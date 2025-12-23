# ⚡ BudgetZen Notification System - Quick Reference

**TL;DR - Get Started in 2-4 Hours**

---

## 📋 Files You Need

### Database
- `database/NOTIFICATION_SYSTEM_ENHANCED_SCHEMA.sql` ← Copy to Supabase SQL Editor

### Backend (Edge Functions)
- `supabase/functions/send-notification/index.ts`
- `supabase/functions/schedule-daily-jobs/index.ts`
- `supabase/functions/process-queue/index.ts`

### Frontend
- `lib/notifications/notificationQueue.ts` ← Copy to your project

### Documentation
1. `NOTIFICATION_EXECUTIVE_SUMMARY.md` ← Start here (overview)
2. `NOTIFICATION_SYSTEM_ANALYSIS.md` ← Deep dive analysis
3. `NOTIFICATION_IMPLEMENTATION_GUIDE.md` ← Step-by-step setup
4. `NOTIFICATION_TESTING_DEPLOYMENT.md` ← Testing & deployment

---

## 🚀 Quick Start (4 Steps)

### Step 1: Database (15 min)
```bash
# In Supabase SQL Editor
# Copy entire NOTIFICATION_SYSTEM_ENHANCED_SCHEMA.sql
# Paste into editor
# Click "Run"
```

### Step 2: Edge Functions (20 min)
```bash
supabase functions new send-notification
supabase functions new schedule-daily-jobs
supabase functions new process-queue

# Copy code from provided files into each function
# Deploy:
supabase functions deploy
```

### Step 3: Frontend (30 min)
```typescript
// Add to lib/notifications/notificationQueue.ts
// Update context/Notifications.tsx
// Start scheduler in app/_layout.tsx:

import { JobScheduler } from '@/lib/notifications/jobScheduler';
const scheduler = JobScheduler.getInstance();
await scheduler.start();
```

### Step 4: Test (30 min)
```typescript
// Queue a test notification
const { success } = await notificationQueueManager.queueNotification(
  userId,
  'daily_reminder',
  '🧪 Test',
  'Does this work?'
);

// Check on real device
```

**Total Time:** 2-4 hours

---

## 📱 What Now Works Automatically

| Notification | Trigger | When |
|---|---|---|
| **Daily Reminder** | Scheduled | Every day at user's preferred time |
| **Budget Warning** | Spending | When user reaches 80% of budget |
| **Anomaly Alert** | Spending | Unusual spending detected |
| **Weekly Summary** | Scheduled | Every Sunday at user's preferred time |
| **Weekly Compliance** | Scheduled | Every Sunday (budget adherence report) |
| **Weekly Trends** | Scheduled | Every Monday (spending patterns) |
| **Goal Progress** | Spending | When user hits milestone |
| **Achievements** | Spending | When user unlocks achievement |

---

## 🔑 Key Concepts (1-2 min read)

### Idempotency Key
Prevents duplicate notifications:
```typescript
const key = `daily_reminder_${userId}_${date}`;
// Same key = notification sent only once
```

### DND Hours
Respects quiet hours:
```typescript
dnd_enabled: true,
dnd_start_time: '22:00',  // 10 PM
dnd_end_time: '08:00'     // 8 AM
```

### Timezone Support
Sends at user's local time:
```typescript
timezone: 'America/New_York'
daily_reminder_time: '19:00' // 7 PM user's time
```

### Queue & Retry
Ensures delivery even if server/network down:
- Notification queued
- Retries up to 3x with exponential backoff
- Logged with delivery status

### Edge Functions
Serverless code running on Supabase:
- `send-notification` - Sends via Expo
- `schedule-daily-jobs` - Runs daily jobs
- `process-queue` - Sends pending notifications

---

## 🔌 API Calls You'll Need

### Queue a Notification
```typescript
await notificationQueueManager.queueNotification(
  userId,           // UUID
  'daily_reminder', // Notification type
  'Title',          // Title
  'Body text',      // Body
  { screen: 'add-record' }, // Optional data
  undefined,        // Scheduled time (optional)
  'unique_key'      // Idempotency key
);
```

### Send Pending
```typescript
const { sent, failed } = await notificationQueueManager.sendPending(userId);
```

### Get Queue Stats
```typescript
const { pending, sent, failed, total } = await notificationQueueManager.getStats(userId);
```

### Get Queue Items
```typescript
const queue = await notificationQueueManager.getQueue(userId);
const pending = await notificationQueueManager.getPending(userId);
```

---

## 🧪 Quick Test

```typescript
// In any component
import { notificationQueueManager } from '@/lib/notifications/notificationQueue';

async function testNotifications() {
  // 1. Queue a notification
  const { success, id } = await notificationQueueManager.queueNotification(
    userId,
    'daily_reminder',
    '🧪 BudgetZen Test',
    'If you see this, notifications work!'
  );
  
  if (success) {
    console.log('✅ Queued:', id);
    
    // 2. Send pending
    const { sent } = await notificationQueueManager.sendPending(userId);
    console.log(`✅ Sent ${sent} notifications`);
    
    // 3. Check stats
    const stats = await notificationQueueManager.getStats(userId);
    console.log('Stats:', stats);
  }
}
```

---

## 📊 Database Queries

### Check Push Tokens
```sql
SELECT COUNT(*), is_valid FROM push_tokens GROUP BY is_valid;
```

### Check Queue Status
```sql
SELECT status, COUNT(*) FROM notification_queue GROUP BY status;
```

### Check Delivery Rate (Last 7 days)
```sql
SELECT 
  notification_type,
  COUNT(*) as sent,
  SUM(CASE WHEN status IN ('delivered', 'opened') THEN 1 ELSE 0 END) as delivered,
  ROUND(100.0 * SUM(CASE WHEN status IN ('delivered', 'opened') THEN 1 ELSE 0 END) / COUNT(*), 2) as rate_percent
FROM notification_log
WHERE sent_at > NOW() - INTERVAL '7 days'
GROUP BY notification_type;
```

### Check Job Success Rate
```sql
SELECT job_name, 
  COUNT(*) as runs,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as rate_percent
FROM job_execution_logs
WHERE executed_at > NOW() - INTERVAL '7 days'
GROUP BY job_name;
```

---

## ⚙️ Configuration

### User Preferences
```typescript
await supabase.from('notification_preferences').upsert({
  user_id: userId,
  
  // Each notification type
  daily_reminder_enabled: true,
  daily_reminder_time: '19:00',
  
  weekly_summary_enabled: true,
  weekly_summary_time: '19:00',
  weekly_summary_day: 0, // 0=Sunday
  
  // Budget alerts
  budget_warnings_enabled: true,
  budget_warning_threshold: 80,
  
  // DND
  dnd_enabled: true,
  dnd_start_time: '22:00',
  dnd_end_time: '08:00',
  
  // Timezone
  timezone: 'America/New_York',
});
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---|---|
| No notifications received | Check `push_tokens` table - is token valid? |
| Duplicate notifications | Ensure idempotency key used |
| Notifications not at right time | Check user's timezone in preferences |
| Job not running | Verify scheduler started in app layout |
| Queue not processing | Check Edge Function logs, ensure deployed |

---

## 🔍 Debug Mode

```typescript
// Check everything
async function debugNotifications(userId: string) {
  // 1. Check tokens
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('*')
    .eq('user_id', userId);
  console.log('Tokens:', tokens?.length);
  
  // 2. Check preferences
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
  console.log('Preferences:', prefs);
  
  // 3. Check queue
  const queue = await notificationQueueManager.getQueue(userId);
  console.log('Queue:', queue?.length);
  
  // 4. Check recent logs
  const { data: logs } = await supabase
    .from('notification_log')
    .select('*')
    .eq('user_id', userId)
    .order('sent_at', { ascending: false })
    .limit(5);
  console.log('Recent logs:', logs);
}
```

---

## 📱 On Real Device Test

1. Log in on device
2. Grant notification permissions
3. Run debug function above
4. Queue test notification
5. Look for notification on device
6. Check notification_log table

---

## ✅ Pre-Launch Checklist

- [ ] SQL schema deployed
- [ ] Edge Functions deployed
- [ ] Push token registered
- [ ] Test notification sent successfully
- [ ] Notification received on device
- [ ] Job execution logs visible
- [ ] DND hours respected
- [ ] Timezone handling verified
- [ ] User preferences UI built
- [ ] Documentation updated

---

## 📞 Need Help?

1. **Overview** → `NOTIFICATION_EXECUTIVE_SUMMARY.md`
2. **Details** → `NOTIFICATION_SYSTEM_ANALYSIS.md`
3. **Setup** → `NOTIFICATION_IMPLEMENTATION_GUIDE.md`
4. **Testing** → `NOTIFICATION_TESTING_DEPLOYMENT.md`
5. **Code** → Look at comments in TypeScript files

---

**Status:** ✅ Ready to implement  
**Time to deploy:** 2-4 hours  
**Complexity:** Medium (everything provided, just integrate)

Good luck! 🚀
