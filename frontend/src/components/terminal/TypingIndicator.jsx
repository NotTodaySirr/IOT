import React from 'react';

const TypingIndicator = () => {
    return (
        <div className="flex space-x-1 p-1 items-center">
            <div className="w-2 h-2 bg-vintage-vfd-text rounded-full animate-typing-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-vintage-vfd-text rounded-full animate-typing-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-vintage-vfd-text rounded-full animate-typing-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
    );
};

export default TypingIndicator;
