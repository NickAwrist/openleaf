import React, { useEffect, useState } from 'react';
import { PlaidAccount } from 'src/types/plaidTypes';
import AccountsList from './components/AccountsList';

const AccountsPage: React.FC = () => {
    const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAccounts = async () => {
            setIsLoading(true);
            console.log('Fetching accounts');
            try {
                const fetchedData = await window.electronAPI.plaidGetAccounts();
                console.log('Raw data from plaidGetAccounts:', fetchedData);

                if (fetchedData.success && fetchedData.accounts) {
                    console.log(`Successfully fetched ${fetchedData.accounts.length} account(s).`);
                    setAccounts(fetchedData.accounts);
                } else {
                    console.error('Error: plaidGetAccounts did not return an array. Actual data:', fetchedData);
                    setAccounts([]); 
                }
            } catch (error) {
                console.error('Exception occurred while fetching accounts:', error);
                setAccounts([]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchAccounts();
    }, []);

    // Log state right before render logic for debugging
    console.log('Render check - isLoading:', isLoading, 'accounts present:', !!accounts, 'accounts.length:', accounts ? accounts.length : 'N/A (accounts is null/undefined)');

    return (
        <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300">
            {/* Header Section */}
            <div className="navbar bg-base-100 shadow-lg border-b border-base-300">
                <div className="container mx-auto px-4">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-base-content">Your Accounts</h1>
                        <div className="ml-4 text-sm text-base-content/60">
                            {!isLoading && `${accounts.length} ${accounts.length === 1 ? 'account' : 'accounts'}`}
                        </div>
                    </div>
                    <div className="flex-none">
                        <button className="btn btn-primary btn-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Account
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                {isLoading ? (
                    <div className="flex flex-col justify-center items-center py-16">
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                        <span className="mt-4 text-lg text-base-content/70">Loading your accounts...</span>
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="max-w-md mx-auto">
                            <div className="w-24 h-24 mx-auto mb-6 bg-base-300 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-base-content mb-2">No accounts found</h3>
                            <p className="text-base-content/60 mb-6">Connect your first account to get started with managing your finances.</p>
                            <button className="btn btn-primary">
                                Connect Your First Account
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="mb-6 text-center">
                            <p className="text-base-content/70">
                                Manage and monitor all your connected accounts in one place
                            </p>
                        </div>
                        <AccountsList accounts={accounts} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountsPage;
