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
export const getPrediction = async (sensorData) => {
    try {
        const response = await api.post('/ai/predict', sensorData);
        return response.data;
    } catch (error) {
        console.error("AI Prediction Error:", error);
        throw error;
    }
};
