import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import VintagePanel from '../components/ui/VintagePanel';
import VintageInput from '../components/ui/VintageInput';
import VintageButton from '../components/ui/VintageButton';
import { useToast } from '../contexts/ToastContext';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();
    const { signUp, loading, error } = useAuth();
    const { showSuccess, showError } = useToast();

    const handleRegister = async (e) => {
        e.preventDefault();

        // Validate passwords match
        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        // Validate password length
        if (password.length < 6) {
            showError('Password must be at least 6 characters');
            return;
        }

        // Validate phone format (basic validation)
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
        if (phone && !phoneRegex.test(phone)) {
            showError('Please enter a valid phone number');
            return;
        }

        // Prepare user metadata
        const metadata = {
            name: name.trim(),
            phone: phone.trim(),
        };

        const { success } = await signUp(email, password, metadata);

        if (success) {
            showSuccess('Registration successful! Please log in.');
            // Redirect to login after a short delay
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        } else if (error) {
            showError(error);
        }
    };

    const customHeader = (
        <div className="bg-vintage-cream p-2 mb-4 flex justify-between items-center border-2 border-vintage-coffee rounded-sm shadow-sm">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-vintage-green border border-vintage-coffee"></div>
                <span className="text-xs font-bold tracking-widest uppercase">New User Registration</span>
            </div>
            <div className="text-[10px] opacity-60">SECURE TERMINAL</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-vintage-beige flex items-center justify-center p-4 font-mono text-vintage-coffee">
            <div className="w-full max-w-md border-4 border-vintage-coffee bg-vintage-tan p-3 shadow-hard rounded-lg">
                {customHeader}

                <VintagePanel className="bg-vintage-beige">
                    <div className="mb-8 text-center">
                        <h1 className="text-2xl font-bold text-vintage-coffee uppercase tracking-widest mb-2">
                            Create Account
                        </h1>
                        <div className="h-1 bg-vintage-coffee w-full mb-1 opacity-20"></div>
                        <div className="h-0.5 bg-vintage-coffee w-3/4 mx-auto opacity-20"></div>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">
                        <VintageInput
                            label="Full Name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="ENTER NAME..."
                            disabled={loading}
                            required
                        />

                        <VintageInput
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ENTER EMAIL..."
                            disabled={loading}
                            required
                        />

                        <VintageInput
                            label="Phone Number"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1234567890"
                            disabled={loading}
                        />

                        <VintageInput
                            label="Passcode"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={loading}
                            required
                        />

                        <VintageInput
                            label="Confirm Passcode"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={loading}
                            required
                        />

                        <div className="pt-4 flex justify-center">
                            <VintageButton type="submit" variant="primary" disabled={loading}>
                                {loading ? 'CREATING ACCOUNT...' : 'Register'}
                            </VintageButton>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-xs text-vintage-coffee/70 hover:text-vintage-coffee uppercase tracking-wide underline"
                            disabled={loading}
                        >
                            Already have an account? Login
                        </button>
                    </div>

                    <div className="mt-8 text-xs text-center text-vintage-coffee/50 uppercase">
                        <p>Restricted Access Area</p>
                        <p>Auth v1.0.4</p>
                    </div>
                </VintagePanel>
            </div>
        </div>
    );
};

export default Register;
