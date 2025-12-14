import React, { useState } from 'react';
import LCDDisplay from '../components/dashboard/LCDDisplay';
import ActuatorButton from '../components/dashboard/ActuatorButton';
import VintagePanel from '../components/ui/VintagePanel';
import ScreenOverlay from '../components/common/ScreenOverlay';
import * as hardwareService from '../services/hardware.service';

const Dashboard = ({ sensors, aiStatus, useRealApi }) => {
    // Component-level state for actuators only
    const [actuators, setActuators] = useState({ fan: false, purifier: false, buzzer: false });

    const handleToggle = async (key) => {
        const newState = !actuators[key];
        setActuators(prev => ({ ...prev, [key]: newState }));

        if (useRealApi) {
            try {
                await hardwareService.toggleActuator(key, newState);
            } catch (error) {
                console.error('Failed to toggle actuator:', error);
                setActuators(prev => ({ ...prev, [key]: !newState }));
            }
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
                    <ActuatorButton
                        label="ALARM BUZZER"
                        active={actuators.buzzer}
                        onClick={() => handleToggle('buzzer')}
                    />
                </div>

                {/* AI Status Panel */}
                <div className={`mt-8 p-4 border-2 border-vintage-coffee shadow-inset relative overflow-hidden ${aiStatus.isAnomaly ? 'bg-red-900/20' : 'bg-vintage-vfd-bg'}`}>
                    <div className="text-xs text-vintage-tan mb-2 relative z-20 font-semibold" style={{ textShadow: '0 0 3px rgba(0,0,0,0.8)' }}>A.I. DIAGNOSTIC</div>
                    <div className="flex items-center gap-3 relative z-20">
                        <div className={`w-4 h-4 rounded-full border border-black ${aiStatus.isAnomaly ? 'bg-red-500 animate-pulse shadow-[0_0_10px_red]' : 'bg-vintage-vfd-text shadow-[0_0_5px_rgba(230,255,177,0.8)]'}`}></div>
                        <div className="flex flex-col">
                            <span className={`text-sm font-bold font-mono ${aiStatus.isAnomaly ? 'text-red-600' : 'text-vintage-vfd-text'} drop-shadow-[0_0_2px_rgba(230,255,177,0.5)]`}>
                                {aiStatus.message}
                            </span>
                            <span className="text-xs text-vintage-tan relative z-20" style={{ textShadow: '0 0 2px rgba(0,0,0,0.8)' }}>{aiStatus.detail}</span>
                        </div>
                    </div>
                    <ScreenOverlay />
                </div>
            </VintagePanel>
        </div>
    );
};

export default Dashboard;
