import React, { useEffect, useRef } from 'react';
import TerminalLine from './TerminalLine';

/**
 * TerminalMessageList - Renders the scrollable list of terminal messages.
 * @param {Array<string|Object>} messages - Array of messages. Can be strings or objects with { content, role }.
 */
const TerminalMessageList = ({ messages }) => {
    const endRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar relative z-20">
            {messages.map((msg, i) => {
                // Support both string and object message formats
                const content = typeof msg === 'string' ? msg : msg.content;
                const role = typeof msg === 'string' ? 'system' : msg.role;
                return <TerminalLine key={i} content={content} role={role} />;
            })}
            <div ref={endRef} />
        </div>
    );
};

export default TerminalMessageList;
