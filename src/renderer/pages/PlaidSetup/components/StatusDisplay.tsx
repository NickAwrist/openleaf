import React from 'react';

interface StatusDisplayProps {
    isSetupComplete: boolean;
    onClear: () => void;
    isLoading: boolean;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ 
    isSetupComplete, 
    onClear, 
    isLoading 
}) => {
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

export default StatusDisplay; 