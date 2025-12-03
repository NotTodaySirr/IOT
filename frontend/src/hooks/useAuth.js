import { useState } from 'react';
import authService from '../services/authService';

/**
 * Custom hook for authentication operations
 * Provides authentication state and methods
 */
const useAuth = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Sign in with email and password
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Promise<{success: boolean, data: object}>}
     */
    const signIn = async (email, password) => {
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await authService.signIn(email, password);

            if (error) {
                setError(error.message);
                return { success: false, data: null };
            }

            return { success: true, data };
        } catch (err) {
            setError(err.message);
            return { success: false, data: null };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Sign up a new user
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @param {object} metadata - Optional user metadata (e.g., { name, phone })
     * @returns {Promise<{success: boolean, data: object}>}
     */
    const signUp = async (email, password, metadata = {}) => {
        setLoading(true);
        setError(null);

        try {
            const options = Object.keys(metadata).length > 0 ? { data: metadata } : {};
            const { data, error } = await authService.signUp(email, password, options);

            if (error) {
                setError(error.message);
                return { success: false, data: null };
            }

            return { success: true, data };
        } catch (err) {
            setError(err.message);
            return { success: false, data: null };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Sign out the current user
     * @returns {Promise<{success: boolean}>}
     */
    const signOut = async () => {
        setLoading(true);
        setError(null);

        try {
            const { error } = await authService.signOut();

            if (error) {
                setError(error.message);
                return { success: false };
            }

            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Clear error state
     */
    const clearError = () => {
        setError(null);
    };

    return {
        loading,
        error,
        signIn,
        signUp,
        signOut,
        clearError,
    };
};

export default useAuth;
