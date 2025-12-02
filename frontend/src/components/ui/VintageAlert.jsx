import React from 'react';

const VintageAlert = ({ message, type = 'error' }) => {
    if (!message) return null;

    const styles = {
        error: "bg-vintage-red text-red border-vintage-dark",
        success: "bg-vintage-green text-vintage-beige border-vintage-coffee",
        warning: "bg-vintage-gold text-vintage-coffee border-vintage-coffee"
    };

    return (
        <div className={`mb-6 border-2 p-2 text-center font-bold shadow-sm ${styles[type]}`}>
            <div className="flex items-center justify-center gap-2">

                <span className="uppercase">
                    {typeof message === 'string' ? message : JSON.stringify(message)}
                </span>
            </div>
        </div>
    );
};

export default VintageAlert;
