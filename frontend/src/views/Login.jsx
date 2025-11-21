import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ActuatorButton from '../components/ActuatorButton';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // Mock authentication logic
        if (username && password) {
            onLogin();
            navigate('/dashboard');
        } else {
            setError('ERR: INVALID_CREDENTIALS');
        }
    };

    return (
        <div className="min-h-screen bg-vintage-beige flex items-center justify-center p-4 font-mono text-vintage-coffee">
            <div className="w-full max-w-md border-4 border-vintage-coffee bg-vintage-tan p-3 shadow-hard rounded-lg">
                {/* Header / Title Bar */}
                <div className="bg-vintage-cream p-2 mb-4 flex justify-between items-center border-2 border-vintage-coffee rounded-sm shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-vintage-red border border-vintage-coffee"></div>
                        <span className="text-xs font-bold tracking-widest uppercase">System Access</span>
                    </div>
                    <div className="text-[10px] opacity-60">SECURE TERMINAL</div>
                </div>

                {/* Main Content Area */}
                <div className="bg-vintage-beige p-6 border-2 border-vintage-coffee shadow-inset relative rounded-sm">

                    {/* Header Text */}
                    <div className="mb-8 text-center">
                        <h1 className="text-2xl font-bold text-vintage-coffee uppercase tracking-widest mb-2">
                            Authentication
                        </h1>
                        <div className="h-1 bg-vintage-coffee w-full mb-1 opacity-20"></div>
                        <div className="h-0.5 bg-vintage-coffee w-3/4 mx-auto opacity-20"></div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mb-6 bg-vintage-red text-vintage-beige border-2 border-vintage-coffee p-2 text-center animate-pulse font-bold shadow-sm">
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-vintage-coffee text-sm font-bold mb-2 uppercase tracking-wider">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-vintage-cream text-vintage-coffee border-2 border-vintage-coffee p-3 focus:outline-none focus:bg-white font-mono shadow-inner placeholder:text-vintage-coffee/30"
                                placeholder="ENTER ID..."
                                autoComplete="off"
                            />
                        </div>

                        <div>
                            <label className="block text-vintage-coffee text-sm font-bold mb-2 uppercase tracking-wider">
                                Passcode
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-vintage-cream text-vintage-coffee border-2 border-vintage-coffee p-3 focus:outline-none focus:bg-white font-mono shadow-inner placeholder:text-vintage-coffee/30"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="pt-4 flex justify-center">
                            <button
                                type="submit"
                                className="px-8 py-3 bg-vintage-coffee text-vintage-beige font-bold uppercase tracking-widest border-2 border-vintage-coffee shadow-hard hover:translate-y-1 hover:shadow-none transition-all active:translate-y-1 active:shadow-none"
                            >
                                Authenticate
                            </button>
                        </div>
                    </form>

                    {/* Footer Status */}
                    <div className="mt-8 text-xs text-center text-vintage-coffee/50 uppercase">
                        <p>Restricted Access Area</p>
                        <p>Auth v1.0.4</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
