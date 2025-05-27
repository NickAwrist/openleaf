import React, { useEffect, useState } from "react";
import { PlaidTransaction } from "src/types/plaidTypes";
import TransactionCard from "./TransactionCard";

interface TransactionsListProps {
    transactions: PlaidTransaction[];
    isLoading?: boolean;
}

const TransactionsList: React.FC<TransactionsListProps> = ({ transactions, isLoading = false }) => {
    const [pageNumber, setPageNumber] = useState(1);

    // Reset page number when transactions change
    useEffect(() => {
        setPageNumber(1);
    }, [transactions]);
    
    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-center py-8">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body text-center py-12">
                    <div className="text-6xl mb-4">💳</div>
                    <h3 className="text-lg font-semibold text-base-content">No transactions found</h3>
                    <p className="text-base-content/70">
                        Transactions will appear here once they are processed by your bank.
                    </p>
                </div>
            </div>
        );
    }

    // Sort transactions by date first
    const sortedTransactions = [...transactions].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Pagination constants
    const TRANSACTIONS_PER_PAGE = 5; // Testing with 5, change to 25 for production
    const totalPages = Math.ceil(sortedTransactions.length / TRANSACTIONS_PER_PAGE);
    
    // Get paginated transactions
    const startIndex = (pageNumber - 1) * TRANSACTIONS_PER_PAGE;
    const endIndex = startIndex + TRANSACTIONS_PER_PAGE;
    const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex);

    // Group paginated transactions by date
    const groupedTransactions = paginatedTransactions.reduce((groups, transaction) => {
        const date = transaction.date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(transaction);
        return groups;
    }, {} as Record<string, PlaidTransaction[]>);

    const sortedDates = Object.keys(groupedTransactions).sort((a, b) => 
        new Date(b).getTime() - new Date(a).getTime()
    );

    const formatDateHeader = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        }
    };
    

    return (
        <div className="space-y-6">
            {/* Pagination Info and Top Controls */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-base-content/70">
                    Showing {startIndex + 1}-{Math.min(endIndex, sortedTransactions.length)} of {sortedTransactions.length} transactions
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center space-x-1">
                        <button 
                            className="btn btn-sm btn-ghost"
                            onClick={() => setPageNumber(pageNumber - 1)}
                            disabled={pageNumber === 1}
                            title="Previous page"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span className="px-3 py-2 text-sm font-medium">
                            Page {pageNumber} of {totalPages}
                        </span>
                        <button 
                            className="btn btn-sm btn-ghost"
                            onClick={() => setPageNumber(pageNumber + 1)}
                            disabled={pageNumber === totalPages}
                            title="Next page"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Transactions */}
            <div className="space-y-6 overflow-y-auto">
                {sortedDates.map((date) => (
                    <div key={date} className="space-y-3">
                        <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold text-base-content">
                                {formatDateHeader(date)}
                            </h3>
                            <div className="flex-1 h-px bg-base-200"></div>
                            <span className="text-sm text-base-content/70">
                                {groupedTransactions[date].length} transaction{groupedTransactions[date].length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className="space-y-2">
                            {groupedTransactions[date].map((transaction) => (
                                <TransactionCard 
                                    key={transaction.transaction_id} 
                                    transaction={transaction} 
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Controls - Bottom */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-1 pt-4 border-t border-base-200">
                    <button 
                        className="btn btn-sm btn-ghost"
                        onClick={() => setPageNumber(pageNumber - 1)}
                        disabled={pageNumber === 1}
                        title="Previous page"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <span className="px-3 py-2 text-sm font-medium">
                        Page {pageNumber} of {totalPages}
                    </span>
                    <button 
                        className="btn btn-sm btn-ghost"
                        onClick={() => setPageNumber(pageNumber + 1)}
                        disabled={pageNumber === totalPages}
                        title="Next page"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
};

export default TransactionsList;
