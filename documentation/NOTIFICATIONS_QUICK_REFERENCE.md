# Notifications Preferences - Quick Reference Card

## 🎯 The 6 Notification Preferences

| # | Preference | Type | Storage Key | Default | Component |
|---|-----------|------|-------------|---------|-----------|
| 1 | Remind Everyday | Toggle | `pref_remind_daily` | true | Switch |
| 2 | Set Reminder Time | Button | `pref_reminder_time` | 09:00 AM | Time Picker |
| 3 | Budget Alerts | Toggle | `pref_budget_alerts` | true | Switch |
| 4 | Low Balance Alerts | Toggle | `pref_low_balance_alerts` | true | Switch |
| 5 | Email Notifications | Toggle | `pref_email_notifications` | true | Switch |
| 6 | Push Notifications | Toggle | `pref_push_notifications` | true | Switch |

---

## 💾 How to Access Preferences

```typescript
import { usePreferences } from '@/context/Preferences';

// Inside component
const {
  remindDaily,
  setRemindDaily,
  reminderTime,
  setReminderTime,
  budgetAlerts,
  setBudgetAlerts,
  lowBalanceAlerts,
  setLowBalanceAlerts,
  emailNotifications,
  setEmailNotifications,
  pushNotifications,
  setPushNotifications,
} = usePreferences();
```

---

## 🔄 How to Use Each Preference

### 1. Remind Everyday
```typescript
// Check if enabled
if (remindDaily) {
  console.log('Daily reminders are ON');
  // Send reminder at reminderTime
}

// Toggle
await setRemindDaily(true);  // Enable
await setRemindDaily(false); // Disable
```

### 2. Set Reminder Time
```typescript
// Get current time
console.log(reminderTime); // "09:00 AM"

// Set new time
await setReminderTime("07:30 PM");

// Accepts formats
await setReminderTime("19:30");      // 24-hour
await setReminderTime("7:30 PM");    // 12-hour
await setReminderTime("07:30 AM");   // Padded
```

### 3. Budget Alerts
```typescript
// Check if enabled
if (budgetAlerts) {
  console.log('Budget alerts are ON');
  // Send budget exceeded alert
}

// Toggle
await setBudgetAlerts(true);
await setBudgetAlerts(false);
```

### 4. Low Balance Alerts
```typescript
// Check if enabled
if (lowBalanceAlerts) {
  console.log('Low balance alerts are ON');
  // Send low balance alert
}

// Toggle
await setLowBalanceAlerts(true);
await setLowBalanceAlerts(false);
```

### 5. Email Notifications
```typescript
// Check if enabled
if (emailNotifications) {
  console.log('Email notifications are ON');
  // Queue email notification
}

// Toggle
await setEmailNotifications(true);
await setEmailNotifications(false);
```

### 6. Push Notifications
```typescript
// Check if enabled (master switch)
if (pushNotifications) {
  console.log('Push notifications are ON');
  // Send push notification
}

// Toggle (disables all notifications)
await setPushNotifications(true);
await setPushNotifications(false);
```

---

## 📍 File Locations

| File | Location | What It Does |
|------|----------|--------------|
| Preferences Context | `context/Preferences.tsx` | Manages all preferences |
| Notifications Modal | `app/(modal)/notifications-modal.tsx` | UI for preferences |
| Time Picker | `components/ReminderTimePicker.tsx` | Time selection UI |
| Testing Guide | `documentation/NOTIFICATIONS_TESTING_GUIDE.md` | How to test |
| Integration Guide | `documentation/NOTIFICATIONS_PREFERENCES_CONNECTED.md` | How to integrate |

---

## 🧪 Quick Testing

### Test 1: Toggle All Switches
```
1. Open Preferences
2. Tap Notifications
3. Toggle each switch ON/OFF
4. Verify console shows: [Preferences] ... set to: true/false
5. Close and reopen app
6. Verify switch states persist
```

### Test 2: Change Reminder Time
```
1. Open Notifications
2. Tap "Set Reminder Time"
3. Select new time (e.g., 07:30 PM)
4. Tap "Done"
5. Verify button shows new time
6. Close and reopen app
7. Verify time persists
```

### Test 3: Check Console
```
1. Open console (React Native Debugger)
2. Toggle preference
3. Look for: 🔔 [NotificationsModal] Preferences updated: {...}
4. Verify changed value
```

---

## 🔍 Debugging Checklist

- [ ] Is preference in context interface? ✓
- [ ] Is storage key defined? ✓
- [ ] Is default value set? ✓
- [ ] Is state declared? ✓
- [ ] Is loader logic added? ✓
- [ ] Is setter function created? ✓
- [ ] Is it added to value object? ✓
- [ ] Is switch/button connected? ✓
- [ ] Does console show changes? ✓
- [ ] Does it persist after restart? ✓

---

## 🎯 Usage Patterns

### Pattern 1: Simple Toggle Check
```typescript
// In any service
const prefs = usePreferences();
if (!prefs.budgetAlerts) return; // Skip if disabled
// Proceed with notification
```

### Pattern 2: With Time
```typescript
// In DailyReminderJob
const prefs = usePreferences();
if (!prefs.remindDaily) return;
const time = parseTime(prefs.reminderTime);
scheduleAt(time);
```

### Pattern 3: Multiple Conditions
```typescript
// In NotificationService
const prefs = usePreferences();
if (!prefs.pushNotifications) return; // Master switch
if (!prefs.budgetAlerts && isBudgetAlert) return;
if (!prefs.lowBalanceAlerts && isLowBalanceAlert) return;
// Send notification
```

---

## 📊 Storage Format

```typescript
// SecureStore entries
{
  'pref_remind_daily': 'true' | 'false',
  'pref_reminder_time': 'HH:MM AM/PM', // e.g., "09:00 AM"
  'pref_budget_alerts': 'true' | 'false',
  'pref_low_balance_alerts': 'true' | 'false',
  'pref_email_notifications': 'true' | 'false',
  'pref_push_notifications': 'true' | 'false',
}
```

---

## ✅ Status Checklist

- [x] All preferences accessible via context
- [x] All preferences persist to SecureStore
- [x] All preferences restore on app start
- [x] All preferences have setters
- [x] All setters update state
- [x] All setters persist changes
- [x] UI switches connected
- [x] Time picker working
- [x] Console logging enabled
- [x] Zero TypeScript errors
- [x] Ready for integration

---

## 🚀 Integration Checklist

**Before using preferences in services:**

- [ ] Preferences are loaded (check app startup)
- [ ] Check preference before proceeding
- [ ] Log when skipping due to preference
- [ ] Log when proceeding with notification
- [ ] Test with preference ON
- [ ] Test with preference OFF
- [ ] Verify persistence across sessions

---

## 💡 Common Patterns

### Check and Skip
```typescript
const { budgetAlerts } = usePreferences();
if (!budgetAlerts) {
  console.log('⏭️ Budget alerts disabled');
  return;
}
```

### Log When Executing
```typescript
console.log('📧 Sending email notification');
console.log('[Preferences] Email notifications:', emailNotifications);
if (!emailNotifications) return;
```

### Get and Use Time
```typescript
const { reminderTime } = usePreferences();
const [hour, minute] = parseTime(reminderTime);
schedule({ hour, minute });
```

---

## 🔧 Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| Preference doesn't change | Check setPreference is called, verify no errors |
| Change doesn't persist | Check SecureStore key matches, verify storage works |
| Modal overlaps status bar | Already fixed in ReminderTimePicker |
| Console doesn't show logs | Check React Native Debugger is open |
| Time picker doesn't save | Verify setReminderTime is in onTimeChange callback |

---

## 📱 Platform-Specific

### Android
- All preferences work
- Respects status bar (SafeAreaView)
- SecureStore uses AndroidKeyStore
- Push notifications through FCM

### iOS
- All preferences work
- Respects safe area with notch/home indicator
- SecureStore uses Keychain
- Push notifications through APNs

---

## 🎓 Key Concepts

**Preference**: User setting stored in SecureStore (boolean or string)
**Context**: React Context API provides access throughout app
**Setter**: Async function that updates state and persists to storage
**Storage Key**: Unique identifier in SecureStore (e.g., `pref_remind_daily`)
**Master Switch**: Push Notifications (when disabled, disables all push)
**Dependent**: Remind Daily depends on Reminder Time

---

## ⚡ Performance Notes

- SecureStore writes are async (non-blocking)
- Preferences loaded once on app start
- Context updates trigger minimal re-renders
- useEffect optimized with dependency arrays
- No memory leaks or infinite loops

---

## 📝 Code Examples

### Example 1: Access Preference
```typescript
const { budgetAlerts } = usePreferences();
```

### Example 2: Toggle Preference
```typescript
const { setBudgetAlerts } = usePreferences();
await setBudgetAlerts(!currentValue);
```

### Example 3: Check and Act
```typescript
const { pushNotifications, budgetAlerts } = usePreferences();
if (pushNotifications && budgetAlerts) {
  sendNotification('Budget Alert');
}
```

### Example 4: Get Time Value
```typescript
const { reminderTime } = usePreferences();
console.log(`Reminder set for ${reminderTime}`);
```

---

## 🎯 Next: Integration Steps

1. ✅ Preferences defined and stored
2. ✅ UI implemented and working
3. ⏳ Services need to check preferences:
   - [ ] DailyReminderJob → check `remindDaily`
   - [ ] BudgetService → check `budgetAlerts`
   - [ ] AccountService → check `lowBalanceAlerts`
   - [ ] EmailService → check `emailNotifications`
   - [ ] NotificationService → check `pushNotifications`

---

**Quick Start**: Open Preferences → Notifications → See all 6 preferences in action!

**Need Help?** See `NOTIFICATIONS_TESTING_GUIDE.md` or `NOTIFICATIONS_PREFERENCES_CONNECTED.md`

**Status**: ✅ Ready for Use
