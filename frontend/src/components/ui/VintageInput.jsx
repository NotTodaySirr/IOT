import React from 'react';

const VintageInput = ({
    label,
    value,
    onChange,
    type = 'text',
    placeholder = '',
    error = '',
    autoComplete = 'off'
}) => {
    return (
        <div>
            {label && (
                <label className="block text-vintage-coffee text-sm font-bold mb-2 uppercase tracking-wider">
                    {label}
                </label>
            )}
            <input
                type={type}
                value={value}
                onChange={onChange}
                className="w-full bg-vintage-cream text-vintage-coffee border-2 border-vintage-coffee p-3 focus:outline-none focus:bg-white font-mono shadow-inner placeholder:text-vintage-coffee/30"
                placeholder={placeholder}
                autoComplete={autoComplete}
            />
            {error && (
                <div className="mt-2 text-red-600 text-sm font-bold">
                    {error}
                </div>
            )}
        </div>
    );
};

export default VintageInput;
