import { useTheme } from '@/context/Theme';
import { useUIMode } from '@/hooks/useUIMode';
import { verifyPassword } from '@/lib/passwordUtils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PasswordLockScreenProps {
  passwordHash: string;
  onUnlock: () => void;
}

const { width, height } = Dimensions.get('window');

export default function PasswordLockScreen({ passwordHash, onUnlock }: PasswordLockScreenProps) {
  const { isDark, colors } = useTheme();
  const spacing = useUIMode();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleUnlock = useCallback(async () => {
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const isCorrect = await verifyPassword(password, passwordHash);

      if (isCorrect) {
        setPassword('');
        onUnlock();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setError('Incorrect password');

        if (newAttempts >= 5) {
          Alert.alert(
            'Security Alert',
            'Too many failed attempts. The app will close for security.',
            [{ text: 'OK', onPress: () => {} }]
          );
        }
      }
    } catch (err) {
      console.error('Error verifying password:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  }, [password, passwordHash, onUnlock, attempts]);

  const styles = createStyles(spacing, isDark, colors, insets);

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior="padding">
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={[styles.iconContainer, { backgroundColor: colors.accent + '15' }]}>
            <MaterialCommunityIcons name="lock" size={48} color={colors.accent} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>BudgetZen</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Enter your password to continue</Text>
        </View>

        {/* Password Input */}
        <View style={styles.inputSection}>
          <View style={[styles.passwordInputContainer, { borderColor: error ? colors.expense : colors.border }]}>
            <MaterialCommunityIcons name="lock-outline" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.passwordInput, { color: colors.text }]}
              placeholder="Enter your password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError('');
              }}
              editable={!isVerifying}
              onSubmitEditing={handleUnlock}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={16} color={colors.expense} />
              <Text style={[styles.errorText, { color: colors.expense }]}>{error}</Text>
            </View>
          )}

          {/* Attempts Warning */}
          {attempts > 2 && (
            <View style={[styles.warningContainer, { backgroundColor: colors.accent + '10' }]}>
              <Text style={[styles.warningText, { color: colors.accent }]}>
                {5 - attempts} attempt{5 - attempts !== 1 ? 's' : ''} remaining
              </Text>
            </View>
          )}
        </View>

        {/* Unlock Button */}
        <TouchableOpacity
          style={[styles.unlockButton, { backgroundColor: colors.accent, opacity: isVerifying ? 0.6 : 1 }]}
          onPress={handleUnlock}
          disabled={isVerifying}
        >
          {isVerifying ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="loading" size={20} color="#FFFFFF" />
              <Text style={styles.unlockButtonText}>Verifying...</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="lock-open" size={20} color="#FFFFFF" />
              <Text style={styles.unlockButtonText}>Unlock</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name="information" size={16} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              This password protects your financial data
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (spacing: any, isDark: boolean, colors: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    content: {
      width: '100%',
      paddingHorizontal: spacing.lg,
      gap: spacing.xl,
      justifyContent: 'center',
      maxWidth: 400,
    },
    headerSection: {
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    subtitle: {
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
    },
    inputSection: {
      gap: spacing.md,
    },
    passwordInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      borderWidth: 1.5,
      borderRadius: 12,
      height: 56,
    },
    passwordInput: {
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
    },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.expense + '10',
      borderRadius: 8,
    },
    errorText: {
      fontSize: 13,
      fontWeight: '500',
    },
    warningContainer: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 8,
    },
    warningText: {
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
    },
    unlockButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      height: 56,
      borderRadius: 12,
      marginTop: spacing.md,
    },
    unlockButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    infoSection: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    infoText: {
      fontSize: 12,
      fontWeight: '500',
    },
  });
