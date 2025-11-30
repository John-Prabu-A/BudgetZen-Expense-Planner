import { useTheme } from '@/context/Theme';
import { verifyPassword } from '@/lib/passwordUtils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const KEY_SIZE = Math.min(width * 0.18, 80);
const SPACING_X = 30;
const SPACING_Y = 20;

interface UnifiedLockScreenProps {
    authMethod: 'password' | 'passcode' | 'both';
    passwordHash?: string | null;
    passcodeHash?: string | null;
    passcodeLength?: 4 | 6;
    onUnlock: () => void;
}

export default function UnifiedLockScreen({
    authMethod,
    passwordHash,
    passcodeHash,
    passcodeLength = 4,
    onUnlock,
}: UnifiedLockScreenProps) {
    const { isDark, colors } = useTheme();
    const [currentMethod, setCurrentMethod] = useState<'password' | 'passcode'>(
        authMethod === 'both' ? 'passcode' : authMethod
    );
    
    const [password, setPassword] = useState('');
    const [passcode, setPasscode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);

    const passwordInputRef = useRef<TextInput>(null);
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

    useEffect(() => {
        if (currentMethod === 'password') {
            setTimeout(() => passwordInputRef.current?.focus(), 300);
        } else {
            Keyboard.dismiss();
        }
    }, [currentMethod]);

    const triggerShake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const handlePasswordVerify = async () => {
        if (!password.trim() || !passwordHash) return;
        setIsLoading(true);
        try {
            const isValid = await verifyPassword(password, passwordHash);
            if (isValid) {
                Keyboard.dismiss();
                onUnlock();
            } else {
                handleError('Incorrect password');
            }
        } catch (err) {
            handleError('Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasscodeVerify = async (codeToCheck: string) => {
        if (!passcodeHash) return;
        setIsLoading(true);
        try {
            const hashedInput = btoa(codeToCheck);
            if (hashedInput === passcodeHash) {
                onUnlock();
            } else {
                setPasscode('');
                handleError('Incorrect passcode');
            }
        } catch (err) {
            setPasscode('');
            handleError('Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleError = (msg: string) => {
        setError(msg);
        triggerShake();
        setAttempts((prev) => prev + 1);
        if (attempts >= 5) Alert.alert('Security Alert', 'Too many failed attempts.');
    };

    const handleKeyPress = (num: string) => {
        if (isLoading) return;
        setError('');
        if (passcode.length < passcodeLength) {
            const newPasscode = passcode + num;
            setPasscode(newPasscode);
            if (newPasscode.length === passcodeLength) {
                setTimeout(() => handlePasscodeVerify(newPasscode), 100);
            }
        }
    };

    const handleBackspace = () => {
        setError('');
        setPasscode((prev) => prev.slice(0, -1));
    };

    // --- RENDERERS ---
    const renderDots = () => (
        <Animated.View style={[styles.dotsContainer, { transform: [{ translateX: shakeAnim }] }]}>
            {Array.from({ length: passcodeLength }).map((_, i) => (
                <View
                    key={i}
                    style={[
                        styles.dot,
                        {
                            borderColor: error ? '#ef4444' : colors.text,
                            backgroundColor: i < passcode.length ? (error ? '#ef4444' : colors.text) : 'transparent',
                        },
                    ]}
                />
            ))}
        </Animated.View>
    );

    const renderKeypad = () => (
        <View style={styles.keypadContainer}>
            {[[1, 2, 3], [4, 5, 6], [7, 8, 9]].map((row, i) => (
                <View key={i} style={styles.keypadRow}>
                    {row.map((num) => (
                        <TouchableOpacity
                            key={num}
                            style={[styles.key, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)' }]}
                            onPress={() => handleKeyPress(num.toString())}
                        >
                            <Text style={[styles.keyText, { color: colors.text }]}>{num}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ))}
            <View style={styles.keypadRow}>
                <View style={styles.keyPlaceholder} />
                <TouchableOpacity
                    style={[styles.key, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)' }]}
                    onPress={() => handleKeyPress('0')}
                >
                    <Text style={[styles.keyText, { color: colors.text }]}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.keyPlaceholder} onPress={handleBackspace}>
                    {passcode.length > 0 && <MaterialCommunityIcons name="backspace-outline" size={28} color={colors.text} />}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* FIXED: KeyboardAvoidingView wraps the WHOLE screen */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <Animated.View style={[styles.mainWrapper, { opacity: fadeAnim }]}>
                    
                    {/* 1. TOP SECTION (Stays Top) */}
                    <View style={styles.staticContent}>
                        <View style={styles.header}>
                            <View style={[styles.iconCircle, { backgroundColor: colors.accent + '20' }]}>
                                <MaterialCommunityIcons name={currentMethod === 'passcode' ? "lock" : "shield-key"} size={28} color={colors.accent} />
                            </View>
                            <Text style={[styles.title, { color: colors.text }]}>
                                {currentMethod === 'password' ? 'Welcome Back' : 'Enter Passcode'}
                            </Text>
                            <Text style={[styles.subtitle, { color: error ? '#ef4444' : colors.textSecondary }]}>
                                {error || (currentMethod === 'password' ? 'Enter password to continue' : 'Enter PIN to unlock')}
                            </Text>
                        </View>

                        {/* Input Field Area */}
                        <View style={styles.inputArea}>
                            {currentMethod === 'passcode' ? (
                                renderDots()
                            ) : (
                                <Animated.View style={{ width: '100%', transform: [{ translateX: shakeAnim }] }}>
                                    <View style={[styles.passwordInputContainer, { backgroundColor: colors.surface, borderColor: error ? '#ef4444' : colors.border }]}>
                                        <TextInput
                                            ref={passwordInputRef}
                                            style={[styles.passwordInput, { color: colors.text }]}
                                            placeholder="Enter Password"
                                            placeholderTextColor={colors.textSecondary}
                                            secureTextEntry={!showPassword}
                                            value={password}
                                            onChangeText={(t) => { setPassword(t); setError(''); }}
                                            autoCapitalize="none"
                                            returnKeyType="go"
                                            onSubmitEditing={handlePasswordVerify}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                            <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={22} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                </Animated.View>
                            )}
                        </View>
                    </View>

                    {/* 2. BOTTOM SECTION (Pushed up by Keyboard) */}
                    <View style={styles.bottomWrapper}>
                        {currentMethod === 'passcode' ? (
                            renderKeypad()
                        ) : (
                            <View style={styles.passwordActions}>
                                <TouchableOpacity
                                    style={[
                                        styles.unlockButton,
                                        { backgroundColor: password.length > 0 ? colors.accent : colors.border }
                                    ]}
                                    onPress={handlePasswordVerify}
                                    disabled={isLoading || password.length === 0}
                                >
                                    {isLoading ? (
                                        <MaterialCommunityIcons name="loading" size={24} color="#FFF" />
                                    ) : (
                                        <Text style={styles.unlockButtonText}>Unlock</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}

                        {authMethod === 'both' && (
                            <TouchableOpacity
                                style={styles.switchButton}
                                onPress={() => {
                                    setCurrentMethod(prev => prev === 'password' ? 'passcode' : 'password');
                                    setError('');
                                    setPassword('');
                                    setPasscode('');
                                }}
                            >
                                <Text style={[styles.switchText, { color: colors.accent }]}>
                                    {currentMethod === 'password' ? 'Use Passcode Instead' : 'Use Password Instead'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                </Animated.View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // Flex 1 + Space Between ensures items stick to top and bottom
    mainWrapper: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between', 
    },
    
    // --- Top Section ---
    staticContent: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: height * 0.08, 
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        minHeight: 22,
    },
    inputArea: {
        width: '100%',
        alignItems: 'center',
        minHeight: 80,
    },
    
    // --- Components ---
    dotsContainer: {
        flexDirection: 'row',
        gap: 24,
        marginTop: 20,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1.5,
    },
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 60,
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 16,
        width: '100%',
        marginTop: 10,
    },
    passwordInput: {
        flex: 1,
        fontSize: 17,
        fontWeight: '500',
        height: '100%',
    },
    eyeIcon: {
        padding: 8,
    },

    // --- Bottom Section ---
    bottomWrapper: {
        width: '100%',
        justifyContent: 'flex-end',
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === 'android' ? 24 : 10,
    },
    keypadContainer: {
        alignItems: 'center',
        gap: SPACING_Y,
        marginBottom: 20,
    },
    keypadRow: {
        flexDirection: 'row',
        gap: SPACING_X,
    },
    key: {
        width: KEY_SIZE,
        height: KEY_SIZE,
        borderRadius: KEY_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    keyText: {
        fontSize: 32,
        fontWeight: '400',
    },
    keyPlaceholder: {
        width: KEY_SIZE,
        height: KEY_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    passwordActions: {
        width: '100%',
        marginBottom: 10,
    },
    unlockButton: {
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    unlockButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    switchButton: {
        paddingVertical: 16,
        alignItems: 'center',
        width: '100%',
    },
    switchText: {
        fontSize: 14,
        fontWeight: '600',
    },
});