import React from 'react';

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
                                <p>Your credentials will be encrypted and stored locally. The encryption password you provided when accessing this page will be used to secure your Plaid API keys.</p>
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

export default Instructions; 