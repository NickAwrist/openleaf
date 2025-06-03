import { PlaidApi, 
    Configuration, 
    PlaidEnvironments, 
    Products, 
    CountryCode, 
    LinkTokenCreateRequest, 
    Transaction,
} from "plaid";
import { decrypt, EncryptedData, encrypt } from "../utils/encryption";
import { PlaidItem, PlaidAccount, PlaidTransaction, PlaidLink } from "../types/plaidTypes";
import { authService } from "../main";
import { User } from "src/types/userTypes";
import { dbService as db } from "../main";
import { v4 as uuidv4 } from 'uuid';

export class PlaidService {
    private plaid: PlaidApi | null = null;
    private decryptedSecret: string | null = null;
    private decryptedClientId: string | null = null;
    private decryptedLinks: Record<string, PlaidLink> = {};

    private user: User | null = null;

    constructor() {
        this.user = authService.getCurrentUser();
    }

    public async decryptCredentials(password: string): Promise<{success: boolean, error?: string}> {
        if(!this.user) {
            return { success: false, error: 'User not found' };
        }
        
        if(this.user.encryptedPlaidSecret){
            this.decryptedSecret = decrypt(this.user.encryptedPlaidSecret, password);
        }

        if(this.user.encryptedPlaidClientId){
            this.decryptedClientId = decrypt(this.user.encryptedPlaidClientId, password);
        }

        const links = await db.getPlaidLinks(this.user.id);
        for(const link of links){
            const decryptedLink: PlaidLink = {
                linkId: link.linkId,
                accessToken: decrypt(link.accessToken as EncryptedData, password),
                institutionId: link.institutionId,
                institutionName: link.institutionName,
            }
            this.decryptedLinks[link.linkId] = decryptedLink;
        }

        return { success: true };
    }

    // Store the user Client ID and Secret
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
        return { success: true };
    }

    // Initialize the Plaid client for the login session
    public async initializePlaidClientForSession(): Promise<{success: boolean, error?: string}> {

        this.user = authService.getCurrentUser();
        
        if(!this.user) {
            return { success: false, error: 'User not found' };
        }

        console.log('Starting Plaid client');

        try{
            // Initialize Plaid client
            this.plaid = new PlaidApi(new Configuration({
                basePath: PlaidEnvironments.sandbox,
                baseOptions: {
                    headers: { 'PLAID_CLIENT_ID': this.decryptedClientId, 'PLAID_SECRET': this.decryptedSecret }
                }
            }));
        } catch (error) {
            console.log('Error initializing Plaid client:', error);
            return { success: false, error: 'Failed to initialize Plaid client' };
        }

        console.log('Plaid client initialized: ', this.plaid);
        
        return { success: true };
    }
    
    // Setup the Plaid session
    public async setupPlaidSession(password: string) {
        this.user = authService.getCurrentUser();
        if(!this.user) {
            throw new Error('User not found');
        }
        
        console.log('setupPlaidSession: Decrypting credentials');
        const decrypted = await this.decryptCredentials(password);
        if(!decrypted.success) {
            throw decrypted.error;
        }
        console.log('setupPlaidSession: Initializing Plaid client');
        const plaidClientInitiated = await this.initializePlaidClientForSession();
        if(!plaidClientInitiated.success) {
            throw plaidClientInitiated.error;
        }
    }

    // Create a link token for the user to link their account
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
                days_requested: 730
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

            const encryptedAccessToken = encrypt(accessToken, password);
            if(!encryptedAccessToken) {
                return { success: false, error: 'Failed to encrypt access token' };
            }

            const decryptedLink: PlaidLink = {
                linkId: uuidv4(),
                accessToken: accessToken,
                institutionId: '',
                institutionName: ''
            }

            // Get the accounts and transactions for the new link
            console.log('Getting accounts for link:', decryptedLink.linkId);
            await this.getAccounts(decryptedLink, password);
            console.log('Getting transactions for link:', decryptedLink.linkId);
            await this.getTransactions(decryptedLink.linkId);

            return { success: true };
        } catch (error) {
            console.log('Error exchanging public token:', error);
            return { success: false, error: 'Failed to exchange public token' };
        }
    }

    private async getAccounts(decryptedLink: PlaidLink, password: string): Promise<{success: boolean, error?: string, accounts?: PlaidAccount[]}> {
        if(!this.plaid) {
            return { success: false, error: 'Plaid client not initialized' };
        }

        try {
            const response = await this.plaid.accountsGet({
                access_token: decryptedLink.accessToken as string,
                client_id: this.decryptedClientId,
                secret: this.decryptedSecret
            });

            const institution_id = response.data.item.institution_id;
            const institution_name = response.data.item.institution_name;

            decryptedLink.institutionId = institution_id;
            decryptedLink.institutionName = institution_name;
            this.decryptedLinks[decryptedLink.linkId] = decryptedLink;

            const encryptedLink: PlaidLink = {
                linkId: decryptedLink.linkId,
                accessToken: encrypt(decryptedLink.accessToken as string, password),
                institutionId: decryptedLink.institutionId,
                institutionName: decryptedLink.institutionName
            }
            await db.addPlaidLink(encryptedLink, this.user.id);

            console.log('Link ID:', decryptedLink.linkId);

            for (const account of response.data.accounts) {
                const plaidAccount: PlaidAccount = {
                    linkId: decryptedLink.linkId,
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
                console.log('Adding account:', plaidAccount.account_id);
                await db.addAccount(plaidAccount, this.user.id);
            }

            return { success: true, accounts: response.data.accounts as PlaidAccount[] };
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
    private async paginatedTransactionSync(cursor?: string, count: number = 500, accessToken: string = ''): Promise<{
        added: any[],
        modified: any[],
        removed: any[],
        finalCursor: string,
        success: boolean,
        error?: string
    }> {
        if (!this.plaid || !accessToken) {
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
                    access_token: accessToken,
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

    // Get the transactions for a link
    public async getTransactions(linkId: string): Promise<{success: boolean, error?: string}> {
        if(!this.plaid) {
            return { success: false, error: 'Plaid client not initialized' };
        }

        const decryptedLink = this.decryptedLinks[linkId];
        if(!decryptedLink) {
            return { success: false, error: 'Link not found' };
        }

        console.log('Getting transactions for link: ', linkId);

        try {
            // First, wait for transactions to be ready
            let response = await this.plaid.transactionsSync({
                client_id: this.decryptedClientId,
                secret: this.decryptedSecret,
                access_token: decryptedLink.accessToken as string,
                options: {
                    include_personal_finance_category: true,
                    days_requested: 730,
                }
            });

            // Wait for historical update to complete
            while(response.data.transactions_update_status === 'NOT_READY' || response.data.transactions_update_status !== 'HISTORICAL_UPDATE_COMPLETE') {
                await new Promise(resolve => setTimeout(resolve, 1000));
                response = await this.plaid.transactionsSync({
                    client_id: this.decryptedClientId,
                    secret: this.decryptedSecret,
                    access_token: decryptedLink.accessToken as string,
                    options: {
                        include_personal_finance_category: true,
                        days_requested: 730,
                    }
                });
                console.log('Waiting for transactions to be ready. Status:', response.data.transactions_update_status);
            }

            // Wait for 5 seconds to ensure the transactions are ready
            await new Promise(resolve => setTimeout(resolve, 5000));

            console.log('Starting paginated transaction fetch');
            const result = await this.paginatedTransactionSync(undefined, 500, decryptedLink.accessToken as string);
            
            if (!result.success) {
                return { success: false, error: result.error };
            }

            // Store the final cursor for future sync operations
            await db.updateLastCursor(linkId, result.finalCursor);

            console.log(`Total transactions fetched - Added: ${result.added.length}, Modified: ${result.modified.length}, Removed: ${result.removed.length}`);

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

        try {
            for (const linkId of Object.keys(this.decryptedLinks)) {
                const decryptedLink = this.decryptedLinks[linkId];

                const lastCursor = await db.getLastCursor(linkId);
                const result = await this.paginatedTransactionSync(lastCursor, 500, decryptedLink.accessToken as string);
                
                if (!result.success) {
                    return { success: false, error: result.error };
                }

                await db.updateLastCursor(linkId, result.finalCursor);

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
                    await db.addTransaction(plaidTransaction, this.user.id);
                }
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: 'Failed to sync transactions' };
        }
    }

    public async clearStoredCredentials(): Promise<{success: boolean, error?: string}> {
        this.user.encryptedPlaidClientId = null;
        this.user.encryptedPlaidSecret = null;
        await db.updateUser(this.user);
        return { success: true };
    }

    public async removeItem(linkId: string): Promise<{success: boolean, error?: string}> {
        if(!this.plaid) {
            return { success: false, error: 'Plaid client not initialized' };
        }

        try {
            await this.plaid.itemRemove({
                client_id: this.decryptedClientId,
                secret: this.decryptedSecret,
                access_token: this.decryptedLinks[linkId].accessToken as string
            });

            await db.deletePlaidLink(linkId);
            delete this.decryptedLinks[linkId];

            return { success: true };
        } catch (error) {
            return { success: false, error: 'Failed to remove Plaid Item' };
        }
    }
}
