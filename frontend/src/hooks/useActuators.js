import { useState, useEffect } from 'react';
import * as hardwareService from '../services/hardware.service';

/**
 * Custom hook to manage actuator control state.
 * 
 * @returns {{actuators: {fan: boolean, heater: boolean, buzzer: boolean}, toggleActuator: (id: string) => Promise<void>}}
 */
const useActuators = () => {
    const [actuators, setActuators] = useState({
        fan: false,
        purifier: false,
    });

    /**
     * Toggle an actuator (optimistic update).
     * 
     * @param {string} id - Actuator ID (e.g., 'fan', 'purifier')
     * @param {string} deviceId - The target device MAC address
     */
    const toggleActuator = async (id, deviceId) => {
        // Optimistic update
        const newState = !actuators[id];
        setActuators(prev => ({ ...prev, [id]: newState }));

        try {
            await hardwareService.toggleActuator(id, newState, deviceId);
        } catch (error) {
            console.error('Failed to toggle actuator:', error);
            // Revert on error
            setActuators(prev => ({ ...prev, [id]: !newState }));
        }
    };

    return { actuators, toggleActuator };
};

export default useActuators;
