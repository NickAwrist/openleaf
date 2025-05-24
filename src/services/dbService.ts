import Database from "better-sqlite3";
import { app } from "electron";
import path from "node:path";
import * as fs from 'fs';
import { User } from "src/types/userTypes";
import { PlaidAccount } from "src/types/plaidTypes";

const USER_DATA_DIR = app.getPath('userData');
const DATA_DIR = path.join(USER_DATA_DIR, 'data');
const USER_DATA_FILE = path.join(DATA_DIR, 'openleaf.db');

export class DBService {
    public readonly db: Database.Database;

    constructor() {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        this.db = new Database(USER_DATA_FILE);
        this.createTables();
    }

    private createTables() {
        // Create users table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                nickname TEXT NOT NULL,
                phoneNumber TEXT,
                email TEXT,
                masterPassword TEXT NOT NULL,
                sessionExpiresAt TEXT,
                createdAt TEXT NOT NULL
            )
        `);

        // Create accounts table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                balances TEXT,
                mask TEXT,
                name TEXT NOT NULL,
                official_name TEXT,
                subtype TEXT,
                type TEXT,
                userId TEXT NOT NULL,
                FOREIGN KEY (userId) REFERENCES users(id)
            )
        `);
    }

    // User operations
    public async addUser(user: User) {
        const stmt = this.db.prepare('INSERT INTO users (id, nickname, masterPassword, sessionExpiresAt, createdAt) VALUES (?, ?, ?, ?, ?)');
        stmt.run(user.id, user.nickname, user.masterPassword, user.sessionExpiresAt, user.createdAt);
    }

    // Get user by id
    public async getUser(id: string) {
        const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
        return stmt.get(id);
    }

    public async getUserByNickname(nickname: string) {
        const stmt = this.db.prepare('SELECT * FROM users WHERE nickname = ?');
        return stmt.get(nickname);
    }

    public async updateUser(user: User) {
        const stmt = this.db.prepare('UPDATE users SET nickname = ?, masterPassword = ?, sessionExpiresAt = ?, WHERE id = ?');
        stmt.run(user.nickname,user.masterPassword, user.sessionExpiresAt,user.id);
    }

    public async deleteUser(id: string) {
        const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
        stmt.run(id);
    }

    // Account operations
    public async addAccount(account: PlaidAccount, userId: string) {
        console.log('Adding account to database:', account);
        const stmt = this.db.prepare('INSERT INTO accounts (balances, mask, name, official_name, subtype, type, userId) VALUES (?, ?, ?, ?, ?, ?, ?)');
        stmt.run(JSON.stringify(account.balances), account.mask, account.name, account.official_name, account.subtype, account.type, userId);
    }

    public async getAccount(accountId: string) {
        const stmt = this.db.prepare('SELECT * FROM accounts WHERE accountId = ?');
        return stmt.get(accountId);
    }

    public async getAccounts(userId: string): Promise<PlaidAccount[]> {
        const stmt = this.db.prepare('SELECT * FROM accounts WHERE userId = ?');
        const rows = stmt.all(userId) as any[];
        
        // Parse the JSON balances back to objects
        return rows.map(row => ({
            account_id: row.id?.toString() || '', // Use database id as account_id
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
        const stmt = this.db.prepare('UPDATE accounts SET balances = ?, mask = ?, name = ?, official_name = ?, subtype = ?, type = ? WHERE accountId = ? AND userId = ?');
        stmt.run(JSON.stringify(account.balances), account.mask, account.name, account.official_name, account.subtype, account.type, account.account_id, userId);
    }
}