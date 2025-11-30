import { useTheme } from '@/context/Theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    onDismiss?: () => void;
}

interface ToastProps extends ToastConfig {
    onDismiss: () => void;
}

const getToastConfig = (type: ToastType, isDark: boolean) => {
    const configs = {
        success: {
            icon: 'check-circle',
            lightBg: '#ecfdf5',
            darkBg: 'rgba(16, 185, 129, 0.15)',
            lightText: '#065f46',
            darkText: '#86efac',
            lightBorder: '#d1fae5',
            darkBorder: 'rgba(16, 185, 129, 0.3)',
            iconColor: '#10b981',
        },
        error: {
            icon: 'alert-circle',
            lightBg: '#fef2f2',
            darkBg: 'rgba(239, 68, 68, 0.15)',
            lightText: '#7f1d1d',
            darkText: '#fca5a5',
            lightBorder: '#fee2e2',
            darkBorder: 'rgba(239, 68, 68, 0.3)',
            iconColor: '#ef4444',
        },
        warning: {
            icon: 'alert',
            lightBg: '#fffbeb',
            darkBg: 'rgba(245, 158, 11, 0.15)',
            lightText: '#78350f',
            darkText: '#fcd34d',
            lightBorder: '#fef3c7',
            darkBorder: 'rgba(245, 158, 11, 0.3)',
            iconColor: '#f59e0b',
        },
        info: {
            icon: 'information',
            lightBg: '#eff6ff',
            darkBg: 'rgba(59, 130, 246, 0.15)',
            lightText: '#1e3a8a',
            darkText: '#93c5fd',
            lightBorder: '#dbeafe',
            darkBorder: 'rgba(59, 130, 246, 0.3)',
            iconColor: '#3b82f6',
        },
    };

    const config = configs[type];
    return {
        ...config,
        bgColor: isDark ? config.darkBg : config.lightBg,
        textColor: isDark ? config.darkText : config.lightText,
        borderColor: isDark ? config.darkBorder : config.lightBorder,
    };
};

function Toast({ id, message, type, duration = 3000, onDismiss }: ToastProps) {
    const { isDark } = useTheme();
    const slideAnim = useRef(new Animated.Value(300)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    const config = getToastConfig(type, isDark);

    useEffect(() => {
        // Slide in and fade in
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();

        // Auto dismiss
        const timer = setTimeout(() => {
            dismissToast();
        }, duration);

        return () => clearTimeout(timer);
    }, []);

    const dismissToast = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 300,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onDismiss();
        });
    };

    return (
        <Animated.View
            style={[
                styles.toastContainer,
                {
                    transform: [{ translateY: slideAnim }],
                    opacity: opacityAnim,
                },
            ]}
        >
            <View
                style={[
                    styles.toast,
                    {
                        backgroundColor: config.bgColor,
                        borderColor: config.borderColor,
                    },
                ]}
            >
                <MaterialCommunityIcons
                    name={config.icon as any}
                    size={20}
                    color={config.iconColor}
                    style={styles.icon}
                />
                <Text
                    style={[
                        styles.message,
                        { color: config.textColor },
                    ]}
                    numberOfLines={2}
                >
                    {message}
                </Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
        paddingBottom: 24,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        maxWidth: width - 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    icon: {
        marginRight: 12,
        minWidth: 20,
    },
    message: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
});

export default Toast;
