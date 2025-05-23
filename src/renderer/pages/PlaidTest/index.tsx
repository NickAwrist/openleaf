import React, { useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';

const PlaidTest = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [linkToken, setLinkToken] = useState<string>('');
    const [clientUserId, setClientUserId] = useState<string>('test-user-123');
    const [friendlyName, setFriendlyName] = useState<string>('Test Account');
    const [isLoading, setIsLoading] = useState(false);
    const [isSetupComplete, setIsSetupComplete] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [linkTokenCreated, setLinkTokenCreated] = useState(false);

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
        console.log(message);
    };

    const clearLogs = () => {
        setLogs([]);
    };

    const handleClearCredentials = async () => {
        setIsLoading(true);
        addLog('Clearing stored Plaid credentials...');
        
        try {
            const result = await window.electronAPI.plaidClearCredentials();
            if (result.success) {
                addLog('✅ Credentials cleared successfully!');
                setIsSetupComplete(false);
                setIsInitialized(false);
                setLinkTokenCreated(false);
                setLinkToken('');
            } else {
                addLog(`❌ Failed to clear credentials: ${result.error}`);
            }
        } catch (error) {
            addLog(`❌ Error clearing credentials: ${error}`);
        }
        
        setIsLoading(false);
    };

    const handleSetup = async () => {
        setIsLoading(true);
        addLog('Setting up Plaid with environment variables...');
        
        try {
            const result = await window.electronAPI.plaidSetup();
            if (result.success) {
                addLog('✅ Plaid setup successful!');
                setIsSetupComplete(true);
            } else {
                addLog(`❌ Plaid setup failed: ${result.error}`);
            }
        } catch (error) {
            addLog(`❌ Plaid setup error: ${error}`);
        }
        
        setIsLoading(false);
    };

    const handleInitialize = async () => {
        setIsLoading(true);
        addLog('Initializing Plaid client for session...');
        
        try {
            const result = await window.electronAPI.plaidInitialize();
            if (result.success) {
                addLog('✅ Plaid client initialized successfully!');
                setIsInitialized(true);
            } else {
                addLog(`❌ Plaid initialization failed: ${result.error}`);
            }
        } catch (error) {
            addLog(`❌ Plaid initialization error: ${error}`);
        }
        
        setIsLoading(false);
    };

    const handleCreateLinkToken = async () => {
        if (!clientUserId.trim()) {
            addLog('❌ Please enter a client user ID');
            return;
        }

        setIsLoading(true);
        addLog(`Creating link token for user: ${clientUserId}...`);
        
        try {
            const result = await window.electronAPI.plaidCreateLinkToken(clientUserId);
            if (result.success && result.linkToken) {
                setLinkToken(result.linkToken);
                setLinkTokenCreated(true);
                addLog('✅ Link token created successfully!');
                addLog(`Link token: ${result.linkToken.substring(0, 20)}...`);
                addLog('🔗 You can now use Plaid Link below!');
            } else {
                addLog(`❌ Link token creation failed: ${result.error}`);
            }
        } catch (error) {
            addLog(`❌ Link token creation error: ${error}`);
        }
        
        setIsLoading(false);
    };

    const handleExchangePublicToken = async (publicToken: string) => {
        setIsLoading(true);
        addLog(`Exchanging public token for access token...`);
        addLog(`Public token received: ${publicToken.substring(0, 20)}...`);
        
        try {
            const result = await window.electronAPI.plaidExchangePublicToken(publicToken, friendlyName);
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

    // Plaid Link configuration
    const config = {
        token: linkToken,
        onSuccess: (public_token: string, metadata: any) => {
            addLog(`✅ Plaid Link successful! Institution: ${metadata.institution?.name}`);
            addLog(`Account(s) linked: ${metadata.accounts?.length || 0}`);
            handleExchangePublicToken(public_token);
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

    return (
        <div className="min-h-screen bg-base-200 overflow-auto">
            <div className="container mx-auto p-6 pb-20">
                <h1 className="text-3xl font-bold text-accent mb-6">Plaid Integration Test</h1>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Controls Section */}
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title text-primary mb-4">Test Controls</h2>
                            
                            <div className="space-y-4">
                                {/* Step 1: Setup */}
                                <div className="divider">Step 1: Setup Credentials</div>
                                <button 
                                    className={`btn btn-primary w-full ${isLoading ? 'loading' : ''} ${isSetupComplete ? 'btn-success' : ''}`}
                                    onClick={handleSetup}
                                    disabled={isLoading || isSetupComplete}
                                >
                                    {isSetupComplete ? '✅ Setup Complete' : 'Setup Plaid (Store Credentials)'}
                                </button>
                                
                                {/* Step 2: Initialize */}
                                <div className="divider">Step 2: Initialize Client</div>
                                <button 
                                    className={`btn btn-secondary w-full ${isLoading ? 'loading' : ''} ${isInitialized ? 'btn-success' : ''}`}
                                    onClick={handleInitialize}
                                    disabled={isLoading || !isSetupComplete || isInitialized}
                                >
                                    {isInitialized ? '✅ Client Initialized' : 'Initialize Plaid Client'}
                                </button>
                                
                                {/* Step 3: Create Link Token */}
                                <div className="divider">Step 3: Create Link Token</div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Client User ID</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered"
                                        value={clientUserId}
                                        onChange={(e) => setClientUserId(e.target.value)}
                                        placeholder="Enter client user ID"
                                        disabled={!isInitialized || linkTokenCreated}
                                    />
                                </div>
                                <button 
                                    className={`btn btn-accent w-full ${isLoading ? 'loading' : ''} ${linkTokenCreated ? 'btn-success' : ''}`}
                                    onClick={handleCreateLinkToken}
                                    disabled={isLoading || !isInitialized || linkTokenCreated}
                                >
                                    {linkTokenCreated ? '✅ Link Token Created' : 'Create Link Token'}
                                </button>
                                
                                {/* Step 4: Plaid Link */}
                                <div className="divider">Step 4: Link Your Account</div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Friendly Name (Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered"
                                        value={friendlyName}
                                        onChange={(e) => setFriendlyName(e.target.value)}
                                        placeholder="Enter account friendly name"
                                        disabled={!linkTokenCreated}
                                    />
                                </div>
                                <button 
                                    className={`btn btn-success w-full ${!ready || !linkTokenCreated ? 'btn-disabled' : ''}`}
                                    onClick={() => open()}
                                    disabled={!ready || !linkTokenCreated || isLoading}
                                >
                                    🔗 Launch Plaid Link
                                </button>
                                
                                {!ready && linkTokenCreated && (
                                    <div className="alert alert-info">
                                        <div>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            <span>Plaid Link is loading...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Logs Section */}
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="card-title text-primary">Console Logs</h2>
                                <div className="flex gap-2">
                                    <button 
                                        className="btn btn-sm btn-outline"
                                        onClick={clearLogs}
                                    >
                                        Clear Logs
                                    </button>
                                    <button 
                                        className="btn btn-sm btn-error btn-outline"
                                        onClick={handleClearCredentials}
                                        disabled={isLoading}
                                    >
                                        Clear Credentials
                                    </button>
                                </div>
                            </div>
                            
                            <div className="mockup-code max-h-96 overflow-y-auto">
                                {logs.length === 0 ? (
                                    <pre data-prefix="$" className="text-info">
                                        <code>Ready to test Plaid integration...</code>
                                    </pre>
                                ) : (
                                    logs.map((log, index) => (
                                        <pre key={index} data-prefix={index + 1} className="text-sm">
                                            <code>{log}</code>
                                        </pre>
                                    ))
                                )}
                            </div>

                            {/* Display Link Token */}
                            {linkToken && (
                                <div className="mt-4">
                                    <div className="alert alert-info">
                                        <div>
                                            <h3 className="font-bold">Link Token Generated!</h3>
                                            <div className="text-xs break-all font-mono bg-base-200 p-2 rounded mt-2">
                                                {linkToken}
                                            </div>
                                            <p className="text-sm mt-2">
                                                Click "Launch Plaid Link" to connect your account!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="card bg-base-100 shadow-xl mt-6">
                    <div className="card-body">
                        <h2 className="card-title text-warning">How to Test</h2>
                        <div className="prose max-w-none">
                            <ol className="list-decimal list-inside space-y-2">
                                <li><strong>Setup:</strong> Click "Setup Plaid" to store your credentials from environment variables</li>
                                <li><strong>Initialize:</strong> Click "Initialize Plaid Client" to decrypt credentials and create the Plaid client</li>
                                <li><strong>Link Token:</strong> Enter a user ID and click "Create Link Token" to generate a link token</li>
                                <li><strong>Plaid Link:</strong> Click "Launch Plaid Link" to open the official Plaid UI for account linking</li>
                                <li><strong>Complete:</strong> Select your bank, enter credentials, and the public token will be automatically exchanged</li>
                            </ol>
                            
                            <div className="alert alert-warning mt-4">
                                <div>
                                    <h4 className="font-bold">Sandbox Testing</h4>
                                    <p>This uses Plaid's sandbox environment. Use these test credentials:</p>
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                        <li><strong>Username:</strong> user_good</li>
                                        <li><strong>Password:</strong> pass_good</li>
                                        <li><strong>PIN:</strong> 1234 (if required)</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="alert alert-info mt-4">
                                <div>
                                    <h4 className="font-bold">Environment Setup</h4>
                                    <p>Make sure your .env file contains:</p>
                                    <ul className="list-disc list-inside mt-2">
                                        <li>PLAID_CLIENT_ID=your_client_id</li>
                                        <li>PLAID_SECRET=your_sandbox_secret</li>
                                        <li>USER_PASSWORD=any_password_for_encryption</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlaidTest;
