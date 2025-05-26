import bcrypt from "bcryptjs";
import { User } from "src/types/userTypes";
import { dbService as db, plaidService as plaid } from "../main";
import { v4 as uuidv4 } from 'uuid';

import { PlaidService } from "./plaidService";

export class AuthService {
    private currentUser: User | null = null;
    
    constructor() {
        this.loadCurrentUser();
    }

    public getCurrentUser(): User | null {
        return this.currentUser;
    }

    private async loadCurrentUser(){
        try {
            console.log('Loading current user from database');
            this.currentUser = await db.getUser() as User;
            console.log('Current user loaded:', this.currentUser);
        } catch (error) {
            console.error('Error loading current user:', error);
        }
    }

    public async logUserIn(nickname: string, masterPassword: string): Promise<{success: boolean, error?: string}> {
        try {
            console.log('Logging user in:', nickname, masterPassword);

            // Check if the password is correct
            const isPasswordCorrect = await bcrypt.compare(masterPassword, this.currentUser.masterPassword);
            if(!isPasswordCorrect) return {success: false, error: 'Invalid password'};

            // Update the user's session expires at
            this.currentUser.sessionExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();

            // Update the user in the database
            await db.updateUser(this.currentUser);
            
            // Decrypt the user's plaid credentials
            await plaid.decryptCredentials(masterPassword);
            await plaid.initializePlaidClientForSession();

            console.log('User logged in:', this.currentUser);

            return {success: true};
        } catch (error) {
            console.error('Error logging in:', error);
            return {success: false, error: `Error logging in: ${error}`};
        }
    }

    public async register(nickname: string, masterPassword: string): Promise<{success: boolean, error?: string}> {
        try {
            // Hash the user's master password
            const hashedPassword = await bcrypt.hash(masterPassword, 10);
            const newUser = {
                id: uuidv4(),
                nickname: nickname,
                masterPassword: hashedPassword,
                sessionExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
                createdAt: new Date().toISOString(),
            }

            // Update the user in the database
            await db.updateUser(newUser);

            console.log('User added successfully');
            return {success: true};
        } catch (error) {
            console.error('Error adding user:', error);
            return {success: false, error: 'Error adding user'};
        }
    }
}