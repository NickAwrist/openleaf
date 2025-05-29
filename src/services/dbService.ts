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
        lastCursor: string;
    }>;

    constructor() {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        this.db = new Database(USER_DATA_FILE);
        this.createTables();

        this.applicationStore = new Store<{
            lastCursor: string;
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

        // Create plaid links table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS plaid_links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                access_token TEXT NOT NULL,
                institution_id TEXT NOT NULL,
                item_id TEXT NOT NULL,
                institution_name TEXT NOT NULL,
                userId TEXT NOT NULL
            )
        `);
        
        
        // Create accounts table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    }

    public async updateLastCursor(cursor: string) {
        this.applicationStore.set('lastCursor', cursor);
    }

    public async getLastCursor() {
        return this.applicationStore.get('lastCursor');
    }

    // Plaid link operations
    public async addPlaidLink(plaidLink: PlaidLink, userId: string) {
        const stmt = this.db.prepare('INSERT INTO plaid_links (access_token, institution_id, item_id, institution_name, userId) VALUES (?, ?, ?, ?, ?)');
        stmt.run(plaidLink.accessToken, plaidLink.institutionId, plaidLink.itemId, plaidLink.institutionName, userId);
    }

    public async getPlaidLink(userId: string) {
        const stmt = this.db.prepare('SELECT * FROM plaid_links WHERE userId = ?');
        return stmt.get(userId) as PlaidLink;
    }

    public async deletePlaidLink(userId: string) {
        const stmt = this.db.prepare('DELETE FROM plaid_links WHERE userId = ?');
        stmt.run(userId);
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

        const stmt = this.db.prepare('INSERT INTO accounts (account_id, balances, mask, name, official_name, subtype, type, institution_id, institution_name, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        stmt.run(account.account_id, JSON.stringify(account.balances), account.mask, account.name, account.official_name, account.subtype, account.type, account.institution_id, account.institution_name, userId);
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
}