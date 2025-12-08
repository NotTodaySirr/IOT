import React from 'react';

/**
 * TerminalLine - Renders a single line of terminal output.
 * @param {string} content - The text content to display.
 * @param {string} [role] - Optional role for future styling ('user', 'system', 'ai').
 */
const TerminalLine = ({ content, role = 'system' }) => {
    // Future: Add different styles based on 'role'
    const roleStyles = {
        user: 'text-vintage-vfd-text',
        system: 'text-vintage-vfd-text',
        ai: 'text-green-400', // Example for future AI responses
    };

    return (
        <div className={`drop-shadow-[0_0_2px_rgba(230,255,177,0.5)] ${roleStyles[role] || roleStyles.system}`}>
            {content}
        </div>
    );
};

export default TerminalLine;
