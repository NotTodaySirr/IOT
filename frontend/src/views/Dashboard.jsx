import React from 'react';
import LCDDisplay from '../components/LCDDisplay';
import ActuatorButton from '../components/ActuatorButton';

const Dashboard = ({ sensors, actuators, toggleActuator, aiStatus }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sensor Panel */}
            <div className="vintage-panel">
                <h2 className="text-xl font-bold mb-4 border-b-2 border-vintage-coffee pb-2 text-vintage-coffee">SENSOR READINGS</h2>
                <LCDDisplay label="TEMPERATURE" value={sensors.temp} unit="°C" warning={sensors.temp > 30} />
                <LCDDisplay label="HUMIDITY" value={sensors.humidity} unit="%" />
                <LCDDisplay label="CO LEVEL" value={sensors.co} unit="PPM" warning={sensors.co > 50} />
            </div>

            {/* Control Panel */}
            <div className="vintage-panel">
                <h2 className="text-xl font-bold mb-4 border-b-2 border-vintage-coffee pb-2 text-vintage-coffee">MANUAL OVERRIDE</h2>
                <div className="space-y-4">
                    <ActuatorButton
                        label="VENTILATION FAN"
                        active={actuators.fan}
                        onClick={() => toggleActuator('fan')}
                    />
                    <ActuatorButton
                        label="HEATING UNIT"
                        active={actuators.heater}
                        onClick={() => toggleActuator('heater')}
                    />
                    <ActuatorButton
                        label="ALARM BUZZER"
                        active={actuators.buzzer}
                        onClick={() => toggleActuator('buzzer')}
                    />
                </div>

                {/* AI Status Panel */}
                <div className={`mt-8 p-4 border-2 border-vintage-coffee shadow-inset relative overflow-hidden ${aiStatus.isAnomaly ? 'bg-red-900/20' : 'bg-vintage-vfd-bg'}`}>
                    <div className="text-xs text-vintage-tan mb-2 opacity-70">A.I. DIAGNOSTIC</div>
                    <div className="flex items-center gap-3 relative z-10">
                        <div className={`w-4 h-4 rounded-full border border-black ${aiStatus.isAnomaly ? 'bg-red-500 animate-pulse shadow-[0_0_10px_red]' : 'bg-vintage-vfd-text shadow-[0_0_5px_rgba(230,255,177,0.8)]'}`}></div>
                        <div className="flex flex-col">
                            <span className={`text-sm font-bold font-mono ${aiStatus.isAnomaly ? 'text-red-600' : 'text-vintage-vfd-text'} drop-shadow-[0_0_2px_rgba(230,255,177,0.5)]`}>
                                {aiStatus.message}
                            </span>
                            <span className="text-xs text-vintage-tan opacity-80">{aiStatus.detail}</span>
                        </div>
                    </div>
                    {/* Grid Overlay */}
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,255,255,0.03),rgba(255,255,255,0.03))] z-0 bg-[length:100%_4px,4px_100%]"></div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
