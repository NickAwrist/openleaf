import { EncryptedData } from "../services/encryption";

export interface PlaidItem {
    itemId: string;
    friendlyName: string;
    encryptedAccessToken: EncryptedData;
}

export interface PlaidAccount {
    account_id: string;
    balances: PlaidBalance;
    mask: string;
    name: string;
    official_name: string;
    subtype: string;
    type: string;
}

export interface PlaidBalance {
    available: number;
    current: number;
    iso_currency_code: string;
    limit: number;
    unofficial_currency_code: string;
}