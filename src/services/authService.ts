import { app, safeStorage } from "electron";
import path from "node:path";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import { User } from "src/types/userTypes";
import * as fs from 'fs';
import Store from 'electron-store';

// Make sure the data directory exists
const USER_DATA_DIR = app.getPath('userData');
const DATA_DIR = path.join(USER_DATA_DIR, 'data');
const USER_DATA_FILE = path.join(DATA_DIR, 'openleaf.db');

// Device registration store
const store = new Store({
    name: 'device-settings',
    defaults: {
        deviceHasRegisteredAccount: false,
    }
});

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
            this.loadCurrentUser();
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

    /*
        Get the current user object
        Uses:
            - AuthPage:
                1. Get the current user object
                2. Check if the user is logged in
                3. If the user is logged in, set the page type to login
                4. If the user is not logged in, set the page type to register
    */
    public async getCurrentUser(): Promise<User | null> {
        return this.currentUser;
    }

    /*
        Load the current user from the database
        Uses:
            - AuthService constructor:
                1. Load the current user from the database
                2. Set the current user
    */
    private async loadCurrentUser(){
        try {
            console.log('Loading current user from database');
            console.log('Current user id:', store.get('currentUserID'));
            this.currentUser = this.db?.prepare('SELECT * FROM users WHERE id = ?').get(store.get('currentUserID') as string) as User;
            console.log('Current user loaded:', this.currentUser);
        } catch (error) {
            console.error('Error loading current user:', error);
        }
    }

    /*
        Log a user in
        Uses:
            - AuthPage:
                1. Log a user in
            - Resets the expiration time to 30 days
    */
    public async logUserIn(nickname: string, masterPassword: string): Promise<boolean> {
        try {
            console.log('Logging user in:', nickname, masterPassword);
            // Check if the user exists
            const user = this.db?.prepare('SELECT * FROM users WHERE nickname = ?').get(nickname);
            if (!user) return false;
            this.currentUser = user as User;

            console.log('Current user:', this.currentUser);


            // Check if the password is correct
            const isPasswordCorrect = await bcrypt.compare(masterPassword, this.currentUser.masterPassword);
            if(!isPasswordCorrect) return false;

            // Update the user's session expires at
            this.currentUser.sessionExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();

            // Update the user in the database
            this.updateUser();

            store.set('currentUserID', this.currentUser.id);

            console.log('User logged in:', this.currentUser);

            return true;
        } catch (error) {
            console.error('Error logging in:', error);
            return false;
        }
    }

    /*
        Register a new user
        Uses:
            - AuthPage:
                1. Register a new user
            - Adds the user to the database
    */
    public async register(user: User): Promise<{success: boolean, error?: string}> {
        try {
            // Check if the user already exists
            const userExists = this.db?.prepare('SELECT * FROM users WHERE nickname = ?').get(user.nickname);
            if (userExists) {
                console.log('User already exists');
                return {success: false, error: 'User already exists'};
            }

            // Hash the user's master password
            const hashedPassword = await bcrypt.hash(user.masterPassword, 10);
            const newUser = {
                ...user,
                masterPassword: hashedPassword,
            }

            // Insert the user into the database
            this.db?.prepare('INSERT INTO users (id, nickname, masterPassword, sessionExpiresAt, createdAt) VALUES (?, ?, ?, ?, ?)').run(
                newUser.id, 
                newUser.nickname, 
                newUser.masterPassword, 
                newUser.sessionExpiresAt, 
                newUser.createdAt
            );
            
            // Set the current user id
            store.set('currentUserID', newUser.id);

            console.log('User added successfully');
            return {success: true};
        } catch (error) {
            console.error('Error adding user:', error);
            return {success: false, error: 'Error adding user'};
        }
    }

        // Update the user in the database with the current user object
        private async updateUser(){
            try {
                this.db?.prepare('UPDATE users SET nickname = ?, masterPassword = ?, sessionExpiresAt = ? WHERE id = ?').run(
                    this.currentUser?.nickname, 
                    this.currentUser?.masterPassword, 
                    this.currentUser?.sessionExpiresAt, 
                    this.currentUser?.id
                );
            } catch (error) {
                console.error('Error updating user:', error);
            }
        }
}