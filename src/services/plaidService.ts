import { PlaidApi, 
    Configuration, 
    PlaidEnvironments, 
    Products, 
    CountryCode, 
    LinkTokenCreateRequest, 
    Transaction,
} from "plaid";
import { decrypt, EncryptedData, encrypt } from "../utils/encryption";
import { PlaidItem, PlaidAccount, PlaidTransaction } from "../types/plaidTypes";
import { authService } from "../main";
import { User } from "src/types/userTypes";
import { dbService as db } from "../main";
import fs from 'fs';

export class PlaidService {
    private plaid: PlaidApi | null = null;
    private decryptedSecret: string | null = null;
    private decryptedClientId: string | null = null;
    private decryptedAccessToken: string | null = null;

    private user: User | null = null;

    constructor() {
        this.user = authService.getCurrentUser();
    }

    public async decryptCredentials(password: string): Promise<{success: boolean, error?: string}> {
        if(!this.user) {
            return { success: false, error: 'User not found' };
        }
        
        if(this.user.encryptedPlaidSecret){
            console.log('Decrypting secret');
            this.decryptedSecret = decrypt(this.user.encryptedPlaidSecret, password);
            console.log('Decrypted secret:', this.decryptedSecret);
        }
        if(this.user.encryptedPlaidClientId){
            console.log('Decrypting client id');
            this.decryptedClientId = decrypt(this.user.encryptedPlaidClientId, password);
            console.log('Decrypted client id:', this.decryptedClientId);
        }
        if(this.user.encryptedPlaidAccessToken){
            console.log('Decrypting access token');
            this.decryptedAccessToken = decrypt(this.user.encryptedPlaidAccessToken, password);
            console.log('Decrypted access token:', this.decryptedAccessToken);
        }

        return { success: true };
    }

    public async setupAndStorePlaidKeys(password: string, clientId: string, secret: string): Promise<{success: boolean, error?: string}> {
        console.log('Initializing Plaid');

        this.user = authService.getCurrentUser();
        
        // Set decrypted credentials
        this.decryptedClientId = clientId;
        this.decryptedSecret = secret;

        // Encrypt incoming credentials
        const encryptedClientId = encrypt(clientId, password);
        const encryptedSecret = encrypt(secret, password);

        // Check if encryption was successful
        if (!encryptedSecret || !encryptedClientId) {
            return { success: false, error: 'Failed to encrypt credentials' };
        }

        console.log('Encrypted credentials');

        // Store encrypted credentials
        console.log('User:', this.user);
        this.user.encryptedPlaidClientId = encryptedClientId;
        this.user.encryptedPlaidSecret = encryptedSecret;

        // Update user in database
        await db.updateUser(this.user);

        console.log('Stored credentials');

        await this.initializePlaidClientForSession();
        await this.getAccounts();
        return { success: true };
    }

    public async initializePlaidClientForSession(): Promise<{success: boolean, error?: string}> {

        this.user = authService.getCurrentUser();
        
        if(!this.user) {
            return { success: false, error: 'User not found' };
        }

        console.log('Starting Plaid client');

        try{
            // Initialize Plaid client
            this.plaid = new PlaidApi(new Configuration({
                basePath: PlaidEnvironments.production,
                baseOptions: {
                    headers: { 'PLAID_CLIENT_ID': this.decryptedClientId, 'PLAID_SECRET': this.decryptedSecret }
                }
            }));
        } catch (error) {
            console.log('Error initializing Plaid client:', error);
            return { success: false, error: 'Failed to initialize Plaid client' };
        }
        
        return { success: true };
    }
    
    public async setupPlaidSession(password: string) {
        this.user = authService.getCurrentUser();
        if(!this.user) {
            throw new Error('User not found');
        }
        
        const decrypted = await this.decryptCredentials(password);
        if(!decrypted.success) {
            throw decrypted.error;
        }
        const plaidClientInitiated = await this.initializePlaidClientForSession();
        if(!plaidClientInitiated.success) {
            throw plaidClientInitiated.error;
        }
    }

    public async createLinkToken(clientUserId: string): Promise<{success: boolean, error?: string, linkToken?: string}> {
        if(!this.plaid) {
            return { success: false, error: 'Plaid client not initialized' };
        }

        console.log('Creating link token');

        const request: LinkTokenCreateRequest = {
            client_id: this.decryptedClientId,
            secret: this.decryptedSecret,
            user: { client_user_id: clientUserId },
            client_name: 'OpenLeaf',
            products: [Products.Transactions],
            country_codes: [CountryCode.Us],
            language: 'en',
            transactions: {
                days_requested: 730  // Request maximum 24 months of transaction history
            }
        };
        
        console.log('Link token request:', request);

        try {
            const response = await this.plaid.linkTokenCreate(request);
            console.log('Link token created:', response.data.link_token);
            return { success: true, linkToken: response.data.link_token };
        } catch (error) {
            console.log('Error creating link token:', error);
            return { success: false, error: 'Failed to create link token' };
        }
    }

    public async exchangePublicToken(password: string, publicToken: string, friendlyName?: string): Promise<{success: boolean, error?: string, item?: PlaidItem}> {
        if(!this.plaid) {
            return { success: false, error: 'Plaid client not initialized' };
        }

        console.log('Exchanging public token');

        try {
            const response = await this.plaid.itemPublicTokenExchange({ 
                public_token: publicToken,
                client_id: this.decryptedClientId,
                secret: this.decryptedSecret
            });
            const { access_token: accessToken } = response.data;

            console.log('Exchanged public token:', response.data);

            this.decryptedAccessToken = accessToken;

            const encryptedAccessToken = encrypt(accessToken, password);
            if(!encryptedAccessToken) {
                return { success: false, error: 'Failed to encrypt access token' };
            }

            this.user.encryptedPlaidAccessToken = encryptedAccessToken;
            await db.updateUser(this.user);

            await this.getAccounts();
            await this.getTransactions();

            return { success: true };
        } catch (error) {
            console.log('Error exchanging public token:', error);
            return { success: false, error: 'Failed to exchange public token' };
        }
    }

    private async getAccounts(): Promise<{success: boolean, error?: string, accounts?: PlaidAccount[]}> {
        if(!this.plaid) {
            return { success: false, error: 'Plaid client not initialized' };
        }

        if (!this.decryptedAccessToken) {
            return { success: false, error: 'No access token available' };
        }

        console.log('Getting accounts');

        try {
            const response = await this.plaid.accountsGet({
                access_token: this.decryptedAccessToken,
                client_id: this.decryptedClientId,
                secret: this.decryptedSecret
            });

            // Write response to json file
            fs.writeFileSync('accounts3.json', JSON.stringify(response.data, null, 2));

            const institution_id = response.data.item.institution_id;
            const institution_name = response.data.item.institution_name;

            for (const account of response.data.accounts) {
                const plaidAccount: PlaidAccount = {
                    account_id: account.account_id,
                    balances: account.balances,
                    mask: account.mask,
                    name: account.name,
                    official_name: account.official_name,
                    subtype: account.subtype,
                    type: account.type,
                    institution_id: institution_id,
                    institution_name: institution_name
                }
                await db.addAccount(plaidAccount, this.user.id);
            }

            return { success: true, accounts: response.data.accounts };
        } catch (error) {
            console.log('Error getting accounts:', error);
            return { success: false, error: 'Failed to get accounts' };
        }
    }

    /**
     * Helper method to handle paginated transaction sync with proper error handling
     * @param cursor - The cursor to start from (undefined for initial fetch)
     * @param count - Number of transactions to fetch per page (max 500)
     * @returns Object containing all transactions and final cursor
     */
    private async paginatedTransactionSync(cursor?: string, count: number = 500): Promise<{
        added: any[],
        modified: any[],
        removed: any[],
        finalCursor: string,
        success: boolean,
        error?: string
    }> {
        if (!this.plaid || !this.decryptedAccessToken) {
            return { 
                added: [], 
                modified: [], 
                removed: [], 
                finalCursor: '', 
                success: false, 
                error: 'Plaid client or access token not available' 
            };
        }

        let added: any[] = [];
        let modified: any[] = [];
        let removed: any[] = [];
        let hasMore = true;
        let currentCursor = cursor;

        console.log('Starting paginated transaction sync with cursor:', currentCursor);

        // Iterate through each page of transaction updates
        while (hasMore) {
            const originalCursor = currentCursor; 
            
            try {
                const request: any = {
                    client_id: this.decryptedClientId,
                    secret: this.decryptedSecret,
                    access_token: this.decryptedAccessToken,
                    count: Math.min(count, 500), 
                    options: {
                        include_personal_finance_category: true,
                    }
                };

                // Add cursor if we have one
                if (currentCursor) {
                    request.cursor = currentCursor;
                }

                const response = await this.plaid.transactionsSync(request);
                const data = response.data;

                console.log(`Fetched page with ${data.added.length} added, ${data.modified.length} modified, ${data.removed.length} removed transactions`);

                // Add this page of results
                added = added.concat(data.added);
                modified = modified.concat(data.modified);
                removed = removed.concat(data.removed);

                hasMore = data.has_more;

                // Update cursor to the next cursor
                currentCursor = data.next_cursor;

                console.log(`Has more: ${hasMore}, Next cursor: ${currentCursor}`);
            } catch (error: any) {
                // Handle TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION error
                if (error?.error_code === 'TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION') {
                    console.log('Pagination mutation detected, restarting from original cursor');
                    // Reset to original cursor and restart pagination
                    currentCursor = originalCursor;
                    added = [];
                    modified = [];
                    removed = [];
                    hasMore = true;
                    continue;
                } else {
                    // Re-throw other errors
                    console.log('Error during paginated sync:', error);
                    return { 
                        added: [], 
                        modified: [], 
                        removed: [], 
                        finalCursor: originalCursor || '', 
                        success: false, 
                        error: error.message || 'Unknown error during pagination' 
                    };
                }
            }
        }

        return {
            added,
            modified,
            removed,
            finalCursor: currentCursor,
            success: true
        };
    }

    public async getTransactions(): Promise<{success: boolean, error?: string}> {
        if(!this.plaid) {
            return { success: false, error: 'Plaid client not initialized' };
        }

        if (!this.decryptedAccessToken) {
            return { success: false, error: 'No access token available' };
        }

        console.log('Getting transactions');

        try {
            // First, wait for transactions to be ready
            let response = await this.plaid.transactionsSync({
                client_id: this.decryptedClientId,
                secret: this.decryptedSecret,
                access_token: this.decryptedAccessToken,
                options: {
                    include_personal_finance_category: true,
                    days_requested: 730,
                }
            });

            console.log('Initial transactions data:', response.data);

            // Wait for historical update to complete
            while(response.data.transactions_update_status === 'NOT_READY' || response.data.transactions_update_status !== 'HISTORICAL_UPDATE_COMPLETE') {
                await new Promise(resolve => setTimeout(resolve, 1000));
                response = await this.plaid.transactionsSync({
                    client_id: this.decryptedClientId,
                    secret: this.decryptedSecret,
                    access_token: this.decryptedAccessToken,
                    options: {
                        include_personal_finance_category: true,
                        days_requested: 730,
                    }
                });
                console.log('Waiting for transactions to be ready. Status:', response.data.transactions_update_status);
            }

            // Now implement proper pagination to get all transactions
            console.log('Starting paginated transaction fetch');

            const result = await this.paginatedTransactionSync(undefined, 500);
            
            if (!result.success) {
                return { success: false, error: result.error };
            }

            // Store the final cursor for future sync operations
            await db.updateLastCursor(result.finalCursor);

            console.log(`Total transactions fetched - Added: ${result.added.length}, Modified: ${result.modified.length}, Removed: ${result.removed.length}`);

            // Write final response to json file for debugging
            fs.writeFileSync('transactions_final.json', JSON.stringify({
                added: result.added,
                modified: result.modified,
                removed: result.removed,
                final_cursor: result.finalCursor
            }, null, 2));

            // Process all added transactions
            for (const transaction of result.added) {
                const plaidTransaction: PlaidTransaction = {
                    transaction_id: transaction.transaction_id,
                    account_id: transaction.account_id,
                    amount: transaction.amount,
                    iso_currency_code: transaction.iso_currency_code,
                    date: transaction.date,
                    name: transaction.name,
                    pending: transaction.pending,
                    payment_channel: transaction.payment_channel,
                    merchant_name: transaction.merchant_name
                }
                console.log('Adding transaction:', plaidTransaction.transaction_id);
                await db.addTransaction(plaidTransaction, this.user.id);
            }

            // TODO: Handle modified and removed transactions if needed
            // For now, we're only handling added transactions

            return { success: true };
        } catch (error) {
            console.log('Error getting transactions:', error);
            return { success: false, error: 'Failed to get transactions' };
        }
    }

    public async syncTransactions(): Promise<{success: boolean, error?: string}> {
        if(!this.plaid) {
            return { success: false, error: 'Plaid client not initialized' };
        }

        if (!this.decryptedAccessToken) {
            return { success: false, error: 'No access token available' };
        }

        console.log('Syncing transactions');

        const lastCursor = await db.getLastCursor();
        console.log('Last cursor:', lastCursor);
        
        try {
            console.log('Starting paginated transaction sync');

            const result = await this.paginatedTransactionSync(lastCursor, 500);
            
            if (!result.success) {
                return { success: false, error: result.error };
            }

            // Store the final cursor for future sync operations
            await db.updateLastCursor(result.finalCursor);

            console.log(`Total sync results - Added: ${result.added.length}, Modified: ${result.modified.length}, Removed: ${result.removed.length}`);

            // Process all added transactions
            for (const transaction of result.added) {
                const plaidTransaction: PlaidTransaction = {
                    transaction_id: transaction.transaction_id,
                    account_id: transaction.account_id,
                    amount: transaction.amount,
                    iso_currency_code: transaction.iso_currency_code,
                    date: transaction.date,
                    name: transaction.name,
                    pending: transaction.pending,
                    payment_channel: transaction.payment_channel,
                    merchant_name: transaction.merchant_name
                }
                console.log('Adding transaction:', plaidTransaction.transaction_id);
                await db.addTransaction(plaidTransaction, this.user.id);
            }

            // TODO: Handle modified and removed transactions if needed
            // For now, we're only handling added transactions

            console.log('Synced transactions');

            return { success: true };
        } catch (error) {
            console.log('Error syncing transactions:', error);
            return { success: false, error: 'Failed to sync transactions' };
        }
    }

    public async clearStoredCredentials(): Promise<{success: boolean, error?: string}> {
        this.user.encryptedPlaidClientId = null;
        this.user.encryptedPlaidSecret = null;
        this.user.encryptedPlaidAccessToken = null;
        await db.updateUser(this.user);
        return { success: true };
    }

    public async removeItem(): Promise<{success: boolean, error?: string}> {
        if(!this.plaid) {
            return { success: false, error: 'Plaid client not initialized' };
        }

        if (!this.decryptedAccessToken) {
            return { success: false, error: 'No access token available' };
        }

        console.log('Removing Plaid Item to allow re-creation with more transaction history');

        try {
            await this.plaid.itemRemove({
                client_id: this.decryptedClientId,
                secret: this.decryptedSecret,
                access_token: this.decryptedAccessToken
            });

            console.log('Successfully removed Plaid Item');
            
            // Clear the stored access token since the item is now invalid
            this.user.encryptedPlaidAccessToken = null;
            await db.updateUser(this.user);
            this.decryptedAccessToken = null;

            return { success: true };
        } catch (error) {
            console.log('Error removing Plaid Item:', error);
            return { success: false, error: 'Failed to remove Plaid Item' };
        }
    }
}
