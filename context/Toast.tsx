import Toast, { ToastConfig, ToastType } from '@/components/Toast';
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { View } from 'react-native';

interface ToastContextType {
    showToast: (message: string, type: ToastType, duration?: number) => string;
    dismissToast: (id: string) => void;
    success: (message: string, duration?: number) => string;
    error: (message: string, duration?: number) => string;
    warning: (message: string, duration?: number) => string;
    info: (message: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toasts, setToasts] = useState<ToastConfig[]>([]);
    const idRef = useRef(0);

    const generateId = useCallback(() => {
        return `toast-${++idRef.current}`;
    }, []);

    const showToast = useCallback(
        (message: string, type: ToastType, duration: number = 3000) => {
            const id = generateId();
            const toastConfig: ToastConfig = {
                id,
                message,
                type,
                duration,
            };
            setToasts((prev) => [...prev, toastConfig]);
            return id;
        },
        [generateId]
    );

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const success = useCallback(
        (message: string, duration?: number) =>
            showToast(message, 'success', duration),
        [showToast]
    );

    const error = useCallback(
        (message: string, duration?: number) =>
            showToast(message, 'error', duration),
        [showToast]
    );

    const warning = useCallback(
        (message: string, duration?: number) =>
            showToast(message, 'warning', duration),
        [showToast]
    );

    const info = useCallback(
        (message: string, duration?: number) =>
            showToast(message, 'info', duration),
        [showToast]
    );

    const value: ToastContextType = {
        showToast,
        dismissToast,
        success,
        error,
        warning,
        info,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 9999 }}>
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        {...toast}
                        onDismiss={() => dismissToast(toast.id)}
                    />
                ))}
            </View>
        </ToastContext.Provider>
    );
};
