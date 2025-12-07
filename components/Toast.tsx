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
    // Professional minimal design with accent colored left border and subtle icons
    // Maintains dark theme elegance with functional differentiation
    const configs = {
        success: {
            icon: 'check-circle',
            lightBg: '#323232',
            darkBg: '#212121',
            accentColor: '#10b981',  // Green
            lightText: '#ffffff',
            darkText: '#ffffff',
        },
        error: {
            icon: 'alert-circle',
            lightBg: '#323232',
            darkBg: '#212121',
            accentColor: '#ef4444',  // Red
            lightText: '#ffffff',
            darkText: '#ffffff',
        },
        warning: {
            icon: 'alert',
            lightBg: '#323232',
            darkBg: '#212121',
            accentColor: '#f59e0b',  // Amber
            lightText: '#ffffff',
            darkText: '#ffffff',
        },
        info: {
            icon: 'information',
            lightBg: '#323232',
            darkBg: '#212121',
            accentColor: '#3b82f6',  // Blue
            lightText: '#ffffff',
            darkText: '#ffffff',
        },
    };

    const config = configs[type];
    return {
        icon: config.icon,
        bgColor: isDark ? config.darkBg : config.lightBg,
        textColor: isDark ? config.darkText : config.lightText,
        accentColor: config.accentColor,
    };
};

function Toast({ id, message, type, duration = 2500, onDismiss }: ToastProps) {
    const { isDark } = useTheme();
    const slideAnim = useRef(new Animated.Value(100)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    const config = getToastConfig(type, isDark);

    useEffect(() => {
        // Slide in and fade in from bottom
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 250,
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
                toValue: 100,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 250,
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
                        borderLeftColor: config.accentColor,
                    },
                ]}
            >
                {/* Colored accent icon */}
                <MaterialCommunityIcons
                    name={config.icon as any}
                    size={18}
                    color={config.accentColor}
                    style={styles.icon}
                />
                
                {/* Message text */}
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
        paddingBottom: 20,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        borderLeftWidth: 3,
        maxWidth: width - 48,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
    },
    icon: {
        marginRight: 10,
        minWidth: 18,
    },
    message: {
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'left',
        lineHeight: 18,
        flex: 1,
    },
});

export default Toast;


