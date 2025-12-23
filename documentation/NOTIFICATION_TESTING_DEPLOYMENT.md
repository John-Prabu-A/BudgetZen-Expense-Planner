# 🧪 BudgetZen Notification System - Testing & Deployment Guide

**Status:** Complete Testing Framework  
**Last Updated:** December 21, 2025

---

## 📋 Pre-Deployment Checklist

### Database Setup
- [ ] Run `NOTIFICATION_SYSTEM_ENHANCED_SCHEMA.sql` in Supabase SQL Editor
- [ ] Verify all tables created: `push_tokens`, `notification_queue`, `notification_log`, etc.
- [ ] Verify all RPC functions created: `queue_notification`, `is_in_dnd_hours`
- [ ] Verify all views created: `recent_job_executions`, `delivery_statistics_7d`, etc.
- [ ] Test RLS policies with authenticated and service role users

### Supabase Edge Functions
- [ ] Create and deploy `send-notification` function
- [ ] Create and deploy `schedule-daily-jobs` function
- [ ] Create and deploy `process-queue` function
- [ ] Create and deploy `schedule-weekly-jobs` function (if needed)
- [ ] Verify functions appear in Supabase dashboard
- [ ] Verify functions have correct environment variables

### Frontend Code
- [ ] Add `notificationQueue.ts` to `lib/notifications/`
- [ ] Update `context/Notifications.tsx` with queue manager
- [ ] Update app layout to start scheduler on app launch
- [ ] Add real-time queue listener
- [ ] Update push token registration to store in database

---

## 🧪 Local Testing (Development)

### Test 1: Push Token Registration

**Goal:** Verify tokens are properly registered and stored

```typescript
// In test component
import { pushTokenManager } from '@/lib/notifications/pushTokens';
import { supabase } from '@/lib/supabase';

async function testTokenRegistration() {
  console.log('🔄 Testing token registration...');

  // Register device
  const result = await pushTokenManager.registerDevice();
  console.log('Registration result:', result);

  if (!result.success) {
    console.error('❌ Registration failed:', result.message);
    return false;
  }

  const token = result.token;
  console.log('📱 Token:', token.substring(0, 20) + '...');

  // Verify token in database
  const { data } = await supabase
    .from('push_tokens')
    .select('*')
    .eq('token', token)
    .single();

  if (data) {
    console.log('✅ Token stored in database');
    return true;
  } else {
    console.error('❌ Token not found in database');
    return false;
  }
}
```

**Expected Output:**
```
🔄 Testing token registration...
📱 Token: ExponentPushToken[...
✅ Token stored in database
```

### Test 2: Queue Notification

**Goal:** Verify notifications can be queued with deduplication

```typescript
// In test component
import { notificationQueueManager } from '@/lib/notifications/notificationQueue';

async function testQueueNotification() {
  console.log('🔄 Testing queue notification...');

  const userId = 'test-user-id';
  const idempotencyKey = `test_${Date.now()}`;

  // Queue notification
  const result = await notificationQueueManager.queueNotification(
    userId,
    'daily_reminder',
    '🧪 Test Notification',
    'This is a test notification from the queue',
    { test: true },
    undefined,
    idempotencyKey
  );

  console.log('Queue result:', result);

  if (!result.success) {
    console.error('❌ Queue failed:', result.message);
    return false;
  }

  // Try to queue again with same key (should not create duplicate)
  const result2 = await notificationQueueManager.queueNotification(
    userId,
    'daily_reminder',
    '🧪 Test Notification 2',
    'Should be deduplicated',
    { test: true },
    undefined,
    idempotencyKey
  );

  // Verify queue
  const queue = await notificationQueueManager.getQueue(userId);
  console.log('Queue items:', queue?.length);

  if (queue && queue.length === 1) {
    console.log('✅ Deduplication working (only 1 item in queue)');
    return true;
  } else {
    console.error('❌ Deduplication failed (multiple items)');
    return false;
  }
}
```

**Expected Output:**
```
🔄 Testing queue notification...
Queue result: { success: true, id: '...' }
Queue items: 1
✅ Deduplication working
```

### Test 3: Send Notification

**Goal:** Verify notification can be sent via Edge Function

```typescript
// In test component
import { notificationService } from '@/lib/notifications/NotificationService';
import { NotificationType } from '@/lib/notifications/types';

async function testSendNotification() {
  console.log('🔄 Testing send notification...');

  const result = await notificationService.sendNotification({
    type: NotificationType.DAILY_REMINDER,
    title: '🧪 Test: Log Expenses',
    body: 'Ready to track your spending?',
    data: { screen: 'add-record' },
  });

  console.log('Send result:', result);

  if (result.success) {
    console.log('✅ Notification sent successfully');
    console.log('Notification ID:', result.notificationId);
    return true;
  } else {
    console.error('❌ Send failed:', result.message);
    return false;
  }
}
```

**Expected Behavior:**
- Notification appears on device if app is foreground
- Notification appears in notification center if app is background

### Test 4: DND Hours

**Goal:** Verify Do Not Disturb hours are respected

```typescript
// In test component
import { smartTimingEngine } from '@/lib/notifications/smartTimingEngine';

async function testDNDHours() {
  console.log('🔄 Testing DND hours...');

  const userId = 'test-user-id';
  const isInDND = await smartTimingEngine.isInDNDHours(userId);

  console.log('Current time in DND:', isInDND);

  // Test with preferences
  const { data: prefs, error: prefError } = await supabase
    .from('notification_preferences')
    .select('dnd_enabled, dnd_start_time, dnd_end_time')
    .eq('user_id', userId)
    .single();

  if (prefs) {
    console.log('DND Settings:', {
      enabled: prefs.dnd_enabled,
      startTime: prefs.dnd_start_time,
      endTime: prefs.dnd_end_time,
      currentlyInDND: isInDND,
    });
  }

  return true;
}
```

### Test 5: Job Scheduler

**Goal:** Verify job scheduler starts and runs

```typescript
// In app launch code
import { JobScheduler } from '@/lib/notifications/jobScheduler';

async function testJobScheduler() {
  console.log('🔄 Testing job scheduler...');

  const scheduler = JobScheduler.getInstance();
  await scheduler.start();

  console.log('✅ Scheduler started');

  // Wait 5 seconds and check logs
  await new Promise(resolve => setTimeout(resolve, 5000));

  const { data: logs } = await supabase
    .from('job_execution_logs')
    .select('*')
    .order('executed_at', { ascending: false })
    .limit(5);

  console.log('Recent job executions:', logs);
  return true;
}
```

### Test 6: Timezone Handling

**Goal:** Verify notifications respect user timezone

```typescript
async function testTimezoneHandling() {
  console.log('🔄 Testing timezone handling...');

  // Set user's timezone
  const userId = 'test-user-id';
  const { error } = await supabase
    .from('notification_preferences')
    .upsert({
      user_id: userId,
      timezone: 'America/New_York',
      daily_reminder_time: '09:00', // 9 AM NY time
    });

  if (error) {
    console.error('❌ Failed to set timezone:', error);
    return false;
  }

  console.log('✅ Timezone set to America/New_York');

  // Verify
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('timezone, daily_reminder_time')
    .eq('user_id', userId)
    .single();

  console.log('Preferences:', prefs);
  return true;
}
```

---

## 🔄 Staging Testing (Supabase)

### Test 1: Direct Edge Function Call

**Via cURL:**
```bash
# Send notification directly
curl -X POST \
  https://[project-id].supabase.co/functions/v1/send-notification \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "[TEST_USER_UUID]",
    "title": "Staging Test",
    "body": "This is a staging test notification",
    "notification_type": "test"
  }'

# Trigger daily jobs
curl -X POST \
  https://[project-id].supabase.co/functions/v1/schedule-daily-jobs \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"manual_trigger": true}'

# Process queue
curl -X POST \
  https://[project-id].supabase.co/functions/v1/process-queue \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"batch_size": 10}'
```

### Test 2: Database Query Verification

```sql
-- Verify push tokens
SELECT 
  COUNT(*) as total_tokens,
  SUM(CASE WHEN is_valid THEN 1 ELSE 0 END) as valid_tokens
FROM push_tokens;

-- Verify notification queue
SELECT 
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest
FROM notification_queue
GROUP BY status;

-- Verify notification log
SELECT 
  notification_type,
  status,
  COUNT(*) as count,
  ROUND(AVG(EXTRACT(EPOCH FROM (delivered_at - sent_at))), 0) as avg_delivery_seconds
FROM notification_log
WHERE sent_at > NOW() - INTERVAL '24 hours'
GROUP BY notification_type, status;

-- Verify job execution
SELECT 
  job_name,
  MAX(executed_at) as last_run,
  MAX(CASE WHEN success THEN executed_at END) as last_success,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_runs,
  SUM(notifications_sent) as total_sent
FROM job_execution_logs
WHERE executed_at > NOW() - INTERVAL '7 days'
GROUP BY job_name;
```

### Test 3: Real Device Testing

**Prerequisites:**
- Real iOS or Android device
- App installed from Expo Go or build
- Test user account

**Steps:**
1. Log in with test account
2. Grant notification permissions
3. Verify token registered:
   ```sql
   SELECT * FROM push_tokens 
   WHERE user_id = '[test-user-id]' 
   AND is_valid = true;
   ```

4. Queue test notification:
   ```typescript
   await notificationQueueManager.queueNotification(
     testUserId,
     'daily_reminder',
     '📱 Test on Real Device',
     'If you see this, notifications work!',
     { screen: 'add-record' }
   );
   ```

5. Verify notification appears on device
6. Tap notification and verify it opens correct screen
7. Check notification log:
   ```sql
   SELECT * FROM notification_log
   WHERE user_id = '[test-user-id]'
   ORDER BY sent_at DESC
   LIMIT 5;
   ```

---

## 📊 Performance Testing

### Load Test: Queue Processing

```typescript
async function loadTestQueue() {
  console.log('🔄 Load testing queue...');

  const userId = 'test-user-id';
  const startTime = Date.now();
  let queuedCount = 0;

  // Queue 100 notifications
  for (let i = 0; i < 100; i++) {
    await notificationQueueManager.queueNotification(
      userId,
      'daily_reminder',
      `Test ${i}`,
      `Message ${i}`,
      { index: i },
      undefined,
      `test_${i}_${Date.now()}`
    );
    queuedCount++;
  }

  const queueTime = Date.now() - startTime;
  console.log(`✅ Queued ${queuedCount} notifications in ${queueTime}ms`);
  console.log(`⚡ Average: ${(queueTime / queuedCount).toFixed(2)}ms per notification`);

  // Now process queue
  const processStart = Date.now();
  const result = await notificationQueueManager.sendPending(userId);
  const processTime = Date.now() - processStart;

  console.log(`✅ Processed ${result.sent + result.failed} notifications in ${processTime}ms`);
}
```

**Expected Performance:**
- Queue: < 50ms per notification
- Send: < 200ms per batch of 20

### Load Test: Job Execution

```bash
# Trigger daily jobs and measure response time
time curl -X POST \
  https://[project-id].supabase.co/functions/v1/schedule-daily-jobs \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"manual_trigger": true}'
```

**Expected Performance:**
- < 30 seconds for 1000 users
- Logs recorded in `job_execution_logs`

---

## 🐛 Debug Mode

### Enable Verbose Logging

In notification files, add:

```typescript
const DEBUG = true; // Set to true for verbose logging

function log(...args: any[]) {
  if (DEBUG) {
    console.log(...args);
  }
}
```

### Monitor Real-time Activity

```typescript
// Create monitoring hook
export function useNotificationMonitoring() {
  useEffect(() => {
    // Subscribe to queue changes
    const { data: subscription } = supabase
      .channel('notification_queue')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notification_queue' },
        (payload) => {
          console.log('🔄 Queue changed:', payload);
        }
      )
      .subscribe();

    // Subscribe to job logs
    const { data: jobSubscription } = supabase
      .channel('job_logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'job_execution_logs' },
        (payload) => {
          console.log('📊 Job executed:', payload.new);
        }
      )
      .subscribe();

    return () => {
      subscription?.unsubscribe();
      jobSubscription?.unsubscribe();
    };
  }, []);
}
```

---

## ✅ Production Verification Checklist

Before launching to production:

### Security
- [ ] No expo push tokens exposed in frontend code
- [ ] All Edge Functions use service role key for operations
- [ ] RLS policies properly configured
- [ ] User can only see own notifications
- [ ] Idempotency keys prevent duplicates

### Reliability
- [ ] Notifications retry on failure
- [ ] Failed notifications logged for debugging
- [ ] Job execution tracked with errors
- [ ] Queue processes all pending notifications
- [ ] Old notifications cleaned up periodically

### Performance
- [ ] Database indexes created
- [ ] Query performance verified with real data
- [ ] No N+1 queries in job processing
- [ ] Batch processing for large user sets
- [ ] Connection pooling working

### Monitoring
- [ ] Metrics dashboard accessible
- [ ] Error alerts configured
- [ ] Job execution logs visible
- [ ] Notification delivery tracked
- [ ] User preferences changeable

### User Experience
- [ ] Users can enable/disable each notification type
- [ ] DND hours respected
- [ ] Timezone handling accurate
- [ ] Notifications don't spam
- [ ] Preferences persist

---

## 🚀 Production Deployment

### Step 1: Database Migration
```bash
# Backup production database first
# Then run schema in SQL Editor
```

### Step 2: Deploy Edge Functions
```bash
supabase functions deploy send-notification
supabase functions deploy schedule-daily-jobs
supabase functions deploy process-queue
supabase functions deploy schedule-weekly-jobs
```

### Step 3: Update Frontend
```bash
# Merge notification changes to main
# Rebuild app
# Deploy to app stores
```

### Step 4: Monitoring Setup
- [ ] Set up error alerts
- [ ] Create monitoring dashboard
- [ ] Document runbooks for common issues

### Step 5: User Communication
- [ ] Notify users about new notifications
- [ ] Provide preference UI
- [ ] Link to help docs

---

## 📞 Incident Response

### Notification Failures

**Symptom:** Users not receiving notifications

**Debug:**
```sql
-- Check recent failures
SELECT * FROM notification_log
WHERE status = 'failed'
AND sent_at > NOW() - INTERVAL '1 hour'
ORDER BY sent_at DESC;

-- Check for error patterns
SELECT error_code, COUNT(*) as count
FROM notification_log
WHERE status = 'failed'
GROUP BY error_code
ORDER BY count DESC;
```

**Resolution:**
1. Check Edge Function logs
2. Verify push tokens are valid
3. Restart queue processor if needed
4. Check Expo service status

### Job Not Running

**Symptom:** Daily/weekly jobs not executing

**Debug:**
```sql
-- Check job logs
SELECT * FROM job_execution_logs
WHERE job_name = 'daily_reminder'
ORDER BY executed_at DESC
LIMIT 10;

-- Check for error patterns
SELECT error_message, COUNT(*) as count
FROM job_execution_logs
WHERE success = false
GROUP BY error_message;
```

**Resolution:**
1. Check Edge Function logs
2. Verify scheduler started in app
3. Check for database connectivity issues
4. Manually trigger function to test

---

**Version:** 1.0  
**Last Updated:** December 21, 2025  
**Status:** Production Ready ✅
