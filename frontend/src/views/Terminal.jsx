import React, { useState, useEffect, useRef } from 'react';

const Terminal = () => {
    const [history, setHistory] = useState(['Welcome to IOT-OS v2.0', 'Type "HELP" for commands.']);
    const [input, setInput] = useState('');
    const endRef = useRef(null);

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

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    return (
        <div className="vintage-panel bg-vintage-vfd-bg h-[500px] overflow-hidden flex flex-col font-mono text-vintage-vfd-text p-4 shadow-inset border-none relative">
            {/* Screen Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,255,255,0.03),rgba(255,255,255,0.03))] z-10 bg-[length:100%_4px,4px_100%]"></div>

            <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar relative z-20">
                {history.map((line, i) => (
                    <div key={i} className="drop-shadow-[0_0_2px_rgba(230,255,177,0.5)]">{line}</div>
                ))}
                <div ref={endRef} />
            </div>
            <div className="mt-2 flex items-center relative z-20">
                <span className="mr-2">{'>'}</span>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleCommand}
                    className="bg-transparent border-none outline-none flex-1 text-vintage-vfd-text focus:ring-0 drop-shadow-[0_0_2px_rgba(230,255,177,0.5)]"
                    autoFocus
                />
            </div>
        </div>
    );
};

export default Terminal;
