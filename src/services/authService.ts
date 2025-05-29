import bcrypt from "bcryptjs";
import { User } from "src/types/userTypes";
import { dbService as db, plaidService as plaid } from "../main";
import { v4 as uuidv4 } from 'uuid';

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
            const isPasswordCorrect = await this.validatePassword(masterPassword);
            if(!isPasswordCorrect) return {success: false, error: 'Invalid password'};
            console.log('Password is correct:', isPasswordCorrect);

            // Update the user's session expires at
            this.currentUser.sessionExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();

            // Update the user in the database
            await db.updateUser(this.currentUser);
            
            // Decrypt the user's plaid credentials
            await plaid.setupPlaidSession(masterPassword);

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

    public async validatePassword(password: string): Promise<boolean> {
        console.log('Validating password:', password);
        const isPasswordCorrect = await bcrypt.compare(password, this.currentUser.masterPassword);
        console.log('Is password correct:', isPasswordCorrect);
        return isPasswordCorrect;
    }
}