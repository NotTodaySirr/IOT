import { useState, useEffect } from 'react';

/**
 * Hook to stream real-time sensor data from the backend via SSE.
 * 
 * @returns {Object} { sensors, history }
 */
export const useSensorStream = () => {
    const [sensors, setSensors] = useState({ temp: 0, humidity: 0, co: 0 });
    const [history, setHistory] = useState([]);

    const [aiStatus, setAiStatus] = useState({
        isAnomaly: false,
        message: 'INITIALIZING...',
        detail: 'Waiting for stream...'
    });

    useEffect(() => {
        // Use environment variable or default to localhost:5000
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const eventSource = new EventSource(`${API_URL}/stream`);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Map backend keys to frontend keys
                const newTemp = data.temperature;
                const newCo = data.co_level;
                const newHumid = data.humidity;

                // Update Sensors State
                setSensors({
                    temp: newTemp,
                    humidity: newHumid,
                    co: newCo
                });

                // Update AI Status from streamed prediction
                if (data.ai_prediction && data.ai_prediction.status === 'success') {
                    const ai = data.ai_prediction;
                    const recAction = ai.recommended_action;
                    const futureEnv = ai.future_environment;

                    let isAnomaly = false;
                    let msg = "SYSTEM NORMAL";
                    let detail = `Predicted: ${futureEnv.temperature_C}°C, ${futureEnv.CO_ppm} PPM`;

                    if (recAction !== 'normal') {
                        isAnomaly = true;
                        msg = "AI ALERT: " + recAction.replace(/_/g, ' ').toUpperCase();
                        detail = `Recommended: ${recAction}`;
                    }
                    setAiStatus({ isAnomaly, message: msg, detail });
                }

                // Update History
                const status = newCo > 50 ? "DANGER" : (newTemp > 35 ? "WARN" : "OK");
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
