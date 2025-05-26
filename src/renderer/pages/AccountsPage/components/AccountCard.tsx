import { useEffect, useState } from "react";
import { PlaidAccount, PlaidBalance } from "src/types/plaidTypes";

const AccountCard: React.FC<{ account: PlaidAccount }> = ({ account }) => {

    const balances = typeof account.balances === 'string' 
        ? JSON.parse(account.balances) 
        : account.balances;

    const formatCurrency = (amount: number | null | undefined) => {
        if (amount === null || amount === undefined) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const displayBalance = balances?.available !== undefined && balances?.available !== null 
        ? balances.available 
        : balances?.current !== undefined && balances?.current !== null
        ? balances.current
        : null;


    return (
        <div className="card bg-base-100 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] cursor-pointer border border-base-300">
            <div className="card-body p-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="mb-1">
                            <span className="text-xs font-medium uppercase tracking-wider text-base-content/50">
                                {account.institution_name}
                            </span>
                        </div>
                        <h2 className="card-title text-base font-semibold text-base-content mb-1">
                            {account.name}
                        </h2>
                        <div className="flex items-center space-x-2 text-xs text-base-content/70">
                            <span className="badge badge-outline badge-xs">{account.type}</span>
                            <span className="capitalize">{account.subtype}</span>
                        </div>
                    </div>
                    <div className="text-right ml-4">
                        <div className="text-xl font-bold text-base-content">
                            {formatCurrency(displayBalance)}
                        </div>
                        <div className="text-xs text-base-content/60">
                            {balances?.available !== undefined && balances?.available !== null 
                                ? 'Available' 
                                : 'Current'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountCard;