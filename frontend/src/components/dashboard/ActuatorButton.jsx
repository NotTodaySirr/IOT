import React from 'react';

const ActuatorButton = ({ label, active, onClick, color = 'vintage-coffee' }) => {
    return (
        <button
            onClick={onClick}
            className={`
        vintage-btn w-full mb-4 flex items-center justify-between
        ${active ? 'translate-y-[4px] shadow-none' : ''}
      `}
            style={{
                // Override shadow for active state if needed, but class handles most
                boxShadow: active
                    ? '0px 0px 0px 0px var(--color-vintage-tan), inset 0px 2px 4px 0px rgba(0,0,0,0.1)'
                    : undefined
            }}
        >
            <span className="text-vintage-coffee">{label}</span>
            <div className={`w-3 h-3 rounded-full border border-vintage-coffee ${active ? 'bg-red-500 shadow-[0_0_5px_red]' : 'bg-vintage-tan'}`}></div>
        </button>
    );
};

export default ActuatorButton;
