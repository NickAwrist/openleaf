import React, { useState } from 'react';

interface PasswordModalProps {
    isOpen: boolean;
    onPasswordSubmit: (password: string) => void;
    onClose?: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ 
    isOpen, 
    onPasswordSubmit, 
    onClose 
}) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) {
            setError('Please enter a password');
            return;
        }
        setError('');
        onPasswordSubmit(password.trim());
        setPassword(''); // Clear the password field
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        }
        setPassword('');
        setError('');
    };

    if (!isOpen) return null;

    return (
        <dialog open className="modal modal-open">
            <div className="modal-box">
                <h3 className="font-bold text-lg text-primary mb-4">
                    🔐 Enter Encryption Password
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Password</span>
                        </label>
                        <input
                            type="password"
                            className={`input input-bordered w-full ${error ? 'input-error' : ''}`}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (error) setError(''); // Clear error when user types
                            }}
                            placeholder="Enter your encryption password"
                            autoFocus
                            required
                        />
                        {error && (
                            <label className="label">
                                <span className="label-text-alt text-error">{error}</span>
                            </label>
                        )}
                        <label className="label">
                            <span className="label-text-alt">
                                This password will be used to decrypt and encrypt your Plaid credentials
                            </span>
                        </label>
                    </div>

                    <div className="modal-action">
                        <button 
                            type="submit"
                            className="btn btn-primary"
                            disabled={!password.trim()}
                        >
                            Unlock Page
                        </button>
                        {onClose && (
                            <button 
                                type="button"
                                className="btn btn-outline"
                                onClick={handleClose}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>

                <div className="alert alert-info mt-4">
                    <div>
                        <h4 className="font-bold">Why do I need this?</h4>
                        <p className="text-sm">
                            Your encryption password is required to securely access and manage 
                            your stored Plaid credentials. This ensures your financial data 
                            remains encrypted and secure.
                        </p>
                    </div>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button type="button" onClick={handleClose}>close</button>
            </form>
        </dialog>
    );
};

export default PasswordModal; 