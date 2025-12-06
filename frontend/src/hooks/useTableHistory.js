import { useState, useEffect, useCallback } from 'react';
import { fetchTableHistory } from '../services/cloud.service';

/**
 * Custom hook to fetch and manage paginated table data for the Archives view.
 * 
 * @param {string} date - Date string in 'YYYY-MM-DD' format
 * @param {number} initialPage - Starting page number
 * @returns {{tableData: Array, page: number, setPage: function, totalPages: number, totalRecords: number, loading: boolean, error: string|null}}
 */
const useTableHistory = (date, initialPage = 1) => {
    const [tableData, setTableData] = useState([]);
    const [page, setPage] = useState(initialPage);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const transformDataPoint = (d) => {
        let status = "OK";
        if (d.co_level > 50) status = "DANGER";
        else if (d.temperature > 35) status = "WARN";

        return {
            time: new Date(d.recorded_at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            temp: d.temperature,
            humidity: d.humidity,
            co: d.co_level,
            status: status
        };
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const startStr = `${date}T00:00:00`;
            const endStr = `${date}T23:59:59`;

            const json = await fetchTableHistory({ start: startStr, end: endStr, page });

            if (json.success) {
                const mappedData = json.data.map(transformDataPoint);
                setTableData(mappedData);
                setTotalPages(json.pagination?.pages || 1);
                setTotalRecords(json.pagination?.total || 0);
            } else {
                setTableData([]);
                setTotalPages(1);
                setTotalRecords(0);
                setError('Failed to load table data');
            }
        } catch (err) {
            console.error("Failed to fetch table data", err);
            setTableData([]);
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    }, [date, page]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Reset page to 1 when date changes
    useEffect(() => {
        setPage(1);
    }, [date]);

    return { tableData, page, setPage, totalPages, totalRecords, loading, error };
};

export default useTableHistory;
