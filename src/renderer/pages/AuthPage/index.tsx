import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';

// Declare window.electronAPI type globally to ensure it's available in all components
declare global {
    interface Window {
        electronAPI: {
            login: (id: string, masterPassword: string) => Promise<boolean>;
            register: (user: any) => Promise<void>;
            isLoggedIn: () => Promise<boolean>;
            minimizeWindow: () => void;
            maximizeWindow: () => void;
            closeWindow: () => void;
            isWindowMaximized: () => Promise<boolean>;
        }
    }
}

const AuthPage: React.FC = () => {
    const [authSuccess, setAuthSuccess] = useState({
        login: false,
        register: false
    });
    const [apiStatus, setApiStatus] = useState({ 
        available: false, 
        message: 'Checking Electron API...' 
    });

    useEffect(() => {
        // Check if electronAPI is available
        const checkApi = () => {
            if (typeof window.electronAPI === 'undefined') {
                setApiStatus({
                    available: false,
                    message: 'Error: Electron API not found'
                });
                console.error('electronAPI is not defined on window object');
                return;
            }

            // Check which methods are available
            const methods = {
                login: typeof window.electronAPI.login === 'function',
                register: typeof window.electronAPI.register === 'function',
                isLoggedIn: typeof window.electronAPI.isLoggedIn === 'function'
            };

            if (methods.login && methods.register) {
                setApiStatus({
                    available: true,
                    message: 'Electron API connected'
                });
            } else {
                setApiStatus({
                    available: false,
                    message: `API Methods: Login ${methods.login ? '✓' : '✗'}, Register ${methods.register ? '✓' : '✗'}`
                });
            }
            
            console.log('Electron API status:', methods);
        };

        checkApi();
    }, []);

    const handleLoginSuccess = (success: boolean) => {
        setAuthSuccess(prev => ({ ...prev, login: success }));
        // Handle redirect or other post-login actions
    };

    const handleRegisterSuccess = (success: boolean) => {
        setAuthSuccess(prev => ({ ...prev, register: success }));
        // Handle redirect or other post-registration actions
    };

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
            {!apiStatus.available && (
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 alert alert-warning py-1 px-4 shadow-lg">
                    <span>{apiStatus.message}</span>
                </div>
            )}
            <div className="card bg-base-100 shadow-xl w-full max-w-4xl transition-all duration-500 ease-in-out hover:shadow-2xl hover:bg-base-50 -mt-25">
                <div className="card-body p-0">
                    <div className="flex flex-col md:flex-row">
                        {/* Register Form */}
                        <RegisterForm onRegister={handleRegisterSuccess} />
                        
                        {/* Divider */}
                        <div className="divider divider-horizontal">OR</div>
                        
                        {/* Login Form */}
                        <LoginForm onLogin={handleLoginSuccess} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
