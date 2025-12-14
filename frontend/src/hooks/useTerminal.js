import { useState, useCallback } from 'react';
import { sendQuery } from '../services/ai.service';

/**
 * useTerminal Hook
 * 
 * Manages the state and logic for the Vintage Terminal.
 * Handles command processing, history management, and API calls.
 * 
 * @returns {Object} { history, input, handleInputChange, handleCommand, isProcessing }
 */
const useTerminal = () => {
    // Initial welcome messages
    const [history, setHistory] = useState([
        { role: 'system', content: 'Welcome to IOT-OS v2.0' },
        { role: 'system', content: 'Type "HELP" or ask a question to begin.' }
    ]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    const addToHistory = (role, content) => {
        setHistory(prev => [...prev, { role, content }]);
    };

    const handleCommand = async (e) => {
        // Only process if it was an Enter key press
        if (e && e.key !== 'Enter') return;

        const cmd = input.trim();
        if (!cmd) return;

        // 1. Display User Input
        addToHistory('user', `> ${cmd} `);
        setInput(''); // Clear input immediately

        // 2. Handle Local Commands
        const upperCmd = cmd.toUpperCase();
        if (upperCmd === 'CLEAR') {
            setHistory([]);
            return;
        }

        // 3. Handle Remote Commands (AI)
        setIsProcessing(true);
        addToHistory('ai', '...'); // Show loading indicator

        try {
            const response = await sendQuery(cmd);

            // Remove the loading indicator and add response
            setHistory(prev => {
                const newHistory = [...prev];
                // Remove the last item if it is the loading indicator
                if (newHistory.length > 0 && newHistory[newHistory.length - 1].content === '...') {
                    newHistory.pop();
                }
                return [...newHistory, { role: 'ai', content: response }];
            });

        } catch (error) {
            setHistory(prev => {
                const newHistory = [...prev];
                if (newHistory.length > 0 && newHistory[newHistory.length - 1].content === '...') {
                    newHistory.pop();
                }
                return [...newHistory, { role: 'system', content: 'Error: Failed to process command.' }];
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        history,
        input,
        handleInputChange,
        handleCommand,
        isProcessing
    };
};

export default useTerminal;
