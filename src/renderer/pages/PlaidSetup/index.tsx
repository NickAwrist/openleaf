import React, { useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import {
    PasswordModal,
    SetupForm,
    StatusDisplay,
    Instructions,
    AccessTokenSection,
    PlaidLinksSection
} from './components';

// Main PlaidSetup Component
const PlaidSetup: React.FC = () => {
    // State management
    const [isLoading, setIsLoading] = useState(false);
    const [isSetupComplete, setIsSetupComplete] = useState(false);
    const [linkToken, setLinkToken] = useState<string>('');
    const [encryptionPassword, setEncryptionPassword] = useState<string>('');
    const [hasOpenedPlaidLink, setHasOpenedPlaidLink] = useState<boolean>(false);
    
    // Password modal state
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(true);
    const [isPageUnlocked, setIsPageUnlocked] = useState(false);
    // Password modal handlers
    const handlePasswordSubmit = async (password: string) => {
        const isPasswordCorrect = await window.electronAPI.validatePassword(password);
        if(!isPasswordCorrect) {
            return;
        }
        
        setEncryptionPassword(password);
        setIsPasswordModalOpen(false);
        setIsPageUnlocked(true);
    };

    const handlePasswordModalClose = () => {
        // Optional: handle when user tries to close modal without entering password
        // For now, we'll just keep the modal open since password is required
        
    };

    // Setup and configuration handlers
    const handleSetup = async (clientId: string, secret: string) => {
        if (!encryptionPassword) {
            return;
        }

        setIsLoading(true);
        
        try {
            const result = await window.electronAPI.plaidSetup(encryptionPassword, clientId, secret);
            if (result.success) {
                setIsSetupComplete(true);
            }
        } catch (error) {
            console.error(error);
        }
        
        setIsLoading(false);
    };

    const handleClearCredentials = async () => {
        setIsLoading(true);
        
        try {
            const result = await window.electronAPI.plaidClearCredentials();
            if (result.success) {
                setIsSetupComplete(false);
                setLinkToken(''); 
                setHasOpenedPlaidLink(false); 
            }
        } catch (error) {
            console.error(error);
        }
        
        setIsLoading(false);
    };

    const handleExchangePublicToken = async (publicToken: string, password: string) => {
        setIsLoading(true);
        
        try {
            const friendlyName = 'OpenLeaf Connected Account';
            const result = await window.electronAPI.plaidExchangePublicToken(password, publicToken, friendlyName);
            if (result.success && result.item) {
                // Handle success
            }
        } catch (error) {
            console.error(error);
        }
        
        setIsLoading(false);
    };

    const handleOpenLink = async () => {
        setIsLoading(true);
        
        try {
            // First create a link token
            const clientUserId = 'user_' + Date.now(); // Generate a simple user ID
            const linkTokenResult = await window.electronAPI.plaidCreateLinkToken(clientUserId);
            
            if (linkTokenResult.success && linkTokenResult.linkToken) {
                setLinkToken(linkTokenResult.linkToken);
                setHasOpenedPlaidLink(false); // Reset for new link token
                // The Plaid Link will automatically open when the token is set
            }
        } catch (error) {
            console.error(error);
        }
        
        setIsLoading(false);
    };

    // Plaid Link configuration
    const config = {
        token: linkToken,
        onSuccess: (public_token: string, metadata: any) => {
            handleExchangePublicToken(public_token, encryptionPassword);
        },
        onExit: (err: any, metadata: any) => {
            if (err) {
                console.error(err);
            }
        },
    };

    const { open, ready } = usePlaidLink(config);

    // Auto-open Plaid Link when token is available and ready (only once)
    useEffect(() => {
        if (linkToken && ready && !isLoading && !hasOpenedPlaidLink) {
            setHasOpenedPlaidLink(true);
            open();
        }
    }, [linkToken, ready, isLoading, hasOpenedPlaidLink, open]);

    return (
        <>
            <PasswordModal
                isOpen={isPasswordModalOpen}
                onPasswordSubmit={handlePasswordSubmit}
                onClose={handlePasswordModalClose}
            />

            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-base-300/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-base-100 p-8 rounded-2xl shadow-2xl border border-base-300 flex flex-col items-center space-y-4 min-w-[300px]">
                        <div className="loading loading-spinner loading-lg text-primary"></div>
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-base-content mb-1">Processing...</h3>
                            <p className="text-sm text-base-content/70">Please wait while we handle your request</p>
                        </div>
                    </div>
                </div>
            )}

            <div className={`min-h-screen bg-base-200 h-screen overflow-auto transition-all duration-300 ${
                isPasswordModalOpen ? 'blur-sm pointer-events-none' : ''
            }`}>
                <div className="container mx-auto p-6 pb-20">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-accent mb-2">Plaid Setup</h1>
                        <p className="text-lg text-base-content opacity-70">
                            Configure your Plaid API credentials to enable bank account connections
                        </p>
                        {isPageUnlocked && (
                            <div className="badge badge-success mt-2">
                                🔓 Page Unlocked
                            </div>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <StatusDisplay 
                                isSetupComplete={isSetupComplete}
                                onClear={handleClearCredentials}
                                isLoading={isLoading}
                            />
                            
                            <SetupForm 
                                onSetup={handleSetup}
                                isLoading={isLoading}
                                isSetupComplete={isSetupComplete}
                            />

                            <AccessTokenSection 
                                isSetupComplete={isSetupComplete}
                                isLoading={isLoading}
                                onOpenLink={handleOpenLink}
                            />
                        </div>
                        
                        <div className="space-y-6">
                            <PlaidLinksSection 
                                isPageUnlocked={isPageUnlocked}
                                isLoading={isLoading}
                            />
                        </div>
                    </div>

                    <div className="mt-8">
                        <Instructions />
                    </div>
                </div>
            </div>
        </>
    );
};

export default PlaidSetup;
