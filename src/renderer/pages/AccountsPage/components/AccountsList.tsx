import { PlaidAccount } from "src/types/plaidTypes";

import AccountCard from "./AccountCard";

interface AccountsListProps {
    accounts: PlaidAccount[];
}

const AccountsList: React.FC<AccountsListProps> = ({ accounts }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
                <AccountCard key={account.account_id} account={account} />
            ))}
        </div>
    );
};

export default AccountsList;