import React, { useState } from 'react';
import VintageTerminal from '../components/terminal/VintageTerminal';

const Terminal = () => {
    const [history, setHistory] = useState(['Welcome to IOT-OS v2.0', 'Type "HELP" for commands.']);
    const [input, setInput] = useState('');

    const handleCommand = (e) => {
        if (e.key === 'Enter') {
            const cmd = input.trim().toUpperCase();
            let response = '';

            switch (cmd) {
                case 'HELP':
                    response = 'AVAILABLE COMMANDS: STATUS, CLEAR, VERSION, REBOOT';
                    break;
                case 'STATUS':
                    response = 'SYSTEM: ONLINE | TEMP: 24C | HUM: 50%';
                    break;
                case 'CLEAR':
                    setHistory([]);
                    setInput('');
                    return;
                case 'VERSION':
                    response = 'IOT-OS v2.0 (VINTAGE BUILD)';
                    break;
                case 'REBOOT':
                    response = 'REBOOTING... (JUST KIDDING)';
                    break;
                default:
                    response = `UNKNOWN COMMAND: ${cmd}`;
            }

            setHistory(prev => [...prev, `> ${input}`, response]);
            setInput('');
        }
    };

    return (
        <VintageTerminal
            history={history}
            input={input}
            onInputChange={(e) => setInput(e.target.value)}
            onCommand={handleCommand}
        />
    );
};

export default Terminal;

