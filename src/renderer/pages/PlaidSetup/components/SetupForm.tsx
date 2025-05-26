import React, { useState } from 'react';

interface SetupFormProps {
    onSetup: (clientId: string, secret: string) => void;
    isLoading: boolean;
    isSetupComplete: boolean;
}

const SetupForm: React.FC<SetupFormProps> = ({ 
    onSetup, 
    isLoading, 
    isSetupComplete 
}) => {
    const [clientId, setClientId] = useState('');
    const [secret, setSecret] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (clientId.trim() && secret.trim()) {
            onSetup(clientId.trim(), secret.trim());
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

                    <div className="form-control mt-6">
                        <button 
                            type="submit"
                            className={`btn btn-primary w-full ${isLoading ? 'loading' : ''} ${isSetupComplete ? 'btn-success' : ''}`}
                            disabled={isLoading || isSetupComplete || !clientId.trim() || !secret.trim()}
                        >
                            {isLoading ? 'Setting up...' : 
                             isSetupComplete ? '✅ Setup Complete' : 
                             'Setup Plaid Credentials'}
                        </button>
                    </div>
                </form>
                
                <div className="alert alert-info mt-4">
                    <div>
                        <h4 className="font-bold">🔐 Security Note</h4>
                        <p className="text-sm">
                            Your credentials will be encrypted using the password you provided when accessing this page.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SetupForm; 