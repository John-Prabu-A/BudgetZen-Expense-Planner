# Visual Guide: Set Reminder Time Feature

## UI Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   PREFERENCES SCREEN                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [← Back] Preferences                                   │
│           Personalize your experience                   │
│                                                          │
│  ───────────────────────────────────────────────────   │
│  APPEARANCE                                             │
│  ───────────────────────────────────────────────────   │
│  🎨 Theme                          System ›             │
│  ▲ UI Mode                         Standard ›           │
│  ...                                                     │
│                                                          │
│  ───────────────────────────────────────────────────   │
│  NOTIFICATIONS  ← YOU ARE HERE                          │
│  ───────────────────────────────────────────────────   │
│                                                          │
│  🔔 Daily Reminder          [Toggle ON/OFF]            │
│     Get reminded to log...                              │
│                                                          │
│     ⏰ Set Reminder Time    [Button]                    │
│        9:00 AM              › (appears when ON)         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Time Picker Modal Layout

```
┌─────────────────────────────────────────────────────────┐
│ Cancel              Select Time              Done        │  ← Header
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Hour  │ Minute │ Period                           │ │  ← Scroll Wheels
│  ├────────────────────────────────────────────────────┤ │
│  │  01    │  00    │  AM                              │ │
│  │  02    │  01    │  PM                              │ │
│  │  ●03   │  02    │  ●AM      (selected)             │ │
│  │  04    │  03    │  PM                              │ │
│  │  05    │  04    │                                  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Reminder will be at                                    │ ← Preview
│  03:02 AM                                               │   Section
│                                                          │
│  ℹ️  Notifications will be delivered daily at           │ ← Info Box
│     this time, even if the app is closed.              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## State Flow Diagram

```
                    User Action
                        │
                        ▼
            ┌──────────────────────┐
            │ Tap "Set Reminder"   │
            │ Time" Button         │
            └──────────────────────┘
                        │
                        ▼
            ┌──────────────────────┐
            │ ReminderTimePicker   │ ← Modal Opens
            │ Modal Shows          │   with current time
            │ Current Time         │
            └──────────────────────┘
                        │
                ┌───────┴────────┐
                │                │
                ▼                ▼
        ┌──────────────┐  ┌──────────────┐
        │ User Selects │  │ User Taps    │
        │ New Time     │  │ Cancel       │
        └──────────────┘  └──────────────┘
                │                │
                ▼                ▼
        ┌──────────────┐  ┌──────────────┐
        │ User Taps    │  │ Modal Closes │
        │ Done Button  │  │ Time Reverts │
        └──────────────┘  └──────────────┘
                │
                ▼
        ┌──────────────────────────┐
        │ setReminderTime() Called │
        │ with Selected Time       │
        └──────────────────────────┘
                │
                ▼
        ┌──────────────────────────┐
        │ Context Updated          │
        │ Local State Changed      │
        └──────────────────────────┘
                │
                ▼
        ┌──────────────────────────┐
        │ SecureStore Updated      │
        │ Time Persisted           │
        └──────────────────────────┘
                │
                ▼
        ┌──────────────────────────┐
        │ UI Refreshes             │
        │ New Time Displayed       │
        │ Modal Closes             │
        └──────────────────────────┘
```

## Component Hierarchy

```
App Root
│
├── Preferences Screen
│   │
│   ├── Header
│   │   ├── Title: "Preferences"
│   │   └── Subtitle: "Personalize your experience"
│   │
│   ├── ScrollView
│   │   │
│   │   ├── Appearance Section
│   │   │   ├── Theme Row
│   │   │   ├── UI Mode Row
│   │   │   └── ...
│   │   │
│   │   └── Notifications Section  ← FOCUS AREA
│   │       ├── Section Header: "Notifications"
│   │       │
│   │       ├── ToggleRow (Daily Reminder)
│   │       │   ├── Icon: bell
│   │       │   ├── Label: "Daily Reminder"
│   │       │   ├── Description: "Get reminded to log..."
│   │       │   └── Switch: ON/OFF
│   │       │
│   │       └── [Conditional] When Enabled:
│   │           ├── TouchableOpacity
│   │           │   ├── Icon: clock
│   │           │   ├── Label: "Set Reminder Time"
│   │           │   ├── Value: "9:00 AM"
│   │           │   └── onPress → setShowTimePickerModal(true)
│   │           │
│   │           └── ReminderTimePicker Modal
│   │               ├── Header
│   │               │   ├── Cancel Button
│   │               │   ├── Title: "Select Time"
│   │               │   └── Done Button
│   │               │
│   │               ├── Content
│   │               │   ├── Scroll Wheels
│   │               │   │   ├── Hours (1-12)
│   │               │   │   ├── Minutes (0-59)
│   │               │   │   └── Period (AM/PM)
│   │               │   │
│   │               │   ├── Preview Section
│   │               │   │   └── Selected Time Display
│   │               │   │
│   │               │   └── Info Box
│   │               │       └── Notification Info
│   │               │
│   │               └── Modal Events
│   │                   ├── onTimeChange
│   │                   └── onClose
│   │
│   └── Other Sections...
│
└── Modals
    └── OptionModals
        └── ReminderTimePicker ← Key Modal
```

## Data Structure

```
Preferences Context
│
├── reminderTime: string
│   └── Format: "HH:MM AM/PM"
│   └── Example: "07:30 PM"
│   └── Stored in: SecureStore
│   └── Key: "pref_reminder_time"
│
└── setReminderTime: (time: string) => Promise<void>
    ├── Input: Accepts multiple formats
    ├── Processing: Normalizes to "HH:MM AM/PM"
    ├── Storage: Updates SecureStore
    └── Event: Triggers UI update

SecureStore
│
└── pref_reminder_time: "07:30 PM"
    └── Persists across app restarts
    └── Encrypted storage
    └── User device only

[Future] Supabase
│
└── user_notification_preferences
    ├── id: UUID
    ├── user_id: UUID
    ├── daily_reminder_time: "19:30" (24-hour)
    ├── daily_reminder_enabled: boolean
    └── updated_at: timestamp
```

## Time Format Conversion Flow

```
User Input
    │
    ├─ "9:30 PM"
    ├─ "09:30 PM"
    ├─ "9:30"
    ├─ "21:30"
    └─ "21:30:00"
        │
        ▼
Input Validation & Parsing
    │
    ├─ Check format validity
    ├─ Extract hours, minutes
    ├─ Identify AM/PM or convert
    └─ Validate ranges
        │
        ▼
Normalization
    │
    ├─ Convert to 12-hour if 24-hour
    ├─ Pad zeros
    ├─ Set period (AM/PM)
    └─ Format: "HH:MM AM/PM"
        │
        ▼
Storage
    │
    ├─ Local: SecureStore as "HH:MM AM/PM"
    └─ Remote: [Future] Supabase as "HH:MM" (24-hour)
        │
        ▼
Display
    │
    └─ Show as "HH:MM AM/PM"
```

## Event Flow Sequence

```
Timeline of User Interaction

[T0] App Loads
├─ Preferences context initialized
├─ reminderTime loaded from SecureStore
└─ UI renders with current time

[T1] User navigates to Preferences
├─ Preferences Screen mounted
├─ showTimePickerModal state = false
└─ "Set Reminder Time" button visible

[T2] User taps "Set Reminder Time"
├─ setShowTimePickerModal(true)
├─ ReminderTimePicker modal visible
├─ Modal parses current time
├─ Scroll wheels initialized
└─ Preview shows current time

[T3] User scrolls hour wheel to 5
├─ selectedHour state = 5
├─ Preview updates to "5:xx PM"
└─ Feedback provided

[T4] User scrolls minute wheel to 30
├─ selectedMinute state = 30
├─ Preview updates to "5:30 PM"
└─ Feedback provided

[T5] User taps "Done"
├─ Modal calls onTimeChange("05:30 PM")
├─ Preferences.setReminderTime() called
├─ Local state updated
├─ SecureStore.setItemAsync() called
└─ Modal closes

[T6] Post-Confirmation
├─ Preferences screen visible
├─ "Set Reminder Time" shows "5:30 PM"
├─ No modal visible
└─ Data persisted

[T7] Time Persists
├─ SecureStore has "05:30 PM"
├─ Survives app restart
├─ Available on next load
└─ Consistency maintained
```

## Conditional Rendering Logic

```
Notifications Section Rendering
│
├─ remindDaily = false
│   │
│   └─ Display:
│       ├─ ToggleRow (OFF)
│       └─ No time picker
│
├─ remindDaily = true
│   │
│   └─ Display:
│       ├─ ToggleRow (ON)
│       ├─ Separator line (top border)
│       ├─ Time Picker Button Row
│       │   ├─ Icon: clock
│       │   ├─ Text: "Set Reminder Time"
│       │   ├─ Subtitle: reminderTime value
│       │   └─ Chevron: ›
│       └─ Tap Handler: onPress={() => setShowTimePickerModal(true)}
│
└─ Time Picker Modal
    │
    ├─ visible = showTimePickerModal
    ├─ currentTime = reminderTime
    ├─ onTimeChange = setReminderTime
    ├─ onClose = setShowTimePickerModal(false)
    └─ title = "Set Reminder Time"
```

## Color & Styling System

```
ReminderTimePicker Modal
│
├─ Background: colors.background
├─ Header: colors.surface + border
├─ Text: colors.text
├─ Secondary Text: colors.textSecondary
│
├─ Scroll Wheels Container
│   ├─ Background: colors.accent + '08' (10% opacity)
│   ├─ Border Color: colors.accent + '30' (30% opacity)
│   ├─ Selected Item Background: colors.accent + '20' (20% opacity)
│   ├─ Selected Text Color: colors.accent
│   ├─ Unselected Text Color: colors.text
│   └─ Font Weight: Bold (selected), Medium (unselected)
│
├─ Preview Section
│   ├─ Label: colors.textSecondary
│   └─ Time: colors.accent (prominent)
│
└─ Info Box
    ├─ Background: colors.accent + '10' (10% opacity)
    ├─ Border: colors.accent + '30' (30% opacity)
    ├─ Icon: colors.accent
    └─ Text: colors.textSecondary
```

## Error Handling Paths

```
Time Format Error
│
├─ Invalid Input
│   └─ "invalid_time_string"
│       ├─ Try/catch triggered
│       ├─ Error logged: "Invalid time format: invalid_time_string"
│       ├─ Fallback: "19:00" used
│       └─ UI: User sees default time
│
├─ Parse Error
│   └─ parseInt() returns NaN
│       ├─ Validation check triggered
│       ├─ Error logged
│       ├─ Fallback: Default time used
│       └─ Graceful degradation
│
└─ Empty/Null Input
    └─ Missing time value
        ├─ Validation catches it
        ├─ User stays in modal
        └─ Prompt to try again
```

## Testing Verification Checkpoints

```
Test Phase 1: Visibility
├─ [ ] Preferences screen loads
├─ [ ] Notifications section visible
├─ [ ] "Set Reminder Time" button visible
└─ [ ] Current time displayed

Test Phase 2: Modal Interaction
├─ [ ] Tap button opens modal
├─ [ ] Current time selected in wheels
├─ [ ] Preview shows current time
├─ [ ] Can scroll wheels
├─ [ ] Preview updates while selecting
└─ [ ] Done/Cancel buttons work

Test Phase 3: Persistence
├─ [ ] Tap "Done" saves time
├─ [ ] UI updates immediately
├─ [ ] Check SecureStore has value
├─ [ ] Kill and restart app
├─ [ ] Time still shows saved value
└─ [ ] SecureStore still has value

Test Phase 4: Edge Cases
├─ [ ] Rapid time changes
├─ [ ] Toggle reminders off/on
├─ [ ] Change time while disabled
├─ [ ] Multiple time selections
└─ [ ] Invalid format handling
```

---

This visual guide provides comprehensive diagrams and flows for understanding the "Set Reminder Time" feature implementation.
