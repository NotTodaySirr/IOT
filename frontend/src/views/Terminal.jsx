import React from 'react';
import VintageTerminal from '../components/terminal/VintageTerminal';
import useTerminal from '../hooks/useTerminal';

const Terminal = () => {
    const { history, input, handleInputChange, handleCommand } = useTerminal();

    return (
        <VintageTerminal
            history={history}
            input={input}
            onInputChange={handleInputChange}
            onCommand={handleCommand}
        />
    );
};

export default Terminal;

