# 🧪 Testing Push Notifications - Complete Guide

## Quick Start: Test in 5 Minutes

### Step 1: Verify Database is Set Up
```sql
-- Run in Supabase SQL Editor to verify tables exist
SELECT COUNT(*) as table_count FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN (
  'job_execution_logs',
  'goal_milestones_notified', 
  'user_achievements',
  'notification_throttle',
  'notification_analytics'
);
-- Should return: 5 ✅
```

### Step 2: Create Test Notification Trigger
In your app, add a **TEST BUTTON** to trigger a large transaction alert:

```typescript
// components/TestNotificationButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNotifications } from '@/context/Notifications';

export default function TestNotificationButton() {
  const { sendLargeTransactionAlert } = useNotifications();

  const handleTestAlert = async () => {
    try {
      console.log('🧪 Testing Large Transaction Alert...');
      await sendLargeTransactionAlert(15000, 'Food');
      console.log('✅ Test alert sent!');
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleTestAlert}>
      <Text style={styles.text}>🧪 Test Large Transaction Alert</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 8,
    margin: 10,
  },
  text: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
```

### Step 3: Add to Your App
Add the test button to your main screen temporarily:

```typescript
// app/(tabs)/index.tsx
import TestNotificationButton from '@/components/TestNotificationButton';

export default function HomeScreen() {
  return (
    <ScrollView>
      {/* Existing content */}
      
      {/* Add this for testing */}
      <TestNotificationButton />
      
      {/* Rest of content */}
    </ScrollView>
  );
}
```

### Step 4: Run the Test
1. Restart your app (`expo start`)
2. Tap the "Test Large Transaction Alert" button
3. Check your device - should see notification pop-up
4. Go to Supabase → Table Editor → `notification_analytics`
5. Should see a new row with the test notification

---

## 🔍 Detailed Testing Checklist

### Test 1: Real-Time Alert - Large Transaction ✅

**What to test:** Large transaction alert triggers and saves to database

**Steps:**
```
1. Open app
2. Tap "Test Large Transaction Alert" button
3. Check device notifications → Should see alert
4. Go to Supabase SQL Editor
5. Run: SELECT * FROM notification_analytics ORDER BY sent_at DESC LIMIT 1;
6. Should see row with:
   - notification_type: 'large_transaction'
   - sent_at: (current time)
   - opened_at: null (until you tap it)
```

**Expected Result:**
```
✅ Notification appears on device
✅ notification_analytics has new row
✅ notification_type = 'large_transaction'
✅ sent_at = now
```

**If it fails:**
- Check notification permissions (Settings → Notifications → BudgetZen)
- Check console for errors: `[NOTIF]` prefix in logs
- Verify push token registered: Check `notification_tokens` table in Supabase
- Verify useNotifications hook imported correctly

---

### Test 2: Real-Time Alert - Budget Exceeded 🏦

**What to test:** Budget exceeded alert triggers

**Manual Test:**
```typescript
// In a component or screen
import { useNotifications } from '@/context/Notifications';

const MyComponent = () => {
  const { sendBudgetExceededAlert } = useNotifications();
  
  const handleTest = async () => {
    // Spend ₹5100 with budget of ₹5000 = exceeded
    await sendBudgetExceededAlert('Food', 5100, 5000);
  };

  return <Button title="Test Budget Alert" onPress={handleTest} />;
};
```

**Expected Result:**
```
✅ Notification shows: "❌ Budget exceeded: Food"
✅ notification_analytics shows new entry
✅ notification_type = 'budget_exceeded'
```

---

### Test 3: Real-Time Alert - Unusual Spending 📈

**What to test:** Unusual spending alert triggers

**Manual Test:**
```typescript
const handleTest = async () => {
  // Normal average: ₹300, this transaction: ₹750 (2.5x)
  await sendUnusualSpendingAlert('Coffee', 750, 300);
};
```

**Expected Result:**
```
✅ Notification shows: "📈 Unusual spending: Coffee"
✅ notification_analytics has new row
✅ Shows percentage above average
```

---

### Test 4: Throttling (Prevents Spam) 🚫

**What to test:** Same alert doesn't send twice within 1 hour

**Steps:**
```
1. Tap "Test Large Transaction Alert" → Get notification ✅
2. Immediately tap again → Should NOT get notification (throttled) ✅
3. Check console for: "⏭️ Notification throttled: large_transaction"
4. Check notification_throttle table:
   SELECT * FROM notification_throttle WHERE user_id = '...';
   Should show: large_transaction, last_sent_at = now
5. Wait 1 hour
6. Tap again → Should get notification ✅
```

**Expected Result:**
```
✅ First alert sent
✅ Second alert blocked (throttled)
✅ notification_throttle shows last_sent_at
❌ No duplicate in notification_analytics (within 1 hour)
```

---

### Test 5: Do-Not-Disturb (DND) 🌙

**What to test:** DND hours prevent notifications

**Setup:**
```sql
-- Set DND to right now for 1 hour
UPDATE notification_preferences
SET dnd_enabled = true,
    dnd_start_time = '20:00',  -- Set to current hour
    dnd_end_time = '21:00'
WHERE user_id = (SELECT user_id FROM notification_preferences LIMIT 1);
```

**Steps:**
```
1. Make sure current time is between 20:00-21:00
2. Tap "Test Large Transaction Alert"
3. Should NOT see notification (in DND)
4. Check console: "🌙 In DND hours, queueing notification"
5. Update DND to past time
6. Tap button again → Should see notification ✅
```

**Expected Result:**
```
✅ Alert blocked during DND hours
❌ No notification appears
✅ Alert sent after DND ends
```

---

### Test 6: User Behavior Learning 📱

**What to test:** Alert skipped if user in app last 2 hours

**Steps:**
```
1. App is open (you're using it)
2. Try to trigger alert
3. Should skip with: "📱 User in app, skipping notification"
4. Close app completely
5. Wait 2+ hours or trigger from another device
6. Try again → Alert should send ✅
```

**Expected Result:**
```
✅ Alert skipped when user in app
✅ No notification appears
✅ Console shows behavior skip message
```

---

## 📊 SQL Queries for Testing

### Check All Alerts Sent
```sql
SELECT 
  notification_type,
  COUNT(*) as total,
  MAX(sent_at) as latest,
  COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as opened
FROM notification_analytics
WHERE sent_at > NOW() - INTERVAL '24 hours'
GROUP BY notification_type
ORDER BY total DESC;
```

### Check Job Executions
```sql
SELECT 
  job_name,
  executed_at,
  success,
  duration_ms,
  error_message
FROM job_execution_logs
WHERE executed_at > NOW() - INTERVAL '1 day'
ORDER BY executed_at DESC
LIMIT 20;
```

### Check Throttle Status
```sql
SELECT 
  notification_type,
  last_sent_at,
  COUNT_TODAY,
  NOW() - last_sent_at as time_since_last
FROM notification_throttle
ORDER BY last_sent_at DESC;
```

### Check User Preferences
```sql
SELECT 
  user_id,
  large_transaction_enabled,
  budget_exceeded_enabled,
  unusual_spending_enabled,
  dnd_enabled,
  dnd_start_time,
  dnd_end_time
FROM notification_preferences
LIMIT 1;
```

---

## 🎯 End-to-End Testing Workflow

### Phase 1: Setup (5 minutes)
- [ ] Run SQL script in Supabase
- [ ] Verify all 5 tables created
- [ ] Verify all notification_preferences columns added
- [ ] Add test button to app
- [ ] Restart app

### Phase 2: Real-Time Alerts (10 minutes)
- [ ] Test Large Transaction Alert → See notification
- [ ] Check notification_analytics table → See entry
- [ ] Test Budget Exceeded Alert
- [ ] Test Unusual Spending Alert

### Phase 3: Smart Filtering (15 minutes)
- [ ] Test Throttling (tap twice, second should be blocked)
- [ ] Test DND (set to current time, alert blocked)
- [ ] Test User Behavior (alert skipped if in app)
- [ ] Verify notification_throttle table updates

### Phase 4: Scheduled Jobs (Check at scheduled times)
- [ ] At 07:00 AM → Daily Budget Warnings
- [ ] At 08:00 AM → Daily Anomaly Detection
- [ ] At 19:00 PM → Daily Reminder
- [ ] At Sunday 19:00 → Weekly Summary
- [ ] At Sunday 19:15 → Weekly Compliance
- [ ] At Monday 08:00 → Weekly Trends

### Phase 5: Optional Features (Event-triggered)
- [ ] Create a goal → Track to 50% → Should get notification
- [ ] Get savings to ₹50K → Should get achievement notification

---

## 📱 Console Logging - What to Look For

### Success Logs
```
✅ [NOTIF] Notifications initialized
✅ [Scheduler] Starting job scheduler
✅ [Scheduler] Registered 8 jobs
✅ ✅ Large transaction alert sent
✅ ✅ [Trends] Sent X trend(s) to user
✅ ✅ Job complete: daily_reminder
```

### Error Logs (Expected to see some)
```
❌ [NOTIF] Error initializing notifications: (might be expected)
⏭️ ⏭️ Notification throttled: large_transaction (expected after first)
🌙 In DND hours, queueing notification (expected during DND)
📱 User in app, skipping notification (expected when active)
```

### Database Errors (Should NOT see)
```
❌ relation "goals" does not exist (should be fixed now)
❌ relation "notification_analytics" does not exist
❌ column does not exist
```

---

## 🐛 Debugging Tips

### 1. Check Notification Permission
```typescript
// In _layout.tsx or component
import * as Notifications from 'expo-notifications';

const checkPermission = async () => {
  const { status } = await Notifications.getPermissionsAsync();
  console.log('Notification permission:', status);
  // Should log: 'granted'
};
```

### 2. Check Push Token
```sql
-- In Supabase SQL Editor
SELECT user_id, push_token, created_at 
FROM notification_tokens 
ORDER BY created_at DESC 
LIMIT 1;
-- Should have a token value
```

### 3. Enable Verbose Logging
```typescript
// In NotificationService.ts or useNotifications
console.log('🔍 Debug:', {
  userId,
  notificationType,
  payload,
  shouldSend,
  inDND,
  userInApp,
});
```

### 4. Test With Supabase Realtime
```sql
-- Listen to notifications as they're inserted
-- In Supabase Dashboard → Realtime → notification_analytics
-- Create a test alert and watch it appear in real-time
```

---

## ✅ Success Criteria

You know it's working when:

### Database
- [x] All 5 tables exist (job_execution_logs, goal_milestones_notified, etc.)
- [x] All 19 columns added to notification_preferences
- [x] notification_analytics has entries when alerts sent
- [x] notification_throttle shows last_sent_at updates
- [x] job_execution_logs has daily/weekly job entries

### Notifications
- [x] Large transaction alert appears on device
- [x] Budget exceeded alert appears on device
- [x] Unusual spending alert appears on device
- [x] Throttling prevents duplicate alerts within 1 hour
- [x] DND hours prevent alerts
- [x] User behavior skips alerts when in app

### Scheduled Jobs
- [x] Daily jobs run at scheduled times (07:00, 08:00, 19:00)
- [x] Weekly jobs run at scheduled times (Sunday/Monday)
- [x] job_execution_logs shows successful runs
- [x] No error_message entries (or minimal expected errors)

### Logging
- [x] Console shows "[Scheduler] Starting job scheduler"
- [x] Console shows alert success messages
- [x] No critical errors in console
- [x] Database logs appear for all operations

---

## 📞 Troubleshooting Test Failures

### Problem: Notification doesn't appear
```
✅ Verify: Notification permission granted
✅ Verify: Push token registered (check notification_tokens table)
✅ Verify: sendNotification method working (check console)
✅ Verify: Device not in silent mode
✅ Solution: Restart app, check permissions, verify token
```

### Problem: notification_analytics is empty
```
✅ Verify: sendNotification actually called (console.log)
✅ Verify: User ID is valid
✅ Verify: Table exists (SELECT * FROM notification_analytics LIMIT 1)
✅ Verify: RLS policy allows inserts
✅ Solution: Check console errors, verify table structure
```

### Problem: Jobs not running
```
✅ Verify: jobScheduler.start() called (check console)
✅ Verify: Current time matches job schedule
✅ Verify: job_execution_logs table exists
✅ Verify: No errors in console
✅ Solution: Restart app, check scheduled time, verify JobScheduler
```

### Problem: Throttling not working
```
✅ Verify: notification_throttle table exists
✅ Verify: MIN_INTERVAL_BETWEEN_NOTIFICATIONS set in types.ts
✅ Verify: notificationThrottler.shouldSend() called
✅ Verify: recordSent() updates table
✅ Solution: Check types.ts constants, verify throttler logic
```

---

## 🎓 What Each Table Tells You

### notification_analytics
```
✅ Shows every notification sent
✅ Shows when it was sent
✅ Shows when it was opened (if user tapped)
✅ Shows response time (user interaction speed)
✅ Use to: Measure engagement, debug delivery issues
```

### job_execution_logs
```
✅ Shows every job run (daily/weekly)
✅ Shows if it succeeded (true/false)
✅ Shows how long it took (duration_ms)
✅ Shows error message if failed
✅ Use to: Verify jobs run on schedule, catch failures
```

### notification_throttle
```
✅ Shows last time each notification type was sent
✅ Shows count per day
✅ Use to: Verify throttling working, check spam prevention
```

### goal_milestones_notified
```
✅ Shows which goals got milestone notifications
✅ Shows which percentage (25%, 50%, 75%, 100%)
✅ Use to: Prevent duplicate milestone notifications
```

### user_achievements
```
✅ Shows which achievements user unlocked
✅ Shows threshold (₹10K, ₹50K, ₹1L, etc.)
✅ Use to: Display badges, prevent duplicates
```

---

## 🚀 Ready for Production?

Run this checklist before deploying:

### Code
- [ ] All 11 job files created
- [ ] All imports working (no red squiggles)
- [ ] No TypeScript errors (`expo check`)
- [ ] Console has no critical errors
- [ ] Test button removed before production

### Database
- [ ] All 5 tables exist
- [ ] All 19 columns in notification_preferences
- [ ] RLS enabled on all tables
- [ ] Foreign keys set up correctly

### Functionality
- [ ] Real-time alerts trigger and appear
- [ ] Throttling prevents duplicates
- [ ] DND respected
- [ ] Scheduled jobs run at scheduled times
- [ ] Database logging working

### Monitoring
- [ ] Can query notification_analytics
- [ ] Can query job_execution_logs
- [ ] Can see metrics and engagement rates
- [ ] Can identify errors from logs

---

## 📝 Sample Test Report

Create a document like this after testing:

```
TEST REPORT - Push Notification Integration
Date: 2025-12-11
Tester: [Your Name]

REAL-TIME ALERTS
[✅] Large Transaction Alert - PASS
[✅] Budget Exceeded Alert - PASS
[✅] Unusual Spending Alert - PASS

SMART FILTERS
[✅] Throttling (1 hour limit) - PASS
[✅] DND Hours (22:00-08:00) - PASS
[✅] User Behavior (in app skip) - PASS

DATABASE
[✅] notification_analytics has entries - PASS
[✅] job_execution_logs shows runs - PASS
[✅] notification_throttle updates - PASS

SCHEDULED JOBS
[✅] Daily reminder at 19:00 - PASS (wait and verify)
[✅] Budget warnings at 07:00 - PASS (wait and verify)
[✅] Weekly summary Sunday - PASS (wait and verify)

OVERALL: READY FOR PRODUCTION ✅
```

---

*Complete testing guide for notification system integration. Follow the steps to verify everything is working correctly!*
