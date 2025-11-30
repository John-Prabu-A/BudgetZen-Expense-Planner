import { AnimatedButton } from '@/components/AnimatedButton';
import { OnboardingStep, useOnboarding } from '@/context/Onboarding';
import { usePreferences } from '@/context/Preferences';
import { useTheme } from '@/context/Theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
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

// Time generation helper
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = ['AM', 'PM'];

const RemindersScreen = () => {
  const { isDark, colors } = useTheme();
  const { completeStep } = useOnboarding();
  const { setRemindDaily, reminderTime: savedReminderTime, setReminderTime: saveReminderTime } = usePreferences();
  const [showReminders, setShowReminders] = useState(false);
  const [reminderTime, setReminderTime] = useState(savedReminderTime);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const router = useRouter();

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerScale = useSharedValue(0.9);
  const itemOpacity = useSharedValue(0);
  const itemTranslateY = useSharedValue(20);

  useEffect(() => {
    // Parse saved reminder time to initialize time picker
    const [time, period] = reminderTime.split(' ');
    const [hour, minute] = time.split(':');
    setSelectedHour(parseInt(hour) || 9);
    setSelectedMinute(parseInt(minute) || 0);
    setSelectedPeriod(period as 'AM' | 'PM');
  }, []);

  useEffect(() => {
    headerOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    headerScale.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });

    itemOpacity.value = withDelay(300, withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    }));
    itemTranslateY.value = withDelay(300, withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    }));
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ scale: headerScale.value }],
  }));

  const itemAnimatedStyle = useAnimatedStyle(() => ({
    opacity: itemOpacity.value,
    transform: [{ translateY: itemTranslateY.value }],
  }));

  const handleSaveTime = () => {
    const formattedMinute = selectedMinute.toString().padStart(2, '0');
    const newTime = `${selectedHour}:${formattedMinute} ${selectedPeriod}`;
    setReminderTime(newTime);
    setShowTimePicker(false);
  };

  const handleTimePickerClose = () => {
    // Revert to previous time if user cancels
    const [time, period] = reminderTime.split(' ');
    const [hour, minute] = time.split(':');
    setSelectedHour(parseInt(hour));
    setSelectedMinute(parseInt(minute));
    setSelectedPeriod(period as 'AM' | 'PM');
    setShowTimePicker(false);
  };

  const handleNext = async () => {
    try {
      console.log('[Reminders] User clicked next');
      await setRemindDaily(showReminders);
      console.log('[Reminders] Saved reminder setting:', showReminders);
      
      // Save reminder time if reminders are enabled
      if (showReminders) {
        await saveReminderTime(reminderTime);
        console.log('[Reminders] Saved reminder time:', reminderTime);
      }
      
      console.log('[Reminders] Completing onboarding step...');
      await completeStep(OnboardingStep.REMINDERS);
      console.log('[Reminders] Onboarding step completed, parent layout should navigate');
      // Navigation is handled automatically by parent layout
    } catch (error) {
      console.error('[Reminders] Error completing reminders step:', error);
    }
  };

  return (
    <>
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
                  3/4
                </Text>
              </View>
              <Text
                style={[
                  styles.headerTitle,
                  { color: colors.text },
                ]}
              >
                Reminders
              </Text>
              <Text
                style={[
                  styles.headerSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Get daily reminders to track your spending
              </Text>
            </View>
          </Animated.View>

          {/* Content */}
          <Animated.View style={itemAnimatedStyle}>
            {/* Main Reminder Toggle */}
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
                    name="bell-outline"
                    size={28}
                    color={colors.accent}
                  />
                </View>

                <View style={styles.cardTextContainer}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    Daily Reminders
                  </Text>
                  <Text
                    style={[
                      styles.cardSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {showReminders
                      ? `Enabled at ${reminderTime}`
                      : 'Get reminders to log your expenses'}
                  </Text>
                </View>

                <Switch
                  value={showReminders}
                  onValueChange={setShowReminders}
                  trackColor={{ false: colors.border, true: colors.accent + '40' }}
                  thumbColor={showReminders ? colors.accent : colors.textSecondary}
                />
              </View>
            </View>

            {/* Time Selection (if enabled) */}
            {showReminders && (
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.accent + '08', borderColor: colors.accent + '30' },
                ]}
              >
                <View style={styles.cardContent}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: colors.accent + '25' },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={28}
                      color={colors.accent}
                    />
                  </View>

                  <View style={styles.cardTextContainer}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      Reminder Time
                    </Text>
                    <Text
                      style={[
                        styles.cardSubtitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {reminderTime}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.timeButton,
                      { backgroundColor: colors.accent },
                    ]}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text
                      style={[
                        styles.timeButtonText,
                        { color: colors.textOnAccent },
                      ]}
                    >
                      Change
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Benefits List */}
            <View style={styles.benefitsContainer}>
              <Text
                style={[
                  styles.benefitsTitle,
                  { color: colors.text },
                ]}
              >
                Why reminders?
              </Text>

              {[
                { icon: 'target', text: 'Stay focused on your budget goals' },
                { icon: 'chart-line', text: 'Track spending habits consistently' },
                { icon: 'lightbulb-outline', text: 'Build better financial habits' },
              ].map((benefit, index) => (
                <View
                  key={index}
                  style={[
                    styles.benefitItem,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={benefit.icon as any}
                    size={20}
                    color={colors.accent}
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={[
                      styles.benefitText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {benefit.text}
                  </Text>
                </View>
              ))}
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <AnimatedButton
                onPress={handleNext}
                style={{ flex: 1 }}
              >
                <View
                  style={[
                    styles.nextButton,
                    { backgroundColor: colors.accent },
                  ]}
                >
                  <Text
                    style={[
                      styles.nextButtonText,
                      { color: colors.textOnAccent },
                    ]}
                  >
                    Next
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

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
        onRequestClose={handleTimePickerClose}
      >
        <SafeAreaView
          style={[styles.timePickerContainer, { backgroundColor: colors.background }]}
        >
          {/* Header */}
          <View
            style={[
              styles.timePickerHeader,
              { backgroundColor: colors.surface, borderBottomColor: colors.border },
            ]}
          >
            <TouchableOpacity onPress={handleTimePickerClose}>
              <Text style={[styles.timePickerHeaderButton, { color: colors.accent }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.timePickerTitle, { color: colors.text }]}>
              Select Time
            </Text>
            <TouchableOpacity onPress={handleSaveTime}>
              <Text style={[styles.timePickerHeaderButton, { color: colors.accent }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>

          {/* Time Picker */}
          <View style={styles.timePickerContent}>
            <View
              style={[
                styles.timePickerWheelContainer,
                { backgroundColor: colors.accent + '08', borderColor: colors.accent },
              ]}
            >
              {/* Hour */}
              <ScrollView
                style={styles.timePickerWheel}
                contentOffset={{ x: 0, y: (selectedHour - 1) * 50 }}
                scrollEnabled={true}
                showsVerticalScrollIndicator={false}
              >
                {HOURS.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    onPress={() => setSelectedHour(hour)}
                    style={[
                      styles.timePickerItem,
                      selectedHour === hour && { backgroundColor: colors.accent + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.timePickerItemText,
                        {
                          color: selectedHour === hour ? colors.accent : colors.text,
                          fontWeight: selectedHour === hour ? '700' : '500',
                        },
                      ]}
                    >
                      {hour.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Minute */}
              <ScrollView
                style={styles.timePickerWheel}
                contentOffset={{ x: 0, y: selectedMinute * 50 }}
                scrollEnabled={true}
                showsVerticalScrollIndicator={false}
              >
                {MINUTES.map((minute) => (
                  <TouchableOpacity
                    key={minute}
                    onPress={() => setSelectedMinute(minute)}
                    style={[
                      styles.timePickerItem,
                      selectedMinute === minute && { backgroundColor: colors.accent + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.timePickerItemText,
                        {
                          color: selectedMinute === minute ? colors.accent : colors.text,
                          fontWeight: selectedMinute === minute ? '700' : '500',
                        },
                      ]}
                    >
                      {minute.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Period */}
              <ScrollView
                style={styles.timePickerWheel}
                contentOffset={{ x: 0, y: (PERIODS.indexOf(selectedPeriod)) * 50 }}
                scrollEnabled={true}
                showsVerticalScrollIndicator={false}
              >
                {PERIODS.map((period) => (
                  <TouchableOpacity
                    key={period}
                    onPress={() => setSelectedPeriod(period as 'AM' | 'PM')}
                    style={[
                      styles.timePickerItem,
                      selectedPeriod === period && { backgroundColor: colors.accent + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.timePickerItemText,
                        {
                          color: selectedPeriod === period ? colors.accent : colors.text,
                          fontWeight: selectedPeriod === period ? '700' : '500',
                        },
                      ]}
                    >
                      {period}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Preview */}
            <View style={styles.timePickerPreview}>
              <Text style={[styles.timePickerPreviewLabel, { color: colors.textSecondary }]}>
                Reminder will be at
              </Text>
              <Text style={[styles.timePickerPreviewTime, { color: colors.accent }]}>
                {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')} {selectedPeriod}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </>
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
  timeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  benefitsContainer: {
    marginTop: 20,
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  benefitText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
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
  // Time Picker Modal Styles
  timePickerContainer: {
    flex: 1,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  timePickerHeaderButton: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  timePickerContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    justifyContent: 'center',
  },
  timePickerWheelContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  timePickerWheel: {
    flex: 1,
    height: 250,
  },
  timePickerItem: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerItemText: {
    fontSize: 24,
  },
  timePickerPreview: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 12,
  },
  timePickerPreviewLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  timePickerPreviewTime: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default RemindersScreen;
