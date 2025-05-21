import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import PasswordInput from './PasswordInput';
import ContactInfoInput from './ContactInfoInput';

interface RegisterFormProps {
    onRegister?: (success: boolean) => void;
}

interface RegisterFormData {
    contactInfo: string;
    masterPassword: string;
    confirmPassword: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister }) => {
    const [registerData, setRegisterData] = useState<RegisterFormData>({
        contactInfo: '',
        masterPassword: '',
        confirmPassword: ''
    });
    
    const [error, setError] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

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
            // Determine if contactInfo is email or phone number
            const isEmail = registerData.contactInfo.includes('@');
            
            const userToRegister = {
                id: uuidv4().toString(),
                nickname: isEmail ? registerData.contactInfo.split('@')[0] : registerData.contactInfo,
                email: isEmail ? registerData.contactInfo : '',
                phoneNumber: !isEmail ? registerData.contactInfo : '',
                masterPassword: registerData.masterPassword,
                sessionExpiresAt: '0',
                createdAt: new Date().toISOString()
            };
            
            console.log(userToRegister);
            
            // Check if electronAPI is available
            if (typeof window.electronAPI === 'undefined' || !window.electronAPI.register) {
                console.error('electronAPI.register is not available');
                setError('Registration API is not available. Please contact support.');
                
                // Simulate successful registration for development if API not available
                if (process.env.NODE_ENV === 'development') {
                    console.log('Development mode: Simulating successful registration');
                    if (onRegister) {
                        setTimeout(() => onRegister(true), 1000);
                    }
                }
                return;
            }
            
            await window.electronAPI.register(userToRegister);
            if (onRegister) {
                onRegister(true);
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
        <div className="flex-1 p-8">
            <h2 className="text-2xl font-bold text-center mb-6">Register</h2>
            <form onSubmit={handleSubmit}>
                <ContactInfoInput name="contactInfo" onChange={handleChange} value={registerData.contactInfo} />
                
                <div className="form-control mb-4">
                    <label className="label">
                        <span className="label-text">Master Password</span>
                    </label>
                    <PasswordInput name="masterPassword" onChange={handleChange} value={registerData.masterPassword} placeholder="Enter your master password" />
                </div>
                
                <div className="form-control mb-6">
                    <label className="label">
                        <span className="label-text">Confirm Password</span>
                    </label>
                    <PasswordInput name="confirmPassword" onChange={handleChange} value={registerData.confirmPassword} placeholder="Confirm your master password" />
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
                            btn btn-primary relative overflow-hidden
                            transition-all duration-300 ease-out
                            hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
                            hover:bg-primary/90 
                            after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/30 after:to-transparent
                            after:opacity-0 hover:after:opacity-100 after:-translate-x-full hover:after:translate-x-full
                            after:transition-all after:duration-700 after:ease-in-out
                            ${isRegistering ? 'loading' : ''}
                        `}
                        disabled={isRegistering}
                    >
                        {isRegistering ? 'Creating Account...' : 'Register'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RegisterForm; 