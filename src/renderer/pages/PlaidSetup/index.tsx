import React, { useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';

// Setup Form Component
const SetupForm: React.FC<{
    onSetup: (clientId: string, secret: string, password: string) => void;
    isLoading: boolean;
    isSetupComplete: boolean;
}> = ({ onSetup, isLoading, isSetupComplete }) => {
    const [clientId, setClientId] = useState('');
    const [secret, setSecret] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (clientId.trim() && secret.trim() && password.trim()) {
            onSetup(clientId.trim(), secret.trim(), password.trim());
        }
    };

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title text-primary mb-4">
                    {isSetupComplete ? '✅ Plaid Configuration' : 'Plaid Configuration'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Plaid Client ID</span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered w-full"
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            placeholder="Enter your Plaid client ID"
                            disabled={isLoading || isSetupComplete}
                            required
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Plaid Secret</span>
                        </label>
                        <input
                            type="password"
                            className="input input-bordered w-full"
                            value={secret}
                            onChange={(e) => setSecret(e.target.value)}
                            placeholder="Enter your Plaid secret key"
                            disabled={isLoading || isSetupComplete}
                            required
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Encryption Password</span>
                        </label>
                        <input
                            type="password"
                            className="input input-bordered w-full"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password for encrypting stored credentials"
                            disabled={isLoading || isSetupComplete}
                            required
                        />
                        <label className="label">
                            <span className="label-text-alt">This password will be used to encrypt your Plaid credentials</span>
                        </label>
                    </div>

                    <div className="form-control mt-6">
                        <button 
                            type="submit"
                            className={`btn btn-primary w-full ${isLoading ? 'loading' : ''} ${isSetupComplete ? 'btn-success' : ''}`}
                            disabled={isLoading || isSetupComplete || !clientId.trim() || !secret.trim() || !password.trim()}
                        >
                            {isLoading ? 'Setting up...' : 
                             isSetupComplete ? '✅ Setup Complete' : 
                             'Setup Plaid Credentials'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Status Display Component
const StatusDisplay: React.FC<{
    isSetupComplete: boolean;
    onClear: () => void;
    isLoading: boolean;
}> = ({ isSetupComplete, onClear, isLoading }) => {
    if (!isSetupComplete) {
        return (
            <div className="alert alert-info">
                <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Please configure your Plaid credentials to get started</span>
                </div>
            </div>
        );
    }

    return (
        <div className="alert alert-success">
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Plaid credentials configured and encrypted successfully</span>
                </div>
                <button 
                    className="btn btn-sm btn-outline btn-error"
                    onClick={onClear}
                    disabled={isLoading}
                >
                    Clear Setup
                </button>
            </div>
        </div>
    );
};

// Activity Log Component
const ActivityLog: React.FC<{
    logs: string[];
    onClear: () => void;
}> = ({ logs, onClear }) => {
    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="card-title text-primary">Setup Activity</h2>
                    <button 
                        className="btn btn-sm btn-outline"
                        onClick={onClear}
                    >
                        Clear Log
                    </button>
                </div>
                
                <div className="mockup-code max-h-64 overflow-y-auto">
                    {logs.length === 0 ? (
                        <pre data-prefix=">" className="text-info">
                            <code>Ready to configure Plaid...</code>
                        </pre>
                    ) : (
                        logs.map((log, index) => (
                            <pre key={index} data-prefix=">" className="text-sm">
                                <code>{log}</code>
                            </pre>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

// Instructions Component
const Instructions: React.FC = () => {
    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title text-warning">Setup Instructions</h2>
                <div className="prose max-w-none">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold">Getting Your Plaid Credentials</h3>
                            <ol className="list-decimal list-inside space-y-2 mt-2">
                                <li>Visit the <a href="https://dashboard.plaid.com/" target="_blank" rel="noopener noreferrer" className="link link-primary">Plaid Dashboard</a></li>
                                <li>Log in to your developer account</li>
                                <li>Navigate to "Team Settings" → "Keys"</li>
                                <li>Copy your Client ID and Sandbox secret key</li>
                            </ol>
                        </div>

                        <div className="alert alert-warning">
                            <div>
                                <h4 className="font-bold">Security Note</h4>
                                <p>Your credentials will be encrypted and stored locally. The encryption password you provide will be used to secure your Plaid API keys.</p>
                            </div>
                        </div>

                        <div className="alert alert-info">
                            <div>
                                <h4 className="font-bold">Environment</h4>
                                <p>This setup uses Plaid's Sandbox environment for testing. You can switch to Development or Production environments later by updating your secret key.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Access Token Component
const AccessTokenSection: React.FC<{
    isSetupComplete: boolean;
    isLoading: boolean;
    onOpenLink: () => void;
}> = ({ isSetupComplete, isLoading, onOpenLink }) => {
    if (!isSetupComplete) {
        return null;
    }

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title text-accent mb-4">🔗 Connect Bank Account</h2>
                <p className="text-base-content opacity-70 mb-4">
                    Now that your Plaid credentials are configured, you can create a link token to start the account connection process.
                </p>
                
                <div className="form-control">
                    <button 
                        className="btn btn-accent btn-lg w-full"
                        onClick={onOpenLink}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                Creating Link Token...
                            </>
                        ) : (
                            <>
                                🔗 Create Link Token
                            </>
                        )}
                    </button>
                </div>
                
                <div className="alert alert-info mt-4">
                    <div>
                        <h4 className="font-bold">What happens next?</h4>
                        <p className="text-sm">A link token will be created and displayed in the activity log. You can then use this token to open Plaid Link in your browser and connect your bank account.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main PlaidSetup Component
const PlaidSetup: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSetupComplete, setIsSetupComplete] = useState(false);
    const [linkToken, setLinkToken] = useState<string>('');
    const [encryptionPassword, setEncryptionPassword] = useState<string>('');
    const [hasOpenedPlaidLink, setHasOpenedPlaidLink] = useState<boolean>(false);

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
        console.log(message);
    };

    const clearLogs = () => {
        setLogs([]);
    };

    const handleSetup = async (clientId: string, secret: string, password: string) => {
        setIsLoading(true);
        addLog('Setting up Plaid credentials...');
        addLog(`Client ID: ${clientId.substring(0, 10)}...`);
        
        try {
            const result = await window.electronAPI.plaidSetup(password, clientId, secret);
            if (result.success) {
                addLog('✅ Plaid credentials encrypted and stored successfully!');
                setIsSetupComplete(true);
                setEncryptionPassword(password); // Store password for later use
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
                setEncryptionPassword(''); // Clear stored password
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
    React.useEffect(() => {
        if (linkToken && ready && !isLoading && !hasOpenedPlaidLink) {
            addLog('🚀 Auto-opening Plaid Link...');
            setHasOpenedPlaidLink(true);
            open();
        }
    }, [linkToken, ready, isLoading, hasOpenedPlaidLink, open]);

    return (
        <div className="min-h-screen bg-base-200 overflow-auto">
            <div className="container mx-auto p-6 pb-20">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-accent mb-2">Plaid Setup</h1>
                    <p className="text-lg text-base-content opacity-70">Configure your Plaid API credentials to enable bank account connections</p>
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
    );
};

export default PlaidSetup;
