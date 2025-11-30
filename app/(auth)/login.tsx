
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
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
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

  async function signInWithEmail() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) Alert.alert('Sign In Error', error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
    });

    if (error) Alert.alert('Sign Up Error', error.message);
    else Alert.alert('Success', 'Check your email to confirm your account');
    setLoading(false);
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
            {isSignUp
              ? 'Create your account to get started'
              : 'Welcome back! Sign in to continue'}
          </Text>
        </Animated.View>

        {/* Form Section */}
        <Animated.View style={[styles.formSection, formAnimatedStyle]}>
          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
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

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Password</Text>
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
                name="lock-outline"
                size={20}
                color={colors.textSecondary}
                style={styles.inputIcon}
              />
              <Input
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
                secureTextEntry={!showPassword}
                style={[styles.input, {color: colors.text}]}
                placeholderTextColor={colors.inputPlaceholder}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Primary Action Button */}
          <AnimatedButton
            onPress={isSignUp ? signUpWithEmail : signInWithEmail}
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
                  name={isSignUp ? 'account-plus-outline' : 'login-variant'}
                  size={20}
                  color={colors.textOnAccent}
                  style={{ marginRight: 8 }}
                />
              )}
              <Text style={[styles.primaryButtonText, { color: colors.textOnAccent }]}>
                {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
              </Text>
            </View>
          </AnimatedButton>

          {/* Secondary Action Button */}
          <AnimatedButton
            onPress={() => {
              setIsSignUp(!isSignUp);
              setEmail('');
              setPassword('');
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
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </Text>
            </View>
          </AnimatedButton>

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
              name="information-outline"
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
              Your data is securely encrypted
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
  eyeIcon: {
    padding: 8,
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
