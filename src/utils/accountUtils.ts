import { PlaidAccount } from "src/types/plaidTypes";
import { dbService } from "../main";

export function addAccount(account: PlaidAccount, userId: string) {
    dbService.addAccount(account, userId);
}

export function getAccounts(userId: string) {
    return dbService.getAccounts(userId);
}

export function updateAccount(account: PlaidAccount, userId: string) {
    dbService.updateAccount(account, userId);
}

export function deleteAccount(accountId: string) {
    dbService.deleteAccount(accountId);
}