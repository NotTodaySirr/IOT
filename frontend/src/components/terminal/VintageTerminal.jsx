import React from 'react';
import ScreenOverlay from '../common/ScreenOverlay';
import TerminalMessageList from './TerminalMessageList';
import TerminalInput from './TerminalInput';

/**
 * VintageTerminal - Main terminal container that composes sub-components.
 * @param {Array<string|Object>} history - The message history.
 * @param {string} input - Current input value.
 * @param {function} onInputChange - Handler for input changes.
 * @param {function} onCommand - Handler for command submission.
 */
const VintageTerminal = ({ history, input, onInputChange, onCommand }) => {
    return (
        <div className="vintage-panel bg-vintage-vfd-bg h-[500px] overflow-hidden flex flex-col font-mono text-vintage-vfd-text p-4 shadow-inset border-none relative">
            <ScreenOverlay />
            <TerminalMessageList messages={history} />
            <TerminalInput
                value={input}
                onChange={onInputChange}
                onSubmit={onCommand}
            />
        </div>
    );
};

export default VintageTerminal;

