# 🧪 Phase 3 Quick Testing Guide

**Last Updated:** December 21, 2025  
**Quick Reference for Testing Frontend Integration**

---

## 🎯 Pre-Testing Checklist

Before you start testing, make sure you have:

- [ ] ✅ Database schema deployed (Phase 1)
- [ ] ✅ Edge Functions deployed (Phase 2)
- [ ] ✅ App code updated with Phase 3 changes
- [ ] ✅ App rebuilt and running on device/emulator
- [ ] ✅ User logged in with valid account

---

## 🚀 Quick Start Tests (2-3 minutes)

### Test 1: Verify App Initialization

**What to Check:**
```
✅ App opens without errors
✅ See in console: "[NOTIF] registerPushToken -> true"
✅ See in console: "[NOTIF] Loaded notification preferences"
✅ No red error screens
```

**If Failed:**
- Check if FCM/APNs is configured
- Verify `google-services.json` is in `android/`
- Check Supabase credentials in `.env`

---

### Test 2: Real-Time Listener (Instant Notification)

**Setup:**
1. Open app on device/emulator
2. Keep app in foreground
3. Open Supabase SQL Editor in browser

**Execute:**
```sql
-- Replace 'YOUR-USER-ID' with actual user ID from your test account
INSERT INTO notification_queue (
  user_id,
  notification_type,
  title,
  body,
  data,
  status,
  scheduled_for,
  idempotency_key
) VALUES (
  'YOUR-USER-ID',
  'test_notification',
  '🧪 Real-Time Test',
  'This notification was sent from Supabase!',
  '{"test": true}'::jsonb,
  'pending',
  NOW(),
  'test_realtime_' || NOW()::text
);
```

**Expected Result (< 1 second):**
- 🔔 Notification appears on device screen
- Sound plays
- Badge updates
- Console log shows: `[NOTIF] 🔔 New notification from queue: 🧪 Real-Time Test`

**If Not Working:**
```
Verify:
1. Supabase RLS policy allows read access
2. User ID is correct (check Auth context)
3. Real-time connection is active
4. No console errors
```

---

### Test 3: Queue Processing (5-Minute Timer)

**Setup:**
1. Close app or send to background
2. Note current time (e.g., 14:32)

**Execute (in Supabase SQL Editor):**
```sql
INSERT INTO notification_queue (
  user_id,
  notification_type,
  title,
  body,
  status,
  scheduled_for,
  idempotency_key
) VALUES (
  'YOUR-USER-ID',
  'test_queue_processor',
  '📋 Queue Processor Test',
  'This was processed by the 5-min timer',
  '{"test": "processor"}'::jsonb,
  'pending',
  NOW(),
  'test_queue_' || NOW()::text
);
```

**Timing:**
- **Option A (Fast):** Restart app immediately → Processes on startup
- **Option B (Wait):** Keep app closed for 5 minutes → Processes at 14:37 when timer runs

**Expected Result:**
- ✅ When app resumes, notification appears
- ✅ Console log: `[NOTIF] Queue processed: X sent, Y failed`
- ✅ Notification appears even though app was closed

**If Not Working:**
```
Check:
1. Is app actually closed/backgrounded? (not just minimized)
2. Does console show interval setup on app init?
3. Are there any errors in Supabase logs?
```

---

## 📊 Verify Queue Statistics

**In App Console/React Dev Tools:**
```typescript
// Get queue stats
const { getQueueStats } = useNotifications();
const stats = await getQueueStats(userId);

console.log('Queue Stats:', stats);
// Expected output:
// {
//   pending: 0,
//   sent: 5,
//   failed: 0,
//   total: 5
// }
```

**What Each Number Means:**
- `pending` - Waiting to be sent (should be 0 after tests complete)
- `sent` - Successfully sent
- `failed` - Failed to send (check `notification_log` for reasons)
- `total` - Total notifications ever queued

---

## 📋 Database Verification

**Check Queue Status:**
```sql
-- Current pending notifications
SELECT id, user_id, notification_type, status, created_at
FROM notification_queue
WHERE user_id = 'YOUR-USER-ID'
ORDER BY created_at DESC
LIMIT 10;

-- Recent sent/failed
SELECT status, COUNT(*) as count
FROM notification_queue
WHERE user_id = 'YOUR-USER-ID'
GROUP BY status;
```

**Check Delivery Logs:**
```sql
-- View all notifications sent to this user
SELECT notification_type, status, sent_at, error_message
FROM notification_log
WHERE user_id = 'YOUR-USER-ID'
ORDER BY sent_at DESC
LIMIT 20;

-- Delivery success rate
SELECT 
  notification_type,
  COUNT(*) as total,
  SUM(CASE WHEN status IN ('delivered', 'opened') THEN 1 ELSE 0 END) as delivered,
  ROUND(100.0 * SUM(CASE WHEN status IN ('delivered', 'opened') THEN 1 ELSE 0 END) / COUNT(*), 1) as success_rate
FROM notification_log
WHERE user_id = 'YOUR-USER-ID'
GROUP BY notification_type;
```

---

## 🔄 Full Integration Test (5-10 minutes)

**Scenario:** Simulate real budget alert workflow

### Step 1: Setup
```sql
-- Clean up old test data
DELETE FROM notification_queue
WHERE user_id = 'YOUR-USER-ID'
AND created_at < NOW() - INTERVAL '5 minutes';

-- Verify clean state
SELECT COUNT(*) as pending
FROM notification_queue
WHERE user_id = 'YOUR-USER-ID'
AND status = 'pending';
-- Should return 0
```

### Step 2: Simulate Budget Alert
```sql
-- Insert as if budget alert Edge Function queued it
INSERT INTO notification_queue (
  user_id,
  notification_type,
  title,
  body,
  data,
  status,
  scheduled_for,
  idempotency_key
) VALUES (
  'YOUR-USER-ID',
  'budget_exceeded',
  '💸 Budget Alert: Food',
  'You\'ve spent 110% of your Food budget',
  '{
    "category": "Food",
    "spent": 110,
    "budget": 100,
    "screen": "budget",
    "category_id": "food"
  }'::jsonb,
  'pending',
  NOW(),
  'budget_exceeded_food_' || to_char(NOW(), 'YYYY-MM-DD HH24:MI')
);
```

### Step 3: Test Immediate Delivery (Real-Time)
```
1. App OPEN in foreground
2. Execute INSERT above
3. Within 1 second:
   ✅ See notification on screen
   ✅ Notification shows "Budget Alert: Food"
   ✅ Tap notification → app navigates to budget screen (if implemented)
```

### Step 4: Test Delayed Delivery (Queue Processor)
```
1. Close app
2. Execute INSERT with different idempotency_key
3. Wait 5 minutes OR restart app
4. Expected:
   ✅ Notification appears when app opens
   ✅ Shows correct budget alert details
   ✅ Console shows "Queue processed: 1 sent, 0 failed"
```

### Step 5: Verify Database Records
```sql
-- Check both notifications were logged
SELECT notification_type, status, created_at
FROM notification_queue
WHERE user_id = 'YOUR-USER-ID'
AND notification_type = 'budget_exceeded'
ORDER BY created_at DESC;

-- Should show 2 rows

-- Check delivery status
SELECT notification_type, status, sent_at
FROM notification_log
WHERE user_id = 'YOUR-USER-ID'
AND notification_type = 'budget_exceeded'
ORDER BY sent_at DESC;

-- Should show 2 delivered
```

---

## ⚠️ Common Issues & Fixes

### Issue: "Cannot find name 'supabase'" Error

**Solution:** Verify import added to `app/_layout.tsx`:
```typescript
import { supabase } from '../lib/supabase';
```

### Issue: Real-Time Listener Not Firing

**Check 1: RLS Policy**
```sql
-- Verify policy exists
SELECT * FROM pg_policies
WHERE tablename = 'notification_queue'
AND policyname LIKE '%select%';
```

**Check 2: Realtime Enabled**
- Go to Supabase Dashboard
- Table Editor → notification_queue
- Ensure "Enable Realtime" is toggled ON

**Check 3: Filter is Working**
```typescript
// Add logging to verify subscription
const channel = supabase.channel(...)
channel.subscribe((status) => {
  console.log('[NOTIF] Real-time status:', status); // Should be 'SUBSCRIBED'
});
```

### Issue: 5-Min Processor Not Running

**Check:**
```
1. Is app actually in background? (Use Xcode/Android Studio)
2. Check console for interval setup logs
3. Try restarting app while notification pending
4. Check if iOS is restricting background tasks
```

### Issue: Duplicate Notifications

**Solution:** Verify idempotency key is unique
```typescript
// Good (includes timestamp)
`reminder_${userId}_${new Date().toDateString()}_${Date.now()}`

// Bad (not unique)
`reminder_${userId}`
```

---

## ✅ Success Indicators

You'll know Phase 3 is working when you see:

```
Console Logs:
✅ [NOTIF] registerPushToken -> true
✅ [NOTIF] syncTokenWithBackend -> true
✅ [NOTIF] Loaded notification preferences
✅ [NOTIF] Real-time subscription active
✅ [NOTIF] Queue processed: X sent, Y failed

Notifications:
✅ Real-time alerts appear < 1 second when app open
✅ Queued notifications arrive when app reopens
✅ No duplicate notifications
✅ Proper retry on network failures

Database:
✅ notification_queue has pending→sent transitions
✅ notification_log captures all sends
✅ job_execution_logs shows periodic runs
```

---

## 📈 Performance Expectations

| Scenario | Expected Time | Actual | Pass |
|----------|---|---|---|
| Real-time notification (app open) | < 1 sec | ___ | ✅/❌ |
| Queue processor startup | < 5 sec | ___ | ✅/❌ |
| 5-minute periodic check | ~5 min | ___ | ✅/❌ |
| Database insert to display | < 1.5 sec total | ___ | ✅/❌ |
| Idempotency deduplication | Instant | ___ | ✅/❌ |

---

## 🎯 Final Verification Script

**Run This to Verify Everything Works:**

```sql
-- 1. Create test user notification preferences
INSERT INTO notification_preferences (
  user_id,
  timezone,
  dnd_enabled
) VALUES (
  'YOUR-USER-ID',
  'America/New_York',
  false
)
ON CONFLICT (user_id) DO NOTHING;

-- 2. Queue test notification
INSERT INTO notification_queue (
  user_id,
  notification_type,
  title,
  body,
  status,
  scheduled_for,
  idempotency_key
) VALUES (
  'YOUR-USER-ID',
  'integration_test',
  '✅ Phase 3 Integration Test',
  'If you see this, everything works!',
  'pending',
  NOW(),
  'phase3_test_' || NOW()::text
);

-- 3. Verify it was created
SELECT COUNT(*) as pending FROM notification_queue
WHERE user_id = 'YOUR-USER-ID'
AND notification_type = 'integration_test';
-- Should return: 1

-- 4. Check after 5 minutes or app restart
SELECT status FROM notification_log
WHERE notification_type = 'integration_test'
AND user_id = 'YOUR-USER-ID';
-- Should show 'delivered' or 'sent'
```

---

**Phase 3 Testing Complete!** 🎉

Once all tests pass, your notification system is fully operational and ready for user testing with real notification scenarios.
