import React, { useState, useEffect, useCallback } from 'react';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (message: string, type: Toast['type'], duration?: number) => void;
    removeToast: (id: string) => void;
}

// Simple toast hook
export const useToast = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: Toast['type'], duration = 4000) => {
        const id = `toast_${Date.now()}_${Math.random()}`;
        setToasts(prev => [...prev, { id, message, type, duration }]);

        // Auto remove after duration
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return { toasts, addToast, removeToast };
};

// Toast Container Component
interface ToastContainerProps {
    toasts: Toast[];
    removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

// Individual Toast Item
const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Animate in
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    const bgColor = {
        success: 'bg-green-600 border-green-400',
        error: 'bg-red-600 border-red-400',
        warning: 'bg-yellow-600 border-yellow-400',
        info: 'bg-blue-600 border-blue-400',
    }[toast.type];

    const icon = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ',
    }[toast.type];

    return (
        <div
            className={`${bgColor} border-l-4 px-4 py-3 rounded-r shadow-lg flex items-center gap-3 transition-all duration-300 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                }`}
        >
            <span className="text-white text-lg">{icon}</span>
            <p className="text-white text-sm flex-1 pixel-font">{toast.message}</p>
            <button
                onClick={onClose}
                className="text-white/70 hover:text-white transition-colors text-xl leading-none"
            >
                ×
            </button>
        </div>
    );
};

export default ToastContainer;
