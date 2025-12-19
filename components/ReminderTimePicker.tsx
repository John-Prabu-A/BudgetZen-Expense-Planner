/**
 * Reusable Reminder Time Picker Component
 * Used in both Onboarding and Preferences screens
 */

import { useTheme } from '@/context/Theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Time generation helpers
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = ['AM', 'PM'];

interface ReminderTimePickerProps {
  visible: boolean;
  currentTime: string; // Format: "HH:MM AM/PM" or "HH:MM" (24-hour)
  onTimeChange: (time: string) => void; // Returns "HH:MM AM/PM"
  onClose: () => void;
  title?: string;
}

export const ReminderTimePicker: React.FC<ReminderTimePickerProps> = ({
  visible,
  currentTime,
  onTimeChange,
  onClose,
  title = 'Select Time',
}) => {
  const { isDark, colors } = useTheme();
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');

  // Parse time format to initialize picker
  useEffect(() => {
    if (!visible) return;

    try {
      const parts = currentTime.split(' ');
      
      if (parts.length === 2) {
        // Format: "HH:MM AM/PM"
        const [hour, minute] = parts[0].split(':');
        setSelectedHour(parseInt(hour) || 9);
        setSelectedMinute(parseInt(minute) || 0);
        setSelectedPeriod(parts[1] as 'AM' | 'PM');
      } else if (parts.length === 1 && parts[0].includes(':')) {
        // Format: "HH:MM" (24-hour)
        const [hour24Str, minute] = parts[0].split(':');
        const hour24 = parseInt(hour24Str) || 9;
        
        // Convert 24-hour to 12-hour format
        const period = hour24 >= 12 ? 'PM' : 'AM';
        const hour12 = hour24 % 12 || 12;
        
        setSelectedHour(hour12);
        setSelectedMinute(parseInt(minute) || 0);
        setSelectedPeriod(period);
      }
    } catch (error) {
      console.warn('Invalid time format, using defaults:', currentTime);
      setSelectedHour(9);
      setSelectedMinute(0);
      setSelectedPeriod('AM');
    }
  }, [visible, currentTime]);

  const handleConfirm = () => {
    // Format as "HH:MM AM/PM"
    const formattedMinute = selectedMinute.toString().padStart(2, '0');
    const newTime = `${selectedHour.toString().padStart(2, '0')}:${formattedMinute} ${selectedPeriod}`;
    onTimeChange(newTime);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top', 'bottom']}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: colors.surface, borderBottomColor: colors.border },
          ]}
        >
          <TouchableOpacity onPress={handleCancel}>
            <Text style={[styles.headerButton, { color: colors.accent }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {title}
          </Text>
          <TouchableOpacity onPress={handleConfirm}>
            <Text style={[styles.headerButton, { color: colors.accent }]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Time Picker Wheels */}
          <View
            style={[
              styles.wheelContainer,
              {
                backgroundColor: colors.accent + '08',
                borderColor: colors.accent + '30',
              },
            ]}
          >
            {/* Hour Wheel */}
            <ScrollView
              style={styles.wheel}
              contentOffset={{ x: 0, y: (selectedHour - 1) * 50 }}
              scrollEnabled={true}
              showsVerticalScrollIndicator={false}
              snapToInterval={50}
              decelerationRate="fast"
            >
              {HOURS.map((hour) => (
                <TouchableOpacity
                  key={hour}
                  onPress={() => setSelectedHour(hour)}
                  style={[
                    styles.wheelItem,
                    selectedHour === hour && {
                      backgroundColor: colors.accent + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.wheelItemText,
                      {
                        color:
                          selectedHour === hour
                            ? colors.accent
                            : colors.text,
                        fontWeight:
                          selectedHour === hour ? '700' : '500',
                      },
                    ]}
                  >
                    {hour.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Minute Wheel */}
            <ScrollView
              style={styles.wheel}
              contentOffset={{ x: 0, y: selectedMinute * 50 }}
              scrollEnabled={true}
              showsVerticalScrollIndicator={false}
              snapToInterval={50}
              decelerationRate="fast"
            >
              {MINUTES.map((minute) => (
                <TouchableOpacity
                  key={minute}
                  onPress={() => setSelectedMinute(minute)}
                  style={[
                    styles.wheelItem,
                    selectedMinute === minute && {
                      backgroundColor: colors.accent + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.wheelItemText,
                      {
                        color:
                          selectedMinute === minute
                            ? colors.accent
                            : colors.text,
                        fontWeight:
                          selectedMinute === minute ? '700' : '500',
                      },
                    ]}
                  >
                    {minute.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Period Wheel */}
            <ScrollView
              style={styles.wheel}
              contentOffset={{
                x: 0,
                y: PERIODS.indexOf(selectedPeriod) * 50,
              }}
              scrollEnabled={true}
              showsVerticalScrollIndicator={false}
              snapToInterval={50}
              decelerationRate="fast"
            >
              {PERIODS.map((period) => (
                <TouchableOpacity
                  key={period}
                  onPress={() => setSelectedPeriod(period as 'AM' | 'PM')}
                  style={[
                    styles.wheelItem,
                    selectedPeriod === period && {
                      backgroundColor: colors.accent + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.wheelItemText,
                      {
                        color:
                          selectedPeriod === period
                            ? colors.accent
                            : colors.text,
                        fontWeight:
                          selectedPeriod === period ? '700' : '500',
                      },
                    ]}
                  >
                    {period}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Preview Section */}
          <View style={styles.preview}>
            <Text
              style={[
                styles.previewLabel,
                { color: colors.textSecondary },
              ]}
            >
              Reminder will be at
            </Text>
            <Text
              style={[
                styles.previewTime,
                { color: colors.accent },
              ]}
            >
              {selectedHour.toString().padStart(2, '0')}:
              {selectedMinute.toString().padStart(2, '0')} {selectedPeriod}
            </Text>
          </View>

          {/* Info */}
          <View
            style={[
              styles.infoBox,
              { backgroundColor: colors.accent + '10', borderColor: colors.accent + '30' },
            ]}
          >
            <MaterialCommunityIcons
              name="information-outline"
              size={18}
              color={colors.accent}
              style={styles.infoIcon}
            />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Notifications will be delivered daily at this time, even if the app is closed.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerButton: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    justifyContent: 'center',
  },
  wheelContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  wheel: {
    flex: 1,
    height: 250,
  },
  wheelItem: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelItemText: {
    fontSize: 24,
    lineHeight: 28,
  },
  preview: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  previewTime: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    flex: 1,
  },
});

export default ReminderTimePicker;
