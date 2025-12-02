import { supabase } from '../lib/supabaseClient';

/**
 * Authentication Service
 * Handles all authentication-related operations using Supabase
 */
const authService = {
    /**
     * Sign in with email and password
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Promise<{data: object, error: object}>}
     */
    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    /**
     * Sign up a new user
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Promise<{data: object, error: object}>}
     */
    async signUp(email, password) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    /**
     * Sign out the current user
     * @returns {Promise<{error: object}>}
     */
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { error: null };
        } catch (error) {
            return { error };
        }
    },

    /**
     * Get the current session
     * @returns {Promise<{data: object, error: object}>}
     */
    async getSession() {
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    /**
     * Get the current user
     * @returns {Promise<{data: object, error: object}>}
     */
    async getUser() {
        try {
            const { data, error } = await supabase.auth.getUser();
            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    /**
     * Listen to auth state changes
     * @param {function} callback - Callback function to handle auth state changes
     * @returns {object} Subscription object
     */
    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange(callback);
    },
};

export default authService;
