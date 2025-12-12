import api from './api';

/**
 * Hardware Service
 * 
 * Handles real-time communication with hardware through the backend.
 */

/**
 * Fetch current sensor data (Temperature, Humidity, CO).
 * 
 * @returns {Promise<{temp: number, humidity: number, co: number}>}
 */
export const getSensorData = async () => {
    // TODO: Implement API call to fetch sensor data
    // return await api.get('/hardware/sensors');
    throw new Error('getSensorData: Not implemented');
};

/**
 * Fetch current actuator states (Fan, Heater, Buzzer).
 * 
 * @returns {Promise<{fan: boolean, heater: boolean, buzzer: boolean}>}
 */
export const getActuatorState = async () => {
    // TODO: Implement API call to fetch actuator states
    // return await api.get('/hardware/actuators');
    throw new Error('getActuatorState: Not implemented');
};

/**
 * Toggle a specific actuator.
 * 
 * @param {string} id - Actuator ID (e.g., 'fan', 'heater', 'buzzer')
 * @param {boolean} state - Desired state (true = ON, false = OFF)
 * @returns {Promise<void>}
 */
export const toggleActuator = async (id, state) => {
    const device = id;
    const action = state ? 'on' : 'off';

    return await api.post('/control', {
        device,
        action
    });
};
