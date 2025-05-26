import Database from "better-sqlite3";
import { app } from "electron";
import path from "node:path";
import * as fs from 'fs';
import { User } from "src/types/userTypes";
import { PlaidAccount } from "src/types/plaidTypes";
import Store from "electron-store";

const USER_DATA_DIR = app.getPath('userData');
const DATA_DIR = path.join(USER_DATA_DIR, 'data');
const USER_DATA_FILE = path.join(DATA_DIR, 'openleaf.db');

export class DBService {
    public readonly db: Database.Database;
    private userStore: Store<{userData: User}>;

    constructor() {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        this.db = new Database(USER_DATA_FILE);
        this.createTables();
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
    }

    private runMigrations() {
        console.log('Running database migrations...');
        
        // Just drop the old tables and recreate fresh
        this.db.exec(`
            DROP TABLE IF EXISTS accounts;
            DROP TABLE IF EXISTS accounts_new;
        `);
        
        // Create fresh accounts table
        this.db.exec(`
            CREATE TABLE accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id TEXT,
                balances TEXT,
                mask TEXT,
                name TEXT,
                official_name TEXT,
                subtype TEXT,
                type TEXT,
                institution_id TEXT,
                institution_name TEXT,
                userId TEXT
            )
        `);
        
        console.log('Successfully created fresh accounts table');
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
}