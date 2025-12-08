import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import VintagePanel from '../../components/ui/VintagePanel';
import VintageInput from '../../components/ui/VintageInput';
import VintageButton from '../../components/ui/VintageButton';
import { useToast } from '../../contexts/ToastContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { signIn, loading, error } = useAuth();
    const { showError, showSuccess } = useToast();

    const handleLogin = async (e) => {
        e.preventDefault();

        const { success, error: authError } = await signIn(email, password);

        if (success) {
            showSuccess('Login successful... Accessing Terminal');
            // AuthContext will automatically update isAuthenticated
            navigate('/dashboard');
        } else if (authError) {
            console.log(authError);
            showError(authError);
        }
    };

    const customHeader = (
        <div className="bg-vintage-cream p-2 mb-4 flex justify-between items-center border-2 border-vintage-coffee rounded-sm shadow-sm">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-vintage-red border border-vintage-coffee"></div>
                <span className="text-xs font-bold tracking-widest uppercase">System Access</span>
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
                            Login
                        </h1>
                        <div className="h-1 bg-vintage-coffee w-full mb-1 opacity-20"></div>
                        <div className="h-0.5 bg-vintage-coffee w-3/4 mx-auto opacity-20"></div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <VintageInput
                            label="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ENTER EMAIL..."
                            disabled={loading}
                        />

                        <VintageInput
                            label="Passcode"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={loading}
                        />

                        <div className="pt-4 flex justify-center">
                            <VintageButton type="submit" variant="primary" disabled={loading}>
                                {loading ? 'Logging in...' : 'Login'}
                            </VintageButton>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate('/register')}
                            className="text-xs text-vintage-coffee/70 hover:text-vintage-coffee uppercase tracking-wide underline"
                            disabled={loading}
                        >
                            Need an account? Register
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

export default Login;
