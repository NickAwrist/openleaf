import Database from "better-sqlite3";
import { app } from "electron";
import path from "node:path";
import * as fs from 'fs';
import { User } from "src/types/userTypes";
import { PlaidAccount, PlaidLink, PlaidTransaction } from "src/types/plaidTypes";
import Store from "electron-store";

const USER_DATA_DIR = app.getPath('userData');
const DATA_DIR = path.join(USER_DATA_DIR, 'data');
const USER_DATA_FILE = path.join(DATA_DIR, 'openleaf.db');

export class DBService {
    public readonly db: Database.Database;
    private userStore: Store<{userData: User}>;
    private applicationStore: Store<{
        lastCursors: Record<string, string>;
    }>;

    constructor() {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        this.db = new Database(USER_DATA_FILE);
        this.createTables();

        this.applicationStore = new Store<{
            lastCursors: Record<string, string>;
        }>({
            name: 'applicationData',
        });
    }

    private createTables() {

        // Create user store
        this.userStore = new Store<{userData: User}>({
            name: 'userData',
            defaults: {
                userData: null
            }
        });
        
        // Create accounts table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                linkId TEXT NOT NULL,
                account_id TEXT NOT NULL,
                balances TEXT,
                mask TEXT,
                name TEXT NOT NULL,
                official_name TEXT,
                subtype TEXT,
                type TEXT,
                institution_id TEXT,
                institution_name TEXT,
                userId TEXT NOT NULL
            )
        `);

        // Create transactions table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_id TEXT NOT NULL,
                account_id TEXT NOT NULL,
                amount REAL NOT NULL,
                iso_currency_code TEXT NOT NULL,
                date TEXT NOT NULL,
                merchant_name TEXT,
                name TEXT NOT NULL,
                pending BOOLEAN NOT NULL,
                payment_channel TEXT NOT NULL,
                userId TEXT NOT NULL
            )
        `);

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS plaid_links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                link_id TEXT NOT NULL UNIQUE,
                access_token TEXT NOT NULL,
                institution_id TEXT NOT NULL,
                institution_name TEXT NOT NULL,
                user_id TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    public async updateLastCursor(linkId: string, cursor: string) {
        this.applicationStore.set('lastCursors', {
            ...this.applicationStore.get('lastCursors'),
            [linkId]: cursor
        });
    }

    public async getLastCursor(linkId: string) {
        return this.applicationStore.get('lastCursors')[linkId];
    }

    // Plaid link operations
    public async getPlaidLinks(userId: string): Promise<PlaidLink[]> {
        const stmt = this.db.prepare('SELECT * FROM plaid_links WHERE user_id = ?');
        const rows = stmt.all(userId) as any[];
        return rows.map(row => ({
            linkId: row.link_id,
            accessToken: typeof row.access_token === 'string' ? JSON.parse(row.access_token) : row.access_token,
            institutionId: row.institution_id,
            institutionName: row.institution_name
        }));
    }

    // Get user
    public async getUser() {
        return this.userStore.get('userData');
    }

    // Update user
    public async updateUser(user: User) {
        this.userStore.set('userData', user);
    }

    // Account operations
    public async addAccount(account: PlaidAccount, userId: string) {
        console.log('Adding account to database:', account);

        // Check if account already exists
        const existingAccount = await this.getAccount(account.account_id);
        if(existingAccount) {
            console.log('Account already exists:', existingAccount);
            return;
        }

        const stmt = this.db.prepare('INSERT INTO accounts (linkId, account_id, balances, mask, name, official_name, subtype, type, institution_id, institution_name, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        stmt.run(account.linkId, account.account_id, JSON.stringify(account.balances), account.mask, account.name, account.official_name, account.subtype, account.type, account.institution_id, account.institution_name, userId);
    }

    public async getAccount(accountId: string) {
        const stmt = this.db.prepare('SELECT * FROM accounts WHERE account_id = ?');
        return stmt.get(accountId);
    }

    public async getAccounts(userId: string): Promise<PlaidAccount[]> {
        const stmt = this.db.prepare('SELECT * FROM accounts WHERE userId = ?');
        const rows = stmt.all(userId) as any[];
        
        // Parse the JSON balances back to objects
        return rows.map(row => ({
            linkId: row.linkId,
            account_id: row.account_id,
            balances: JSON.parse(row.balances),
            mask: row.mask,
            name: row.name,
            official_name: row.official_name,
            subtype: row.subtype,
            type: row.type,
            institution_id: row.institution_id,
            institution_name: row.institution_name
        }));
    }
    
    public async deleteAccount(id: string) {
        const stmt = this.db.prepare('DELETE FROM accounts WHERE id = ?');
        stmt.run(id);
    }

    public async updateAccount(account: PlaidAccount, userId: string) {
        const stmt = this.db.prepare('UPDATE accounts SET balances = ?, mask = ?, name = ?, official_name = ?, subtype = ?, type = ?, institution_id = ?, institution_name = ? WHERE account_id = ? AND userId = ?');
        stmt.run(JSON.stringify(account.balances), account.mask, account.name, account.official_name, account.subtype, account.type, account.institution_id, account.institution_name, account.account_id, userId);
    }

    // Transaction operations
    public async addTransaction(transaction: PlaidTransaction, userId: string) {
        // Check if transaction already exists
        const existingTransaction = await this.getTransaction(transaction.transaction_id);
        if(existingTransaction) {
            await this.updateTransaction(transaction);
            return;
        }

        const stmt = this.db.prepare('INSERT INTO transactions (transaction_id, account_id, amount, iso_currency_code, date, name, pending, payment_channel, merchant_name, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        stmt.run(transaction.transaction_id, transaction.account_id, transaction.amount, transaction.iso_currency_code, transaction.date, transaction.name, transaction.pending ? 1 : 0, transaction.payment_channel, transaction.merchant_name, userId);
    }

    public async getTransaction(transactionId: string) {
        const stmt = this.db.prepare('SELECT * FROM transactions WHERE transaction_id = ?');
        return stmt.get(transactionId);
    }

    public async getTransactions(accountId: string): Promise<PlaidTransaction[]> {
        const stmt = this.db.prepare('SELECT * FROM transactions WHERE account_id = ?');
        const rows = stmt.all(accountId) as any[];
        return rows.map(row => ({
            transaction_id: row.transaction_id,
            account_id: row.account_id,
            amount: row.amount,
            iso_currency_code: row.iso_currency_code,
            date: row.date,
            name: row.name,
            pending: row.pending === 1,
            payment_channel: row.payment_channel,
            merchant_name: row.merchant_name
        }));
    }

    public async updateTransaction(transaction: PlaidTransaction) {
        const stmt = this.db.prepare('UPDATE transactions SET amount = ?, iso_currency_code = ?, date = ?, name = ?, pending = ?, payment_channel = ?, merchant_name = ? WHERE transaction_id = ?');
        stmt.run(transaction.amount, transaction.iso_currency_code, transaction.date, transaction.name, transaction.pending ? 1 : 0, transaction.payment_channel, transaction.merchant_name, transaction.transaction_id);
    }

    public async deleteTransaction(transactionId: string) {
        const stmt = this.db.prepare('DELETE FROM transactions WHERE transaction_id = ?');
        stmt.run(transactionId);
    }

    public async addPlaidLink(link: PlaidLink, userId: string) {
        console.log('Adding plaid link to database:', link);
        console.log('UserId:', userId);
        
        // Validate all parameters
        console.log('Parameter validation:');
        console.log('- linkId:', link.linkId, '(type:', typeof link.linkId, ')');
        console.log('- accessToken:', link.accessToken ? 'present' : 'MISSING', '(type:', typeof link.accessToken, ')');
        console.log('- institutionId:', link.institutionId, '(type:', typeof link.institutionId, ')');
        console.log('- institutionName:', link.institutionName, '(type:', typeof link.institutionName, ')');
        console.log('- userId:', userId, '(type:', typeof userId, ')');
        
        const existingLink = await this.getPlaidLink(link.linkId);
        if(existingLink) {
            console.log('Existing link found, updating...');
            await this.updatePlaidLink(link, userId);
            return;
        }

        console.log('No existing link found, inserting new one...');
        
        // Serialize the accessToken if it's an object (encrypted data)
        const serializedAccessToken = typeof link.accessToken === 'object' 
            ? JSON.stringify(link.accessToken) 
            : link.accessToken;
            
        const stmt = this.db.prepare('INSERT INTO plaid_links (link_id, access_token, institution_id, institution_name, user_id) VALUES (?, ?, ?, ?, ?)');
        
        try {
            console.log('About to execute statement with parameters:', [link.linkId, '***encrypted***', link.institutionId, link.institutionName, userId]);
            const res = stmt.run(link.linkId, serializedAccessToken, link.institutionId, link.institutionName, userId);
            console.log('Plaid link added to database successfully:', res);
        } catch (error) {
            console.error('Error executing INSERT statement:', error);
            console.error('Parameters were:', [link.linkId, typeof serializedAccessToken, link.institutionId, link.institutionName, userId]);
            throw error;
        }
    }

    public async getPlaidLink(linkId: string) {
        const stmt = this.db.prepare('SELECT * FROM plaid_links WHERE link_id = ?');
        const row = stmt.get(linkId) as any;
        if (!row) return null;

        return {
            linkId: row.link_id,
            accessToken: typeof row.access_token === 'string' ? JSON.parse(row.access_token) : row.access_token,
            institutionId: row.institution_id,
            institutionName: row.institution_name
        };
    }

    public async updatePlaidLink(link: PlaidLink, userId: string) {
        // Serialize the accessToken if it's an object (encrypted data)
        const serializedAccessToken = typeof link.accessToken === 'object' 
            ? JSON.stringify(link.accessToken) 
            : link.accessToken;
            
        const stmt = this.db.prepare('UPDATE plaid_links SET access_token = ?, institution_id = ?, institution_name = ? WHERE link_id = ? AND user_id = ?');
        stmt.run(serializedAccessToken, link.institutionId, link.institutionName, link.linkId, userId);
    }

    public async deletePlaidLink(linkId: string) {
        const stmt = this.db.prepare('DELETE FROM plaid_links WHERE link_id = ?');
        stmt.run(linkId);
    }
    
}