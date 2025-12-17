import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook to stream real-time sensor data from the backend via SSE.
 * Uses fetch with ReadableStream to support Authorization headers.
 * 
 * @returns {Object} { sensors, history, aiStatus, aiPrediction, connectionStatus }
 */
export const useSensorStream = () => {
    const [sensors, setSensors] = useState({ temp: 0, humidity: 0, co: 0 });
    const [history, setHistory] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('connecting');

    const [aiStatus, setAiStatus] = useState({
        isAnomaly: false,
        message: 'INITIALIZING...',
        detail: 'Waiting for stream...'
    });

    const [aiPrediction, setAiPrediction] = useState(null);
    const abortControllerRef = useRef(null);

    useEffect(() => {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        const connectStream = async () => {
            try {
                // Get auth token from Supabase
                const { data: { session } } = await supabase.auth.getSession();

                if (!session?.access_token) {
                    setConnectionStatus('unauthenticated');
                    setAiStatus({
                        isAnomaly: false,
                        message: 'NOT AUTHENTICATED',
                        detail: 'Please log in to view sensor data'
                    });
                    return;
                }

                // Create abort controller for cleanup
                abortControllerRef.current = new AbortController();

                const response = await fetch(`${API_URL}/stream`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Accept': 'text/event-stream',
                    },
                    signal: abortControllerRef.current.signal,
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        setConnectionStatus('unauthenticated');
                        setAiStatus({
                            isAnomaly: false,
                            message: 'SESSION EXPIRED',
                            detail: 'Please log in again'
                        });
                    } else {
                        setConnectionStatus('error');
                    }
                    return;
                }

                setConnectionStatus('connected');

                // Read the stream
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        setConnectionStatus('disconnected');
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });

                    // Process complete SSE messages
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // Keep incomplete line in buffer

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const jsonStr = line.slice(6); // Remove 'data: ' prefix
                            try {
                                const data = JSON.parse(jsonStr);
                                processData(data);
                            } catch (parseError) {
                                console.error("Error parsing SSE data:", parseError);
                            }
                        }
                        // Ignore keep-alive comments (lines starting with ':')
                    }
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error("SSE Stream error:", error);
                    setConnectionStatus('error');
                }
            }
        };

        const processData = (data) => {
            // Map backend keys to frontend keys
            const newTemp = data.temperature;
            const newCo = data.co_level;
            const newHumid = data.humidity;
            const deviceId = data.device_id;

            // Update Sensors State
            setSensors({
                temp: newTemp,
                humidity: newHumid,
                co: newCo,
                device_id: deviceId
            });

            // Update AI Status from streamed prediction
            if (data.ai_prediction && data.ai_prediction.status === 'success') {
                const ai = data.ai_prediction;
                setAiPrediction(ai);

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
        };

        connectStream();

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return { sensors, history, aiStatus, aiPrediction, connectionStatus };
};

