import { PlaidAccount } from "src/types/plaidTypes";

import AccountCard from "./AccountCard";

interface AccountsListProps {
    accounts: PlaidAccount[];
    onAccountSelect: (account: PlaidAccount) => void;
}

const AccountsList: React.FC<AccountsListProps> = ({ accounts, onAccountSelect }) => {

    return (
        <div className="max-w-2xl mx-auto h-[70vh] overflow-y-auto space-y-3 pr-2">
            {accounts.map((account) => (
                <AccountCard 
                    key={account.account_id} 
                    account={account} 
                    onClick={() => onAccountSelect(account)}
                />
            ))}
        </div>
    );
};

export default AccountsList;