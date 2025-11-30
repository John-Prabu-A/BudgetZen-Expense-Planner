# Reminder Time Selection - Code Reference

## Complete Implementation Overview

### 1. Preferences Context Changes

**File**: `context/Preferences.tsx`

```typescript
// Interface Addition
interface PreferencesContextType {
  // ... existing fields ...
  
  // Notifications
  remindDaily: boolean;
  setRemindDaily: (remind: boolean) => Promise<void>;
  reminderTime: string;                    // NEW
  setReminderTime: (time: string) => Promise<void>;  // NEW
}

// Storage Key Addition
const STORAGE_KEYS = {
  // ... existing keys ...
  REMIND_DAILY: 'pref_remind_daily',
  REMINDER_TIME: 'pref_reminder_time',    // NEW
  SEND_CRASH_STATS: 'pref_send_crash_stats',
};

// Default Value Addition
const DEFAULT_VALUES = {
  // ... existing defaults ...
  remindDaily: true,
  reminderTime: '09:00 AM',                // NEW
  sendCrashStats: true,
};

// State Declaration Addition
export const PreferencesProvider = ({ children }: { children: React.ReactNode }) => {
  // ... existing states ...
  const [reminderTime, setReminderTimeState] = useState<string>(DEFAULT_VALUES.reminderTime);  // NEW
  // ... rest of state ...
};

// Load Function Addition
const loadPreferences = async () => {
  try {
    // ... existing loads ...
    const storedReminderTime = (await SecureStore.getItemAsync(STORAGE_KEYS.REMINDER_TIME)) || DEFAULT_VALUES.reminderTime;  // NEW
    
    // ... existing sets ...
    setReminderTimeState(storedReminderTime);  // NEW
  } catch (error) {
    // ... error handling ...
  }
};

// Setter Function Addition
const setReminderTime = async (time: string) => {
  try {
    setReminderTimeState(time);
    await SecureStore.setItemAsync(STORAGE_KEYS.REMINDER_TIME, time);
  } catch (error) {
    console.error('Error setting reminder time:', error);
  }
};

// Context Value Addition
const value: PreferencesContextType = {
  // ... existing values ...
  reminderTime,           // NEW
  setReminderTime,        // NEW
  // ... rest of values ...
};
```

### 2. Reminders Screen Implementation

**File**: `app/(onboarding)/reminders.tsx`

#### Imports
```typescript
import { Dimensions, Modal, ScrollView, ... } from 'react-native';

// Time data
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = ['AM', 'PM'];
```

#### State Variables
```typescript
const RemindersScreen = () => {
  // ... existing states ...
  const { reminderTime: savedReminderTime, setReminderTime: saveReminderTime } = usePreferences();
  const [reminderTime, setReminderTime] = useState(savedReminderTime);     // NEW
  const [showTimePicker, setShowTimePicker] = useState(false);             // NEW
  const [selectedHour, setSelectedHour] = useState(9);                     // NEW
  const [selectedMinute, setSelectedMinute] = useState(0);                 // NEW
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM'); // NEW
};
```

#### Effect Hook for Parsing Time
```typescript
useEffect(() => {
  // Parse saved reminder time to initialize time picker
  const [time, period] = reminderTime.split(' ');
  const [hour, minute] = time.split(':');
  setSelectedHour(parseInt(hour) || 9);
  setSelectedMinute(parseInt(minute) || 0);
  setSelectedPeriod(period as 'AM' | 'PM');
}, []);
```

#### Handler: Save Time
```typescript
const handleSaveTime = () => {
  const formattedMinute = selectedMinute.toString().padStart(2, '0');
  const newTime = `${selectedHour}:${formattedMinute} ${selectedPeriod}`;
  setReminderTime(newTime);
  setShowTimePicker(false);
};
```

#### Handler: Close Time Picker
```typescript
const handleTimePickerClose = () => {
  // Revert to previous time if user cancels
  const [time, period] = reminderTime.split(' ');
  const [hour, minute] = time.split(':');
  setSelectedHour(parseInt(hour));
  setSelectedMinute(parseInt(minute));
  setSelectedPeriod(period as 'AM' | 'PM');
  setShowTimePicker(false);
};
```

#### Handler: Update Next Handler
```typescript
const handleNext = async () => {
  try {
    console.log('[Reminders] User clicked next');
    await setRemindDaily(showReminders);
    
    // Save reminder time if reminders are enabled  // NEW
    if (showReminders) {                            // NEW
      await saveReminderTime(reminderTime);         // NEW
      console.log('[Reminders] Saved reminder time:', reminderTime);  // NEW
    }
    
    console.log('[Reminders] Completing onboarding step...');
    await completeStep(OnboardingStep.REMINDERS);
  } catch (error) {
    console.error('[Reminders] Error completing reminders step:', error);
  }
};
```

#### Change Button Implementation
```typescript
<TouchableOpacity
  style={[
    styles.timeButton,
    { backgroundColor: colors.accent },
  ]}
  onPress={() => setShowTimePicker(true)}  // Opens modal
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
```

#### Time Picker Modal Structure
```typescript
<Modal
  visible={showTimePicker}
  transparent
  animationType="slide"
  onRequestClose={handleTimePickerClose}
>
  <SafeAreaView style={[styles.timePickerContainer, { backgroundColor: colors.background }]}>
    
    {/* Header with Cancel/Done */}
    <View style={[styles.timePickerHeader, { ... }]}>
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

    {/* Picker Content */}
    <View style={styles.timePickerContent}>
      
      {/* Hour/Minute/Period Wheels */}
      <View style={[styles.timePickerWheelContainer, { ... }]}>
        
        {/* Hour Wheel */}
        <ScrollView style={styles.timePickerWheel} ...>
          {HOURS.map((hour) => (
            <TouchableOpacity
              key={hour}
              onPress={() => setSelectedHour(hour)}
              style={[
                styles.timePickerItem,
                selectedHour === hour && { backgroundColor: colors.accent + '20' },
              ]}
            >
              <Text style={[styles.timePickerItemText, { ... }]}>
                {hour.toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Minute Wheel */}
        <ScrollView style={styles.timePickerWheel} ...>
          {MINUTES.map((minute) => (
            <TouchableOpacity
              key={minute}
              onPress={() => setSelectedMinute(minute)}
              style={[
                styles.timePickerItem,
                selectedMinute === minute && { backgroundColor: colors.accent + '20' },
              ]}
            >
              <Text style={[styles.timePickerItemText, { ... }]}>
                {minute.toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Period Wheel */}
        <ScrollView style={styles.timePickerWheel} ...>
          {PERIODS.map((period) => (
            <TouchableOpacity
              key={period}
              onPress={() => setSelectedPeriod(period as 'AM' | 'PM')}
              style={[
                styles.timePickerItem,
                selectedPeriod === period && { backgroundColor: colors.accent + '20' },
              ]}
            >
              <Text style={[styles.timePickerItemText, { ... }]}>
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
```

### 3. StyleSheet Additions

```typescript
const styles = StyleSheet.create({
  // ... existing styles ...
  
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
```

## Usage Examples

### Read Current Reminder Time
```typescript
const { reminderTime } = usePreferences();
console.log(`Scheduled for: ${reminderTime}`);  // "09:00 AM"
```

### Update Reminder Time Programmatically
```typescript
const { setReminderTime } = usePreferences();

const updateReminder = async () => {
  await setReminderTime('03:30 PM');
};
```

### Parse Time String
```typescript
const parseTime = (timeString: string) => {
  const [time, period] = timeString.split(' ');
  const [hour, minute] = time.split(':');
  return {
    hour: parseInt(hour),
    minute: parseInt(minute),
    period: period as 'AM' | 'PM',
  };
};

const parsed = parseTime('09:00 AM');
// { hour: 9, minute: 0, period: 'AM' }
```

### Format Time String
```typescript
const formatTime = (hour: number, minute: number, period: 'AM' | 'PM'): string => {
  return `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
};

const formatted = formatTime(9, 0, 'AM');
// "9:00 AM"
```

## Key Functions Summary

| Function | Purpose | Parameters | Returns |
|----------|---------|-----------|---------|
| `handleSaveTime()` | Format and save selected time | None | void |
| `handleTimePickerClose()` | Revert time picker to previous value | None | void |
| `handleNext()` | Complete reminders onboarding step | None | Promise<void> |
| `setReminderTime()` | Save reminder time to secure storage | time: string | Promise<void> |

## Data Format Specification

### String Format: `"HH:MM AM/PM"`
- **HH**: Hour (1-12, zero-padded)
- **MM**: Minute (0-59, zero-padded)
- **AM/PM**: Period indicator

### Valid Examples:
```
"01:00 AM"
"09:00 AM"
"12:00 PM"
"03:30 PM"
"11:59 PM"
```

### Invalid Examples:
```
"9:00 AM"        // Hour not zero-padded
"09:0 AM"        // Minute not zero-padded
"13:00 PM"       // Invalid hour (13)
"09-00-AM"       // Wrong separators
"9:00"           // Missing period
```

## Testing Checklist

```
[] Time picker modal opens when Change button tapped
[] Hour picker scrolls from 1 to 12
[] Minute picker scrolls from 0 to 59
[] Period selector shows AM/PM
[] Selected values are highlighted
[] Preview updates in real-time
[] Done button saves time correctly
[] Cancel button reverts to previous time
[] Time persists after closing modal
[] Time persists after closing app
[] Time loads on component mount
[] Time is saved in secure storage
[] Default time is "09:00 AM"
[] Time format is always "HH:MM AM/PM"
[] Works in light theme
[] Works in dark theme
[] Modal closes smoothly
[] No TypeScript errors
[] No console errors
```

---

This complete code reference shows exactly how the reminder time selection feature is implemented!
