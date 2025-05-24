import { useEffect, useState } from "react";
import { PlaidAccount, PlaidBalance } from "src/types/plaidTypes";

const AccountCard: React.FC<{ account: PlaidAccount }> = ({ account }) => {

    console.log('AccountCard account.balances:', account.balances);
    console.log('AccountCard account.balances type:', typeof account.balances);

    const balances = typeof account.balances === 'string' 
        ? JSON.parse(account.balances) 
        : account.balances;

    return (
        <div className="card card-bordered bg-base-200">
            <div className="card-body">
                <h2 className="card-title">{account.name}</h2>
                <p className="card-subtitle">{account.subtype}</p>
                <p className="card-subtitle">{account.type}</p>
                <p className="card-subtitle">
                    ${balances?.available !== undefined && balances?.available !== null 
                        ? balances.available.toFixed(2) 
                        : balances?.current !== undefined && balances?.current !== null
                        ? balances.current.toFixed(2)
                        : 'N/A'}
                </p>
                <div className="card-actions">
                    <button className="btn btn-primary">View Details</button>
                </div>
            </div>
        </div>
    );
};

export default AccountCard;