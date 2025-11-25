import axios from 'axios';

/**
 * Centralized Axios instance for API configuration.
 * 
 * TODO: Configure base URL, timeout, and error handling interceptors.
 */
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    timeout: 10000,
});

// TODO: Add request interceptor for authentication tokens
// api.interceptors.request.use((config) => { ... });

// TODO: Add response interceptor for error handling
// api.interceptors.response.use((response) => { ... }, (error) => { ... });

export default api;
