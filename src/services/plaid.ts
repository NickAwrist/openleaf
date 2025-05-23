import { PlaidApi, Configuration, PlaidEnvironments } from "plaid";
import Store from "electron-store";
import { decrypt, EncryptedData, encrypt } from "./encryption";

export class PlaidService {
    private plaid: PlaidApi;
    private store: Store<{ apiKey: EncryptedData }>;

    constructor() {
        this.store = new Store({
            name: 'plaid-api-key',
            defaults: {
                apiKey: {
                    salt: '',
                    iv: '',
                    encryptedText: '',
                    authTag: ''
                }
            }
        });
    }

    /**
     * Logs in to Stripe and decrypts the API key
     * @param password - The password to decrypt the API key
     * @returns { success: boolean, error?: string } - The result of the login attempt
     */
    public plaidLogin(password: string): { success: boolean, error?: string } {
        const encryptedData = this.store.get('apiKey') as EncryptedData;
        if (!encryptedData) {
            return { success: false, error: 'API key not found' };
        }
        const decryptedApiKey = decrypt(encryptedData, password);
        if (!decryptedApiKey) { 
            return { success: false, error: 'Invalid password' };
        }
        // TODO: Implement Plaid login
        return { success: true };
    }

    /**
     * Logs out of Stripe
     */
    public plaidLogout(): void {
        this.plaid = null;
    }



    

}