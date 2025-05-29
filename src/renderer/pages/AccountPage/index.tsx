import React, { useEffect, useState } from "react";
import { PlaidAccount, PlaidTransaction } from "src/types/plaidTypes";
import { TransactionsList, IncomeSpendingAnalysis } from "./components";

interface AccountPageProps {
    account: PlaidAccount;
    onBack: () => void;
}

const AccountPage: React.FC<AccountPageProps> = ({ account, onBack }) => {
    const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    const fetchTransactions = async () => {
        try {
            const transactions = await window.electronAPI.plaidGetTransactions(account.account_id);
            setTransactions(transactions);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    useEffect(() => {
        const fetchAccount = async () => {
            setIsLoading(true);
            try {
                await fetchTransactions();
            } finally {
                setIsLoading(false);
            }
        };
        fetchAccount();
    }, [account]);

    const handleRefreshTransactions = async () => {
        setIsSyncing(true);
        try {
            console.log('Syncing transactions...');
            const syncResult = await window.electronAPI.plaidSyncTransactions();
            
            if (syncResult.success) {
                console.log('Sync successful, refreshing transactions...');
                await fetchTransactions();
            } else {
                console.error('Sync failed:', syncResult.error);
                // You could add a toast notification here
            }
        } catch (error) {
            console.error('Error syncing transactions:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    const formatCurrency = (amount: number, currencyCode: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode || 'USD',
        }).format(amount);
    };

    const getAccountTypeIcon = (type: string, subtype: string) => {
        if (type === 'depository') {
            if (subtype === 'checking') return '🏦';
            if (subtype === 'savings') return '💰';
        }
        if (type === 'credit') return '💳';
        if (type === 'investment') return '📈';
        return '🏛️';
    };

    return (
        <div className="bg-base-200 h-screen p-6 min-h-screen overflow-y-auto">
            {/* Back Button */}
            <div className="flex items-center space-x-4 mb-6">
                <button 
                    onClick={onBack}
                    className="btn btn-ghost btn-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Accounts
                </button>
            </div>

            {/* Main Two Column Layout */}
            <div className="grid lg:grid-cols-5 gap-6">
                {/* Left Column - Header + Transactions (3/5 of width) */}
                <div className="lg:col-span-3 flex flex-col space-y-6">
                    {/* Account Header */}
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="text-4xl">
                                        {getAccountTypeIcon(account.type, account.subtype)}
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-base-content">
                                            {account.official_name || account.name}
                                        </h1>
                                        <p className="text-base-content/70">
                                            {account.institution_name} • {account.subtype} • ••••{account.mask}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-base-content/70">Available Balance</div>
                                    <div className="text-3xl font-bold text-success">
                                        {formatCurrency(account.balances.available, account.balances.iso_currency_code)}
                                    </div>
                                    {account.balances.current !== account.balances.available && (
                                        <div className="text-sm text-base-content/70">
                                            Current: {formatCurrency(account.balances.current, account.balances.iso_currency_code)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Account Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                <div className="stat bg-base-200 rounded-lg">
                                    <div className="stat-title">Account Type</div>
                                    <div className="stat-value text-lg capitalize">{account.type}</div>
                                    <div className="stat-desc capitalize">{account.subtype}</div>
                                </div>
                                <div className="stat bg-base-200 rounded-lg">
                                    <div className="stat-title">Current Balance</div>
                                    <div className="stat-value text-lg">
                                        {formatCurrency(account.balances.current, account.balances.iso_currency_code)}
                                    </div>
                                    {account.balances.limit && (
                                        <div className="stat-desc">
                                            Limit: {formatCurrency(account.balances.limit, account.balances.iso_currency_code)}
                                        </div>
                                    )}
                                </div>
                                <div className="stat bg-base-200 rounded-lg">
                                    <div className="stat-title">Transactions</div>
                                    <div className="stat-value text-lg">{transactions.length}</div>
                                    <div className="stat-desc">Recent activity</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transactions Section */}
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-base-content">Recent Transactions</h2>
                                <div className="flex items-center space-x-3">
                                    <div className="badge badge-neutral">
                                        {transactions.length} total
                                    </div>
                                    <button 
                                        onClick={handleRefreshTransactions}
                                        disabled={isSyncing}
                                        className="btn btn-sm btn-ghost"
                                        title="Sync latest transactions"
                                    >
                                        <svg 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} 
                                            fill="none" 
                                            viewBox="0 0 24 24" 
                                            stroke="currentColor"
                                        >
                                            <path 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round" 
                                                strokeWidth={2} 
                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                                            />
                                        </svg>
                                        {isSyncing ? 'Syncing...' : 'Refresh'}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="max-h-[800px] overflow-y-auto">
                                <TransactionsList 
                                    transactions={transactions} 
                                    isLoading={isLoading}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Income vs Spending Analysis (2/5 of width) */}
                <div className="lg:col-span-2 card bg-base-100 shadow-lg mb-20">
                    <div className="card-body">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-base-content">Income vs Spending</h2>
                            <div className="badge badge-primary">
                                Analysis
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            <IncomeSpendingAnalysis 
                                transactions={transactions}
                                currencyCode={account.balances.iso_currency_code}
                                account={account}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountPage;