# Push Notification Service - Testing Guide

## 🧪 Comprehensive Testing Strategy

This guide walks you through testing all notification features systematically.

---

## ✅ Phase 1: Setup & Verification (Before Testing)

### Check Installation
```bash
# Verify dependencies are installed
npm list expo-notifications expo-constants expo-secure-store

# Verify files exist
ls -la lib/notifications/
ls -la context/Notifications.tsx
ls -la hooks/useNotifications.ts
ls -la lib/deepLinking.ts
```

### Check Supabase Tables
1. Go to Supabase Dashboard
2. SQL Editor → New Query
3. Run: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
4. Verify these tables exist:
   - `notification_tokens`
   - `notification_preferences`
   - `notification_events` (optional)

### Check app.json Configuration
```bash
# Verify notification plugin is configured
grep -A 15 "expo-notifications" app.json
```

Should show:
```json
[
  "expo-notifications",
  {
    "icon": "./assets/images/notification_icon.png",
    "color": "#6366F1",
    "defaultChannel": "default",
    "enableBackgroundRemoteNotifications": true
  }
]
```

---

## 🚀 Phase 2: Build & Run

### Start Development Server
```bash
expo start
```

### Build for Testing
```bash
# Android
expo start --android

# iOS
expo start --ios

# Web (limited notification support)
expo start --web
```

### Build with Expo Go (Quick testing)
```bash
# Install Expo Go on physical device
# Scan QR code from `expo start` output
```

### Build for Physical Device (Recommended)
```bash
# Create development build
expo install expo-dev-client
eas build --platform android --profile preview

# Or for iOS
eas build --platform ios --profile preview
```

---

## 📋 Phase 3: Manual Testing Checklist

### Test 1: Permission Request
**Expected Behavior:**
- App asks for notification permission on first launch
- Permission dialog shows "BudgetZen" app name

**Test Steps:**
1. Launch app fresh (first time)
2. Grant notification permission
3. Check that permission is saved

**Pass Criteria:**
- ✅ Permission dialog appears
- ✅ Permission is saved
- ✅ No crashes

**Test Command (if no dialog):**
```bash
# Android: Check notification settings
adb shell dumpsys notification | grep budgetzen

# iOS: Check settings
settings get notifications
```

---

### Test 2: Token Registration
**Expected Behavior:**
- Device receives push token from Expo
- Token is saved locally
- Token is synced to Supabase

**Test Steps:**
```typescript
// In a component or hook
import useNotifications from '@/hooks/useNotifications';

const { registerPushToken } = useNotifications();

// Call this function
const result = await registerPushToken();
console.log('Token registration:', result);

// Check Supabase
// Go to notification_tokens table
// Verify row exists with your user_id
```

**Pass Criteria:**
- ✅ registerPushToken() returns success
- ✅ Row created in notification_tokens table
- ✅ Token is not empty
- ✅ Log shows "✅ Push token registered"

---

### Test 3: Immediate Notification
**Expected Behavior:**
- Send a notification immediately
- Notification appears in notification center

**Test Steps:**
```typescript
import useNotifications from '@/hooks/useNotifications';

const { sendNotification } = useNotifications();

const result = await sendNotification({
  type: 'daily_reminder',
  title: '🧪 Test Notification',
  body: 'This is a test notification from BudgetZen',
  data: { screen: 'analysis', action: 'view_analysis' },
});

console.log('Send result:', result);
```

**Pass Criteria:**
- ✅ Result shows success
- ✅ Notification ID is returned
- ✅ Notification appears on device
- ✅ Notification has correct title and body

**Android Verification:**
```bash
adb logcat | grep "notification\|BudgetZen"
```

**iOS Verification:**
```bash
# Check device Notification Center
# Swipe down to see notifications
```

---

### Test 4: Scheduled Notification (Daily)
**Expected Behavior:**
- Schedule notification for specific time
- Notification sends at scheduled time

**Test Steps:**
```typescript
import useNotifications from '@/hooks/useNotifications';
import { useAuth } from '@/context/Auth';

const { scheduleDailyReminder, loadPreferences } = useNotifications();
const { session } = useAuth();

// Load preferences first
await loadPreferences(session.user.id);

// Schedule daily reminder (will use preference time)
await scheduleDailyReminder();

console.log('Daily reminder scheduled');

// Check scheduled notifications
import { notificationService } from '@/lib/notifications/NotificationService';
const scheduled = await notificationService.getScheduledNotifications();
console.log('Scheduled notifications:', scheduled);
```

**Pass Criteria:**
- ✅ Notification appears in scheduled list
- ✅ Notification sends at correct time (or soon if testing)
- ✅ Log shows scheduling message

**For Testing:**
Schedule for 1 minute from now to verify:
```typescript
const now = new Date();
const testTime = new Date(now.getTime() + 60000); // 1 minute from now

await notificationService.scheduleNotificationAtTime(
  payload,
  testTime.getHours(),
  testTime.getMinutes(),
  true // repeat daily
);
```

---

### Test 5: Weekly Notification
**Expected Behavior:**
- Schedule notification for specific day/time
- Notification sends on that day

**Test Steps:**
```typescript
import useNotifications from '@/hooks/useNotifications';

const { scheduleWeeklyReport, loadPreferences } = useNotifications();
const { session } = useAuth();

await loadPreferences(session.user.id);
await scheduleWeeklyReport();

// Check scheduled
const scheduled = await notificationService.getScheduledNotifications();
console.log(scheduled);
```

**Pass Criteria:**
- ✅ Notification scheduled for correct day of week
- ✅ Notification sends at correct time

---

### Test 6: Budget Warning Alert
**Expected Behavior:**
- Send budget warning when spending reaches 80%
- Notification has action buttons

**Test Steps:**
```typescript
const { sendBudgetWarning } = useNotifications();

// Simulate spending at 80% of budget
const budget = 5000;
const spent = 4000; // 80%

await sendBudgetWarning('Groceries', spent, budget);
```

**Pass Criteria:**
- ✅ Notification appears with warning icon
- ✅ Shows category name and percentage
- ✅ Action buttons appear (iOS/Android 7+)
- ✅ Body shows correct amounts

---

### Test 7: Budget Exceeded Alert
**Expected Behavior:**
- Send alert when spending exceeds budget
- Notification is more prominent (time-sensitive)

**Test Steps:**
```typescript
const { sendBudgetExceeded } = useNotifications();

// Simulate budget exceeded
const budget = 5000;
const spent = 5500; // 10% over

await sendBudgetExceeded('Entertainment', spent, budget);
```

**Pass Criteria:**
- ✅ Notification appears with alert icon
- ✅ Shows exceeded amount
- ✅ Badge count updated on app icon
- ✅ Sound plays (if enabled)

---

### Test 8: Achievement Notification
**Expected Behavior:**
- Send achievement for zero-spending day
- Notification uses passive interruption level

**Test Steps:**
```typescript
const { sendAchievement } = useNotifications();

await sendAchievement(
  '🎉 Great Job!',
  "You didn't spend anything today. Keep it up!"
);
```

**Pass Criteria:**
- ✅ Notification appears with celebration icon
- ✅ No sound/vibration (passive)
- ✅ Shows in notification center

---

### Test 9: Deep Linking
**Expected Behavior:**
- Tap notification navigates to correct screen
- Screen receives notification parameters

**Test Steps:**
```typescript
// Send notification with deep link data
const { sendNotification } = useNotifications();

await sendNotification({
  type: 'budget_warning',
  title: '⚠️ Budget Alert',
  body: 'Test navigation',
  data: {
    screen: 'budgets',
    action: 'view_budget',
    category: 'Groceries',
  },
});

// Tap the notification
// Expected: Navigate to Budgets screen with Groceries category highlighted
```

**Pass Criteria:**
- ✅ App opens when notification is tapped
- ✅ Correct screen is displayed
- ✅ Notification data is received by screen
- ✅ Screen displays correct category/details

**Test Android Deep Linking:**
```bash
# Send deep link
adb shell am start -a android.intent.action.VIEW -d "mymoney://(tabs)/budgets?category=Groceries" com.budgetzen.app
```

---

### Test 10: Notification Preferences
**Expected Behavior:**
- User can enable/disable notifications
- User can customize times
- Preferences are saved to Supabase

**Test Steps:**
```typescript
import useNotifications from '@/hooks/useNotifications';

const { updatePreference, preferences } = useNotifications();

// Toggle daily reminder
await updatePreference(['dailyReminder', 'enabled'], false);

// Change time
await updatePreference(['dailyReminder', 'time'], '18:00');

// Toggle budget alerts
await updatePreference(['budgetAlerts', 'enabled'], true);

// Check that preferences are updated
console.log(preferences);
```

**Pass Criteria:**
- ✅ Preferences update in UI
- ✅ Changes saved to Supabase
- ✅ Next app launch loads saved preferences
- ✅ Notifications respect preferences

---

### Test 11: Do Not Disturb
**Expected Behavior:**
- DND prevents notifications during set hours
- Notifications still send outside DND window

**Test Steps:**
```typescript
const { updatePreference } = useNotifications();

// Enable DND from 22:00 to 08:00
await updatePreference(['doNotDisturb', 'enabled'], true);
await updatePreference(['doNotDisturb', 'startTime'], '22:00');
await updatePreference(['doNotDisturb', 'endTime'], '08:00');

// Try sending notification at 23:00 (in DND)
// Expected: Notification blocked

// Try at 10:00 (outside DND)
// Expected: Notification sent
```

**Pass Criteria:**
- ✅ Notifications blocked during DND hours
- ✅ Notifications allowed outside DND hours
- ✅ DND preferences saved

---

### Test 12: Unusual Spending Alert
**Expected Behavior:**
- Alert when spending is 150%+ of average

**Test Steps:**
```typescript
const { sendUnusualSpending } = useNotifications();

const average = 1000;
const current = 1800; // 180% of average

await sendUnusualSpending(current, average);
```

**Pass Criteria:**
- ✅ Notification sent with warning
- ✅ Shows excess amount
- ✅ Includes link to analysis

---

### Test 13: Savings Goal Progress
**Expected Behavior:**
- Notify at milestones (25%, 50%, 75%, 100%)

**Test Steps:**
```typescript
const { sendSavingsGoalProgress } = useNotifications();

await sendSavingsGoalProgress(
  'Emergency Fund',
  50, // percentage
  5000, // current amount
  10000 // target amount
);
```

**Pass Criteria:**
- ✅ Notification sent with goal name
- ✅ Shows progress percentage
- ✅ Navigates to goals/analysis screen

---

### Test 14: Low Balance Alert
**Expected Behavior:**
- Alert when account balance is low

**Test Steps:**
```typescript
const { sendLowBalance } = useNotifications();

await sendLowBalance('Main Checking Account', 500);
```

**Pass Criteria:**
- ✅ Notification sent with account name
- ✅ Shows balance amount
- ✅ Time-sensitive notification

---

## 🔍 Phase 4: Automated Testing

### Create Test File
```typescript
// __tests__/notifications.test.ts
import { notificationService } from '@/lib/notifications/NotificationService';
import { notificationPreferencesManager } from '@/lib/notifications/notificationPreferences';
import { pushTokenManager } from '@/lib/notifications/pushTokens';

describe('Notification Service', () => {
  test('should send notification', async () => {
    const result = await notificationService.sendNotification({
      type: 'daily_reminder',
      title: 'Test',
      body: 'Test notification',
    });

    expect(result.success).toBe(true);
    expect(result.notificationId).toBeDefined();
  });

  test('should schedule notification', async () => {
    const result = await notificationService.scheduleNotificationAtTime(
      {
        type: 'daily_reminder',
        title: 'Test',
        body: 'Test',
      },
      14,
      30
    );

    expect(result.success).toBe(true);
  });

  test('should get preferences', async () => {
    const prefs = await notificationPreferencesManager.getPreferences('test-user-id');
    expect(prefs).toBeDefined();
  });
});
```

### Run Tests
```bash
npm test
# or
yarn test
```

---

## 📊 Phase 5: Performance Testing

### Measure Notification Latency
```typescript
const start = performance.now();
const result = await sendNotification(payload);
const end = performance.now();

console.log(`Notification latency: ${end - start}ms`);
// Target: < 500ms
```

### Monitor Memory Usage
```typescript
import { Alert } from 'react-native';

const memoryBefore = require('react-native/Libraries/Utilities/GlobalPerformanceLogger').getTimespans('Script download')[0];

// Send multiple notifications
for (let i = 0; i < 100; i++) {
  await sendNotification(payload);
}

const memoryAfter = require('react-native/Libraries/Utilities/GlobalPerformanceLogger').getTimespans('Script download')[0];

console.log(`Memory increase: ${memoryAfter - memoryBefore}MB`);
```

---

## 🐛 Phase 6: Debugging

### Enable Debug Logging
```typescript
// In app startup
import { notificationService } from '@/lib/notifications/NotificationService';

// Wrap all notification calls with logging
const originalSend = notificationService.sendNotification;
notificationService.sendNotification = async (payload) => {
  console.log('[DEBUG] Sending notification:', payload);
  const result = await originalSend(payload);
  console.log('[DEBUG] Send result:', result);
  return result;
};
```

### Check Logs
```bash
# Android
adb logcat -s "budgetzen:*" "*expo*"

# iOS
xcrun simctl spawn booted log stream --predicate 'eventMessage contains "BudgetZen"'

# Expo
expo logs
```

### Check Supabase Logs
```sql
-- View notification token registrations
SELECT * FROM notification_tokens
ORDER BY created_at DESC
LIMIT 10;

-- View preference changes
SELECT * FROM notification_preferences
WHERE updated_at > now() - interval '1 hour'
ORDER BY updated_at DESC;

-- View notification events
SELECT * FROM notification_events
ORDER BY timestamp DESC
LIMIT 50;
```

---

## ✨ Phase 7: Integration Testing

### Test with Real App Scenarios
```typescript
// Scenario: User creates expense exceeding budget
const { sendBudgetWarning, sendBudgetExceeded } = useNotifications();

// Create expense that hits 80%
const newExpense = 4000;
const budget = 5000;

if (newExpense / budget >= 0.8 && newExpense <= budget) {
  await sendBudgetWarning('Groceries', newExpense, budget);
  // ✅ Warning sent
}

// Create expense exceeding budget
const overExpense = 5500;
if (overExpense > budget) {
  await sendBudgetExceeded('Groceries', overExpense, budget);
  // ✅ Exceeded alert sent
}
```

### Test with Real Backend
```typescript
// Test full flow with actual Supabase
const userId = session.user.id;

// 1. Register token
await registerPushToken();

// 2. Sync with backend
await syncTokenWithBackend(userId);

// 3. Load preferences
await loadPreferences(userId);

// 4. Update preferences
await updatePreference(['budgetAlerts', 'enabled'], true);

// 5. Send notifications
await sendBudgetWarning('Test', 4000, 5000);

// 6. Verify in Supabase
// Check tokens, preferences, events tables
```

---

## 📋 Final Checklist

### Before Deployment
- [ ] All 14 notification types tested manually
- [ ] Deep linking working correctly
- [ ] Preferences save and persist
- [ ] Token registration successful
- [ ] Supabase tables populated correctly
- [ ] DND feature working
- [ ] Badge count updating
- [ ] Notification sounds playing
- [ ] No memory leaks
- [ ] Performance acceptable (< 500ms latency)
- [ ] Errors logged properly
- [ ] Tested on Android device
- [ ] Tested on iOS device (if applicable)
- [ ] RLS policies working correctly
- [ ] No hardcoded test data

---

## 🎯 Success Criteria

✅ **Notification Service is READY when:**
1. All 14 test cases pass
2. Notifications send immediately
3. Scheduled notifications work
4. Deep linking works
5. Preferences persist
6. No crashes
7. Performance is acceptable
8. Works on both Android and iOS
9. Supabase integration successful
10. Ready for production deployment

---

**Last Updated:** December 2025
**Status:** ✅ Testing Guide Complete
