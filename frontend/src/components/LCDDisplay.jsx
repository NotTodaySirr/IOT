import React from 'react';

const LCDDisplay = ({ label, value, unit, warning }) => {
    return (
        <div className="vintage-panel mb-4 bg-vintage-vfd-bg border-none shadow-inset relative overflow-hidden">
            <div className="text-xs uppercase font-bold mb-1 opacity-70 tracking-wider text-vintage-tan">{label}</div>
            <div className={`text-3xl font-mono text-right tracking-widest ${warning ? 'text-red-500 animate-pulse' : 'text-vintage-vfd-text'} drop-shadow-[0_0_5px_rgba(230,255,177,0.5)]`}>
                {value} <span className="text-sm">{unit}</span>
            </div>
            {/* VFD Grid Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,255,255,0.03),rgba(255,255,255,0.03))] z-10 bg-[length:100%_4px,4px_100%]"></div>
        </div>
    );
};

export default LCDDisplay;
