import { usePreferences } from '@/context/Preferences';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
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

type Screen = 'options' | 'set' | 'confirm' | 'verify';

export default function PasscodeSetupScreen() {
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === 'dark';
  const { passcodeEnabled, setPasscodeEnabled } = usePreferences();

  const [currentScreen, setCurrentScreen] = useState<Screen>(passcodeEnabled ? 'verify' : 'options');
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyPasscode, setVerifyPasscode] = useState('');

  const colors = {
    background: isDark ? '#1A1A1A' : '#FFFFFF',
    surface: isDark ? '#262626' : '#F5F5F5',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#A0A0A0' : '#666666',
    border: isDark ? '#404040' : '#E5E5E5',
    accent: '#0284c7',
    success: '#10B981',
    danger: '#EF4444',
  };

  const PASSCODE_KEY = 'app_passcode';

  const handleSetPasscode = async () => {
    if (passcode.length < 4) {
      Alert.alert('Error', 'Passcode must be at least 4 digits');
      return;
    }

    if (passcode !== confirmPasscode) {
      Alert.alert('Error', 'Passcodes do not match');
      return;
    }

    try {
      setLoading(true);
      // Hash the passcode (simple implementation - in production use a proper hashing library)
      const hashedPasscode = btoa(passcode); // Base64 encoding for demo
      await SecureStore.setItemAsync(PASSCODE_KEY, hashedPasscode);
      await setPasscodeEnabled(true);

      Alert.alert('Success', 'Passcode has been set successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error setting passcode:', error);
      Alert.alert('Error', 'Failed to set passcode');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRemove = async () => {
    try {
      setLoading(true);
      const storedPasscode = await SecureStore.getItemAsync(PASSCODE_KEY);
      const hashedInput = btoa(verifyPasscode);

      if (storedPasscode === hashedInput) {
        // Correct passcode - show disable confirmation
        Alert.alert('Disable Passcode Protection', 'Are you sure you want to disable passcode protection?', [
          { text: 'Cancel', onPress: () => {}, style: 'cancel' },
          {
            text: 'Disable',
            onPress: async () => {
              try {
                await SecureStore.deleteItemAsync(PASSCODE_KEY);
                await setPasscodeEnabled(false);
                Alert.alert('Success', 'Passcode protection has been disabled', [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ]);
              } catch (error) {
                Alert.alert('Error', 'Failed to disable passcode protection');
              }
            },
            style: 'destructive',
          },
        ]);
      } else {
        Alert.alert('Error', 'Incorrect passcode');
        setVerifyPasscode('');
      }
    } catch (error) {
      console.error('Error verifying passcode:', error);
      Alert.alert('Error', 'Failed to verify passcode');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePasscode = async () => {
    try {
      setLoading(true);
      const storedPasscode = await SecureStore.getItemAsync(PASSCODE_KEY);
      const hashedInput = btoa(verifyPasscode);

      if (storedPasscode === hashedInput) {
        // Correct passcode - proceed to set new one
        setVerifyPasscode('');
        setCurrentScreen('set');
      } else {
        Alert.alert('Error', 'Incorrect passcode');
        setVerifyPasscode('');
      }
    } catch (error) {
      console.error('Error verifying passcode:', error);
      Alert.alert('Error', 'Failed to verify passcode');
    } finally {
      setLoading(false);
    }
  };

  // Header Component
  const Header = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
      </TouchableOpacity>
      <View style={styles.headerContent}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        )}
      </View>
    </View>
  );

  // Passcode Input Component
  const PasscodeInput = ({
    label,
    value,
    onChangeText,
    placeholder,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
  }) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
      <TextInput
        style={[
          styles.passcodeInput,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        placeholder={placeholder || 'Enter 4+ digits'}
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        secureTextEntry
        editable={!loading}
      />
    </View>
  );

  if (currentScreen === 'options') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Passcode Protection" subtitle="Secure your app with a passcode" />

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="lock-outline" size={32} color={colors.accent} />
              <Text style={[styles.infoTitle, { color: colors.text }]}>Enable Passcode Protection</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Protect your financial data with a 4-digit passcode. You'll be asked to enter it every time you open the app.
              </Text>
            </View>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />
                <View style={styles.featureTextGroup}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>Secure Access</Text>
                  <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                    Prevent unauthorized access to your account
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />
                <View style={styles.featureTextGroup}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>Quick & Easy</Text>
                  <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                    Fast 4-digit entry takes just a few seconds
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />
                <View style={styles.featureTextGroup}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>You Control It</Text>
                  <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                    Change or disable anytime from settings
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.accent }]}
              onPress={() => setCurrentScreen('set')}
              disabled={loading}
            >
              <MaterialCommunityIcons name="lock-plus" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Set Passcode</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (currentScreen === 'verify') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Verify Passcode" />

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="lock-check" size={32} color={colors.accent} />
              <Text style={[styles.infoTitle, { color: colors.text }]}>Passcode Protection Active</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Enter your current passcode to change or disable protection
              </Text>
            </View>

            <PasscodeInput
              label="Current Passcode"
              value={verifyPasscode}
              onChangeText={setVerifyPasscode}
            />

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.accent }]}
                onPress={() => setCurrentScreen('options')}
                disabled={loading}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dangerButton, { backgroundColor: colors.danger }]}
                onPress={handleVerifyAndRemove}
                disabled={loading || verifyPasscode.length === 0}
              >
                <MaterialCommunityIcons name="lock-open" size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Disable</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.accent }]}
                onPress={handleChangePasscode}
                disabled={loading || verifyPasscode.length === 0}
              >
                <MaterialCommunityIcons name="lock-reset" size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={currentScreen === 'set' ? 'Set Passcode' : 'Confirm Passcode'}
        subtitle={
          currentScreen === 'set'
            ? 'Choose a secure 4+ digit code'
            : 'Re-enter your passcode to confirm'
        }
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {currentScreen === 'set' && (
            <>
              <PasscodeInput label="Passcode" value={passcode} onChangeText={setPasscode} />
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                💡 Use a combination of digits you'll remember easily
              </Text>
            </>
          )}

          {currentScreen === 'confirm' && (
            <PasscodeInput label="Confirm Passcode" value={confirmPasscode} onChangeText={setConfirmPasscode} />
          )}

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.accent }]}
              onPress={() => {
                if (currentScreen === 'set') {
                  router.back();
                } else {
                  setCurrentScreen('set');
                  setConfirmPasscode('');
                }
              }}
              disabled={loading}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>
                {currentScreen === 'set' ? 'Cancel' : 'Back'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: colors.accent,
                  opacity:
                    currentScreen === 'set'
                      ? passcode.length >= 4
                        ? 1
                        : 0.5
                      : confirmPasscode.length >= 4
                        ? 1
                        : 0.5,
                },
              ]}
              onPress={() => {
                if (currentScreen === 'set') {
                  if (passcode.length < 4) {
                    Alert.alert('Error', 'Passcode must be at least 4 digits');
                    return;
                  }
                  setCurrentScreen('confirm');
                } else {
                  handleSetPasscode();
                }
              }}
              disabled={
                loading ||
                (currentScreen === 'set' ? passcode.length < 4 : confirmPasscode.length < 4)
              }
            >
              <Text style={styles.primaryButtonText}>
                {currentScreen === 'set' ? 'Next' : 'Confirm'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  infoBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  featuresList: {
    gap: 16,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    gap: 12,
  },
  featureTextGroup: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  passcodeInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    letterSpacing: 2,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 13,
    marginBottom: 24,
    marginTop: -8,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  dangerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
