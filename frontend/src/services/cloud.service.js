import api from './api';

/**
 * Cloud Service
 * 
 * Handles fetching of historical data from the cloud database.
 * Designed for lower frequency fetching (e.g., 15-30 min intervals).
 */

/**
 * Fetch historical sensor data for charts and logs.
 * 
 * @param {Object} options - Query options
 * @param {string} options.timeRange - Time range (e.g., '15m', '30m', '1h', '24h')
 * @param {number} options.limit - Maximum number of records
 * @returns {Promise<Array<{time: string, temp: number, humidity: number, co: number, status: string}>>}
 */
export const getHistory = async ({ timeRange = '30m', limit = 100 } = {}) => {
    // TODO: Implement API call to fetch historical data
    // return await api.get('/cloud/history', { params: { timeRange, limit } });
    throw new Error('getHistory: Not implemented');
};
