import React, { useState, useEffect } from 'react';
import PasswordInput from './PasswordInput';
import { User } from 'src/types/userTypes';

interface LoginFormProps {
    onLogin: () => void;
    currentUser: User | null;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, currentUser }) => {
    const [masterPassword, setMasterPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [differentUser, setDifferentUser] = useState(false);
    
    // Show toast when error is set
    useEffect(() => {
        if (error) {
            setShowToast(true);
            const timer = setTimeout(() => {
                setShowToast(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNickname(e.target.value);
        console.log('nickname changed to:', nickname);
    };
    const handleMasterPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMasterPassword(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoggingIn(true);
        
        try {
            
            console.log('currentUser', currentUser);
            console.log('Logging in with:', nickname, masterPassword);

            let nicknameToUse = nickname;
            if(!differentUser && currentUser){
                nicknameToUse = currentUser.nickname;
            }

            const success = await window.electronAPI.login(nicknameToUse, masterPassword);
            console.log('Login success:', success);
            if (!success.success) {
                setError('Invalid master password');
                return;
            }   
            onLogin();
        } catch (error) {
            console.error('Login error:', error);
            setError('Login failed. Please try again.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="w-full flex flex-col">

            <div className="flex-1 p-8">
                <div className="text-center mb-8">
                    <div className="font-bold text-3xl mb-2">
                        {differentUser ? 'Welcome Back' : `Welcome Back ${currentUser?.nickname}`}
                    </div>
                    <p className="text-base-content/60">Enter your master password to unlock</p>
                </div>
                
                <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                    {differentUser && (
                        <div className="form-control mb-6">
                            <input
                                type="text"
                                name="nickname"
                                onChange={handleNicknameChange}
                                className="input bg-base-200 transition-all duration-300 ease-in-out border-base-300 focus:outline-none focus:border-primary focus:ring-0"
                                placeholder="Enter your account nickname"
                                required
                            />
                        </div>
                    )}
                    
                    <div className="form-control mb-6">
                        <PasswordInput 
                            name="masterPassword" 
                            onChange={handleMasterPasswordChange} 
                            value={masterPassword} 
                            placeholder="Enter your master password" 
                        />
                    </div>
                    
                    <div className="form-control mt-10">
                        <button 
                            type="submit" 
                            className={`
                                btn btn-primary relative overflow-hidden group
                                transition-all duration-300 ease-out
                                hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
                                before:absolute before:inset-0 before:bg-white/20 
                                before:translate-x-[-100%] hover:before:translate-x-[100%]
                                before:transition-transform before:duration-500 before:ease-in-out
                                ${isLoggingIn ? 'loading' : ''}
                            `}
                            disabled={isLoggingIn}
                        >
                            {isLoggingIn ? 'Unlocking...' : 'Unlock'}
                        </button>
                    </div>
                </form>
                <div className="text-center mt-4">
                    <button 
                        onClick={() => setDifferentUser(!differentUser)} 
                        className="btn btn-sm btn-ghost"
                    >
                        {differentUser ? 'Cancel' : 'Log in as a different user'}
                    </button>
                </div>
            </div>

            {/* Toast notification for errors */}
            {showToast && error && (
                <div className="toast toast-top toast-center mt-50">
                    <div className="alert alert-error">
                        <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginForm; 