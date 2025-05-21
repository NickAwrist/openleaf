import { app, safeStorage } from "electron";
import path from "node:path";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import { User } from "src/types/userTypes";
import * as fs from 'fs';

// Make sure the data directory exists
const USER_DATA_DIR = app.getPath('userData');
const DATA_DIR = path.join(USER_DATA_DIR, 'data');
const USER_DATA_FILE = path.join(DATA_DIR, 'openleaf.db');

export class AuthService {
    private currentUser: User | null = null;
    private db: Database.Database | null = null;
    
    constructor() {
        console.log('AuthService constructor');
        // Ensure data directory exists
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        
        try {
            this.loadDB();
        } catch (error) {
            console.error('Error in AuthService constructor:', error);
        }
    }

    // Load the database and users table
    private loadDB(){
        try {
            console.log('Loading database from:', USER_DATA_FILE);
            this.db = new Database(USER_DATA_FILE);
            
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
            console.log('Database loaded and table created if needed');
        } catch (error) {
            console.error('Error loading database:', error);
            throw error;
        }
    }

    // Log a user in.
    public async logUserIn(id: string, masterPassword: string): Promise<boolean> {
        try {
            // Check if the user exists
            const user = this.db?.prepare('SELECT * FROM users WHERE id = ?').get(id);
            if (!user) return false;
            this.currentUser = user as User;

            // Check if the password is correct
            const isPasswordCorrect = await bcrypt.compare(masterPassword, this.currentUser.masterPassword);
            if(!isPasswordCorrect) return false;

            // Update the user's session expires at
            this.currentUser.sessionExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();

            // Update the user in the database
            this.updateUser();

            console.log('User logged in:', this.currentUser);

            return true;
        } catch (error) {
            console.error('Error logging in:', error);
            return false;
        }
    }

    // Check if the user is logged in by comparing the session expires at to the current date
    public async isLoggedIn(): Promise<boolean> {
        if (!this.currentUser) return false;
        return this.currentUser.sessionExpiresAt > new Date().toISOString();
    }

    // Set the current user from a given id
    public async setCurrentUser(id: string) {
        try {
            const user = this.db?.prepare('SELECT * FROM users WHERE id = ?').get(id);
            if (!user) return;
            this.currentUser = user as User;
        } catch (error) {
            console.error('Error setting current user:', error);
        }
    }
    
    // Update the user in the database
    private async updateUser(){
        try {
            this.db?.prepare('UPDATE users SET nickname = ?, phoneNumber = ?, email = ?, masterPassword = ?, sessionExpiresAt = ? WHERE id = ?').run(
                this.currentUser?.nickname, 
                this.currentUser?.phoneNumber, 
                this.currentUser?.email, 
                this.currentUser?.masterPassword, 
                this.currentUser?.sessionExpiresAt, 
                this.currentUser?.id
            );
        } catch (error) {
            console.error('Error updating user:', error);
        }
    }

    // Add a new user to the database
    private async register(user: User) {
        try {
            // Check if the user already exists
            const userExists = this.db?.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
            if (userExists) {
                console.log('User already exists');
                return;
            }

            // Hash the user's master password
            const hashedPassword = await bcrypt.hash(user.masterPassword, 10);
            const newUser = {
                ...user,
                masterPassword: hashedPassword,
            }

            // Insert the user into the database
            this.db?.prepare('INSERT INTO users (id, nickname, phoneNumber, email, masterPassword, sessionExpiresAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
                newUser.id, 
                newUser.nickname, 
                newUser.phoneNumber, 
                newUser.email, 
                newUser.masterPassword, 
                newUser.sessionExpiresAt, 
                newUser.createdAt
            );
            console.log('User added successfully');
        } catch (error) {
            console.error('Error adding user:', error);
        }
    }
}