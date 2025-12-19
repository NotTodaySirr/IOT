import { useState, useEffect, useRef } from 'react';
import { createSensorStream, parseSSEBuffer } from '../services/hardware.service';

// ============================================================================
// USE SENSOR STREAM HOOK
// ============================================================================
// This hook handles the "Logic Layer" for real-time sensor streaming.
// It is responsible for:
//   1. State management (sensors, history, AI status, connection status)
//   2. Data transformation (mapping backend keys to frontend keys)
//   3. Business logic (calculating status, formatting time, updating history)
// 
// The "API Layer" (hardware.service.js) handles:
//   - Network requests
//   - Authentication
//   - Raw data transport
// ============================================================================

/**
 * Hook to stream real-time sensor data from the backend via SSE.
 * Uses the hardware service for API communication.
 * 
 * HOW IT WORKS:
 * 1. On mount, calls createSensorStream() from hardware service
 * 2. Receives a ReadableStream reader
 * 3. Continuously reads chunks and parses SSE messages
 * 4. Updates React state with processed data
 * 5. Cleans up on unmount by aborting the connection
 * 
 * @returns {Object} { sensors, history, aiStatus, aiPrediction, connectionStatus }
 */
export const useSensorStream = () => {
    // ========================================================================
    // STATE DEFINITIONS
    // ========================================================================

    // Current sensor readings (updated in real-time)
    const [sensors, setSensors] = useState({ temp: 0, humidity: 0, co: 0 });

    // History of recent sensor readings (for charts/tables)
    const [history, setHistory] = useState([]);

    // Connection status for UI feedback
    const [connectionStatus, setConnectionStatus] = useState('connecting');

    // AI anomaly detection status
    const [aiStatus, setAiStatus] = useState({
        isAnomaly: false,
        message: 'INITIALIZING...',
        detail: 'Waiting for stream...'
    });

    // Full AI prediction data
    const [aiPrediction, setAiPrediction] = useState(null);

    // Ref to store abort controller (survives re-renders)
    const abortControllerRef = useRef(null);

    // ========================================================================
    // DATA PROCESSING LOGIC
    // ========================================================================

    /**
     * Processes raw sensor data from the stream.
     * 
     * WHAT IT DOES:
     * 1. Maps backend field names to frontend field names
     * 2. Updates sensor state with new values
     * 3. Processes AI predictions if available
     * 4. Calculates status (OK/WARN/DANGER) based on thresholds
     * 5. Adds entry to history (keeping last 20 entries)
     * 
     * @param {Object} data - Raw data object from SSE stream
     */
    const processData = (data) => {
        // Step 1: Map backend keys to frontend keys
        // Backend uses: temperature, co_level, humidity
        // Frontend uses: temp, co, humidity
        const newTemp = data.temperature;
        const newCo = data.co_level;
        const newHumid = data.humidity;
        const deviceId = data.device_id;

        // Step 2: Update current sensor readings
        setSensors({
            temp: newTemp,
            humidity: newHumid,
            co: newCo,
            device_id: deviceId
        });

        // Step 3: Process AI prediction (if available in stream)
        // AI predictions are attached to sensor data by backend
        if (data.ai_prediction && data.ai_prediction.status === 'success') {
            const ai = data.ai_prediction;
            setAiPrediction(ai);

            const recAction = ai.recommended_action;
            const futureEnv = ai.future_environment;

            // Determine if there's an anomaly based on recommended action
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

        // Step 4: Calculate status based on sensor thresholds
        // CO > 50 ppm = DANGER, Temp > 35°C = WARN, otherwise OK
        const status = newCo > 50 ? "DANGER" : (newTemp > 35 ? "WARN" : "OK");

        // Step 5: Create history entry with formatted timestamp
        const newEntry = {
            time: new Date(data.timestamp).toLocaleTimeString([], {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }),
            temp: newTemp,
            humidity: newHumid,
            co: newCo,
            status: status
        };

        // Step 6: Add to history, keeping only last 20 entries
        setHistory(prevHist => {
            const updated = [...prevHist, newEntry];
            if (updated.length > 20) updated.shift();
            return updated;
        });
    };

    // ========================================================================
    // STREAM CONNECTION EFFECT
    // ========================================================================

    useEffect(() => {
        /**
         * Connects to the SSE stream and continuously reads data.
         * 
         * FLOW:
         * 1. Create abort controller for cleanup
         * 2. Call API service to create stream connection
         * 3. Handle connection errors (auth, network, etc.)
         * 4. Enter read loop to continuously consume stream
         * 5. Parse and process each chunk of data
         */
        const connectStream = async () => {
            // Create new abort controller for this connection
            abortControllerRef.current = new AbortController();

            // Step 1: Call API layer to establish SSE connection
            // This separates network concerns from business logic
            const result = await createSensorStream(abortControllerRef.current);

            // Step 2: Handle connection failures
            if (!result.success) {
                setConnectionStatus(result.status);

                // Update AI status to reflect connection issue
                if (result.status === 'unauthenticated') {
                    setAiStatus({
                        isAnomaly: false,
                        message: 'NOT AUTHENTICATED',
                        detail: 'Please log in to view sensor data'
                    });
                }
                return;
            }

            // Step 3: Connection successful, update status
            setConnectionStatus('connected');

            // Step 4: Enter the read loop
            // This continuously reads chunks from the stream
            const reader = result.reader;
            const decoder = new TextDecoder();
            let buffer = '';

            try {
                while (true) {
                    // Read next chunk from stream
                    const { done, value } = await reader.read();

                    // Stream ended (server closed connection)
                    if (done) {
                        setConnectionStatus('disconnected');
                        break;
                    }

                    // Decode binary chunk to text and add to buffer
                    buffer += decoder.decode(value, { stream: true });

                    // Step 5: Parse complete SSE messages from buffer
                    // The service function handles SSE format parsing
                    const { messages, remainingBuffer } = parseSSEBuffer(buffer);
                    buffer = remainingBuffer;

                    // Step 6: Process each received message
                    // This is where business logic happens
                    for (const data of messages) {
                        processData(data);
                    }
                }
            } catch (error) {
                // Ignore abort errors (intentional cleanup)
                if (error.name !== 'AbortError') {
                    console.error('[useSensorStream] Stream read error:', error);
                    setConnectionStatus('error');
                }
            }
        };

        // Start the connection
        connectStream();

        // Cleanup function: abort connection on unmount
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // ========================================================================
    // RETURN HOOK VALUES
    // ========================================================================

    return { sensors, history, aiStatus, aiPrediction, connectionStatus };
};
