import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import { User } from 'src/types/userTypes';

interface AuthPageProps {
    currentUser: User | null;
    changePage: (page: string) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({currentUser, changePage}) => {
    
    const [pageType, setPageType] = useState<'login' | 'register'>('login');

    const handleLoginSuccess = () => {
        changePage('accounts');
    };

    const handleRegisterSuccess = () => {
        changePage('plaid-setup');
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
                            <LoginForm onLogin={handleLoginSuccess} currentUser={currentUser} />
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
