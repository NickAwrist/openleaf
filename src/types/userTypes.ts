import { EncryptedData } from "../utils/encryption";

export interface User {
    id: string;
    nickname: string;
    masterPassword: string;
    sessionExpiresAt: string;
    createdAt: string;
    encryptedPlaidSecret?: EncryptedData;
    encryptedPlaidClientId?: EncryptedData;
    encryptedPlaidAccessToken?: EncryptedData;
}