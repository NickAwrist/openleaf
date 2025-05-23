import crypto from "crypto";

export interface EncryptedData {
    salt: string;
    iv: string;
    encryptedText: string;
    authTag: string;
}

// Encryption Constants
const KEY_LENGTH = 32; 
const SALT_LENGTH = 16;
const IV_LENGTH = 16; 
const PBKDF2_ITERATIONS = 100000; 
const DIGEST = 'sha512';
const ALGORITHM = 'aes-256-gcm';

export function encrypt(data: string, password: string): EncryptedData | null {
    console.log('Encrypting data with password:', password);
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    console.log('Encrypted data:', encrypted);

    return {
        salt: salt.toString('base64'),
        iv: iv.toString('base64'),
        encryptedText: encrypted,
        authTag: cipher.getAuthTag().toString('base64')
    }
}

export function decrypt(encryptedData: EncryptedData, password: string): string | null {
    try {
        console.log('Beging to decrypt data with password:', password);
        const salt = Buffer.from(encryptedData.salt, 'base64');
        const iv = Buffer.from(encryptedData.iv, 'base64');
        const key = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST);
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'base64'));
        console.log('Decrypting data:', encryptedData);
        let decrypted = decipher.update(encryptedData.encryptedText, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        console.log('Decrypted data:', decrypted);

        return decrypted;
    } catch (error) {
        console.error('Error decrypting data:', error);
        return null;
    }
}