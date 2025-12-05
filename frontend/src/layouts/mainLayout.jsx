import React from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';

const mainLayout = ({ children, isAuthenticated, aiStatus, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-vintage-beige p-8 flex flex-col items-center justify-center font-mono text-vintage-coffee selection:bg-vintage-coffee selection:text-vintage-beige">
            <div className="w-full max-w-5xl border-4 border-vintage-coffee bg-vintage-tan p-3 shadow-hard rounded-lg">
                {/* Header / Mode Switcher */}
                <div className="bg-vintage-cream p-3 mb-4 flex justify-between items-center border-2 border-vintage-coffee rounded-sm shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border border-vintage-coffee shadow-inner ${aiStatus.isAnomaly ? 'bg-vintage-red animate-pulse' : 'bg-vintage-green'}`}></div>
                        <h1 className="text-vintage-coffee font-bold text-xl tracking-widest uppercase">
                            Environmental control system <span className="text-xs opacity-60"></span>
                        </h1>
                    </div>

                    <div className="flex gap-2 bg-vintage-tan p-1 rounded border border-vintage-coffee shadow-inner">
                        {['dashboard', 'archives', 'terminal'].map((view) => (
                            <button
                                key={view}
                                onClick={() => navigate(`/${view}`)}
                                className={`
                  px-4 py-1 text-xs font-bold uppercase transition-all rounded-sm
                  ${location.pathname === `/${view}`
                                        ? 'bg-vintage-coffee text-vintage-beige shadow-none'
                                        : 'bg-vintage-cream text-vintage-coffee hover:bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]'}
                `}
                            >
                                {view}
                            </button>
                        ))}
                        <button
                            onClick={onLogout}
                            className="px-4 py-1 text-xs font-bold uppercase transition-all rounded-sm bg-vintage-red text-vintage-beige hover:bg-red-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] ml-2"
                        >
                            EXIT
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-vintage-beige p-6 min-h-[600px] border-2 border-vintage-coffee shadow-inset relative rounded-sm">
                    {children}
                </div>

                {/* Footer */}
                <div className="mt-3 flex justify-between text-xs text-vintage-coffee font-bold px-2 opacity-70">
                    <span>MEM: 64KB OK</span>
                    <span>CONNECTED: LOCALHOST</span>
                </div>
            </div>
        </div>
    );
};

export default mainLayout;
