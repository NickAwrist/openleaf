import React from 'react';

interface ActivityLogProps {
    logs: string[];
    onClear: () => void;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ logs, onClear }) => {
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

export default ActivityLog; 