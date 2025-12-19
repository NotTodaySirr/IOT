import axios from 'axios';
import { supabase } from '../lib/supabaseClient';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    timeout: 30000,
});

// Add request interceptor for authentication tokens
api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized errors (e.g., redirect to login)
        if (error.response?.status === 401) {
            // Optional: Dispatch a logout action or redirect
            console.warn('Unauthorized access - redirecting to login');
        }
        return Promise.reject(error);
    }
);

export default api;
