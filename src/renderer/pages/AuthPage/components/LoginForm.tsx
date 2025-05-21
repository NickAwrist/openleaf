import React, { useState } from 'react';
import PasswordInput from './PasswordInput';
import ContactInfoInput from './ContactInfoInput';

interface LoginFormProps {
    onLogin?: (success: boolean) => void;
}

interface LoginData {
    contactInfo: string;
    masterPassword: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
    const [loginData, setLoginData] = useState<LoginData>({
        contactInfo: '',
        masterPassword: ''
    });
    
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLoginData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoggingIn(true);
        
        try {
            // Check if electronAPI is available
            if (typeof window.electronAPI === 'undefined' || !window.electronAPI.login) {
                console.error('electronAPI.login is not available');
                setError('Login API is not available. Please contact support.');
                
                // Simulate successful login for development if API not available
                if (process.env.NODE_ENV === 'development') {
                    console.log('Development mode: Simulating successful login');
                    if (onLogin) {
                        setTimeout(() => onLogin(true), 1000);
                    }
                }
                return;
            }
            
            const success = await window.electronAPI.login(loginData.contactInfo, loginData.masterPassword);
            if (!success) {
                setError('Invalid email/phone or password');
            }
            if (onLogin) {
                onLogin(success);
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Login failed. Please try again.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="flex-1 p-8">
            <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
            <form onSubmit={handleSubmit}>
                <ContactInfoInput name="contactInfo" onChange={handleChange} value={loginData.contactInfo} />
                
                <div className="form-control mb-6">
                    <label className="label">
                        <span className="label-text">Master Password</span>
                    </label>
                    <PasswordInput name="masterPassword" onChange={handleChange} value={loginData.masterPassword} placeholder="Enter your master password" />
                </div>
                
                {error && (
                    <div className="alert alert-error mb-4">
                        <span>{error}</span>
                    </div>
                )}
                
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
                        {isLoggingIn ? 'Logging in...' : 'Login'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LoginForm; 