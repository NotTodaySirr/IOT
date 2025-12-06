import api from './api';

/**
 * Cloud Service
 * 
 * Handles fetching of historical data from the cloud database.
 */

/**
 * Fetches chart data for a given time range.
 * Uses limit mode (no pagination) for chart visualization.
 * 
 * @param {string} startISO - ISO date string for start
 * @param {string} endISO - ISO date string for end
 * @param {number} limit - Max records to fetch
 * @returns {Promise<{success: boolean, data: Array, count: number}>}
 */
export const fetchChartHistory = async (startISO, endISO, limit = 50000) => {
    const response = await api.get('/history', {
        params: { start: startISO, end: endISO, limit }
    });
    return response.data;
};

/**
 * Fetches paginated table data for a specific date range.
 * 
 * @param {object} options
 * @param {string} options.start - ISO date string for start of day
 * @param {string} options.end - ISO date string for end of day
 * @param {number} options.page - Page number
 * @param {number} options.perPage - Records per page
 * @returns {Promise<{success: boolean, data: Array, pagination: object}>}
 */
export const fetchTableHistory = async ({ start, end, page = 1, perPage = 10 }) => {
    const response = await api.get('/history', {
        params: { start, end, page, per_page: perPage }
    });
    return response.data;
};

