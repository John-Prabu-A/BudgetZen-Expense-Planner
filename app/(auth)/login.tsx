import { AnimatedButton } from '@/components/AnimatedButton';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/context/Theme';
import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// Tells Supabase Auth to continuously refresh the session automatically
AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function Auth() {
  const { isDark, colors } = useTheme();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(30);

  useEffect(() => {
    // Listen for keyboard events
    const showListener = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow',
      () => {
        setKeyboardVisible(true);
      }
    );

    const hideListener = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  useEffect(() => {
    // Header animation
    headerOpacity.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });

    // Form animation with delay
    formOpacity.value = withTiming(1, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });

    formTranslateY.value = withTiming(0, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  async function sendOtp() {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
    });

    if (error) {
      Alert.alert('Error Sending Code', error.message);
    } else {
      setOtpSent(true);
    }
    setLoading(false);
  }

  async function verifyOtp() {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: 'email',
    });

    if (error) {
      Alert.alert('Verification Error', error.message);
      setLoading(false);
    }
    // On success, the session state updates and _layout.tsx will navigate to main app
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            keyboardVisible && styles.scrollContentKeyboardOpen,
          ]}
          bounces={false}
          scrollEnabled={keyboardVisible}
          onScrollBeginDrag={() => Keyboard.dismiss()}
        >
        {/* Header Section */}
        <Animated.View style={[styles.headerSection, headerAnimatedStyle]}>
          <View
            style={[
              styles.logoContainer,
              { backgroundColor: colors.accent + '15' },
            ]}
          >
            <MaterialCommunityIcons
              name="wallet"
              size={48}
              color={colors.accent}
            />
          </View>

          <Text
            style={[
              styles.title,
              { color: colors.text },
            ]}
          >
            BudgetZen
          </Text>

          <Text
            style={[
              styles.subtitle,
              { color: colors.textSecondary },
            ]}
          >
            {otpSent
              ? 'Enter the 6-digit code sent to your email'
              : 'Sign in instantly with a secure code sent to your email.'}
          </Text>
        </Animated.View>

        {/* Form Section */}
        <Animated.View style={[styles.formSection, formAnimatedStyle]}>
          {!otpSent ? (
            /* Email Input */
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Email Address</Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="email-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <Input
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[styles.input, {color: colors.text}]}
                  placeholderTextColor={colors.inputPlaceholder}
                />
              </View>
            </View>
          ) : (
            /* OTP Input */
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Security Code</Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="lock-check-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <Input
                  placeholder="123456"
                  value={otp}
                  onChangeText={setOtp}
                  editable={!loading}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[styles.input, {color: colors.text}]}
                  placeholderTextColor={colors.inputPlaceholder}
                />
              </View>
            </View>
          )}

          {/* Primary Action Button */}
          <AnimatedButton
            onPress={otpSent ? verifyOtp : sendOtp}
            disabled={loading}
            style={{
              marginTop: 20,
              marginBottom: 12,
            }}
          >
            <View
              style={[
                styles.primaryButton,
                {
                  backgroundColor: colors.accent,
                  opacity: loading ? 0.7 : 1,
                },
              ]}
            >
              {loading ? (
                <MaterialCommunityIcons
                  name="loading"
                  size={20}
                  color={colors.textOnAccent}
                  style={{ marginRight: 8 }}
                />
              ) : (
                <MaterialCommunityIcons
                  name={otpSent ? 'check-circle-outline' : 'email-fast-outline'}
                  size={20}
                  color={colors.textOnAccent}
                  style={{ marginRight: 8 }}
                />
              )}
              <Text style={[styles.primaryButtonText, { color: colors.textOnAccent }]}>
                {loading ? 'Please wait...' : otpSent ? 'Verify Code' : 'Send Code'}
              </Text>
            </View>
          </AnimatedButton>

          {/* Secondary Action Button */}
          {otpSent && (
            <AnimatedButton
              onPress={() => {
                setOtpSent(false);
                setOtp('');
              }}
              disabled={loading}
            >
              <View
                style={[
                  styles.secondaryButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>
                  Change Email Address
                </Text>
              </View>
            </AnimatedButton>
          )}

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* Info Message */}
          <View
            style={[
              styles.infoBox,
              { backgroundColor: colors.accent + '10' },
            ]}
          >
            <MaterialCommunityIcons
              name={otpSent ? "email-check-outline" : "information-outline"}
              size={18}
              color={colors.accent}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                styles.infoText,
                { color: colors.accent },
              ]}
            >
              {otpSent ? "Check your spam folder if you don't instantly see it." : "We'll email you a magic code for password-free login."}
            </Text>
          </View>
        </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  scrollContentKeyboardOpen: {
    justifyContent: 'flex-start',
    paddingVertical: 16,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: width - 60,
    lineHeight: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  inputWrapper: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontWeight: '500',
  },
  primaryButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  infoBox: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
});
