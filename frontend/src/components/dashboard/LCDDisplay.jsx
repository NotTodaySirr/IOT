import React from 'react';
import ScreenOverlay from '../common/ScreenOverlay';

const LCDDisplay = ({ label, value, unit, warning }) => {
    return (
        <div className="vintage-panel mb-4 bg-vintage-vfd-bg border-none shadow-inset relative overflow-hidden">
            <div className="text-xs uppercase font-bold mb-1 opacity-70 tracking-wider text-vintage-tan">{label}</div>
            <div className={`text-3xl font-mono text-right tracking-widest ${warning ? 'text-red-500 animate-pulse' : 'text-vintage-vfd-text'} drop-shadow-[0_0_5px_rgba(230,255,177,0.5)]`}>
                {value} <span className="text-sm">{unit}</span>
            </div>
            <ScreenOverlay />
        </div>
    );
};

export default LCDDisplay;
