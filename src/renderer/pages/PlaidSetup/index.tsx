import React, { useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import {
    PasswordModal,
    SetupForm,
    StatusDisplay,
    ActivityLog,
    Instructions,
    AccessTokenSection
} from './components';

// Main PlaidSetup Component
const PlaidSetup: React.FC = () => {
    // State management
    const [logs, setLogs] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSetupComplete, setIsSetupComplete] = useState(false);
    const [linkToken, setLinkToken] = useState<string>('');
    const [encryptionPassword, setEncryptionPassword] = useState<string>('');
    const [hasOpenedPlaidLink, setHasOpenedPlaidLink] = useState<boolean>(false);
    
    // Password modal state
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(true);
    const [isPageUnlocked, setIsPageUnlocked] = useState(false);

    // Utility functions
    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
        console.log(message);
    };

    const clearLogs = () => {
        setLogs([]);
    };

    // Password modal handlers
    const handlePasswordSubmit = async (password: string) => {
        const isPasswordCorrect = await window.electronAPI.validatePassword(password);
        if(!isPasswordCorrect) {
            addLog('❌ Invalid password');
            return;
        }
        
        setEncryptionPassword(password);
        setIsPasswordModalOpen(false);
        setIsPageUnlocked(true);
        addLog('🔓 Page unlocked with encryption password');
        addLog('Ready to configure Plaid credentials...');
    };

    const handlePasswordModalClose = () => {
        // Optional: handle when user tries to close modal without entering password
        // For now, we'll just keep the modal open since password is required
        addLog('⚠️ Password is required to access this page');
    };

    // Setup and configuration handlers
    const handleSetup = async (clientId: string, secret: string) => {
        if (!encryptionPassword) {
            addLog('❌ Encryption password not available');
            return;
        }

        setIsLoading(true);
        addLog('Setting up Plaid credentials...');
        addLog(`Client ID: ${clientId.substring(0, 10)}...`);
        
        try {
            const result = await window.electronAPI.plaidSetup(encryptionPassword, clientId, secret);
            if (result.success) {
                addLog('✅ Plaid credentials encrypted and stored successfully!');
                setIsSetupComplete(true);
            } else {
                addLog(`❌ Setup failed: ${result.error}`);
            }
        } catch (error) {
            addLog(`❌ Setup error: ${error}`);
        }
        
        setIsLoading(false);
    };

    const handleClearCredentials = async () => {
        setIsLoading(true);
        addLog('Clearing stored Plaid credentials...');
        
        try {
            const result = await window.electronAPI.plaidClearCredentials();
            if (result.success) {
                addLog('✅ Credentials cleared successfully!');
                setIsSetupComplete(false);
                setLinkToken(''); // Clear link token
                setHasOpenedPlaidLink(false); // Reset Plaid Link state
            } else {
                addLog(`❌ Failed to clear credentials: ${result.error}`);
            }
        } catch (error) {
            addLog(`❌ Error clearing credentials: ${error}`);
        }
        
        setIsLoading(false);
    };

    const handleExchangePublicToken = async (publicToken: string, password: string) => {
        setIsLoading(true);
        addLog(`Exchanging public token for access token...`);
        addLog(`Public token received: ${publicToken.substring(0, 20)}...`);
        
        try {
            const friendlyName = 'Connected Account'; // You can make this configurable if needed
            const result = await window.electronAPI.plaidExchangePublicToken(password, publicToken, friendlyName);
            if (result.success && result.item) {
                addLog('✅ Public token exchanged successfully!');
                addLog(`Item ID: ${result.item.itemId}`);
                addLog(`Friendly Name: ${result.item.friendlyName}`);
                addLog(`Access token encrypted and stored.`);
                addLog('🎉 Account linking complete!');
            } else {
                addLog(`❌ Public token exchange failed: ${result.error}`);
            }
        } catch (error) {
            addLog(`❌ Public token exchange error: ${error}`);
        }
        
        setIsLoading(false);
    };

    const handleOpenLink = async () => {
        setIsLoading(true);
        addLog('Creating Plaid Link token...');
        
        try {
            // First create a link token
            const clientUserId = 'user_' + Date.now(); // Generate a simple user ID
            const linkTokenResult = await window.electronAPI.plaidCreateLinkToken(clientUserId);
            
            if (linkTokenResult.success && linkTokenResult.linkToken) {
                addLog('✅ Link token created successfully!');
                addLog(`Link token: ${linkTokenResult.linkToken.substring(0, 20)}...`);
                addLog('🔗 Opening Plaid Link...');
                setLinkToken(linkTokenResult.linkToken);
                setHasOpenedPlaidLink(false); // Reset for new link token
                // The Plaid Link will automatically open when the token is set
            } else {
                addLog(`❌ Failed to create link token: ${linkTokenResult.error}`);
            }
        } catch (error) {
            addLog(`❌ Error creating link token: ${error}`);
        }
        
        setIsLoading(false);
    };

    // Plaid Link configuration
    const config = {
        token: linkToken,
        onSuccess: (public_token: string, metadata: any) => {
            addLog(`✅ Plaid Link successful! Institution: ${metadata.institution?.name}`);
            addLog(`Account(s) linked: ${metadata.accounts?.length || 0}`);
            handleExchangePublicToken(public_token, encryptionPassword);
        },
        onExit: (err: any, metadata: any) => {
            if (err) {
                addLog(`❌ Plaid Link error: ${err.error_message || 'Unknown error'}`);
            } else {
                addLog('ℹ️ Plaid Link exited by user');
            }
        },
    };

    const { open, ready } = usePlaidLink(config);

    // Auto-open Plaid Link when token is available and ready (only once)
    useEffect(() => {
        if (linkToken && ready && !isLoading && !hasOpenedPlaidLink) {
            addLog('🚀 Auto-opening Plaid Link...');
            setHasOpenedPlaidLink(true);
            open();
        }
    }, [linkToken, ready, isLoading, hasOpenedPlaidLink, open]);

    return (
        <>
            {/* Password Modal */}
            <PasswordModal
                isOpen={isPasswordModalOpen}
                onPasswordSubmit={handlePasswordSubmit}
                onClose={handlePasswordModalClose}
            />

            {/* Main Content with Blur Effect */}
            <div className={`min-h-screen bg-base-200 overflow-auto transition-all duration-300 ${
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
                        {/* Left Column */}
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

                        {/* Right Column */}
                        <div className="space-y-6">
                            <ActivityLog 
                                logs={logs}
                                onClear={clearLogs}
                            />
                        </div>
                    </div>

                    {/* Instructions - Full Width */}
                    <div className="mt-8">
                        <Instructions />
                    </div>
                </div>
            </div>
        </>
    );
};

export default PlaidSetup;
