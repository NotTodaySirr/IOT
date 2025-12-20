import api from './api';
import { supabase } from '../lib/supabaseClient';

// ============================================================================
// HARDWARE SERVICE
// ============================================================================
// This service handles all API calls related to hardware communication.
// It acts as the "API Layer" - responsible for:
//   1. Network requests (fetch, SSE connections)
//   2. Authentication token management
//   3. Data transport (sending/receiving raw data)
// 
// The "Logic Layer" (hooks) will use this service and handle:
//   - State management (React useState)
//   - Data transformation/processing
//   - UI-related logic
// ============================================================================



// ============================================================================
// SSE STREAM CONNECTION
// ============================================================================

/**
 * Creates an SSE (Server-Sent Events) stream connection to receive real-time
 * sensor data from the backend.
 * 
 * HOW IT WORKS:
 * 1. Gets the authenticated user's JWT token from Supabase
 * 2. Opens a fetch request to /stream endpoint with Authorization header
 * 3. Returns a reader that can be used to consume the stream
 * 4. The caller (hook) is responsible for reading and processing the stream
 * 
 * @param {AbortController} abortController - Controller to abort the connection
 * @returns {Promise<{success: boolean, reader?: ReadableStreamDefaultReader, error?: string, status?: string}>}
 * 
 * @example
 * const abortController = new AbortController();
 * const result = await createSensorStream(abortController);
 * 
 * if (result.success) {
 *   // Read from result.reader
 * } else {
 *   // Handle result.error
 * }
 */
export const createSensorStream = async (abortController) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    try {
        // Step 1: Get authentication token from Supabase session
        // This ensures only authenticated users can access the sensor stream
        const { data: { session } } = await supabase.auth.getSession();

        // Step 2: Check if user is authenticated
        if (!session?.access_token) {
            return {
                success: false,
                error: 'User not authenticated',
                status: 'unauthenticated'
            };
        }

        // Step 3: Make fetch request to SSE endpoint with auth header
        // Note: We use fetch instead of EventSource because EventSource
        // doesn't support custom headers (like Authorization)
        const response = await fetch(`${API_URL}/stream`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Accept': 'text/event-stream',
            },
            signal: abortController.signal, // Allows cleanup/cancellation
        });

        // Step 4: Handle HTTP errors
        if (!response.ok) {
            if (response.status === 401) {
                return {
                    success: false,
                    error: 'Session expired or invalid token',
                    status: 'unauthenticated'
                };
            }
            return {
                success: false,
                error: `HTTP ${response.status}: ${response.statusText}`,
                status: 'error'
            };
        }

        // Step 5: Return the stream reader for the caller to consume
        // The caller (hook) will use this reader to read chunks of data
        const reader = response.body.getReader();

        return {
            success: true,
            reader: reader,
            status: 'connected'
        };

    } catch (error) {
        // Handle abort separately (not an actual error, just cleanup)
        if (error.name === 'AbortError') {
            return {
                success: false,
                error: 'Connection aborted',
                status: 'aborted'
            };
        }

        // Network or other errors
        return {
            success: false,
            error: error.message,
            status: 'error'
        };
    }
};

/**
 * Parses raw SSE data chunks into structured messages.
 * 
 * HOW IT WORKS:
 * 1. Takes raw text buffer from stream
 * 2. Splits by newlines and looks for "data: " prefix (SSE format)
 * 3. Parses JSON data from each complete message
 * 4. Returns array of parsed data objects and remaining buffer
 * 
 * SSE FORMAT:
 * - Each message starts with "data: " followed by JSON
 * - Messages are separated by newlines
 * - Comments start with ":" (used for keep-alive)
 * 
 * @param {string} buffer - Accumulated text from stream
 * @returns {{messages: Array<Object>, remainingBuffer: string}}
 * 
 * @example
 * const { messages, remainingBuffer } = parseSSEBuffer(buffer);
 * messages.forEach(data => processData(data));
 * buffer = remainingBuffer; // Keep incomplete data for next chunk
 */
export const parseSSEBuffer = (buffer) => {
    const messages = [];
    const lines = buffer.split('\n');

    // Keep the last line in buffer (might be incomplete)
    const remainingBuffer = lines.pop() || '';

    for (const line of lines) {
        // SSE data lines start with "data: "
        if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6); // Remove 'data: ' prefix
            try {
                const data = JSON.parse(jsonStr);
                messages.push(data);
            } catch (parseError) {
                console.error('[HardwareService] Error parsing SSE data:', parseError);
            }
        }
        // Lines starting with ':' are SSE comments (keep-alive) - ignore them
    }

    return { messages, remainingBuffer };
};

/**
 * Toggle a specific actuator.
 * 
 * @param {string} id - Actuator ID (e.g., 'fan', 'heater', 'buzzer')
 * @param {boolean} state - Desired state (true = ON, false = OFF)
 * @param {string} deviceId - Device MAC address (e.g., 'AA:BB:CC:DD:EE:FF')
 * @returns {Promise<void>}
 */
export const toggleActuator = async (id, state, deviceId) => {
    const device = id;
    const action = state ? 'on' : 'off';

    return await api.post('/control', {
        device,
        action,
        device_id: deviceId
    });
};
