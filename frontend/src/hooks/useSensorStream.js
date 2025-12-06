import { useState, useEffect } from 'react';

/**
 * Hook to stream real-time sensor data from the backend.
 * Replaces the mock simulation when running in real API mode.
 * 
 * @param {Object} actuators - Current state of actuators (for potential future syncing)
 * @returns {Object} { sensors, history, aiStatus }
 */
export const useSensorStream = (actuators) => {
    const [sensors, setSensors] = useState({ temp: 0, humidity: 0, co: 0 });
    const [history, setHistory] = useState([]);
    const [aiStatus, setAiStatus] = useState({ isAnomaly: false, message: 'INITIALIZING...', detail: 'Waiting for stream...' });

    useEffect(() => {
        // Use environment variable or default to localhost:5000
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const eventSource = new EventSource(`${API_URL}/stream`);



        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Map backend keys to frontend keys
                // Backend: { temperature, humidity, co_level, timestamp }
                // Frontend: { temp, humidity, co }

                const newTemp = data.temperature;
                const newCo = data.co_level;
                const newHumid = data.humidity;

                // Update Sensors State
                setSensors({
                    temp: newTemp,
                    humidity: newHumid,
                    co: newCo
                });

                // Calculate AI Status (Client-side logic mirroring simulation for now)
                // TODO: Ideally this should come from the backend AI service if available in stream
                let status = "OK";
                let aiMsg = "SYSTEM NORMAL";
                let aiDet = "Optimal conditions maintained.";
                let isBad = false;

                if (newCo > 50) {
                    isBad = true;
                    aiMsg = "WARNING: TOXIC AIR";
                    aiDet = `High CO levels(${newCo} PPM) detected. Suggest activating Fan.`;
                    status = "DANGER";
                } else if (newTemp > 35) {
                    isBad = true;
                    aiMsg = "WARNING: OVERHEAT";
                    aiDet = `Temperature(${newTemp}°C) high. Check cooling.`;
                    status = "WARN";
                }

                setAiStatus({ isAnomaly: isBad, message: aiMsg, detail: aiDet });

                // Update History
                const newEntry = {
                    time: new Date(data.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    temp: newTemp,
                    humidity: newHumid,
                    co: newCo,
                    status: status
                };

                setHistory(prevHist => {
                    const updated = [...prevHist, newEntry];
                    if (updated.length > 20) updated.shift();
                    return updated;
                });

            } catch (error) {
                console.error("Error parsing SSE data:", error);
            }
        };

        eventSource.onerror = (error) => {
            console.error("EventSource error:", error);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, []); // Empty dependency array means it runs once on mount

    return { sensors, history, aiStatus };
};
