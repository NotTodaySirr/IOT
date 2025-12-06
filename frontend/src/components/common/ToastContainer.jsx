import React from 'react';
import VintageToast from './VintageToast';

const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col items-end pointer-events-none">
            <div className="pointer-events-auto">
                {toasts.map((toast) => (
                    <VintageToast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default ToastContainer;
