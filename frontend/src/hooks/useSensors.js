import { useState, useEffect } from 'react';
import * as hardwareService from '../services/hardware.service';

/**
 * Custom hook to manage real-time sensor data.
 * 
 * @returns {{sensors: {temp: number, humidity: number, co: number}, loading: boolean, error: string|null}}
 */
const useSensors = () => {
    const [sensors, setSensors] = useState({
        temp: 0,
        humidity: 0,
        co: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // TODO: Implement polling logic to fetch sensor data
        // Example:
        // const fetchSensors = async () => { ... };
        // const interval = setInterval(fetchSensors, 2000);
        // return () => clearInterval(interval);

        setLoading(false);
    }, []);

    return { sensors, loading, error };
};

export default useSensors;
