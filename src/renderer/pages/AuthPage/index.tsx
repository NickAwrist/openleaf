import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import { User } from 'src/types/userTypes';

// Declare window.electronAPI type globally to ensure it's available in all components
declare global {
    interface Window {
        electronAPI: {
            login: (nickname: string, masterPassword: string) => Promise<boolean>;
            register: (user: any) => Promise<boolean>;
            getCurrentUser: () => Promise<User>;
        }
    }
}

const AuthPage: React.FC = () => {
    const [authSuccess, setAuthSuccess] = useState({
        login: false,
        register: false
    });
    
    const [pageType, setPageType] = useState<'login' | 'register'>('login');

    useEffect(() => {
        const checkCurrentUser = async () => {
            const currentUser = await window.electronAPI.getCurrentUser();
            if (currentUser) {
                setPageType('login');
            } else {
                setPageType('register');
            }
        };

        checkCurrentUser();
    }, []);

    const handleLoginSuccess = (success: boolean) => {
        setAuthSuccess(prev => ({ ...prev, login: success }));
        // Handle redirect or other post-login actions
    };

    const handleRegisterSuccess = (success: boolean) => {
        setAuthSuccess(prev => ({ ...prev, register: success }));
        // Handle redirect or other post-registration actions
    };

    const switchPageType = (type: string) => {
        if(type != 'login' && type != 'register'){
            return;
        }
        setPageType(type);
    }

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
            <div className="card bg-base-100 shadow-xl w-full max-w-31/100 transition-all duration-500 ease-in-out hover:shadow-2xl -mt-50">
                <div className="card-body">
                    {pageType === 'login' ? (
                        <>
                            <LoginForm onLogin={handleLoginSuccess} />
                            <div className="text-center mt-0">
                                <p className="text-sm">
                                    Don't have an account?{' '}
                                    <button
                                        onClick={() => switchPageType('register')}
                                        className="btn btn-link btn-primary p-0 align-baseline text-primary"
                                    >
                                        Register
                                    </button>
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <RegisterForm onRegister={handleRegisterSuccess} />
                            <div className="text-center mt-0"> 
                                <p className="text-sm">
                                    Already have an account?{' '}
                                    <button
                                        onClick={() => switchPageType('login')}
                                        className="btn btn-link btn-secondary p-0 align-baseline text-primary" 
                                    >
                                        Login
                                    </button>
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>

    );
};

export default AuthPage;
