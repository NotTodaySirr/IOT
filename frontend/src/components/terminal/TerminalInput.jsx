import React from 'react';

/**
 * TerminalInput - The command input field for the terminal.
 * @param {string} value - Current input value.
 * @param {function} onChange - Handler for input changes.
 * @param {function} onSubmit - Handler for Enter key press.
 * @param {string} [prompt] - The prompt character(s) to display.
 */
const TerminalInput = ({ value, onChange, onSubmit, prompt = '>' }) => {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            onSubmit(e);
        }
    };

    return (
        <div className="mt-2 flex items-center relative z-20">
            <span className="mr-2">{prompt}</span>
            <input
                type="text"
                value={value}
                onChange={onChange}
                onKeyDown={handleKeyDown}
                className="bg-transparent border-none outline-none flex-1 text-vintage-vfd-text focus:ring-0 drop-shadow-[0_0_2px_rgba(230,255,177,0.5)]"
                autoFocus
            />
        </div>
    );
};

export default TerminalInput;
