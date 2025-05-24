import { PlaidApi, Configuration, PlaidEnvironments, Products, CountryCode, LinkTokenCreateRequest, Transaction } from "plaid";
import Store from "electron-store";
import { decrypt, EncryptedData, encrypt } from "./encryption";
import { PlaidItem, PlaidAccount } from "../types/plaidTypes";

export class PlaidService {
    private plaid: PlaidApi | null = null;
    private store: Store<{ secret: EncryptedData, clientId: EncryptedData, items: Record<string, PlaidItem> }>;
    private decryptedSecret: string | null = null;
    private decryptedClientId: string | null = null;
    private decryptedAccessToken: string | null = null;

    constructor() {
        this.store = new Store({
            name: 'plaid-credentials',
            defaults: {
                secret: {
                    salt: '',
                    iv: '',
                    encryptedText: '',
                    authTag: ''
                },
                clientId: {
                    salt: '',
                    iv: '',
                    encryptedText: '',
                    authTag: ''
                },
                items: {}
            }
        });
    }

    public async setupAndStorePlaidKeys(password: string, clientId: string, secret: string): Promise<{success: boolean, error?: string}> {
        console.log('Initializing Plaid');
        
        // Encrypt incoming credentials
        const encryptedSecret = encrypt(secret, password);
        const encryptedClientId = encrypt(clientId, password);

        // Check if encryption was successful
        if (!encryptedSecret || !encryptedClientId) {
            return { success: false, error: 'Failed to encrypt credentials' };
        }

        console.log('Encrypted credentials');

        // Store encrypted credentials
        // TODO: Store relative to user
        this.store.set('secret', encryptedSecret);
        this.store.set('clientId', encryptedClientId);

        this.store.set('items', {});

        console.log('Stored credentials');

        return { success: true };
    }

    public async initializePlaidClientForSession(password: string): Promise<{success: boolean, error?: string}> {

        console.log('Starting Plaid client');

        // Get stored credentials
        const storedSecret = this.store.get('secret') as EncryptedData;
        const storedClientId = this.store.get('clientId') as EncryptedData;
        
        // Check if credentials exist and are valid (not empty defaults)
        if (!storedSecret || !storedClientId || 
            !storedSecret.encryptedText || !storedClientId.encryptedText ||
            storedSecret.encryptedText === '' || storedClientId.encryptedText === '') {
            return { success: false, error: 'No encrypted credentials found. Please run setup first.' };
        }

        // Decrypt credentials
        this.decryptedSecret = decrypt(storedSecret, password);
        this.decryptedClientId = decrypt(storedClientId, password);
        
        if (!this.decryptedSecret || !this.decryptedClientId) {
            return { success: false, error: 'Failed to decrypt credentials. Please check your password or run setup again.' };
        }

        console.log('Decrypted credentials');

        // Initialize Plaid client
        this.plaid = new PlaidApi(new Configuration({
            basePath: PlaidEnvironments.sandbox,
            baseOptions: {
                headers: { 'PLAID_CLIENT_ID': this.decryptedClientId, 'PLAID_SECRET': this.decryptedSecret }
            }
        }));

        console.log('Plaid client initialized:', this.plaid);

        return { success: true };
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
            const { access_token: accessToken, item_id: itemId } = response.data;

            console.log('Exchanged public token:', response.data);

            this.decryptedAccessToken = accessToken;

            const encryptedAccessToken = encrypt(password, accessToken);
            if(!encryptedAccessToken) {
                return { success: false, error: 'Failed to encrypt access token' };
            }

            console.log('Encrypted access token:', encryptedAccessToken);

            const item: PlaidItem = {
                itemId,
                friendlyName: friendlyName || itemId,
                encryptedAccessToken: encryptedAccessToken
            };

            console.log('Item:', item);

            // Store item
            const currentItems = (this.store.get('items') as Record<string, PlaidItem>) || {};
            currentItems[itemId] = item;
            this.store.set('items', currentItems);

            console.log('Stored item:', this.store.get('items'));

            return { success: true, item };
        } catch (error) {
            console.log('Error exchanging public token:', error);
            return { success: false, error: 'Failed to exchange public token' };
        }
    }

    public async getAccounts(): Promise<{success: boolean, error?: string, accounts?: PlaidAccount[]}> {
        if(!this.plaid) {
            return { success: false, error: 'Plaid client not initialized' };
        }

        console.log('Getting accounts');

        if (!this.decryptedAccessToken) {
            return { success: false, error: 'No access token available' };
        }

        try {
            const response = await this.plaid.accountsGet({
                access_token: this.decryptedAccessToken,
                client_id: this.decryptedClientId,
                secret: this.decryptedSecret
            });

            console.log('Accounts:', response.data);

            return { success: true, accounts: response.data.accounts };
        } catch (error) {
            console.log('Error getting accounts:', error);
            return { success: false, error: 'Failed to get accounts' };
        }
    }

    public async clearStoredCredentials(): Promise<{success: boolean, error?: string}> {
        try {
            console.log('Clearing stored Plaid credentials');
            
            // Reset to default empty values
            this.store.set('secret', {
                salt: '',
                iv: '',
                encryptedText: '',
                authTag: ''
            });
            this.store.set('clientId', {
                salt: '',
                iv: '',
                encryptedText: '',
                authTag: ''
            });
            this.store.set('items', {});
            
            // Clear the current Plaid client
            this.plaid = null;
            
            console.log('Cleared stored credentials');

            return { success: true };
        } catch (error) {
            return { success: false, error: 'Failed to clear credentials' };
        }
    }

    public async getTransactions(itemId: string): Promise<{success: boolean, error?: string, transactions?: Transaction[]}> {
        if(!this.plaid) {
            return { success: false, error: 'Plaid client not initialized' };
        }

        console.log('Getting transactions for item:', itemId);

        if (!this.decryptedAccessToken) {
            return { success: false, error: 'No access token available' };
        }

        try {
            const response = await this.plaid.transactionsSync({
                access_token: this.decryptedAccessToken,
                client_id: this.decryptedClientId,
                secret: this.decryptedSecret,
            });

            console.log('Transactions:', response.data);

            const accounts: PlaidAccount[] = response.data.accounts;

            console.log('Accounts:', accounts);

            return { success: true};
        } catch (error) {
            console.log('Error getting transactions:', error);
            return { success: false, error: 'Failed to get transactions' };
        }
    }
}

/*
    Flow:
    
    When a user adds a new account (Nickname and password), they are prompted to link their Plaid account.
    The user clicks "Link Account" and are prompted for their Plaid client id and secret.
    The user enters this information along with their OpenLeaf password and setupAndStorePlaidKeys is called.

    setupAndStorePlaidKeys will encrypt the credentials and store them in the store.

    When the user logs in, we decrypt the credentials and initialize the Plaid client with initializePlaidClientForSession.

    To add a new account, the user clicks "Add Account". This calls createLinkToken.
    createLinkToken returns a link token that is used to initialize the Plaid link.
    The user is redirected to the Plaid link where they can enter their credentials and authorize the app.
    When the user successfully links their account, the account is added to the store.
*/
