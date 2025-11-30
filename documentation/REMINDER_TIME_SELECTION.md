# Reminder Time Selection - Implementation Guide

## Overview
Complete implementation of the "Change" reminder time functionality in the onboarding reminders screen. Users can now select a specific time for their daily reminders and have it persisted across app sessions.

## Data Storage Architecture

### Storage Location: `Preferences` Context
**File**: `context/Preferences.tsx`

The reminder time is stored in the `Preferences` context using `expo-secure-store` for secure, persistent storage.

**Storage Key**: `pref_reminder_time`
**Data Type**: `string` (format: "HH:MM AM/PM")
**Default Value**: `"09:00 AM"`

### Why Preferences Context?
1. **Centralized Management**: All app preferences stored in one context
2. **Secure Storage**: Uses expo-secure-store for encrypted storage
3. **Persistence**: Survives app restarts and updates
4. **Easy Integration**: Simple hooks-based API for any component
5. **Performance**: Lazy-loads on app startup
6. **TypeScript Support**: Full type safety

## Implementation Details

### 1. Context Updates (Preferences.tsx)

**Added to interface**:
```typescript
reminderTime: string;
setReminderTime: (time: string) => Promise<void>;
```

**Storage Keys**:
```typescript
REMINDER_TIME: 'pref_reminder_time',
```

**Default Values**:
```typescript
reminderTime: '09:00 AM',
```

**State Variable**:
```typescript
const [reminderTime, setReminderTimeState] = useState<string>(DEFAULT_VALUES.reminderTime);
```

**Load Function**:
```typescript
const storedReminderTime = (await SecureStore.getItemAsync(STORAGE_KEYS.REMINDER_TIME)) || DEFAULT_VALUES.reminderTime;
setReminderTimeState(storedReminderTime);
```

**Setter Function**:
```typescript
const setReminderTime = async (time: string) => {
  try {
    setReminderTimeState(time);
    await SecureStore.setItemAsync(STORAGE_KEYS.REMINDER_TIME, time);
  } catch (error) {
    console.error('Error setting reminder time:', error);
  }
};
```

### 2. Reminders Screen Updates (reminders.tsx)

**New State Variables**:
- `reminderTime`: Current selected time (synced from saved value)
- `showTimePicker`: Modal visibility control
- `selectedHour`: Hour picker value (1-12)
- `selectedMinute`: Minute picker value (0-59)
- `selectedPeriod`: AM/PM toggle

**New Handlers**:

#### `handleSaveTime()`
```typescript
const handleSaveTime = () => {
  const formattedMinute = selectedMinute.toString().padStart(2, '0');
  const newTime = `${selectedHour}:${formattedMinute} ${selectedPeriod}`;
  setReminderTime(newTime);
  setShowTimePicker(false);
};
```
- Formats selected time with zero-padded minutes
- Updates local state
- Closes modal

#### `handleTimePickerClose()`
```typescript
const handleTimePickerClose = () => {
  const [time, period] = reminderTime.split(' ');
  const [hour, minute] = time.split(':');
  setSelectedHour(parseInt(hour));
  setSelectedMinute(parseInt(minute));
  setSelectedPeriod(period as 'AM' | 'PM');
  setShowTimePicker(false);
};
```
- Reverts time picker to previous value if user cancels
- Prevents unintended changes

#### Updated `handleNext()`
```typescript
if (showReminders) {
  await saveReminderTime(reminderTime);
  console.log('[Reminders] Saved reminder time:', reminderTime);
}
```
- Saves reminder time to preferences when advancing
- Only saves if reminders are enabled

### 3. Time Picker Modal

**Features**:
- **Scrollable Hour Picker**: 1-12 hours
- **Scrollable Minute Picker**: 0-59 minutes
- **Scrollable Period Picker**: AM/PM
- **Live Preview**: Shows formatted time as user selects
- **Cancel/Done Buttons**: Confirm or discard changes

**Modal Structure**:
```
Modal (showTimePicker)
├── Header
│   ├── Cancel Button
│   ├── Title
│   └── Done Button
├── Picker Content
│   ├── Wheel Container
│   │   ├── Hour Scroll
│   │   ├── Minute Scroll
│   │   └── Period Scroll
│   └── Preview Display
└── (Auto-closes on Done/Cancel)
```

**Styling**:
- Color-coded selected items with accent color
- Accent background highlight for selected value
- Larger font size (24px) for readability
- Bold text for selected items
- Border radius and background for visual grouping

## Data Flow Diagram

```
Reminders Screen
    ↓
[User Taps "Change" Button]
    ↓
[Modal Opens with Time Picker]
    ↓
[User Selects Hour/Minute/Period]
    ↓
[Preview Updates Live]
    ↓
[User Taps "Done"]
    ↓
[handleSaveTime() Called]
    ↓
setReminderTime(newTime)
    ↓
Preferences Context
    ↓
expo-secure-store
    ↓
[Data Persisted]
    ↓
[Modal Closes]
    ↓
[Card Subtitle Updates with New Time]
    ↓
[User Taps "Next" on Reminders Screen]
    ↓
[handleNext() Called]
    ↓
saveReminderTime(reminderTime)
    ↓
[Time Saved to Secure Storage]
    ↓
[Onboarding Continues...]
```

## Usage Example

### Reading Reminder Time
```tsx
const { reminderTime } = usePreferences();
console.log(`Reminders scheduled for: ${reminderTime}`);
```

### Updating Reminder Time
```tsx
const { setReminderTime } = usePreferences();

const handleChangeTime = async () => {
  await setReminderTime('03:30 PM');
};
```

### Loading Time on Component Mount
```tsx
useEffect(() => {
  const [time, period] = reminderTime.split(' ');
  const [hour, minute] = time.split(':');
  setSelectedHour(parseInt(hour));
  setSelectedMinute(parseInt(minute));
  setSelectedPeriod(period as 'AM' | 'PM');
}, []);
```

## Time Format Specification

**Format**: `"HH:MM AM/PM"`

**Examples**:
- `"09:00 AM"` - 9:00 AM
- `"12:30 PM"` - 12:30 PM
- `"01:15 AM"` - 1:15 AM
- `"11:59 PM"` - 11:59 PM

**Parsing Logic**:
```typescript
const [time, period] = reminderString.split(' ');
const [hours, minutes] = time.split(':');
```

## UI Components

### Time Button
- **Text**: "Change"
- **Color**: Accent color
- **Size**: 12px font, padding 14x8
- **Border Radius**: 8px
- **Location**: Right side of reminder time card

### Modal
- **Animation**: Slide from bottom
- **Backdrop**: Semi-transparent (optional)
- **Header**: Fixed with Cancel/Done buttons
- **Body**: Centered time picker wheels
- **Footer**: Live time preview

### Time Picker Wheels
- **Height**: 250px (5 items visible)
- **Item Height**: 50px
- **Font Size**: 24px
- **Highlight**: Accent background color
- **Scrollable**: Yes, with snap-to-item effect

## Testing Checklist

✅ **Functionality**:
- [ ] Time picker modal opens when "Change" button tapped
- [ ] Hour wheel scrolls 1-12
- [ ] Minute wheel scrolls 0-59
- [ ] Period toggle switches AM/PM
- [ ] Selected values highlight with accent color
- [ ] Preview text updates in real-time
- [ ] "Done" button saves selected time
- [ ] "Cancel" button reverts to previous time
- [ ] Time persists after closing modal
- [ ] Time persists after completing onboarding
- [ ] Time persists after app restart

✅ **Persistence**:
- [ ] Time saved to secure storage on "Next"
- [ ] Time loaded from storage on component mount
- [ ] Time format is correct (HH:MM AM/PM)
- [ ] Default time is "09:00 AM"

✅ **UI/UX**:
- [ ] Modal slides up smoothly
- [ ] Picker wheels are easy to scroll
- [ ] Selected items are visually distinct
- [ ] Preview is easy to read
- [ ] Header buttons are accessible
- [ ] Text doesn't overflow
- [ ] Works in both light and dark themes

## Integration Points

### File Dependencies
1. **context/Preferences.tsx** - Storage & state management
2. **app/(onboarding)/reminders.tsx** - Time picker UI & handlers

### Context Hooks Used
```typescript
const { reminderTime, setReminderTime } = usePreferences();
const { setReminderTime: saveReminderTime } = usePreferences();
```

### SecureStore Keys
```typescript
'pref_reminder_time' // String format: "HH:MM AM/PM"
```

## Performance Considerations

1. **No Network Calls**: All data stored locally
2. **Lazy Loading**: Preferences loaded once on app start
3. **Memoized Handlers**: useCallback prevents unnecessary re-renders
4. **Efficient Storage**: Single string value, minimal disk I/O
5. **State Management**: React state for quick UI updates

## Future Enhancements

1. **Multiple Reminders**: Support 2-3 reminder times per day
2. **Custom Intervals**: Remind every 2/4/6 hours
3. **Notification Integration**: Actually send notifications at scheduled time
4. **Timezone Support**: Handle timezone changes
5. **Snooze Functionality**: Snooze specific reminders
6. **Reminder History**: Track which reminders were dismissed
7. **Smart Suggestions**: Recommend times based on user behavior

## Security Notes

- ✅ Time stored in expo-secure-store (encrypted)
- ✅ No sensitive data exposure
- ✅ No network transmission
- ✅ Local device only
- ✅ Safe to restore from backup

## Error Handling

```typescript
const setReminderTime = async (time: string) => {
  try {
    setReminderTimeState(time);
    await SecureStore.setItemAsync(STORAGE_KEYS.REMINDER_TIME, time);
  } catch (error) {
    console.error('Error setting reminder time:', error);
    // Gracefully continue with in-memory state
  }
};
```

Errors are logged but don't break functionality - in-memory state persists for current session.

## Version History

- **v1.0.0** - Initial implementation with 12-hour format picker
  - Hour: 1-12
  - Minute: 0-59
  - Period: AM/PM
  - Storage: expo-secure-store
  - Format: "HH:MM AM/PM"

## Summary

The reminder time selection functionality is now complete and fully integrated with the app's preferences system. Users can easily change their daily reminder time, and it will persist across app sessions using secure encrypted storage.
