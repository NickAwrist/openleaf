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

                if (Array.isArray(fetchedData)) {
                    console.log(`Successfully fetched ${fetchedData.length} account(s).`);
                    setAccounts(fetchedData as PlaidAccount[]);
                } else {
                    console.error('Error: plaidGetAccounts did not return an array. Actual data:', fetchedData);
                    setAccounts([]); // Set to empty array if data is not an array
                }
            } catch (error) {
                console.error('Exception occurred while fetching accounts:', error);
                setAccounts([]); // Set to empty array on exception
            } finally {
                setIsLoading(false);
            }
        }
        fetchAccounts();
    }, []);

    // Log state right before render logic for debugging
    console.log('Render check - isLoading:', isLoading, 'accounts present:', !!accounts, 'accounts.length:', accounts ? accounts.length : 'N/A (accounts is null/undefined)');

    return (
        <div className="min-h-screen bg-base-100">
            {/* Header Section */}
            <div className="navbar bg-base-200 shadow-md">
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-base-content">Your Accounts</h1>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-6">
                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <span className="loading loading-spinner loading-lg"></span>
                        <span className="ml-2 text-lg">Loading accounts...</span>
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-lg">No accounts found</p>
                    </div>
                ) : (
                    <AccountsList accounts={accounts} />
                )}
            </div>
        </div>
    );
};

export default AccountsPage;
