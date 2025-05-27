import React, { useState, useEffect } from 'react';

import AuthPage from './pages/AuthPage';
import PlaidSetup from './pages/PlaidSetup';
import { User } from 'src/types/userTypes';
import { PlaidAccount, PlaidTransaction } from 'src/types/plaidTypes';
import AccountsPage from './pages/AccountsPage';
import AccountPage from './pages/AccountPage';

declare global {
    interface Window {
        electronAPI: {
            getCurrentUser: () => Promise<User | null>;
            login: (nickname: string, masterPassword: string) => Promise<{success: boolean, error?: string}>;
            register: (nickname: string, masterPassword: string) => Promise<{success: boolean, error?: string}>;
            validatePassword: (password: string) => Promise<boolean>;

            plaidSetup: (password: string, clientId: string, secret: string) => Promise<{success: boolean, error?: string}>;
            plaidCreateLinkToken: (clientUserId: string) => Promise<{success: boolean, error?: string, linkToken?: string}>;
            plaidExchangePublicToken: (password: string, publicToken: string, friendlyName?: string) => Promise<{success: boolean, error?: string, item?: any}>;
            plaidClearCredentials: () => Promise<{success: boolean, error?: string}>;
            plaidGetAccounts: () => Promise<{success: boolean, error?: string, accounts?: PlaidAccount[]}>;
            plaidGetTransactions: (accountId: string) => Promise<PlaidTransaction[]>;
        };
    }
}

function App() {
    const [currentPage, setCurrentPage] = useState('auth');
    const [selectedAccount, setSelectedAccount] = useState<PlaidAccount | null>(null);

    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const checkCurrentUser = async () => {
            const currentUser = await window.electronAPI.getCurrentUser();
            setCurrentUser(currentUser);
        }
        checkCurrentUser();
    }, []);

    useEffect(() => {
        if(currentUser){
            console.log('currentUser', currentUser);
            if(currentUser.sessionExpiresAt < new Date().toISOString()){
                console.log('Session expired, redirecting to auth');
                setCurrentPage('auth');
            }else{
                console.log('Session not expired, redirecting to page1');
                setCurrentPage('accounts');
            }
        }
    }, [currentUser]);

    const handleAccountSelect = (account: PlaidAccount) => {
        setSelectedAccount(account);
        setCurrentPage('account');
    };

    const handleBackToAccounts = () => {
        setSelectedAccount(null);
        setCurrentPage('accounts');
    };

    return (
        <div className="flex flex-col bg-base-200">
            <div className="navbar bg-base-100 shadow-md">
                <div className="flex-1">
                    <a className="btn btn-ghost text-xl">OpenLeaf</a>
                </div>
                <div className="flex-none">
                    <div className="tabs tabs-boxed">
                        <a 
                            className={`tab ${currentPage === 'auth' ? 'tab-active' : ''}`} 
                            onClick={() => setCurrentPage('auth')}
                        >
                            Auth
                        </a>
                        <a 
                            className={`tab ${(currentPage === 'accounts' || currentPage === 'account') ? 'tab-active' : ''}`} 
                            onClick={() => setCurrentPage('accounts')}
                        >
                            Accounts
                        </a>
                        <a 
                            className={`tab ${currentPage === 'plaid-setup' ? 'tab-active' : ''}`} 
                            onClick={() => setCurrentPage('plaid-setup')}
                        >
                            Plaid Setup
                        </a>
                    </div>
                </div>
            </div>
            
            <main className="flex-grow overflow-auto">
                {currentPage === 'auth' ? <AuthPage currentUser={currentUser} changePage={setCurrentPage} /> : 
                 currentPage === 'accounts' ? <AccountsPage onAccountSelect={handleAccountSelect} /> : 
                 currentPage === 'account' && selectedAccount ? <AccountPage account={selectedAccount} onBack={handleBackToAccounts} /> :
                 currentPage === 'plaid-setup' ? <PlaidSetup /> : 
                 <AccountsPage onAccountSelect={handleAccountSelect} />}
            </main>
        </div>
    );
}

export default App; 