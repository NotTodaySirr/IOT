import React from 'react';
import ScreenOverlay from '../common/ScreenOverlay';

const VintageTerminal = ({ history, input, onInputChange, onCommand, inputRef }) => {
    return (
        <div className="vintage-panel bg-vintage-vfd-bg h-[500px] overflow-hidden flex flex-col font-mono text-vintage-vfd-text p-4 shadow-inset border-none relative">
            <ScreenOverlay />

            <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar relative z-20">
                {history.map((line, i) => (
                    <div key={i} className="drop-shadow-[0_0_2px_rgba(230,255,177,0.5)]">
                        {line}
                    </div>
                ))}
                <div ref={inputRef} />
            </div>

            <div className="mt-2 flex items-center relative z-20">
                <span className="mr-2">{'>'}</span>
                <input
                    type="text"
                    value={input}
                    onChange={onInputChange}
                    onKeyDown={onCommand}
                    className="bg-transparent border-none outline-none flex-1 text-vintage-vfd-text focus:ring-0 drop-shadow-[0_0_2px_rgba(230,255,177,0.5)]"
                    autoFocus
                />
            </div>
        </div>
    );
};

export default VintageTerminal;
