import { PlaidApi, 
    Configuration, 
    PlaidEnvironments, 
    Products, 
    CountryCode, 
    LinkTokenCreateRequest, 
    Transaction,
} from "plaid";
import { decrypt, EncryptedData, encrypt } from "../utils/encryption";
import { PlaidItem, PlaidAccount } from "../types/plaidTypes";
import { authService } from "../main";
import { User } from "src/types/userTypes";
import { dbService as db } from "../main";

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
            this.decryptedSecret = decrypt(this.user.encryptedPlaidSecret, password);
        }
        if(this.user.encryptedPlaidClientId){
            this.decryptedClientId = decrypt(this.user.encryptedPlaidClientId, password);
        }
        if(this.user.encryptedPlaidAccessToken){
            this.decryptedAccessToken = decrypt(this.user.encryptedPlaidAccessToken, password);
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
            const { access_token: accessToken } = response.data;

            console.log('Exchanged public token:', response.data);

            this.decryptedAccessToken = accessToken;

            const encryptedAccessToken = encrypt(password, accessToken);
            if(!encryptedAccessToken) {
                return { success: false, error: 'Failed to encrypt access token' };
            }

            this.user.encryptedPlaidAccessToken = encryptedAccessToken;
            await db.updateUser(this.user);

            await this.getAccounts();

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

            console.log('Accounts:', response.data);
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
                console.log('Adding account:', plaidAccount);
                await db.addAccount(plaidAccount, this.user.id);
            }

            return { success: true, accounts: response.data.accounts };
        } catch (error) {
            console.log('Error getting accounts:', error);
            return { success: false, error: 'Failed to get accounts' };
        }
    }

    public async clearStoredCredentials(): Promise<{success: boolean, error?: string}> {
        this.user.encryptedPlaidClientId = null;
        this.user.encryptedPlaidSecret = null;
        this.user.encryptedPlaidAccessToken = null;
        await db.updateUser(this.user);
        return { success: true };
    }
}
