# 🚀 BudgetZen Notification System - Complete Implementation Guide

**Status:** Ready for Implementation  
**Last Updated:** December 21, 2025  
**Target:** Production-Grade Automated Notifications

---

## 📚 Quick Start (Step-by-Step)

### Phase 1: Database Setup (15 minutes)

**Step 1.1: Run SQL Schema**
```bash
# In Supabase SQL Editor:
# 1. Open: https://app.supabase.com/project/[your-project]/sql/new
# 2. Copy entire contents of: database/NOTIFICATION_SYSTEM_ENHANCED_SCHEMA.sql
# 3. Click "Run"
# 4. Verify all tables created
```

**Verify:**
```sql
-- Run these queries to verify
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'notification_%';

-- Expected tables:
-- - notification_queue
-- - notification_log
-- - notification_preferences
-- - notification_throttle
-- - push_tokens
```

### Phase 2: Deploy Edge Functions (20 minutes)

**Step 2.1: Create Edge Functions**
```bash
# From project root
supabase functions new send-notification
supabase functions new schedule-daily-jobs
supabase functions new process-queue
supabase functions new schedule-weekly-jobs
```

**Step 2.2: Copy Code**
- Copy content from `supabase/functions/send-notification/index.ts` → `supabase/functions/send-notification/index.ts`
- Copy content from `supabase/functions/schedule-daily-jobs/index.ts` → `supabase/functions/schedule-daily-jobs/index.ts`
- Copy content from `supabase/functions/process-queue/index.ts` → `supabase/functions/process-queue/index.ts`

**Step 2.3: Deploy**
```bash
supabase functions deploy send-notification
supabase functions deploy schedule-daily-jobs
supabase functions deploy process-queue
```

**Verify:**
```bash
supabase functions list
# Should show all functions as deployed
```

### Phase 3: Frontend Integration (30 minutes)

**Step 3.1: Add Push Token Registration**

In `context/Notifications.tsx`, update to use new queue manager:

```typescript
import { notificationQueueManager } from '@/lib/notifications/notificationQueue';

// In NotificationsProvider component:
const registerPushToken = useCallback(async () => {
  const result = await pushTokenManager.registerDevice();
  if (result.success && result.token) {
    // Store token in database
    const { error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: userId,
        token: result.token,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        is_valid: true,
        created_at: new Date().toISOString(),
      });
    
    if (!error) {
      setIsPushEnabled(true);
      console.log('✅ Push token registered');
    }
  }
}, [userId]);
```

**Step 3.2: Start Job Scheduler on App Launch**

In `app/_layout.tsx` or main app component:

```typescript
import { JobScheduler } from '@/lib/notifications/jobScheduler';
import { notificationQueueManager } from '@/lib/notifications/notificationQueue';

export default function RootLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      // Start job scheduler
      const scheduler = JobScheduler.getInstance();
      scheduler.start().catch(console.error);

      // Process queue periodically
      const interval = setInterval(() => {
        const userId = user?.id;
        if (userId) {
          notificationQueueManager.sendPending(userId).catch(console.error);
        }
      }, 5 * 60 * 1000); // Every 5 minutes

      return () => clearInterval(interval);
    }
  }, [isSignedIn]);

  // ... rest of layout
}
```

**Step 3.3: Add Queue Listener**

```typescript
useEffect(() => {
  if (isSignedIn && userId) {
    // Subscribe to real-time queue updates
    const unsubscribe = notificationQueueManager.subscribeToQueue(
      userId,
      (notification) => {
        // Handle new notification
        notificationService.sendNotification({
          type: notification.notification_type as NotificationType,
          title: notification.title,
          body: notification.body,
          data: notification.data,
        });
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }
}, [isSignedIn, userId]);
```

---

## 🔌 API Endpoints Reference

### Endpoint: `POST /functions/v1/send-notification`

**Request:**
```json
{
  "user_id": "user-uuid",
  "title": "Notification Title",
  "body": "Notification body text",
  "notification_type": "daily_reminder",
  "data": {
    "screen": "add-record",
    "action": "create_expense"
  },
  "queue_id": "optional-queue-id"
}
```

**Response (Success):**
```json
{
  "success": true,
  "successCount": 2,
  "failureCount": 0,
  "expoNotificationIds": ["expo-id-1", "expo-id-2"],
  "message": "Sent to 2 device(s)"
}
```

**Response (Failure):**
```json
{
  "success": false,
  "successCount": 0,
  "failureCount": 2,
  "message": "Failed to send to any device"
}
```

### Endpoint: `POST /functions/v1/schedule-daily-jobs`

**Request:**
```json
{
  "manual_trigger": true
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "daily_reminders": { "processed": 100, "sent": 85, "failed": 0 },
    "budget_warnings": { "processed": 100, "sent": 12, "failed": 0 },
    "daily_anomalies": { "processed": 100, "sent": 5, "failed": 0 }
  }
}
```

### Endpoint: `POST /functions/v1/process-queue`

**Request:**
```
POST /functions/v1/process-queue?batch_size=20
```

**Response:**
```json
{
  "success": true,
  "result": {
    "processed": 20,
    "sent": 18,
    "failed": 0,
    "retried": 2
  }
}
```

---

## 📱 Database Operations

### Queue a Notification

```typescript
// Simple queue
const { success } = await notificationQueueManager.queueNotification(
  userId,
  'daily_reminder',
  'Don\'t forget to log expenses',
  'Ready to track your spending?',
  { screen: 'add-record' },
  undefined, // scheduledFor
  `reminder_${userId}_${new Date().toDateString()}` // idempotency key
);

// Direct RPC call (if needed)
const { data: notificationId } = await supabase.rpc('queue_notification', {
  p_user_id: userId,
  p_notification_type: 'daily_reminder',
  p_title: 'Log your expenses',
  p_body: 'Ready to track?',
  p_data: { screen: 'add-record' },
  p_idempotency_key: `reminder_${userId}`,
});
```

### Get Queue Status

```typescript
// Get all queued notifications
const queue = await notificationQueueManager.getQueue(userId);

// Get pending notifications
const pending = await notificationQueueManager.getPending(userId);

// Get statistics
const stats = await notificationQueueManager.getStats(userId);
// Returns: { pending: 5, sent: 20, failed: 0, total: 25 }
```

### Monitor Delivery

```sql
-- Check recent notifications
SELECT * FROM notification_log
WHERE user_id = 'user-uuid'
ORDER BY sent_at DESC
LIMIT 20;

-- Check delivery rate
SELECT 
  notification_type,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'delivered' OR status = 'opened' THEN 1 ELSE 0 END) as delivered,
  ROUND(100.0 * SUM(CASE WHEN status = 'delivered' OR status = 'opened' THEN 1 ELSE 0 END) / COUNT(*), 2) as delivery_rate_percent
FROM notification_log
WHERE sent_at > NOW() - INTERVAL '7 days'
GROUP BY notification_type;

-- Check job execution
SELECT * FROM job_execution_logs
ORDER BY executed_at DESC
LIMIT 20;
```

---

## ⚙️ Configuration

### User Notification Preferences

Users can customize via preferences table:

```typescript
// Enable/disable notification types
await supabase.from('notification_preferences').upsert({
  user_id: userId,
  
  // Daily reminders
  daily_reminder_enabled: true,
  daily_reminder_time: '19:00',
  daily_reminder_timezone: 'America/New_York',
  
  // Weekly summary
  weekly_summary_enabled: true,
  weekly_summary_time: '19:00',
  weekly_summary_day: 0, // Sunday
  weekly_summary_timezone: 'America/New_York',
  
  // Budget alerts
  budget_warnings_enabled: true,
  budget_warning_threshold: 80, // 80% of budget
  
  // DND (Do Not Disturb)
  dnd_enabled: true,
  dnd_start_time: '22:00',
  dnd_end_time: '08:00',
  
  // Other settings
  timezone: 'America/New_York',
  max_notifications_per_day: 10,
});
```

### Throttling Configuration

In `notificationThrottler.ts`:

```typescript
// Customize minimum intervals between notifications
export const MIN_INTERVAL_BETWEEN_NOTIFICATIONS: Record<NotificationType, number> = {
  DAILY_REMINDER: 86400000,        // 1 per day
  BUDGET_EXCEEDED: 3600000,        // 1 per hour
  UNUSUAL_SPENDING: 3600000,       // 1 per hour
  // ... etc
};
```

---

## 🧪 Testing

### Test Daily Reminder Manually

```bash
# Trigger daily jobs edge function
curl -X POST https://[your-project].supabase.co/functions/v1/schedule-daily-jobs \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"manual_trigger": true}'
```

### Test Send Notification

```typescript
// In test component or console
const { success } = await notificationService.sendNotification({
  type: NotificationType.DAILY_REMINDER,
  title: '🧪 Test Notification',
  body: 'This is a test',
  data: { test: true },
});

console.log('Sent:', success);
```

### Check Queue Status

```typescript
const stats = await notificationQueueManager.getStats(userId);
console.log('Queue stats:', stats);

const queue = await notificationQueueManager.getQueue(userId, 10);
console.log('Latest notifications:', queue);
```

### View Logs in Supabase

```sql
-- Check job execution logs
SELECT 
  job_name,
  executed_at,
  success,
  notifications_sent,
  notifications_failed,
  error_message
FROM job_execution_logs
WHERE executed_at > NOW() - INTERVAL '24 hours'
ORDER BY executed_at DESC;

-- Check notification queue
SELECT status, COUNT(*) as count
FROM notification_queue
GROUP BY status;

-- Check push token validity
SELECT 
  platform,
  COUNT(*) as total,
  SUM(CASE WHEN is_valid THEN 1 ELSE 0 END) as valid,
  ROUND(100.0 * SUM(CASE WHEN is_valid THEN 1 ELSE 0 END) / COUNT(*), 2) as validity_percent
FROM push_tokens
GROUP BY platform;
```

---

## 🐛 Troubleshooting

### Issue: Notifications Not Received

**Check 1: Push Token Registration**
```sql
SELECT * FROM push_tokens 
WHERE user_id = 'target-user-uuid';
-- Should have at least one valid token
```

**Check 2: DND Hours**
- Verify user's DND settings are not preventing notification
- Check `notification_preferences` table

**Check 3: Queue Status**
```sql
SELECT * FROM notification_queue
WHERE user_id = 'target-user-uuid'
ORDER BY created_at DESC
LIMIT 5;
-- Check if notifications are pending or failed
```

**Check 4: Delivery Logs**
```sql
SELECT * FROM notification_log
WHERE user_id = 'target-user-uuid'
ORDER BY sent_at DESC
LIMIT 5;
-- Check error messages
```

### Issue: Job Not Running

**Check 1: Scheduler Started**
```typescript
// In app console
const scheduler = JobScheduler.getInstance();
scheduler.start();
```

**Check 2: Job Execution Logs**
```sql
SELECT * FROM job_execution_logs
WHERE job_name = 'daily_reminder'
ORDER BY executed_at DESC
LIMIT 5;
```

**Check 3: Edge Function Logs**
- Check Supabase dashboard → Functions → Logs

### Issue: Duplicate Notifications

**Solution: Idempotency Keys**
- Always provide idempotency key when queuing
- Format: `{job_type}_{user_id}_{date_key}`
- Database automatically deduplicates

```typescript
const idempotencyKey = `daily_reminder_${userId}_${new Date().toDateString()}`;
await notificationQueueManager.queueNotification(
  userId,
  'daily_reminder',
  title,
  body,
  data,
  undefined,
  idempotencyKey
);
```

---

## 📊 Monitoring Dashboard

Create a monitoring UI to track notification system health:

```typescript
export function NotificationMonitor() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const loadStats = async () => {
      // Get queue stats
      const queueStats = await notificationQueueManager.getStats(userId);
      setStats(queueStats);

      // Get recent logs
      const { data } = await supabase
        .from('notification_log')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(10);

      setLogs(data);
    };

    const interval = setInterval(loadStats, 5000);
    loadStats();

    return () => clearInterval(interval);
  }, [userId]);

  return (
    <View>
      {/* Queue Status */}
      <Text>Pending: {stats?.pending} | Sent: {stats?.sent} | Failed: {stats?.failed}</Text>

      {/* Recent Notifications */}
      {logs.map(log => (
        <View key={log.id}>
          <Text>{log.title}</Text>
          <Text>{log.status} • {log.notification_type}</Text>
        </View>
      ))}
    </View>
  );
}
```

---

## 📈 Performance Optimization

### Batch Processing
```typescript
// Process multiple users efficiently
const batchSize = 50;
const { data: preferences } = await supabase
  .from('notification_preferences')
  .select('user_id')
  .eq('daily_reminder_enabled', true)
  .range(0, batchSize - 1);

// Process next batch
.range(batchSize, batchSize * 2 - 1);
```

### Index Queries
```sql
-- Ensure indexes exist (already created in schema)
CREATE INDEX idx_queue_pending ON notification_queue(status, scheduled_for) 
  WHERE status = 'pending';

CREATE INDEX idx_token_valid ON push_tokens(user_id, is_valid);

CREATE INDEX idx_log_sent ON notification_log(sent_at DESC);
```

### Connection Pooling
```typescript
// Reuse Supabase client (singleton)
import { supabase } from '@/lib/supabase';
// Always use this instance, don't create new clients
```

---

## 🚀 Production Deployment Checklist

- [ ] Database schema deployed
- [ ] All Edge Functions deployed
- [ ] Push tokens registered for test users
- [ ] Test notification sent successfully
- [ ] Job scheduler running on app launch
- [ ] Queue processor running every 5 minutes
- [ ] DND hours respected
- [ ] Timezone handling verified
- [ ] Idempotency keys preventing duplicates
- [ ] Failed notifications retried
- [ ] Monitoring dashboard accessible
- [ ] Error alerts configured
- [ ] User preference UI implemented
- [ ] Privacy policy updated (mentioning notifications)
- [ ] Documentation provided to users

---

## 🎯 What's Automated Now

✅ **Daily Reminders** - Every day at preferred time  
✅ **Budget Warnings** - When spending reaches threshold  
✅ **Anomaly Detection** - When spending unusual  
✅ **Weekly Summaries** - Every Sunday at preferred time  
✅ **Weekly Compliance** - Budget adherence report  
✅ **Weekly Trends** - Week-over-week analysis  
✅ **Goal Progress** - Milestone tracking  
✅ **Achievements** - Gamification rewards  
✅ **Real-time Alerts** - Queued and retried automatically  
✅ **Delivery Tracking** - Complete log of all notifications  
✅ **Error Handling** - Automatic retry with exponential backoff  

---

## 📞 Support

For issues or questions:
1. Check `job_execution_logs` table
2. Review notification_queue status
3. Check notification_log for delivery errors
4. Review Supabase Function logs
5. Verify user preferences are correct

---

**Version:** 1.0  
**Last Updated:** December 21, 2025  
**Status:** Production Ready ✅
