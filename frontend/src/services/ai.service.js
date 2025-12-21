import api from './api';

/**
 * AI Service
 * 
 * Handles AI-related data fetching for diagnostics and anomaly detection.
 */

/**
 * Get AI Prediction based on current sensor data.
 * 
 * @param {Object} sensorData - { temperature_C, humidity_%, CO_ppm, action }
 * @returns {Promise<Object>} - The prediction result from backend
 */

// UNUNSED
export const getPrediction = async (sensorData) => {
    try {
        const response = await api.post('/ai/predict', sensorData);
        return response.data;
    } catch (error) {
        console.error("AI Prediction Error:", error);
        throw error;
    }
};

/**
 * Send a query to the AI Chatbot.
 * 
 * @param {string} query - The user's message/query.
 * @returns {Promise<string>} - The AI's response text.
 */
export const sendQuery = async (query) => {
    try {
        const response = await api.post('/ai/chatbot', { query });
        return response.data.response;
    } catch (error) {
        console.error("Chatbot Error:", error);
        // Return a user-friendly error message if the service fails
        return "System Notification: Connection to AI Module failed. Please try again later.";
    }
};
