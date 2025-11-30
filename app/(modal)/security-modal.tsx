import { usePreferences } from '@/context/Preferences';
import { useTheme } from '@/context/Theme';
import { useToast } from '@/context/Toast';
import { hashPassword, validatePasswordStrength } from '@/lib/passwordUtils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    LayoutAnimation,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const KEY_SIZE = Math.min(width * 0.18, 75); 
const KEY_SPACING = 25;

type ModalType = 'selectAuth' | 'setupPassword' | 'setupPasscode' | null;

export default function SecurityModal() {
    const router = useRouter();
    const { isDark, colors } = useTheme();
    const toast = useToast();
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
    
    // --- PASSWORD STATE ---
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const confirmPasswordRef = useRef<TextInput>(null);

    // --- PASSCODE STATE ---
    const [passcodeStep, setPasscodeStep] = useState<'create' | 'confirm'>('create');
    const [newPasscode, setNewPasscode] = useState('');
    const [confirmPasscode, setConfirmPasscode] = useState('');
    const [selectedPasscodeLength, setSelectedPasscodeLength] = useState<4 | 6>(4);
    const [passcodeError, setPasscodeError] = useState('');

    // --- RESET HELPERS ---
    const resetStates = () => {
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
        setNewPasscode('');
        setConfirmPasscode('');
        setPasscodeStep('create');
        setPasscodeError('');
        setIsLoading(false);
    };

    // --- PASSWORD LOGIC ---
    const handlePasswordSetup = async () => {
        Keyboard.dismiss();
        if (!newPassword.trim()) return setPasswordError('Password cannot be empty');
        if (newPassword !== confirmPassword) return setPasswordError('Passwords do not match');
        
        const validation = validatePasswordStrength(newPassword);
        if (!validation.valid) return setPasswordError(validation.error || 'Invalid password');

        try {
            setIsLoading(true);
            const hash = await hashPassword(newPassword);
            await setPasswordHash(hash);
            
            // Auto-enable logic
            let newMethod: 'password' | 'passcode' | 'both' = 
                authMethod === 'passcode' || authMethod === 'both' ? 'both' : 'password';
            
            await setAuthMethod(newMethod);
            setActiveModal(null);
            resetStates();
            toast.success('Password enabled');
        } catch (error) {
            setPasswordError('Failed to save');
        } finally {
            setIsLoading(false);
        }
    };

    // --- PASSCODE LOGIC ---
    const handlePasscodeDigit = (num: string) => {
        if (isLoading) return;

        // Use requestAnimationFrame to ensure UI press finishes before logic runs
        requestAnimationFrame(() => {
            setPasscodeError('');

            if (passcodeStep === 'create') {
                if (newPasscode.length < selectedPasscodeLength) {
                    const next = newPasscode + num;
                    setNewPasscode(next);

                    // If filled, wait slightly then switch to confirm
                    if (next.length === selectedPasscodeLength) {
                        setTimeout(() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setPasscodeStep('confirm');
                        }, 200);
                    }
                }
            } else {
                // Confirm Step
                if (confirmPasscode.length < selectedPasscodeLength) {
                    setConfirmPasscode(prev => prev + num);
                }
            }
        });
    };

    const handleBackspace = () => {
        setPasscodeError('');
        if (passcodeStep === 'create') {
            setNewPasscode(prev => prev.slice(0, -1));
        } else {
            if (confirmPasscode.length > 0) {
                setConfirmPasscode(prev => prev.slice(0, -1));
            } else {
                // If empty in confirm step, go back to create step?
                // UX decision: Usually better to just stay or let user manually reset
                // But let's allow going back if they want to change the original
                setPasscodeStep('create');
            }
        }
    };

    const handlePasscodeSubmit = async () => {
        if (newPasscode !== confirmPasscode) {
            setPasscodeError('Passcodes do not match. Try again.');
            setConfirmPasscode('');
            // Shake animation could go here
            return;
        }

        try {
            setIsLoading(true);
            const hash = btoa(newPasscode); // Use stronger hash in prod
            await setPasscodeHash(hash);
            await setPasscodeLength(selectedPasscodeLength);

            let newMethod: 'password' | 'passcode' | 'both' = 
                authMethod === 'password' || authMethod === 'both' ? 'both' : 'passcode';
            
            await setAuthMethod(newMethod);
            setActiveModal(null);
            resetStates();
            toast.success('Passcode set successfully');
        } catch (e) {
            setPasscodeError('Error saving passcode');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisableProtection = (type: 'password' | 'passcode') => {
        Alert.alert(
            `Disable ${type === 'password' ? 'Password' : 'Passcode'}?`,
            'This will remove this security layer.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Disable',
                    style: 'destructive',
                    onPress: async () => {
                        if (type === 'password') {
                            await clearPasswordHash();
                            await setAuthMethod(authMethod === 'both' ? 'passcode' : 'none');
                        } else {
                            await clearPasscodeHash();
                            await setAuthMethod(authMethod === 'both' ? 'password' : 'none');
                        }
                        toast.success('Disabled successfully');
                    }
                }
            ]
        );
    };

    // --- RENDERERS ---

    const renderPasscodeKeypad = () => (
        <View style={styles.keypadContainer}>
            {[[1, 2, 3], [4, 5, 6], [7, 8, 9]].map((row, rIdx) => (
                <View key={rIdx} style={styles.keypadRow}>
                    {row.map((num) => (
                        <TouchableOpacity
                            key={num}
                            style={[
                                styles.key, 
                                { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)' }
                            ]}
                            onPress={() => handlePasscodeDigit(num.toString())}
                            activeOpacity={0.4} // Faster feedback
                        >
                            <Text style={[styles.keyText, { color: colors.text }]}>{num}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ))}
            
            {/* Bottom Row: [Action] [0] [Backspace] */}
            <View style={styles.keypadRow}>
                {/* Left Action Button (Checkmark) */}
                <View style={styles.keyPlaceholder}>
                    {passcodeStep === 'confirm' && confirmPasscode.length === selectedPasscodeLength && (
                        <TouchableOpacity 
                            style={[styles.key, { backgroundColor: colors.accent }]}
                            onPress={handlePasscodeSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <MaterialCommunityIcons name="loading" size={24} color="#FFF" />
                            ) : (
                                <MaterialCommunityIcons name="check" size={32} color="#FFF" />
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {/* Zero */}
                <TouchableOpacity
                    style={[
                        styles.key, 
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)' }
                    ]}
                    onPress={() => handlePasscodeDigit('0')}
                    activeOpacity={0.4}
                >
                    <Text style={[styles.keyText, { color: colors.text }]}>0</Text>
                </TouchableOpacity>

                {/* Backspace */}
                <TouchableOpacity
                    style={styles.keyPlaceholder}
                    onPress={handleBackspace}
                    onLongPress={() => {
                        setConfirmPasscode('');
                        if (passcodeStep === 'create') setNewPasscode('');
                    }}
                >
                    <MaterialCommunityIcons name="backspace-outline" size={28} color={colors.text} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            
            {/* Main Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Security</Text>
                <View style={styles.headerBtn} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Status Card */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.accent }]}>STATUS</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.statusRow}>
                            <View style={[styles.iconBox, { backgroundColor: authMethod !== 'none' ? colors.accent + '20' : colors.text + '10' }]}>
                                <MaterialCommunityIcons 
                                    name={authMethod === 'none' ? "shield-off-outline" : "shield-check"} 
                                    size={24} 
                                    color={authMethod !== 'none' ? colors.accent : colors.textSecondary} 
                                />
                            </View>
                            <View style={{flex: 1}}>
                                <Text style={[styles.cardTitle, { color: colors.text }]}>
                                    {authMethod === 'none' ? 'Unprotected' : 'Protected'}
                                </Text>
                                <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                                    {authMethod === 'both' ? 'Password & Passcode Active' : 
                                     authMethod === 'password' ? 'Password Active' :
                                     authMethod === 'passcode' ? 'Passcode Active' :
                                     'No security enabled'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Configuration */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.accent }]}>CONFIGURATION</Text>
                    
                    <TouchableOpacity 
                        style={[styles.optionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => {
                            if(passwordHash) handleDisableProtection('password');
                            else { resetStates(); setActiveModal('setupPassword'); }
                        }}
                    >
                        <View style={styles.optionLeft}>
                            <MaterialCommunityIcons name="form-textbox-password" size={22} color={colors.text} />
                            <Text style={[styles.optionText, { color: colors.text }]}>Password</Text>
                        </View>
                        <View style={styles.optionRight}>
                            <Text style={[styles.statusText, { color: passwordHash ? colors.accent : colors.textSecondary }]}>
                                {passwordHash ? 'Enabled' : 'Off'}
                            </Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.optionCard, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 12 }]}
                        onPress={() => {
                            if(passcodeHash) handleDisableProtection('passcode');
                            else { resetStates(); setSelectedPasscodeLength(4); setActiveModal('setupPasscode'); }
                        }}
                    >
                        <View style={styles.optionLeft}>
                            <MaterialCommunityIcons name="numeric" size={22} color={colors.text} />
                            <Text style={[styles.optionText, { color: colors.text }]}>Passcode</Text>
                        </View>
                        <View style={styles.optionRight}>
                            <Text style={[styles.statusText, { color: passcodeHash ? colors.accent : colors.textSecondary }]}>
                                {passcodeHash ? 'Enabled' : 'Off'}
                            </Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* --- PASSWORD MODAL (Keyboard Aware) --- */}
            {activeModal === 'setupPassword' && (
                <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)' }]}>
                    <KeyboardAvoidingView 
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.keyboardView}
                    >
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View style={styles.modalCenterWrapper}>
                                <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
                                    <View style={styles.modalHeader}>
                                        <Text style={[styles.modalTitle, { color: colors.text }]}>Set Password</Text>
                                        <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                                            <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>

                                    <ScrollView bounces={false} contentContainerStyle={{padding: 20}}>
                                        <View style={styles.inputGroup}>
                                            <Text style={[styles.label, { color: colors.text }]}>New Password</Text>
                                            <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                                <TextInput
                                                    style={[styles.input, { color: colors.text }]}
                                                    placeholder="Enter new password"
                                                    placeholderTextColor={colors.textSecondary}
                                                    secureTextEntry={!showPassword}
                                                    value={newPassword}
                                                    onChangeText={setNewPassword}
                                                    autoCapitalize="none"
                                                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                                                />
                                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                                                    <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
                                            <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                                <TextInput
                                                    ref={confirmPasswordRef}
                                                    style={[styles.input, { color: colors.text }]}
                                                    placeholder="Repeat password"
                                                    placeholderTextColor={colors.textSecondary}
                                                    secureTextEntry={!showConfirmPassword}
                                                    value={confirmPassword}
                                                    onChangeText={setConfirmPassword}
                                                    autoCapitalize="none"
                                                    onSubmitEditing={handlePasswordSetup}
                                                />
                                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                                                    <MaterialCommunityIcons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        {/* Requirements */}
                                        <View style={styles.reqList}>
                                            <View style={styles.reqItem}>
                                                <MaterialCommunityIcons name={newPassword.length >= 6 ? "check-circle" : "circle-outline"} size={14} color={newPassword.length >= 6 ? "#10b981" : colors.textSecondary} />
                                                <Text style={[styles.reqText, { color: colors.textSecondary }]}>6+ chars</Text>
                                            </View>
                                            <View style={styles.reqItem}>
                                                <MaterialCommunityIcons name={/[0-9]/.test(newPassword) ? "check-circle" : "circle-outline"} size={14} color={/[0-9]/.test(newPassword) ? "#10b981" : colors.textSecondary} />
                                                <Text style={[styles.reqText, { color: colors.textSecondary }]}>Number</Text>
                                            </View>
                                        </View>

                                        {passwordError ? (
                                            <View style={styles.errorBanner}>
                                                <Text style={styles.errorBannerText}>{passwordError}</Text>
                                            </View>
                                        ) : null}

                                        <TouchableOpacity 
                                            style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
                                            onPress={handlePasswordSetup}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? <MaterialCommunityIcons name="loading" size={20} color="#FFF" /> : <Text style={styles.primaryBtnText}>Save Password</Text>}
                                        </TouchableOpacity>
                                    </ScrollView>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                </View>
            )}

            {/* --- PASSCODE MODAL (Clean, Fast, Non-Overlapping) --- */}
            {activeModal === 'setupPasscode' && (
                <View style={[styles.modalOverlay, { backgroundColor: colors.background }]}>
                    <SafeAreaView style={styles.fullScreenModal}>
                        
                        {/* 1. Header with Close and Length Switch */}
                        <View style={styles.fsHeader}>
                            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.fsCloseBtn}>
                                <MaterialCommunityIcons name="close" size={28} color={colors.text} />
                            </TouchableOpacity>
                            <View style={styles.lengthToggle}>
                                {[4, 6].map(len => (
                                    <TouchableOpacity 
                                        key={len} 
                                        onPress={() => {
                                            if (passcodeStep === 'create') {
                                                setSelectedPasscodeLength(len as 4|6);
                                                setNewPasscode('');
                                            }
                                        }}
                                        disabled={passcodeStep !== 'create'}
                                        style={[styles.lenBtn, selectedPasscodeLength === len && { backgroundColor: colors.accent }]}
                                    >
                                        <Text style={[styles.lenText, { color: selectedPasscodeLength === len ? '#FFF' : colors.text, opacity: passcodeStep === 'create' ? 1 : 0.5 }]}>{len} Digits</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* 2. Visual Display (Dots) */}
                        <View style={styles.fsContent}>
                            <Text style={[styles.fsTitle, { color: colors.text }]}>
                                {passcodeStep === 'create' ? 'Create Passcode' : 'Confirm Passcode'}
                            </Text>
                            <Text style={[styles.fsSubtitle, { color: passcodeError ? '#ef4444' : colors.textSecondary }]}>
                                {passcodeError || (passcodeStep === 'create' ? 'Enter a new PIN' : 'Re-enter to verify')}
                            </Text>

                            <View style={styles.dotsRow}>
                                {Array.from({ length: selectedPasscodeLength }).map((_, i) => {
                                    // Determine which code to show based on step
                                    const activeCode = passcodeStep === 'create' ? newPasscode : confirmPasscode;
                                    const isFilled = i < activeCode.length;
                                    return (
                                        <View 
                                            key={i} 
                                            style={[
                                                styles.dot, 
                                                { 
                                                    borderColor: passcodeError ? '#ef4444' : colors.text,
                                                    backgroundColor: isFilled ? (passcodeError ? '#ef4444' : colors.text) : 'transparent' 
                                                }
                                            ]} 
                                        />
                                    );
                                })}
                            </View>
                        </View>

                        {/* 3. Keypad (Tick Mark Embedded in Grid) */}
                        <View style={styles.fsBottom}>
                            {renderPasscodeKeypad()}
                        </View>
                    </SafeAreaView>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
    headerBtn: { width: 40, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    content: { flex: 1, padding: 20 },
    
    // Status Section
    section: { marginBottom: 32 },
    sectionHeader: { fontSize: 13, fontWeight: '700', marginBottom: 12, letterSpacing: 0.8 },
    card: { borderRadius: 16, borderWidth: 1, padding: 16 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    cardDesc: { fontSize: 13 },
    
    // Options
    optionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, borderWidth: 1 },
    optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    optionText: { fontSize: 16, fontWeight: '500' },
    optionRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statusText: { fontSize: 14, fontWeight: '600' },

    // Password Modal
    modalOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
    keyboardView: { flex: 1, justifyContent: 'center' },
    modalCenterWrapper: { flex: 1, justifyContent: 'center', padding: 20 },
    modalCard: { borderRadius: 24, maxHeight: '80%', shadowColor: "#000", shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5, overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    closeBtn: { padding: 4 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    inputBox: { flexDirection: 'row', alignItems: 'center', height: 54, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
    input: { flex: 1, height: '100%', fontSize: 16 },
    eyeBtn: { padding: 8 },
    reqList: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    reqItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    reqText: { fontSize: 12 },
    errorBanner: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, marginBottom: 16 },
    errorBannerText: { color: '#ef4444', fontSize: 13, fontWeight: '500', textAlign: 'center' },
    primaryBtn: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

    // Passcode Fullscreen
    fullScreenModal: { flex: 1 },
    fsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    fsCloseBtn: { padding: 8 },
    lengthToggle: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 20, padding: 4 },
    lenBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16 },
    lenText: { fontSize: 12, fontWeight: '600' },
    
    fsContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 20 },
    fsTitle: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
    fsSubtitle: { fontSize: 15 },
    dotsRow: { flexDirection: 'row', gap: 20, marginTop: 30, height: 20, alignItems: 'center' },
    dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 },
    
    fsBottom: { paddingBottom: 20, alignItems: 'center' },
    keypadContainer: { gap: KEY_SPACING },
    keypadRow: { flexDirection: 'row', gap: 30 },
    key: { width: KEY_SIZE, height: KEY_SIZE, borderRadius: KEY_SIZE/2, alignItems: 'center', justifyContent: 'center' },
    keyText: { fontSize: 30, fontWeight: '400' },
    keyPlaceholder: { width: KEY_SIZE, height: KEY_SIZE, alignItems: 'center', justifyContent: 'center' },
});