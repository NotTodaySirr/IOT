import { useState, useEffect, useCallback } from 'react';
import { fetchChartHistory } from '../services/cloud.service';

/**
 * Custom hook to fetch and manage chart data for the Archives view.
 * 
 * @param {string} range - Time range: '24H', '7D', '1M', 'ALL'
 * @returns {{chartData: object, loading: boolean, error: string|null, refetch: function}}
 */
const useChartHistory = (range = '24H') => {
    const [chartData, setChartData] = useState({ labels: [], datasets: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const processChartData = (data) => {
        // API returns newest first (DESC). Chart needs oldest -> newest.
        const sorted = [...data].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));

        const labels = sorted.map(d => new Date(d.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        const tempData = sorted.map(d => d.temperature);
        const humidityData = sorted.map(d => d.humidity);
        const coData = sorted.map(d => d.co_level);

        return {
            labels,
            datasets: [
                {
                    label: 'Temp (°C)',
                    data: tempData,
                    borderColor: '#795548',
                    backgroundColor: '#795548',
                    tension: 0.1,
                    borderWidth: 2,
                    pointRadius: 0,
                    hitRadius: 10,
                },
                {
                    label: 'Humidity (%)',
                    data: humidityData,
                    borderColor: '#2196F3',
                    backgroundColor: '#2196F3',
                    tension: 0.1,
                    borderWidth: 2,
                    pointRadius: 0,
                },
                {
                    label: 'CO (PPM)',
                    data: coData,
                    borderColor: '#ff6b6b',
                    backgroundColor: '#ff6b6b',
                    tension: 0.1,
                    borderWidth: 2,
                    pointRadius: 0,
                }
            ]
        };
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const now = new Date();
            const end = now.toISOString();
            let start = '';

            if (range === '24H') {
                start = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
            } else if (range === '7D') {
                start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
            } else if (range === '1M') {
                start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
            }
            // 'ALL' case: start remains empty, backend returns all data up to limit.

            const json = await fetchChartHistory(start, end);

            if (json.success) {
                setChartData(processChartData(json.data));
            } else {
                setError('Failed to fetch chart data');
            }
        } catch (err) {
            console.error("Failed to fetch chart data", err);
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    }, [range]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { chartData, loading, error, refetch: fetchData };
};

export default useChartHistory;
