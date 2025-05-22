import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import PasswordInput from './PasswordInput';

interface RegisterFormProps {
    onRegister?: (success: boolean) => void;
}

interface RegisterFormData {
    name: string;
    masterPassword: string;
    confirmPassword: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister }) => {
    const [registerData, setRegisterData] = useState<RegisterFormData>({
        name: '',
        masterPassword: '',
        confirmPassword: ''
    });
    
    const [error, setError] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [showToast, setShowToast] = useState(false);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setRegisterData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        // Basic validation
        if (registerData.masterPassword !== registerData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        
        setIsRegistering(true);
        
        try {
            // Prepare user data for registration
            
            const userToRegister = {
                id: uuidv4().toString(),
                nickname: registerData.name,
                masterPassword: registerData.masterPassword,
                sessionExpiresAt: '0',
                createdAt: new Date().toISOString()
            };
            
            console.log('User to register:', userToRegister);

            const res: {success: boolean, error?: string} = await window.electronAPI.register(userToRegister);
            console.log('Registration response:', res.success, res.error);
            if (res.success) {
                if (onRegister) {
                    console.log('Registration successful');
                    onRegister(true);
                }
            } else {
                setError(res.error || 'Registration failed. Please try again.');
                if (onRegister) {
                    onRegister(false);
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
            setError('Registration failed. Please try again.');
            if (onRegister) {
                onRegister(false);
            }
        } finally {
            setIsRegistering(false);
        }
    };

    return (
        <div className="w-full flex flex-col">
            <div className="flex-1 p-8">
                <div className="text-center mb-8">
                    <div className="font-bold text-3xl mb-2">Create Account</div>
                    <p className="text-base-content/60">Create your master password to get started</p>
                </div>
                
                <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                    <div className="form-control mb-6">
                        <label className="label">
                            <span className="label-text">Your Name</span>
                        </label>
                        <input 
                            type="text" 
                            name="name"
                            value={registerData.name}
                            onChange={handleChange}
                            className="input bg-base-200 transition-all duration-300 ease-in-out border-base-300 focus:outline-none focus:border-primary focus:ring-0" 
                            placeholder="John Doe"
                            required 
                        />
                    </div>
                    
                    <div className="form-control mb-4">
                        <label className="label">
                            <span className="label-text">Master Password</span>
                        </label>
                        <PasswordInput 
                            name="masterPassword"
                            onChange={handleChange}
                            value={registerData.masterPassword}
                            placeholder="Enter your master password"
                        />
                    </div>
                    
                    <div className="form-control mb-6">
                        <label className="label">
                            <span className="label-text">Confirm Password</span>
                        </label>
                        <PasswordInput 
                            name="confirmPassword"
                            onChange={handleChange}
                            value={registerData.confirmPassword}
                            placeholder="Confirm your master password"
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
                                ${isRegistering ? 'loading' : ''}
                            `}
                            disabled={isRegistering}
                        >
                            {isRegistering ? 'Creating Account...' : 'Register'}
                        </button>
                    </div>
                </form>
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

export default RegisterForm; 