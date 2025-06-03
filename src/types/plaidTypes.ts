import { EncryptedData } from "../utils/encryption";

export interface PlaidLink {
    linkId: string;
    accessToken: EncryptedData | string;
    institutionName: string; 
    institutionId: string;
}

export interface PlaidItem {
    itemId: string;
    friendlyName: string;
    encryptedAccessToken: EncryptedData;
    institutionId?: string;
    institutionName?: string;
}

export interface PlaidAccount {
    linkId: string;
    account_id: string;
    balances: PlaidBalance;
    mask: string;
    name: string;
    official_name: string;
    subtype: string;
    type: string;
    institution_id?: string;
    institution_name?: string;
}

export interface PlaidBalance {
    available: number;
    current: number;
    iso_currency_code: string;
    limit: number;
    unofficial_currency_code: string;
}

export interface PlaidTransaction {
    transaction_id: string;
    account_id: string;
    amount: number;
    iso_currency_code: string;
    date: string;
    merchant_name?: string;
    name: string;
    pending: boolean;
    payment_channel: string;
}