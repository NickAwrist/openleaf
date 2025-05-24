import React, { useState } from 'react';
import { PlaidAccount } from 'src/types/plaidTypes';
import AccountsList from './components/AccountsList';

const AccountsPage: React.FC = () => {
    // Mock data for UI layout - replace with actual data source
    const [accounts] = useState<PlaidAccount[]>([]);
    const [isLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredAccounts = accounts.filter(account =>
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.subtype.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-base-100">
            {/* Header Section */}
            <div className="navbar bg-base-200 shadow-md">
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-base-content">Your Accounts</h1>
                </div>
                <div className="flex-none gap-2">
                    <div className="form-control">
                        <input
                            type="text"
                            placeholder="Search accounts..."
                            className="input input-bordered w-24 md:w-auto"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Account
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-6">
                {/* Stats Section */}
                <div className="stats shadow w-full mb-6">
                    <div className="stat">
                        <div className="stat-figure text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                            </svg>
                        </div>
                        <div className="stat-title">Total Accounts</div>
                        <div className="stat-value text-primary">{accounts.length}</div>
                        <div className="stat-desc">Connected accounts</div>
                    </div>

                    <div className="stat">
                        <div className="stat-figure text-secondary">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                        </div>
                        <div className="stat-title">Total Balance</div>
                        <div className="stat-value text-secondary">
                            ${accounts.reduce((sum, account) => sum + (account.balances.available || 0), 0).toFixed(2)}
                        </div>
                        <div className="stat-desc">Available balance</div>
                    </div>

                    <div className="stat">
                        <div className="stat-figure text-accent">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                            </svg>
                        </div>
                        <div className="stat-title">Active</div>
                        <div className="stat-value text-accent">{accounts.filter(a => a.balances.available > 0).length}</div>
                        <div className="stat-desc">Accounts with balance</div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="tabs tabs-boxed mb-6">
                    <a className="tab tab-active">All Accounts</a>
                    <a className="tab">Checking</a>
                    <a className="tab">Savings</a>
                    <a className="tab">Credit Cards</a>
                    <a className="tab">Investment</a>
                </div>

                {/* Content Area */}
                <div className="bg-base-100">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <span className="loading loading-spinner loading-lg"></span>
                            <span className="ml-2 text-lg">Loading accounts...</span>
                        </div>
                    ) : accounts.length === 0 ? (
                        <div className="hero min-h-[400px] bg-base-200 rounded-lg">
                            <div className="hero-content text-center">
                                <div className="max-w-md">
                                    <div className="mb-5">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-24 w-24 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <h1 className="text-2xl font-bold">No Accounts Connected</h1>
                                    <p className="py-6 text-base-content/70">
                                        Get started by connecting your first bank account. We'll help you track your finances and manage your money better.
                                    </p>
                                    <button className="btn btn-primary">Connect Your First Account</button>
                                </div>
                            </div>
                        </div>
                    ) : filteredAccounts.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🔍</div>
                            <h3 className="text-xl font-semibold mb-2">No accounts found</h3>
                            <p className="text-base-content/70">Try adjusting your search criteria</p>
                        </div>
                    ) : (
                        <AccountsList accounts={filteredAccounts} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountsPage;
