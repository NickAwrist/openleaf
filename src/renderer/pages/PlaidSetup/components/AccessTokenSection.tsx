import React from 'react';

interface AccessTokenSectionProps {
    isSetupComplete: boolean;
    isLoading: boolean;
    onOpenLink: () => void;
}

const AccessTokenSection: React.FC<AccessTokenSectionProps> = ({ 
    isSetupComplete, 
    isLoading, 
    onOpenLink 
}) => {
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

export default AccessTokenSection; 