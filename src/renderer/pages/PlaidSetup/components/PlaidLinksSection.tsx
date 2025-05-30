import React, { useState, useEffect } from 'react';
import { PlaidLink } from 'src/types/plaidTypes';

interface PlaidLinksSectionProps {
    isPageUnlocked: boolean;
    isLoading: boolean;
}

const PlaidLinksSection: React.FC<PlaidLinksSectionProps> = ({ 
    isPageUnlocked, 
    isLoading 
}) => {
    const [plaidLinks, setPlaidLinks] = useState<PlaidLink[]>([]);
    const [isLoadingLinks, setIsLoadingLinks] = useState(false);

    const fetchPlaidLinks = async () => {
        if (!isPageUnlocked) return;
        
        setIsLoadingLinks(true);
        try {
            const links = await window.electronAPI.plaidGetPlaidLinks();
            setPlaidLinks(links);
        } catch (error) {
            console.error('Failed to fetch Plaid links:', error);
        }
        setIsLoadingLinks(false);
    };

    useEffect(() => {
        fetchPlaidLinks();
    }, [isPageUnlocked]);

    const handleRefresh = () => {
        fetchPlaidLinks();
    };

    if (!isPageUnlocked) {
        return (
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title text-secondary">
                        🔗 Connected Accounts
                    </h2>
                    <div className="alert alert-warning">
                        <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
                            </svg>
                            <span>Please unlock the page to view connected accounts</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="card-title text-secondary">
                        🔗 Connected Accounts
                    </h2>
                    <button 
                        className="btn btn-sm btn-outline btn-primary"
                        onClick={handleRefresh}
                        disabled={isLoadingLinks || isLoading}
                    >
                        {isLoadingLinks ? (
                            <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                        )}
                        Refresh
                    </button>
                </div>

                {isLoadingLinks ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="loading loading-spinner loading-md text-primary"></div>
                        <span className="ml-2 text-base-content/70">Loading connected accounts...</span>
                    </div>
                ) : plaidLinks.length === 0 ? (
                    <div className="alert alert-info">
                        <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>No connected accounts found. Use the "Open Plaid Link" button to connect your first account.</span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {plaidLinks.map((link) => (
                            <div key={link.linkId} className="border border-base-300 rounded-lg p-4 bg-base-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="avatar placeholder">
                                            <div className="bg-primary text-primary-content rounded-full w-10 h-10">
                                                <span className="text-sm font-bold">
                                                    {link.institutionName ? link.institutionName.charAt(0).toUpperCase() : '?'}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-base-content">
                                                {link.institutionName || 'Unknown Institution'}
                                            </h3>
                                            <p className="text-sm text-base-content/70">
                                                ID: {link.linkId.substring(0, 8)}...
                                            </p>
                                            {link.institutionId && (
                                                <p className="text-xs text-base-content/50">
                                                    Institution ID: {link.institutionId}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="badge badge-success badge-sm">Connected</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        <div className="divider text-base-content/50">
                            Total: {plaidLinks.length} connected account{plaidLinks.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlaidLinksSection; 