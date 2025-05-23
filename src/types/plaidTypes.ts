import { EncryptedData } from "../services/encryption";

export interface PlaidItem {
    itemId: string;
    friendlyName: string;
    encryptedAccessToken: EncryptedData;
}
