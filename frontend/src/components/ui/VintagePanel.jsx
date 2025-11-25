import React from 'react';

const VintagePanel = ({ title, header, children, className = '', type = 'default' }) => {
    const typeClasses = {
        default: 'vintage-panel',
        inset: 'vintage-panel shadow-inset',
        screen: 'vintage-panel bg-vintage-vfd-bg border-none shadow-inset'
    };

    return (
        <div className={`${typeClasses[type]} ${className}`}>
            {header && header}
            {title && (
                <h2 className="text-xl font-bold mb-4 border-b-2 border-vintage-coffee pb-2 text-vintage-coffee">
                    {title}
                </h2>
            )}
            {children}
        </div>
    );
};

export default VintagePanel;
