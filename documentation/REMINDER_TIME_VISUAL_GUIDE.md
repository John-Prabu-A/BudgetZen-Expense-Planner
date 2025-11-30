# Reminder Time Selection - Visual Guide & Architecture

## User Interface Flow

### Screen 1: Reminders Onboarding Screen
```
┌─────────────────────────────────────┐
│                                     │
│  Reminders              3/4         │
│                                     │
│  Get daily reminders to track      │
│  your spending                      │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🔔 Daily Reminders     [🔘] │   │  <- OFF
│  │  Get reminders to log       │   │
│  │  your expenses              │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🕐 Reminder Time            │   │
│  │  09:00 AM      [Change]     │   │  <- ON (if enabled)
│  └─────────────────────────────┘   │
│                                     │
│  Why reminders?                    │
│  • Stay focused on budget goals    │
│  • Track spending consistently     │
│  • Build better habits             │
│                                     │
│           [Next →]                 │
│                                     │
└─────────────────────────────────────┘
```

### Screen 2: Time Picker Modal (When "Change" Tapped)
```
┌──────────────────────────────────────┐
│  Cancel  Select Time  Done           │  <- Header
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐  │
│  │  Hour  │ Min │ Period          │  │
│  ├──────┼─────┼────────┤          │  │
│  │   08  │ 55  │  AM    │         │  │
│  │   09  │ 56  │  AM    │         │  │
│  │   10  │ 57  │  PM    │  <- Scrollable
│  │   11  │ 58  │  PM    │         │  │
│  │   12  │ 59  │        │         │  │
│  │   01  │ 00  │        │         │  │
│  └──────┼─────┼────────┘          │  │
│                                    │
│     Reminder will be at           │  <- Preview
│     09:00 AM                       │  │
│                                    │
└──────────────────────────────────────┘
```

## Data Architecture

### Storage Hierarchy
```
Device SecureStore (expo-secure-store)
    │
    ├── 'pref_theme' → "system"
    ├── 'pref_currency_sign' → "₹"
    ├── 'pref_remind_daily' → "true"
    └── 'pref_reminder_time' → "09:00 AM"  ← NEW
```

### Component Hierarchy
```
App Root
    │
    ├── PreferencesProvider (context/Preferences.tsx)
    │   │
    │   └── [Exposes]
    │       ├── reminderTime: string
    │       └── setReminderTime: (time: string) => Promise<void>
    │
    └── RemindersScreen (app/(onboarding)/reminders.tsx)
        │
        ├── [Uses]
        │   ├── reminderTime (from context)
        │   └── setReminderTime (from context)
        │
        ├── Time Picker Modal
        │   ├── Hour Selector (1-12)
        │   ├── Minute Selector (0-59)
        │   ├── Period Selector (AM/PM)
        │   ├── Live Preview
        │   └── Done/Cancel Buttons
        │
        └── Main Reminders Card
            └── Time Display + Change Button
```

## Data Flow Sequence Diagram

```
User                Modal              State              Context           Storage
 │                   │                  │                  │                 │
 ├─ Tap "Change" ───→│                  │                  │                 │
 │                   │                  │                  │                 │
 │                   ├─ Parse time ─→│                  │                 │
 │                   │ Init pickers   │                  │                 │
 │                   │                ├─ Load from ─────→│                 │
 │                   │                │  context          │                 │
 │                   │                │←─ reminderTime ──┤                 │
 │                   │←─ Show Modal ──┤                  │                 │
 │                   │                │                  │                 │
 ├─ Scroll Wheels ──→│                │                  │                 │
 │                   ├─ Update State ─→│                  │                 │
 │                   │  (hour/min)     │                  │                 │
 │                   │                  │                  │                 │
 │                   │←─ Show Preview ─│                  │                 │
 │                   │ (formatted)      │                  │                 │
 │                   │                  │                  │                 │
 ├─ Tap "Done" ─────→│                  │                  │                 │
 │                   ├─ handleSaveTime()→│                  │                 │
 │                   │  Format time    │                  │                 │
 │                   │                ├─ setReminderTime()→│                 │
 │                   │                │                  ├─ setState ───────→│
 │                   │                │                  │                  │
 │                   │                │                  ├─ setItemAsync ───→│
 │                   │                │                  │  (secure-store)  │
 │                   │                │                  │←─ Success ───────┤
 │                   │                │←─ return ────────┤                 │
 │                   │←─ Close Modal ─│                  │                 │
 │                   │  Update UI      │                  │                 │
 │                   │                  │                  │                 │
 └─ Main Screen      │                  │                  │                 │
    with new time    │                  │                  │                 │
    displayed        │                  │                  │                 │
```

## State Transitions

```
┌─────────────────────────────────────────┐
│      Component Mount                    │
│  (Parse saved time from context)        │
└──────────────────┬──────────────────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ Reminders Screen    │
        │ Displayed           │
        │ reminderTime: "9:00"│
        │ showTimePicker: false
        └──────────┬──────────┘
                   │
              [User Action]
                   │
     ┌─────────────┼─────────────┐
     │             │             │
     ▼             ▼             ▼
  Tap Toggle   Tap "Change"  Tap "Next"
    │             │             │
    │             ▼             │
    │     ┌─────────────────┐   │
    │     │ Time Picker     │   │
    │     │ Modal Opens     │   │
    │     │ showTimePicker: │   │
    │     │ true            │   │
    │     └──────┬──────┬──┘   │
    │            │      │       │
    │        [Scroll]   │       │
    │            │    [Tap]     │
    │            │      │       │
    │      ┌─────▼──┐ ┌─▼──────┐
    │      │ "Done" │ │"Cancel"│
    │      └─────┬──┘ └──┬─────┘
    │            │       │
    │            ▼       ▼
    │        Save &   Cancel &
    │        Close    Revert
    │            │       │
    ▼            ▼       ▼
  Toggle    Back to  Back to
  State     Screen   Modal

         [User Taps Next]
              │
              ▼
         saveReminderTime()
              │
              ▼
    setReminderTime(time)
              │
              ▼
    SecureStore.setItemAsync()
              │
              ▼
    ✅ Persisted
              │
              ▼
    Continue Onboarding
```

## Code Structure

### File: context/Preferences.tsx
```typescript
Interface PreferencesContextType
├── reminderTime: string              // NEW
└── setReminderTime: Function         // NEW

Constant STORAGE_KEYS
├── REMIND_DAILY: 'pref_remind_daily'
└── REMINDER_TIME: 'pref_reminder_time'  // NEW

Constant DEFAULT_VALUES
├── remindDaily: true
└── reminderTime: '09:00 AM'             // NEW

Function loadPreferences()
├── Load REMIND_DAILY
└── Load REMINDER_TIME                   // NEW

Function setReminderTime(time: string)   // NEW
├── Update state
└── Save to SecureStore

Function PreferencesProvider()
└── Expose all values and setters
```

### File: app/(onboarding)/reminders.tsx
```typescript
Constants
├── HOURS = [1, 2, ..., 12]
├── MINUTES = [0, 1, ..., 59]
└── PERIODS = ['AM', 'PM']

State Variables
├── reminderTime: string               // Current selected time
├── showTimePicker: boolean            // Modal visible?
├── selectedHour: number               // 1-12
├── selectedMinute: number             // 0-59
└── selectedPeriod: 'AM' | 'PM'

Effect Hooks
├── Parse saved time on mount
└── Run animations

Handler Functions
├── handleSaveTime()                   // Format & close
├── handleTimePickerClose()            // Cancel & revert
└── handleNext()                       // Save to preferences

Render
├── Main Reminders Screen
└── Time Picker Modal
    ├── Header (Cancel/Title/Done)
    ├── 3 Scrollable Wheels
    └── Live Preview
```

## UI Component Breakdown

### Time Button
```
┌──────────┐
│  Change  │  Click to open picker
└──────────┘

Styling:
- Background: colors.accent
- Text Color: colors.textOnAccent
- Padding: 14px vertical, 8px horizontal
- Border Radius: 8px
- Font Size: 12px bold
```

### Modal Header
```
┌─────────────────────────────────┐
│ Cancel    Select Time    Done    │  Fixed at top
└─────────────────────────────────┘

- Flex layout with space-between
- Cancel & Done are tappable
- Title centered
```

### Picker Wheels
```
Before:          During:           After:
  01              01                01
  02              02                02
  03              03 ← Selected      03
  04              04 (highlighted)   04
  05              05                05
  06              06                06

Each wheel:
- Height: 250px
- Item height: 50px
- Font: 24px
- Scrollable by dragging
- Snap to item on release
```

### Preview Display
```
┌──────────────────────┐
│ Reminder will be at  │  Hint text
│                      │
│   09:00 AM           │  Large, accent color
└──────────────────────┘
```

## Integration Checklist

- [x] Added reminderTime to Preferences interface
- [x] Added storage key REMINDER_TIME
- [x] Added default value "09:00 AM"
- [x] Added state variable in Provider
- [x] Added load logic in loadPreferences()
- [x] Added setReminderTime() function
- [x] Added to context value object
- [x] Created time picker modal UI
- [x] Created picker wheel components
- [x] Implemented time formatting
- [x] Implemented save handler
- [x] Implemented cancel handler
- [x] Connected Change button
- [x] Updated handleNext() to save
- [x] Added comprehensive styling
- [x] Tested parsing and formatting
- [x] Created documentation

## Security & Privacy

✅ Data is encrypted by expo-secure-store
✅ No sensitive information exposed
✅ No network transmission
✅ Local device only
✅ No tracking or analytics
✅ Safe to backup/restore

---

This comprehensive guide shows how the reminder time selection feature is architected, implemented, and integrated into the app!
