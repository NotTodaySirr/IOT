import React, { useState } from 'react';
import LCDDisplay from '../components/dashboard/LCDDisplay';
import ActuatorButton from '../components/dashboard/ActuatorButton';
import VintagePanel from '../components/ui/VintagePanel';
import ScreenOverlay from '../components/common/ScreenOverlay';
import * as hardwareService from '../services/hardware.service';
import AIDiagnosticPanel from '../components/dashboard/AIDiagnosticPanel';

const Dashboard = ({ sensors, prediction }) => {
    // Component-level state for actuators only
    const [actuators, setActuators] = useState({ fan: false, purifier: false });

    const handleToggle = async (key) => {
        const newState = !actuators[key];
        setActuators(prev => ({ ...prev, [key]: newState }));

        try {
            await hardwareService.toggleActuator(key, newState, sensors.device_id);
        } catch (error) {
            console.error('Failed to toggle actuator:', error);
            setActuators(prev => ({ ...prev, [key]: !newState }));
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sensor Panel */}
            <VintagePanel title="SENSOR READINGS">
                <LCDDisplay label="TEMPERATURE" value={sensors.temp} unit="°C" warning={sensors.temp > 30} />
                <LCDDisplay label="HUMIDITY" value={sensors.humidity} unit="%" />
                <LCDDisplay label="CO LEVEL" value={sensors.co} unit="PPM" warning={sensors.co > 50} />
            </VintagePanel>

            {/* Control Panel */}
            <VintagePanel title="MANUAL OVERRIDE">
                <div className="space-y-4">
                    <ActuatorButton
                        label="VENTILATION FAN"
                        active={actuators.fan}
                        onClick={() => handleToggle('fan')}
                    />
                    <ActuatorButton
                        label="AIR PURIFIER"
                        active={actuators.purifier}
                        onClick={() => handleToggle('purifier')}
                    />
                </div>

                {/* AI Status Panel */}
                <AIDiagnosticPanel prediction={prediction} />
            </VintagePanel>
        </div>
    );
};

export default Dashboard;
