import React from 'react';

const VintageButton = ({
    onClick,
    children,
    type = 'button',
    variant = 'primary',
    fullWidth = false,
    className = ''
}) => {
    const variantClasses = {
        primary: 'bg-vintage-coffee text-vintage-beige',
        secondary: 'bg-vintage-cream text-vintage-coffee',
        danger: 'bg-red-600 text-white border-red-700'
    };

    return (
        <button
            type={type}
            onClick={onClick}
            className={`
                ${variant === 'primary' || variant === 'danger'
                    ? `px-8 py-3 font-bold uppercase tracking-widest border-2 shadow-hard hover:translate-y-1 hover:shadow-none transition-all active:translate-y-1 active:shadow-none ${variantClasses[variant]}`
                    : 'vintage-btn'
                }
                ${fullWidth ? 'w-full' : ''}
                ${className}
            `}
        >
            {children}
        </button>
    );
};

export default VintageButton;
