interface ContactInfoInputProps {
    name: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    value: string;
}

const ContactInfoInput: React.FC<ContactInfoInputProps> = ({ name, onChange, value }) => {
    return (
        <div className="form-control mb-4">
            <label className="label">
                <span className="label-text">Email or Phone Number</span>
            </label>
            <input 
                type="text" 
                name={name} 
                value={value}
                onChange={onChange}
                className="input bg-base-200 transition-all duration-300 ease-in-out border-base-300 focus:outline-none focus:border-primary focus:ring-0" 
                placeholder="email@example.com or +1234567890"
                required 
            />
        </div>
    )
}

export default ContactInfoInput;