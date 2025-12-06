import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * Manages authentication state globally and persists sessions across page reloads
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const { data, error } = await authService.getSession();

                if (error) {
                    console.error('Error fetching session:', error);
                    setUser(null);
                    setSession(null);
                } else if (data?.session) {
                    setSession(data.session);
                    setUser(data.session.user);
                } else {
                    setUser(null);
                    setSession(null);
                }
            } catch (err) {
                console.error('Error initializing auth:', err);
                setUser(null);
                setSession(null);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        // Listen to auth state changes (login, logout, token refresh)
        const { data: authListener } = authService.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event);

                if (session) {
                    setSession(session);
                    setUser(session.user);
                } else {
                    setSession(null);
                    setUser(null);
                }

                setLoading(false);
            }
        );

        // Cleanup listener on unmount
        return () => {
            authListener?.subscription?.unsubscribe();
        };
    }, []);

    const value = {
        user,
        session,
        loading,
        isAuthenticated: !!session,
        signOut: async () => {
            await authService.signOut();
            // State will be updated by the auth listener
        }
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * useAuth Hook
 * Access authentication state from any component
 */
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};
