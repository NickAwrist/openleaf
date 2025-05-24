import { EncryptedData } from "../services/encryption";

/**
 * PlaidItem is the main object that represents a bank link.
 */
export interface PlaidItem {
    itemId: string;
    friendlyName: string;
    encryptedAccessToken: EncryptedData;
    institutionId?: string;
    institutionName?: string;
}

export interface PlaidAccount {
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