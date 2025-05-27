import React, { useState } from "react";
import { PlaidTransaction } from "src/types/plaidTypes";

interface TransactionCardProps {
    transaction: PlaidTransaction;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const formatCurrency = (amount: number, currencyCode: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode || 'USD',
        }).format(Math.abs(amount));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const isDebit = transaction.amount > 0;

    return (
        <div className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all duration-200">
            <div 
                className="card-body p-4 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${isDebit ? 'bg-error' : 'bg-success'}`}></div>
                        <div>
                            <h3 className="font-semibold text-base-content">
                                {transaction.merchant_name || transaction.name}
                            </h3>
                            <p className="text-sm text-base-content/70">
                                {formatDate(transaction.date)}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        {transaction.pending && (
                            <div className="badge badge-warning badge-sm">Pending</div>
                        )}
                        <div className={`text-lg font-bold ${isDebit ? 'text-error' : 'text-success'}`}>
                            {isDebit ? '-' : '+'}{formatCurrency(transaction.amount, transaction.iso_currency_code)}
                        </div>
                        <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                            <svg className="w-5 h-5 text-base-content/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Expandable content */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
                }`}>
                    <div className="border-t border-base-200 pt-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-base-content/70">Transaction ID:</span>
                                <p className="font-mono text-xs break-all">{transaction.transaction_id}</p>
                            </div>
                            <div>
                                <span className="text-base-content/70">Account ID:</span>
                                <p className="font-mono text-xs break-all">{transaction.account_id}</p>
                            </div>
                            <div>
                                <span className="text-base-content/70">Payment Channel:</span>
                                <p className="capitalize">{transaction.payment_channel}</p>
                            </div>
                            <div>
                                <span className="text-base-content/70">Status:</span>
                                <p className={transaction.pending ? 'text-warning' : 'text-success'}>
                                    {transaction.pending ? 'Pending' : 'Completed'}
                                </p>
                            </div>
                            {transaction.merchant_name && transaction.merchant_name !== transaction.name && (
                                <div className="col-span-2">
                                    <span className="text-base-content/70">Description:</span>
                                    <p>{transaction.name}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionCard;
