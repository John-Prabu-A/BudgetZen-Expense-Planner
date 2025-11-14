import { usePreferences } from '@/context/Preferences';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SecurityModal() {
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const { passcodeEnabled, setPasscodeEnabled } = usePreferences();

  const isDark = colorScheme === 'dark';
  const colors = {
    background: isDark ? '#1A1A1A' : '#FFFFFF',
    surface: isDark ? '#2A2A2A' : '#F9FAFB',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#A0A0A0' : '#6B7280',
    border: isDark ? '#404040' : '#E5E7EB',
    accent: '#0284c7',
    success: '#10B981',
  };

  const handlePasscodeChange = async (value: boolean) => {
    if (value) {
      // TODO: Navigate to passcode setup
      Alert.alert('Setup Passcode', 'You will be guided to set up your passcode');
    }
    await setPasscodeEnabled(value);
  };

  const handleBiometricChange = async (value: boolean) => {
    // TODO: Implement biometric setup
    Alert.alert('Biometric Auth', 'Biometric authentication setup coming soon');
  };

  const handleTwoFactorChange = async (value: boolean) => {
    // TODO: Implement 2FA setup
    Alert.alert('Two-Factor Auth', 'Two-factor authentication setup coming soon');
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Password change functionality coming soon');
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Privacy policy content would open here');
  };

  return (
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
        {/* Authentication Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>
            Authentication
          </Text>

          <View
            style={[
              styles.settingRow,
              { borderBottomColor: colors.border },
            ]}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={24}
                color={colors.accent}
              />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Passcode Protection
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Requires a passcode to enter the app
                </Text>
              </View>
            </View>
            <Switch
              value={passcodeEnabled}
              onValueChange={handlePasscodeChange}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={passcodeEnabled ? colors.accent : colors.textSecondary}
            />
          </View>

          <View
            style={[
              styles.settingRow,
              { borderBottomColor: colors.border },
            ]}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons
                name="fingerprint"
                size={24}
                color={colors.accent}
              />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Biometric Authentication
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Use fingerprint or face recognition
                </Text>
              </View>
            </View>
            <Switch
              value={false}
              onValueChange={handleBiometricChange}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={false ? colors.accent : colors.textSecondary}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={24}
                color={colors.accent}
              />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Two-Factor Authentication
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Extra layer of security for your account
                </Text>
              </View>
            </View>
            <Switch
              value={false}
              onValueChange={handleTwoFactorChange}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={false ? colors.accent : colors.textSecondary}
            />
          </View>
        </View>

        {/* Password Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>
            Password
          </Text>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { borderColor: colors.border },
            ]}>
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons
                name="key-outline"
                size={24}
                color={colors.accent}
              />
              <View style={styles.buttonText}>
                <Text style={[styles.buttonTitle, { color: colors.text }]}>
                  Change Password
                </Text>
                <Text style={[styles.buttonDescription, { color: colors.textSecondary }]}>
                  Update your account password
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>
            Privacy
          </Text>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { borderColor: colors.border },
            ]}
            onPress={handlePrivacyPolicy}>
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={24}
                color={colors.accent}
              />
              <View style={styles.buttonText}>
                <Text style={[styles.buttonTitle, { color: colors.text }]}>
                  Privacy Policy
                </Text>
                <Text style={[styles.buttonDescription, { color: colors.textSecondary }]}>
                  View our privacy practices
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { borderColor: colors.border },
            ]}>
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={24}
                color={colors.accent}
              />
              <View style={styles.buttonText}>
                <Text style={[styles.buttonTitle, { color: colors.text }]}>
                  Terms of Service
                </Text>
                <Text style={[styles.buttonDescription, { color: colors.textSecondary }]}>
                  Review our terms and conditions
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View
          style={[
            styles.infoBox,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <MaterialCommunityIcons
            name="information-outline"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Your financial data is encrypted and securely stored. We never share
            your personal information without your consent.
          </Text>
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
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingBottom: 16,
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  buttonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonText: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  buttonDescription: {
    fontSize: 12,
  },
  infoBox: {
    flexDirection: 'row',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
