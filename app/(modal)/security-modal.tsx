import { usePreferences } from '@/context/Preferences';
import { useTheme } from '@/context/Theme';
import { hashPassword, validatePasswordStrength } from '@/lib/passwordUtils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ModalType = 'selectAuth' | 'setupPassword' | 'setupPasscode' | null;

export default function SecurityModal() {
    const router = useRouter();
    const { isDark, colors } = useTheme();
    const {
        authMethod,
        setAuthMethod,
        passwordHash,
        setPasswordHash,
        clearPasswordHash,
        passcodeHash,
        setPasscodeHash,
        clearPasscodeHash,
        passcodeLength,
        setPasscodeLength,
    } = usePreferences();

    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [newPasscode, setNewPasscode] = useState('');
    const [confirmPasscode, setConfirmPasscode] = useState('');
    const [selectedPasscodeLength, setSelectedPasscodeLength] = useState<4 | 6>(passcodeLength);
    const [passcodeError, setPasscodeError] = useState('');

    const handleAuthMethodChange = (newMethod: 'password' | 'passcode' | 'both' | 'none') => {
        if (newMethod === 'none') {
            Alert.alert(
                'Disable All Security',
                'Are you sure you want to disable all security protection?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Disable',
                        onPress: async () => {
                            try {
                                await clearPasswordHash();
                                await clearPasscodeHash();
                                await setAuthMethod('none');
                            } catch (error) {
                                Alert.alert('Error', 'Failed to disable security');
                            }
                        },
                        style: 'destructive',
                    },
                ]
            );
        } else {
            setActiveModal('selectAuth');
        }
    };

    const handlePasswordSetup = async () => {
        if (!newPassword.trim()) {
            setPasswordError('Password cannot be empty');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        const validation = validatePasswordStrength(newPassword);
        if (!validation.valid) {
            setPasswordError(validation.error || 'Invalid password');
            return;
        }

        try {
            setIsLoading(true);
            const hash = await hashPassword(newPassword);
            await setPasswordHash(hash);

            if (selectedPasscodeLength !== passcodeLength) {
                await setPasscodeLength(selectedPasscodeLength);
            }

            let newAuthMethod: 'password' | 'passcode' | 'both' =
                authMethod === 'passcode' || authMethod === 'both' ? 'both' : 'password';
            await setAuthMethod(newAuthMethod);

            setActiveModal(null);
            setNewPassword('');
            setConfirmPassword('');
            setPasswordError('');

            Alert.alert('Success', 'Password protection enabled successfully!');
        } catch (error) {
            console.error('Error setting password:', error);
            setPasswordError('An error occurred while setting up the password');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasscodeSetup = async () => {
        if (!newPasscode.trim() || newPasscode.length < selectedPasscodeLength) {
            setPasscodeError(`Passcode must be ${selectedPasscodeLength} digits`);
            return;
        }

        if (newPasscode !== confirmPasscode) {
            setPasscodeError('Passcodes do not match');
            return;
        }

        if (!/^\d+$/.test(newPasscode)) {
            setPasscodeError('Passcode must contain only digits');
            return;
        }

        try {
            setIsLoading(true);
            const hash = btoa(newPasscode);
            await setPasscodeHash(hash);
            await setPasscodeLength(selectedPasscodeLength);

            let newAuthMethod: 'password' | 'passcode' | 'both' =
                authMethod === 'password' || authMethod === 'both' ? 'both' : 'passcode';
            await setAuthMethod(newAuthMethod);

            setActiveModal(null);
            setNewPasscode('');
            setConfirmPasscode('');
            setPasscodeError('');

            Alert.alert('Success', `${selectedPasscodeLength}-digit passcode set successfully!`);
        } catch (error) {
            console.error('Error setting passcode:', error);
            setPasscodeError('An error occurred while setting up the passcode');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisablePassword = () => {
        Alert.alert(
            'Disable Password Protection',
            'Remove password protection from app startup?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Disable',
                    onPress: async () => {
                        try {
                            await clearPasswordHash();
                            const newMethod =
                                authMethod === 'both' ? 'passcode' : 'none';
                            await setAuthMethod(newMethod);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to disable password');
                        }
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    const handleDisablePasscode = () => {
        Alert.alert(
            'Disable Passcode Protection',
            'Remove passcode protection from app startup?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Disable',
                    onPress: async () => {
                        try {
                            await clearPasscodeHash();
                            const newMethod =
                                authMethod === 'both' ? 'password' : 'none';
                            await setAuthMethod(newMethod);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to disable passcode');
                        }
                    },
                    style: 'destructive',
                },
            ]
        );
    };


    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <MaterialCommunityIcons
                            name="chevron-left"
                            size={28}
                            color={colors.text}
                        />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        Security & Privacy
                    </Text>
                    <View style={{ width: 28 }} />
                </View>

                {/* Content */}
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Authentication Method */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.accent }]}>
                            App Protection
                        </Text>

                        {/* Current Method Status */}
                        {(authMethod !== 'none' || passwordHash || passcodeHash) && (
                            <View style={[styles.activeMethod, { backgroundColor: colors.surface, borderColor: colors.accent, borderWidth: 2 }]}>
                                <MaterialCommunityIcons
                                    name="check-circle"
                                    size={20}
                                    color={colors.accent}
                                />
                                <Text style={[styles.activeMethodText, { color: colors.accent, marginLeft: 8 }]}>
                                    {passwordHash && passcodeHash
                                        ? `Both Password & ${passcodeLength}-Digit Passcode Active`
                                        : passwordHash
                                        ? 'Password Protection Active'
                                        : passcodeHash
                                        ? `${passcodeLength}-Digit Passcode Active`
                                        : authMethod === 'both'
                                        ? 'Both Methods Active'
                                        : authMethod === 'password'
                                        ? 'Password Protection Active'
                                        : authMethod === 'passcode'
                                        ? `${passcodeLength}-Digit Passcode Active`
                                        : 'Protection Active'}
                                </Text>
                            </View>
                        )}

                        {(authMethod === 'none' && !passwordHash && !passcodeHash) && (
                            <Text style={[styles.noSecurityText, { color: colors.textSecondary }]}>
                                No security protection is currently enabled.
                            </Text>
                        )}
                    </View>

                    {/* Manage Protection */}
                    {(authMethod !== 'none' || passwordHash || passcodeHash) && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.accent }]}>
                                Manage Protection
                            </Text>

                            {(authMethod === 'password' || authMethod === 'both' || passwordHash) && passwordHash && (
                                <TouchableOpacity
                                    style={[styles.settingButton, { backgroundColor: colors.surface }]}
                                    onPress={handleDisablePassword}
                                >
                                    <MaterialCommunityIcons
                                        name="lock-remove"
                                        size={18}
                                        color="#ef4444"
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text style={[styles.settingButtonText, { color: '#ef4444' }]}>
                                        Disable Password Protection
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {(authMethod === 'passcode' || authMethod === 'both' || passcodeHash) && passcodeHash && (
                                <TouchableOpacity
                                    style={[
                                        styles.settingButton,
                                        { backgroundColor: colors.surface, marginTop: (authMethod === 'both' || (passwordHash && passcodeHash)) ? 12 : 0 },
                                    ]}
                                    onPress={handleDisablePasscode}
                                >
                                    <MaterialCommunityIcons
                                        name="numeric-off"
                                        size={18}
                                        color="#ef4444"
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text style={[styles.settingButtonText, { color: '#ef4444' }]}>
                                        Disable Passcode Protection
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* Add Protection */}
                    {((authMethod === 'none' && !passwordHash && !passcodeHash) || (authMethod === 'password' && !passcodeHash && !passcodeHash) || (authMethod === 'passcode' && !passwordHash && !passwordHash) || !passwordHash || !passcodeHash) && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.accent }]}>
                                Add Protection
                            </Text>

                            {!passwordHash && (
                                <TouchableOpacity
                                    style={[styles.primaryButton, { backgroundColor: colors.accent }]}
                                    onPress={() => {
                                        setNewPassword('');
                                        setConfirmPassword('');
                                        setPasswordError('');
                                        setActiveModal('setupPassword');
                                    }}
                                >
                                    <MaterialCommunityIcons
                                        name="lock-plus"
                                        size={20}
                                        color="white"
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text style={styles.primaryButtonText}>
                                        Set Password
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {!passcodeHash && (
                                <TouchableOpacity
                                    style={[
                                        styles.primaryButton,
                                        {
                                            backgroundColor: colors.accent,
                                            marginTop: !passwordHash ? 12 : 0,
                                        },
                                    ]}
                                    onPress={() => {
                                        setNewPasscode('');
                                        setConfirmPasscode('');
                                        setPasscodeError('');
                                        setSelectedPasscodeLength(4);
                                        setActiveModal('setupPasscode');
                                    }}
                                >
                                    <MaterialCommunityIcons
                                        name="numeric"
                                        size={20}
                                        color="white"
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text style={styles.primaryButtonText}>
                                        Set Passcode
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* Privacy Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.accent }]}>
                            Privacy
                        </Text>

                        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
                            <View style={styles.settingContent}>
                                <View style={styles.settingLabel}>
                                    <MaterialCommunityIcons
                                        name="shield-check-outline"
                                        size={24}
                                        color={colors.accent}
                                        style={styles.settingIcon}
                                    />
                                    <View>
                                        <Text style={[styles.settingName, { color: colors.text }]}>
                                            Data Privacy
                                        </Text>
                                        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                                            All data is stored locally on your device
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>

            {/* Setup Password Modal */}
            {activeModal === 'setupPassword' && (
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            Set Up Password
                        </Text>

                        <View style={[styles.requirementsBox, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.requirementsTitle, { color: colors.text }]}>
                                Requirements:
                            </Text>
                            <View style={styles.requirementItem}>
                                <MaterialCommunityIcons
                                    name={newPassword.length >= 6 ? 'check-circle' : 'circle-outline'}
                                    size={18}
                                    color={newPassword.length >= 6 ? '#10b981' : colors.textSecondary}
                                />
                                <Text style={[styles.requirementText, { color: colors.textSecondary, marginLeft: 8 }]}>
                                    At least 6 characters
                                </Text>
                            </View>
                            <View style={styles.requirementItem}>
                                <MaterialCommunityIcons
                                    name={/[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 'check-circle' : 'circle-outline'}
                                    size={18}
                                    color={/[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? '#10b981' : colors.textSecondary}
                                />
                                <Text style={[styles.requirementText, { color: colors.textSecondary, marginLeft: 8 }]}>
                                    Mix of letters and numbers
                                </Text>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.text }]}>
                                New Password
                            </Text>
                            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Enter password"
                                    placeholderTextColor={colors.textSecondary}
                                    secureTextEntry={!showPassword}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    editable={!isLoading}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <MaterialCommunityIcons
                                        name={showPassword ? 'eye-off' : 'eye'}
                                        size={20}
                                        color={colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.text }]}>
                                Confirm Password
                            </Text>
                            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Confirm password"
                                    placeholderTextColor={colors.textSecondary}
                                    secureTextEntry={!showConfirmPassword}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    editable={!isLoading}
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <MaterialCommunityIcons
                                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                                        size={20}
                                        color={colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {passwordError && (
                            <View style={[styles.errorBox, { backgroundColor: '#fee2e2' }]}>
                                <MaterialCommunityIcons name="alert-circle" size={16} color="#dc2626" />
                                <Text style={[styles.errorText, { color: '#dc2626', marginLeft: 8 }]}>
                                    {passwordError}
                                </Text>
                            </View>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.surface }]}
                                onPress={() => {
                                    setActiveModal(null);
                                    setNewPassword('');
                                    setConfirmPassword('');
                                    setPasswordError('');
                                }}
                                disabled={isLoading}
                            >
                                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.accent }]}
                                onPress={handlePasswordSetup}
                                disabled={isLoading}
                            >
                                <Text style={[styles.modalButtonText, { color: 'white' }]}>
                                    {isLoading ? 'Setting...' : 'Enable Password'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Setup Passcode Modal */}
            {activeModal === 'setupPasscode' && (
                <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        {/* Header */}
                        <View style={styles.passcodeModalHeader}>
                            <MaterialCommunityIcons name="numeric-4-box" size={32} color={colors.accent} />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>
                                    Set Up Passcode
                                </Text>
                                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                                    Add a PIN for quick access
                                </Text>
                            </View>
                        </View>

                        {/* Passcode Length Selector */}
                        <View style={[styles.lengthSelectorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <View style={styles.lengthSelectorHeader}>
                                <MaterialCommunityIcons name="information-outline" size={18} color={colors.accent} />
                                <Text style={[styles.lengthLabel, { color: colors.text, marginLeft: 8 }]}>
                                    Passcode Length
                                </Text>
                            </View>
                            <View style={styles.lengthButtons}>
                                {[4, 6].map((len) => (
                                    <TouchableOpacity
                                        key={len}
                                        style={[
                                            styles.lengthButton,
                                            {
                                                backgroundColor:
                                                    selectedPasscodeLength === len
                                                        ? colors.accent
                                                        : colors.background,
                                                borderColor: selectedPasscodeLength === len ? colors.accent : colors.border,
                                            },
                                        ]}
                                        onPress={() => setSelectedPasscodeLength(len as 4 | 6)}
                                    >
                                        <MaterialCommunityIcons 
                                            name={len === 4 ? "numeric-4" : "numeric-6"} 
                                            size={20} 
                                            color={selectedPasscodeLength === len ? 'white' : colors.accent}
                                        />
                                        <Text
                                            style={[
                                                styles.lengthButtonText,
                                                {
                                                    color:
                                                        selectedPasscodeLength === len
                                                            ? 'white'
                                                            : colors.text,
                                                    marginTop: 4,
                                                },
                                            ]}
                                        >
                                            {len} Digits
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Passcode Display - Step 1: New Passcode */}
                        {!confirmPasscode.length && (
                            <>
                                <View style={styles.passcodeStepContainer}>
                                    <Text style={[styles.passcodeStepLabel, { color: colors.textSecondary }]}>
                                        Enter New Passcode
                                    </Text>
                                    <View style={[styles.passcodeDisplay, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                        <View style={styles.passcodeDotsContainer}>
                                            {Array.from({ length: selectedPasscodeLength }).map((_, i) => (
                                                <View
                                                    key={i}
                                                    style={[
                                                        styles.passcodeDigitDot,
                                                        {
                                                            backgroundColor: i < newPasscode.length ? colors.accent : colors.border,
                                                        },
                                                    ]}
                                                />
                                            ))}
                                        </View>
                                        <Text style={[styles.passcodeCounter, { color: colors.textSecondary }]}>
                                            {newPasscode.length}/{selectedPasscodeLength}
                                        </Text>
                                    </View>
                                </View>

                                {/* Numeric Keypad */}
                                <View style={styles.numpadContainer}>
                                    {/* Row 1: 1 2 3 */}
                                    <View style={styles.numpadRow}>
                                        {[1, 2, 3].map((num) => (
                                            <TouchableOpacity
                                                key={num}
                                                style={[styles.numpadButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                                onPress={() => {
                                                    if (newPasscode.length < selectedPasscodeLength) {
                                                        setNewPasscode(newPasscode + num);
                                                    }
                                                }}
                                                disabled={isLoading}
                                            >
                                                <Text style={[styles.numpadText, { color: colors.text }]}>{num}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Row 2: 4 5 6 */}
                                    <View style={styles.numpadRow}>
                                        {[4, 5, 6].map((num) => (
                                            <TouchableOpacity
                                                key={num}
                                                style={[styles.numpadButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                                onPress={() => {
                                                    if (newPasscode.length < selectedPasscodeLength) {
                                                        setNewPasscode(newPasscode + num);
                                                    }
                                                }}
                                                disabled={isLoading}
                                            >
                                                <Text style={[styles.numpadText, { color: colors.text }]}>{num}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Row 3: 7 8 9 */}
                                    <View style={styles.numpadRow}>
                                        {[7, 8, 9].map((num) => (
                                            <TouchableOpacity
                                                key={num}
                                                style={[styles.numpadButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                                onPress={() => {
                                                    if (newPasscode.length < selectedPasscodeLength) {
                                                        setNewPasscode(newPasscode + num);
                                                    }
                                                }}
                                                disabled={isLoading}
                                            >
                                                <Text style={[styles.numpadText, { color: colors.text }]}>{num}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Row 4: Empty, 0, and Backspace */}
                                    <View style={styles.numpadRow}>
                                        <View style={styles.numpadButtonEmpty} />
                                        <TouchableOpacity
                                            style={[styles.numpadButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                            onPress={() => {
                                                if (newPasscode.length < selectedPasscodeLength) {
                                                    setNewPasscode(newPasscode + '0');
                                                }
                                            }}
                                            disabled={isLoading}
                                        >
                                            <Text style={[styles.numpadText, { color: colors.text }]}>0</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.numpadButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                            onPress={() => {
                                                setNewPasscode(newPasscode.slice(0, -1));
                                            }}
                                            disabled={isLoading}
                                        >
                                            <MaterialCommunityIcons name="backspace" size={22} color={colors.text} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        )}

                        {/* Passcode Display - Step 2: Confirm Passcode */}
                        {confirmPasscode.length >= 0 && newPasscode.length === selectedPasscodeLength && (
                            <>
                                <View style={styles.passcodeStepContainer}>
                                    <Text style={[styles.passcodeStepLabel, { color: colors.textSecondary }]}>
                                        Confirm Passcode
                                    </Text>
                                    <View style={[styles.passcodeDisplay, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                        <View style={styles.passcodeDotsContainer}>
                                            {Array.from({ length: selectedPasscodeLength }).map((_, i) => (
                                                <View
                                                    key={i}
                                                    style={[
                                                        styles.passcodeDigitDot,
                                                        {
                                                            backgroundColor: i < confirmPasscode.length ? colors.accent : colors.border,
                                                        },
                                                    ]}
                                                />
                                            ))}
                                        </View>
                                        <Text style={[styles.passcodeCounter, { color: colors.textSecondary }]}>
                                            {confirmPasscode.length}/{selectedPasscodeLength}
                                        </Text>
                                    </View>
                                </View>

                                {/* Numeric Keypad */}
                                <View style={styles.numpadContainer}>
                                    {/* Row 1: 1 2 3 */}
                                    <View style={styles.numpadRow}>
                                        {[1, 2, 3].map((num) => (
                                            <TouchableOpacity
                                                key={num}
                                                style={[styles.numpadButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                                onPress={() => {
                                                    if (confirmPasscode.length < selectedPasscodeLength) {
                                                        setConfirmPasscode(confirmPasscode + num);
                                                    }
                                                }}
                                                disabled={isLoading}
                                            >
                                                <Text style={[styles.numpadText, { color: colors.text }]}>{num}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Row 2: 4 5 6 */}
                                    <View style={styles.numpadRow}>
                                        {[4, 5, 6].map((num) => (
                                            <TouchableOpacity
                                                key={num}
                                                style={[styles.numpadButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                                onPress={() => {
                                                    if (confirmPasscode.length < selectedPasscodeLength) {
                                                        setConfirmPasscode(confirmPasscode + num);
                                                    }
                                                }}
                                                disabled={isLoading}
                                            >
                                                <Text style={[styles.numpadText, { color: colors.text }]}>{num}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Row 3: 7 8 9 */}
                                    <View style={styles.numpadRow}>
                                        {[7, 8, 9].map((num) => (
                                            <TouchableOpacity
                                                key={num}
                                                style={[styles.numpadButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                                onPress={() => {
                                                    if (confirmPasscode.length < selectedPasscodeLength) {
                                                        setConfirmPasscode(confirmPasscode + num);
                                                    }
                                                }}
                                                disabled={isLoading}
                                            >
                                                <Text style={[styles.numpadText, { color: colors.text }]}>{num}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Row 4: Empty, 0, and Backspace */}
                                    <View style={styles.numpadRow}>
                                        <View style={styles.numpadButtonEmpty} />
                                        <TouchableOpacity
                                            style={[styles.numpadButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                            onPress={() => {
                                                if (confirmPasscode.length < selectedPasscodeLength) {
                                                    setConfirmPasscode(confirmPasscode + '0');
                                                }
                                            }}
                                            disabled={isLoading}
                                        >
                                            <Text style={[styles.numpadText, { color: colors.text }]}>0</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.numpadButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                            onPress={() => {
                                                setConfirmPasscode(confirmPasscode.slice(0, -1));
                                            }}
                                            disabled={isLoading}
                                        >
                                            <MaterialCommunityIcons name="backspace" size={22} color={colors.text} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        )}

                        {/* Error Message */}
                        {passcodeError && (
                            <View style={[styles.errorBox, { backgroundColor: isDark ? 'rgba(220, 38, 38, 0.15)' : '#fee2e2', borderColor: '#dc2626' }]}>
                                <MaterialCommunityIcons name="alert-circle" size={18} color="#dc2626" />
                                <Text style={[styles.errorText, { color: '#dc2626', marginLeft: 10 }]}>
                                    {passcodeError}
                                </Text>
                            </View>
                        )}

                        {/* Buttons */}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    styles.cancelButton,
                                    { backgroundColor: colors.surface, borderColor: colors.border }
                                ]}
                                onPress={() => {
                                    setActiveModal(null);
                                    setNewPasscode('');
                                    setConfirmPasscode('');
                                    setPasscodeError('');
                                }}
                                disabled={isLoading}
                            >
                                <MaterialCommunityIcons name="close" size={20} color={colors.text} />
                                <Text style={[styles.modalButtonText, { color: colors.text, marginLeft: 8 }]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    styles.confirmButton,
                                    { backgroundColor: colors.accent, opacity: isLoading ? 0.6 : 1 }
                                ]}
                                onPress={handlePasscodeSetup}
                                disabled={isLoading}
                            >
                                <MaterialCommunityIcons 
                                    name={isLoading ? "loading" : "check"} 
                                    size={20} 
                                    color="white" 
                                />
                                <Text style={[styles.modalButtonText, { color: 'white', marginLeft: 8 }]}>
                                    {isLoading ? 'Setting...' : 'Enable Passcode'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        marginLeft: 4,
    },
    settingRow: {
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    settingContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    settingLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingIcon: {
        marginRight: 12,
    },
    settingName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 13,
        marginTop: 4,
    },
    activeMethod: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    activeMethodText: {
        fontSize: 13,
        fontWeight: '600',
    },
    noSecurityText: {
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 12,
    },
    settingButton: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    settingButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    primaryButton: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        width: '90%',
        borderRadius: 12,
        padding: 20,
        maxHeight: '90%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    requirementsBox: {
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    requirementsTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    requirementText: {
        fontSize: 13,
    },
    inputGroup: {
        marginBottom: 12,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        marginTop: 4,
    },
    errorText: {
        fontSize: 13,
        fontWeight: '500',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    lengthSelector: {
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    lengthLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    lengthButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    lengthButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    lengthButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
    // New Passcode Modal Styles
    passcodeModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    lengthSelectorCard: {
        borderRadius: 12,
        padding: 14,
        marginBottom: 18,
        borderWidth: 1,
    },
    lengthSelectorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    passcodeInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    passcodeInput: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 4,
        paddingVertical: 4,
    },
    inputCounter: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 8,
    },
    inputLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    cancelButton: {
        flexDirection: 'row',
        borderWidth: 1,
    },
    confirmButton: {
        flexDirection: 'row',
    },
    // Numeric Keypad Styles
    numpadContainer: {
        gap: 10,
        marginTop: 20,
    },
    numpadRow: {
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center',
    },
    numpadButton: {
        flex: 1,
        maxWidth: '30%',
        aspectRatio: 1,
        borderRadius: 10,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    numpadButtonEmpty: {
        flex: 1,
        maxWidth: '30%',
    },
    numpadText: {
        fontSize: 22,
        fontWeight: '700',
    },
    // Passcode Display Styles
    passcodeStepContainer: {
        marginBottom: 20,
    },
    passcodeStepLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        textAlign: 'center',
    },
    passcodeDisplay: {
        borderWidth: 1.5,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    passcodeDotsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    passcodeDigitDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    passcodeCounter: {
        fontSize: 13,
        fontWeight: '600',
    },
});
