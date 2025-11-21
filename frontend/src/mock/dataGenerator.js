import { useState, useEffect } from 'react';

export const useSensorData = () => {
    const [data, setData] = useState({
        temp: 24.0,
        humidity: 50,
        co: 5,
        timestamp: new Date().toISOString()
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setData(prev => ({
                temp: +(prev.temp + (Math.random() - 0.5)).toFixed(1),
                humidity: Math.min(100, Math.max(0, Math.floor(prev.humidity + (Math.random() * 4 - 2)))),
                co: Math.max(0, Math.floor(prev.co + (Math.random() * 2 - 1))),
                timestamp: new Date().toISOString()
            }));
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    return data;
};
