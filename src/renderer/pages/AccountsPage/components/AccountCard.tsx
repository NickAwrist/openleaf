import { PlaidAccount } from "src/types/plaidTypes";

const AccountCard: React.FC<{ account: PlaidAccount }> = ({ account }) => {
    return (
        <div className="card card-bordered">
            <figure>
                <img src="https://placehold.co/400x200" alt="Account Image" />
            </figure>
            <div className="card-body">
                <h2 className="card-title">{account.name}</h2>
                <p className="card-subtitle">{account.subtype}</p>
                <p className="card-subtitle">{account.type}</p>
                <p className="card-subtitle">${account.balances.available.toFixed(2)}</p>
                <div className="card-actions">
                    <button className="btn btn-primary">View Details</button>
                </div>
            </div>
        </div>
    );
};

export default AccountCard;