# 📊 Database Setup Guide - BudgetZen Notification System

## Quick Start (3 minutes)

### 1. Open Supabase SQL Editor
- Go to your Supabase dashboard
- Click **SQL Editor** (left sidebar)
- Click **New Query**

### 2. Copy & Paste SQL
- Open the file: `database/SETUP_INSTRUCTIONS.sql`
- Copy ALL the code
- Paste into Supabase SQL Editor
- Click **Run** (blue button)

### 3. Done! ✅
All tables are created and app is ready to use.

---

## What Gets Created

### 5 New Tables

| Table | Purpose | Rows | Auto-Populated |
|-------|---------|------|---|
| **job_execution_logs** | Tracks when scheduled jobs run | Grows over time | By app |
| **goal_milestones_notified** | Tracks goal progress notifications | Per goal | By app |
| **user_achievements** | Tracks savings milestones | Per user | By app |
| **notification_throttle** | Prevents notification spam | Per user | By app |
| **notification_analytics** | Tracks notification metrics | Per notification | By app |

### 3+ New Columns in notification_preferences

All of these are automatically set to sensible defaults:
- `large_transaction_enabled` - Default: true
- `large_transaction_threshold` - Default: ₹10,000
- `budget_exceeded_enabled` - Default: true
- `unusual_spending_enabled` - Default: true
- `daily_reminder_enabled` - Default: true
- `daily_reminder_time` - Default: '19:00'
- `budget_warnings_enabled` - Default: false
- `budget_warning_threshold` - Default: 80%
- `daily_anomaly_enabled` - Default: false
- `weekly_summary_enabled` - Default: true
- `weekly_summary_time` - Default: '19:00'
- `weekly_summary_day` - Default: 0 (Sunday)
- `compliance_report_enabled` - Default: false
- `trends_report_enabled` - Default: false
- `goal_progress_enabled` - Default: true
- `achievement_enabled` - Default: true
- `dnd_enabled` - Default: false
- `dnd_start_time` - Default: '22:00'
- `dnd_end_time` - Default: '08:00'
- `max_notifications_per_day` - Default: 5

---

## Troubleshooting

### If you get "table already exists" error
✅ That's fine! The script uses `IF NOT EXISTS` so it's safe to run multiple times.

### If you get "foreign key error"
❌ This means `goals` table doesn't exist. First create your goals table, then run this script.

### If nothing happens when you click Run
- Check that you pasted the ENTIRE script
- Look for error messages at bottom of page
- Try running queries one at a time

### How to verify it worked

Run these queries in SQL Editor:

```sql
-- Check table count
SELECT COUNT(*) as table_count FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN (
  'job_execution_logs',
  'goal_milestones_notified', 
  'user_achievements',
  'notification_throttle',
  'notification_analytics'
);
-- Should return: 5

-- Check notification_preferences columns
SELECT COUNT(*) as column_count FROM information_schema.columns 
WHERE table_name = 'notification_preferences' 
AND column_name IN (
  'large_transaction_enabled',
  'daily_reminder_enabled',
  'weekly_summary_enabled',
  'goal_progress_enabled',
  'achievement_enabled',
  'trends_report_enabled'
);
-- Should return: 6+
```

---

## File Structure

```
database/
├── notification_system_schema.sql  (Comprehensive, with comments)
├── SETUP_INSTRUCTIONS.sql          (Simple, easy to copy-paste) ← USE THIS ONE
└── DATABASE_SETUP_GUIDE.md         (This file)
```

---

## After Setup

### 1. Restart Your App
The app will now:
- ✅ Start the job scheduler automatically
- ✅ Save job execution logs to database
- ✅ Track notification metrics
- ✅ Record goal milestone notifications
- ✅ Track savings achievements

### 2. Check Logs
Run this query to see job executions:

```sql
SELECT 
  job_name,
  executed_at,
  success,
  duration_ms,
  error_message
FROM job_execution_logs
ORDER BY executed_at DESC
LIMIT 20;
```

### 3. Monitor Notifications
See which notifications were sent:

```sql
SELECT 
  notification_type,
  sent_at,
  opened_at,
  response_time_ms
FROM notification_analytics
ORDER BY sent_at DESC
LIMIT 20;
```

### 4. Check Achievements
See which users unlocked achievements:

```sql
SELECT 
  user_id,
  achievement_name,
  threshold,
  unlocked_at
FROM user_achievements
ORDER BY unlocked_at DESC
LIMIT 20;
```

---

## What Each Table Does

### job_execution_logs
Tracks every time a scheduled job runs.

**Example data:**
```
job_name: "daily_reminder"
executed_at: 2025-12-11 19:00:00
success: true
duration_ms: 245
error_message: null
```

**Useful for:**
- Debugging failed jobs
- Checking when jobs ran
- Monitoring job performance

---

### goal_milestones_notified
Tracks which goal milestones have been announced.

**Example data:**
```
goal_id: "abc123..."
milestone_percentage: 50
notified_at: 2025-12-11 14:30:00
```

**Useful for:**
- Preventing duplicate notifications
- Tracking goal progress
- User dashboard (show achieved milestones)

---

### user_achievements
Tracks savings achievements unlocked.

**Example data:**
```
user_id: "john123..."
achievement_name: "Lakh Milestone"
threshold: 100000
unlocked_at: 2025-12-11 15:45:00
```

**Useful for:**
- Achievement badges
- User profile
- Motivational messages

---

### notification_throttle
Prevents sending same notification too often.

**Example data:**
```
user_id: "john123..."
notification_type: "budget_exceeded:food"
last_sent_at: 2025-12-11 10:30:00
count_today: 3
```

**Useful for:**
- Preventing spam
- Rate limiting
- User preference enforcement

---

### notification_analytics
Detailed metrics about every notification.

**Example data:**
```
notification_id: "notif_xyz789"
notification_type: "large_transaction"
sent_at: 2025-12-11 15:00:00
opened_at: 2025-12-11 15:02:30
actioned_at: null
response_time_ms: 150
```

**Useful for:**
- Measuring engagement
- A/B testing
- Understanding user behavior

---

## Common SQL Queries

### Get job execution stats (last 24 hours)
```sql
SELECT 
  job_name,
  COUNT(*) as total_runs,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed,
  AVG(duration_ms)::INT as avg_duration_ms
FROM job_execution_logs
WHERE executed_at > NOW() - INTERVAL '24 hours'
GROUP BY job_name
ORDER BY total_runs DESC;
```

### Get notification open rate
```sql
SELECT 
  notification_type,
  COUNT(*) as total_sent,
  COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as opened,
  ROUND(100.0 * COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) / COUNT(*), 2) as open_rate_percent
FROM notification_analytics
WHERE sent_at > NOW() - INTERVAL '7 days'
GROUP BY notification_type
ORDER BY open_rate_percent DESC;
```

### Get user with most achievements
```sql
SELECT 
  user_id,
  COUNT(*) as achievement_count,
  MAX(threshold) as highest_achievement,
  MAX(unlocked_at) as latest_date
FROM user_achievements
GROUP BY user_id
ORDER BY achievement_count DESC
LIMIT 10;
```

### Find failed jobs
```sql
SELECT 
  job_name,
  executed_at,
  error_message
FROM job_execution_logs
WHERE success = false
ORDER BY executed_at DESC
LIMIT 20;
```

---

## Security

### Row Level Security (RLS)
All tables have RLS enabled. The app service role can insert data, authenticated users can read their own data.

If you need custom RLS policies, uncomment them in the SQL file.

### Data Privacy
- ✅ Each table is linked to `auth.users`
- ✅ Only users can see their own data
- ✅ Job logs are visible to service role only
- ✅ No sensitive data stored (only IDs and timestamps)

---

## Backups & Cleanup

### Backup job execution logs
```sql
-- Export last 30 days of job logs
SELECT * FROM job_execution_logs
WHERE executed_at > NOW() - INTERVAL '30 days'
ORDER BY executed_at DESC;
```

### Clean up old logs (optional)
```sql
-- Delete logs older than 90 days
DELETE FROM job_execution_logs
WHERE executed_at < NOW() - INTERVAL '90 days';

-- Delete logs older than 1 year
DELETE FROM notification_analytics
WHERE sent_at < NOW() - INTERVAL '1 year';
```

---

## Next Steps

1. ✅ Run the SQL script
2. ✅ Verify tables created (see Troubleshooting)
3. ✅ Restart your app
4. ✅ Create a transaction to trigger real-time alert
5. ✅ Wait until 19:00 to see daily reminder
6. ✅ Check database to see logs
7. ✅ Monitor job_execution_logs table

---

## Files Provided

```
database/
├── notification_system_schema.sql
│   └── Comprehensive SQL with detailed comments
│       All 5 tables + columns in one file
│       Includes sample data and views
│
├── SETUP_INSTRUCTIONS.sql
│   └── Simplified SQL with ONLY what you need
│       Remove the comments/explanations
│       Just create tables and columns
│       EASIEST TO USE - COPY & PASTE THIS ONE
│
└── DATABASE_SETUP_GUIDE.md
    └── This file - explains what gets created
```

---

## Questions?

### Where do I paste the SQL?
Supabase Dashboard → SQL Editor → New Query → Paste → Run

### How long does it take?
30 seconds.

### Will it affect my existing data?
No. Uses `IF NOT EXISTS` so it won't overwrite anything.

### Do I need to restart the app?
Yes, after running the SQL, restart the app.

### How do I know it worked?
Run the verification queries (see Troubleshooting section).

---

## Success! ✅

Your database is now set up for the complete notification system.

**The app will now:**
- ✅ Send real-time alerts (large transaction, budget exceeded, unusual spending)
- ✅ Send daily reminders and summaries
- ✅ Send weekly insights and trends
- ✅ Track goal progress
- ✅ Track savings achievements
- ✅ Log all job executions
- ✅ Prevent notification spam

**Everything is automated and ready to use!**

---

*Database setup completed. App is ready for production.*
