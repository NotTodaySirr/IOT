import React from 'react';

const AIDiagnosticPanel = ({ prediction }) => {
    // Default values if no prediction is available yet
    const data = prediction?.future_environment || {
        temperature_C: '--.-',
        'humidity_%': '--',
        CO_ppm: '--'
    };

    const action = prediction?.recommended_action || "INITIALIZING...";
    const isOptimal = action === 'normal';

    return (
        <div className="mt-8 border-2 border-vintage-coffee relative bg-vintage-cream transition-colors duration-500 shadow-sm">

            {/* Header Block used to be simple text, now a distinct bar */}
            <div className="bg-vintage-coffee text-vintage-cream px-3 py-2 flex justify-between items-center">
                <div className="text-xs font-bold uppercase tracking-widest">
                    AI DIAGNOSTIC MODULE
                </div>
            </div>

            <div className="p-4">
                {/* System Status Line */}
                <div className="flex items-center gap-3 mb-4 p-2 bg-vintage-coffee/5 rounded border border-vintage-coffee/10">
                    <span className={`w-3 h-3 rounded-full shrink-0 ${isOptimal ? 'bg-vintage-green shadow-[0_0_5px_#388E3C]' : 'bg-vintage-red animate-pulse'}`}></span>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-vintage-coffee/60 leading-none">Status</span>
                        <span className={`text-base font-bold ${isOptimal ? 'text-vintage-coffee' : 'text-vintage-red'}`}>
                            {isOptimal ? 'SYSTEM OPTIMAL' : 'ANOMALY DETECTED'}
                        </span>
                    </div>
                </div>

                {/* Prediction Matrix */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2 border-b border-vintage-coffee/20 pb-1">
                        <span className="text-xs uppercase font-bold text-vintage-coffee/80">Forecast (T+5m)</span>
                        <span className="text-[10px] font-mono text-vintage-coffee/50">CONFIDENCE: HIGH</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-vintage-coffee font-mono">
                        {/* Temp */}
                        <div className="flex flex-col bg-vintage-cream p-1">
                            <span className="text-2xl font-bold">{data.temperature_C}</span>
                            <span className="text-[10px] uppercase font-bold opacity-50">°C Temp</span>
                        </div>
                        {/* Humidity */}
                        <div className="flex flex-col bg-vintage-cream p-1 border-l border-vintage-coffee/20">
                            <span className="text-2xl font-bold">{data['humidity_%']}</span>
                            <span className="text-[10px] uppercase font-bold opacity-50">% Humid</span>
                        </div>
                        {/* CO */}
                        <div className="flex flex-col bg-vintage-cream p-1 border-l border-vintage-coffee/20">
                            <span className={`text-2xl font-bold ${data.CO_ppm > 50 ? 'text-vintage-red' : ''}`}>
                                {data.CO_ppm}
                            </span>
                            <span className="text-[10px] uppercase font-bold opacity-50">PPM CO</span>
                        </div>
                    </div>
                </div>

                {/* Action Line */}
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-vintage-coffee/60">Recommended Action:</span>
                    <div className="text-sm font-mono bg-vintage-coffee text-vintage-cream p-3 rounded-sm shadow-inner uppercase tracking-wide">
                        {'>'} {action.replace(/_/g, ' ')}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIDiagnosticPanel;

