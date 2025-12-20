import React, { useState } from 'react';
import LCDDisplay from '../components/dashboard/LCDDisplay';
import ActuatorButton from '../components/dashboard/ActuatorButton';
import VintagePanel from '../components/ui/VintagePanel';
import useActuators from '../hooks/useActuators';
import AIDiagnosticPanel from '../components/dashboard/AIDiagnosticPanel';

const Dashboard = ({ sensors, prediction }) => {
    const { actuators, toggleActuator } = useActuators();

    // Helper to keep the JSX clean
    const handleToggle = (key) => {
        toggleActuator(key, sensors.device_id);
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
