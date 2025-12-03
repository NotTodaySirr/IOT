import React from 'react';

const VintageToast = ({ message, type = 'info', onClose }) => {
    const styles = {
        success: {
            bg: 'bg-vintage-green',
            border: 'border-vintage-coffee',
            text: 'text-white',
        },
        error: {
            bg: 'bg-vintage-red',
            border: 'border-vintage-coffee',
            text: 'text-white',
        },
        info: {
            bg: 'bg-vintage-cream',
            border: 'border-vintage-coffee',
            text: 'text-vintage-coffee',
        }
    };

    const style = styles[type] || styles.info;

    // Format message to ensure it's displayable
    const formatMessage = (msg) => {
        if (typeof msg === 'string') return msg;
        if (typeof msg === 'object' && msg !== null) {
            // If it's an error object with a message property
            if (msg.message) return msg.message;
            // Otherwise stringify it
            return JSON.stringify(msg);
        }
        return String(msg);
    };

    const displayMessage = formatMessage(message);

    return (
        <div className={`
            ${style.bg} ${style.border} ${style.text}
            border-2 rounded-sm shadow-hard
            p-3 mb-2 min-w-[300px] max-w-[400px]
            font-mono text-sm
            animate-slide-in-right
            flex items-center justify-between gap-3
        `}>
            <div className="flex items-center gap-2 flex-1">
                <span className="text-lg font-bold">{style.icon}</span>
                <span className="uppercase font-bold tracking-wide break-words">
                    {displayMessage}
                </span>
            </div>
            <button
                onClick={onClose}
                className={`
                    ${style.text} hover:opacity-70
                    font-bold text-lg leading-none
                    px-2 py-1 rounded
                    transition-opacity
                `}
                aria-label="Close notification"
            >
                ×
            </button>
        </div>
    );
};

export default VintageToast;
