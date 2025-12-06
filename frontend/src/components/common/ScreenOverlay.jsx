import React from 'react';

const ScreenOverlay = ({ className = '', grid = true }) => {
    return (
        <div
            className={`absolute inset-0 pointer-events-none ${grid
                    ? 'bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,255,255,0.03),rgba(255,255,255,0.03))] bg-[length:100%_4px,4px_100%]'
                    : 'bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]'
                } z-10 ${className}`}
        />
    );
};

export default ScreenOverlay;
