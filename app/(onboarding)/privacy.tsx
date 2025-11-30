import { AnimatedButton } from '@/components/AnimatedButton';
import { OnboardingStep, useOnboarding } from '@/context/Onboarding';
import { usePreferences } from '@/context/Preferences';
import { useTheme } from '@/context/Theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const PrivacyScreen = () => {
  const { isDark, colors } = useTheme();
  const { completeStep } = useOnboarding();
  const { setSendCrashStats } = usePreferences();
  const [sendStats, setSendStats] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const router = useRouter();

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerScale = useSharedValue(0.9);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(20);

  useEffect(() => {
    headerOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    headerScale.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });

    contentOpacity.value = withDelay(300, withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    }));
    contentTranslateY.value = withDelay(300, withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    }));
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ scale: headerScale.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const handleNext = async () => {
    try {
      console.log('[Privacy] User clicked next');
      await setSendCrashStats(sendStats);
      console.log('[Privacy] Saved crash stats:', sendStats);
      console.log('[Privacy] Completing onboarding step...');
      await completeStep(OnboardingStep.PRIVACY);
      console.log('[Privacy] Onboarding step completed, parent layout should navigate');
      // Navigation is handled automatically by parent layout
    } catch (error) {
      console.error('[Privacy] Error completing privacy step:', error);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {/* Header */}
        <Animated.View style={headerAnimatedStyle}>
          <View style={styles.header}>
            <View
              style={[
                styles.stepIndicator,
                { backgroundColor: colors.accent + '20' },
              ]}
            >
              <Text
                style={[
                  styles.stepNumber,
                  { color: colors.accent },
                ]}
              >
                2/4
              </Text>
            </View>
            <Text
              style={[
                styles.headerTitle,
                { color: colors.text },
              ]}
            >
              Privacy & Safety
            </Text>
            <Text
              style={[
                styles.headerSubtitle,
                { color: colors.textSecondary },
              ]}
            >
              We care about your data security and privacy
            </Text>
          </View>
        </Animated.View>

        {/* Content */}
        <Animated.View style={contentAnimatedStyle}>
          {/* Stats Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.cardContent}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: colors.accent + '15' },
                ]}
              >
                <MaterialCommunityIcons
                  name="chart-box-outline"
                  size={28}
                  color={colors.accent}
                />
              </View>

              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Usage Statistics
                </Text>
                <Text
                  style={[
                    styles.cardSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Help us improve by sending crash reports
                </Text>
              </View>

              <Switch
                value={sendStats}
                onValueChange={setSendStats}
                trackColor={{ false: colors.border, true: colors.accent + '40' }}
                thumbColor={sendStats ? colors.accent : colors.textSecondary}
              />
            </View>
          </View>

          {/* Privacy Info */}
          <View
            style={[
              styles.infoCard,
              { backgroundColor: colors.accent + '08' },
            ]}
          >
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={24}
              color={colors.accent}
              style={{ marginBottom: 12 }}
            />
            <Text
              style={[
                styles.infoTitle,
                { color: colors.text },
              ]}
            >
              Your data is encrypted
            </Text>
            <Text
              style={[
                styles.infoText,
                { color: colors.textSecondary },
              ]}
            >
              All financial information is end-to-end encrypted and stored securely. We never sell or share your data.
            </Text>
          </View>

          {/* Terms Agreement */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: agreedToTerms ? colors.success + '10' : colors.surface,
                borderColor: agreedToTerms ? colors.success : colors.border,
              },
            ]}
          >
            <View style={styles.cardContent}>
              <View style={styles.termsTextContainer}>
                <Text
                  style={[
                    styles.termsText,
                    { color: colors.text },
                  ]}
                >
                  I agree to the{' '}
                  <Text
                    style={{ color: colors.accent, fontWeight: '700' }}
                    onPress={() => Linking.openURL('https://example.com/terms')}
                  >
                    Terms of Service
                  </Text>
                  {' '}and{' '}
                  <Text
                    style={{ color: colors.accent, fontWeight: '700' }}
                    onPress={() => Linking.openURL('https://example.com/privacy')}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </View>
              <View
                style={[
                  styles.checkboxContainer,
                  {
                    backgroundColor: agreedToTerms
                      ? colors.success
                      : colors.background,
                    borderColor: agreedToTerms
                      ? colors.success
                      : colors.border,
                  },
                ]}
                onTouchEnd={() => setAgreedToTerms(!agreedToTerms)}
              >
                {agreedToTerms && (
                  <MaterialCommunityIcons
                    name="check"
                    size={16}
                    color={colors.textOnAccent}
                  />
                )}
              </View>
            </View>
          </View>

          {/* Policy Links */}
          <View style={styles.linksContainer}>
            <Text
              style={[
                styles.linksTitle,
                { color: colors.textSecondary },
              ]}
            >
              Learn more
            </Text>

            {[
              {
                icon: 'file-document-outline',
                label: 'Terms of Service',
                url: 'https://example.com/terms',
              },
              {
                icon: 'lock-outline',
                label: 'Privacy Policy',
                url: 'https://example.com/privacy',
              },
              {
                icon: 'information-outline',
                label: 'Data Security',
                url: 'https://example.com/security',
              },
            ].map((link, index) => (
              <View
                key={index}
                style={[
                  styles.linkItem,
                  { borderBottomColor: colors.border },
                ]}
              >
                <MaterialCommunityIcons
                  name={link.icon as any}
                  size={18}
                  color={colors.accent}
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={[
                    styles.linkText,
                    { color: colors.accent },
                  ]}
                  onPress={() => Linking.openURL(link.url)}
                >
                  {link.label}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={18}
                  color={colors.textSecondary}
                  style={{ marginLeft: 'auto' }}
                />
              </View>
            ))}
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <AnimatedButton
              onPress={handleNext}
              disabled={!agreedToTerms}
              style={{ flex: 1 }}
            >
              <View
                style={[
                  styles.nextButton,
                  {
                    backgroundColor: agreedToTerms ? colors.accent : colors.textTertiary,
                    opacity: agreedToTerms ? 1 : 0.5,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.nextButtonText,
                    { color: colors.textOnAccent },
                  ]}
                >
                  Continue
                </Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={18}
                  color={colors.textOnAccent}
                />
              </View>
            </AnimatedButton>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 32,
    gap: 12,
  },
  stepIndicator: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  infoCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  linksContainer: {
    marginVertical: 20,
  },
  linksTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
  nextButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default PrivacyScreen;
