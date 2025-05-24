import bcrypt from "bcryptjs";
import { User } from "src/types/userTypes";
import Store from 'electron-store';
import { dbService as db } from "../main";


// Device registration store
const store = new Store({
    name: 'device-settings',
    defaults: {
        deviceHasRegisteredAccount: false,
    }
});

export class AuthService {
    private currentUser: User | null = null;
    
    constructor() {
        try {
            this.loadCurrentUser();
        } catch (error) {
            console.error('Error in AuthService constructor:', error);
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
            this.currentUser = await db.getUser(store.get('currentUserID') as string) as User;
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
            const user = await db.getUserByNickname(nickname);
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
            const userExists = await db.getUserByNickname(user.nickname);
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
            await db.addUser(newUser);
            
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
                db.updateUser(this.currentUser);
            } catch (error) {
                console.error('Error updating user:', error);
            }
        }
}