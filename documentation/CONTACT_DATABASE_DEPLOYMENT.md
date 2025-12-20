## Contact Messages Database - Deployment Guide

### Overview
Step-by-step guide to deploy the `contact_messages` table to your Supabase database.

**Time to Complete:** 5 minutes
**Difficulty:** Easy
**Rollback:** Yes (drop table if needed)

---

## Step 1: Access Supabase Dashboard

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign in with your credentials
3. Select your BudgetZen project
4. Click "SQL Editor" in the left sidebar

---

## Step 2: Create SQL File

Navigate to `database/contact_messages_schema.sql` in your project.

**Location:** `c:\dev\budgetzen\database\contact_messages_schema.sql`

Copy the entire contents of this file.

---

## Step 3: Execute in Supabase

1. **In Supabase SQL Editor:**
   - Click "New Query"
   - Paste the entire SQL contents
   - Click "Run" button (or Ctrl+Enter)

2. **Expected Output:**
   ```
   ✓ Table created: contact_messages
   ✓ Policies created
   ✓ Indexes created
   ✓ Triggers created
   ```

3. **Check for errors:**
   - If you see red errors, check the error message
   - Common issue: Table already exists (safe to ignore)

---

## Step 4: Verify Installation

### Via SQL Editor

Run this query to confirm the table exists:

```sql
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'contact_messages'
ORDER BY ordinal_position;
```

**Expected result:** 11 rows (one for each column)

### Via Supabase UI

1. Click "Table Editor" in left sidebar
2. Look for `contact_messages` in the table list
3. Click it to see the structure
4. Verify all 11 columns exist

---

## Step 5: Enable Row Level Security (RLS)

1. **In Table Editor:**
   - Click `contact_messages` table
   - Click "RLS" button at top right
   - Enable RLS (turn on the toggle)

2. **Verify Policies:**
   - Go to SQL Editor
   - Run this query:
   ```sql
   SELECT * FROM auth.policies 
   WHERE table_name = 'contact_messages';
   ```
   - Should show 3 policies:
     - `SELECT policy` - Users see their own
     - `INSERT policy` - Users insert with own user_id
     - `DELETE policy` - Users delete their own

---

## Step 6: Create Storage Bucket (Optional)

If you want to store attachments:

1. Go to "Storage" in left sidebar
2. Click "New Bucket"
3. Name: `contact-attachments`
4. Make it private
5. Create

---

## Step 7: Test the Setup

### Create Test Message

```sql
-- Insert a test message (replace user_id with your actual user)
INSERT INTO contact_messages (
  user_id,
  user_email,
  subject,
  message,
  message_type,
  app_version,
  platform,
  status
) VALUES (
  'your-user-id-here',
  'test@example.com',
  'Test message',
  'This is a test message to verify the system works',
  'general_feedback',
  '1.0.0',
  'android',
  'pending'
);
```

### Verify RLS Works

```sql
-- This should only show messages from the current user
-- The RLS policy restricts visibility
SELECT * FROM contact_messages;
```

### Check Triggers

```sql
-- Verify the table updates
SELECT 
  id,
  subject,
  status,
  created_at,
  updated_at
FROM contact_messages
ORDER BY created_at DESC
LIMIT 1;
```

---

## Step 8: Configure Environment Variables

Update your `.env.local` or `.env` file:

```bash
# Already configured (verify these exist)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Backend email service (add these)
EXPO_PUBLIC_BACKEND_URL=https://api.yoursite.com
EXPO_PUBLIC_API_KEY=your-secret-key-here
```

---

## Troubleshooting

### Error: "Table already exists"
- This is fine - the table was already created
- You can safely ignore this error

### Error: "Permission denied"
- Check your Supabase permissions
- Verify you have the correct project selected
- Try re-authenticating

### Error: "Column already exists"
- The column was already created in a previous attempt
- Drop and recreate the table:
```sql
DROP TABLE IF EXISTS contact_messages CASCADE;
-- Then re-run the full schema
```

### RLS Not Working
- Verify RLS is enabled on the table
- Check policies exist:
```sql
SELECT policy_name, definition 
FROM auth.policies 
WHERE table_name = 'contact_messages';
```

### Indexes Not Created
- Verify indexes exist:
```sql
SELECT * FROM pg_indexes 
WHERE tablename = 'contact_messages';
```
- Should show 3 indexes

---

## Database Schema Reference

### Table: contact_messages

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, Default: gen_random_uuid() |
| user_id | UUID | NOT NULL, FK to auth.users |
| user_email | TEXT | NOT NULL |
| subject | TEXT | NOT NULL, 3-100 chars |
| message | TEXT | NOT NULL, 5-5000 chars |
| message_type | TEXT | NOT NULL, ENUM |
| app_version | TEXT | Optional |
| platform | TEXT | NOT NULL, ENUM |
| status | TEXT | DEFAULT 'pending', ENUM |
| created_at | TIMESTAMP | DEFAULT now() |
| updated_at | TIMESTAMP | DEFAULT now() |

### Valid Enums

**message_type:**
- `bug_report`
- `feature_request`
- `general_feedback`
- `other`

**platform:**
- `ios`
- `android`
- `web`

**status:**
- `pending` (just created)
- `sent` (email sent successfully)
- `failed` (email send failed, can retry)

---

## Indexes

The database includes 3 performance indexes:

1. **Index on user_id, created_at**
   ```sql
   CREATE INDEX idx_contact_user_created 
   ON contact_messages (user_id, created_at DESC);
   ```
   - Fast lookup of user's messages
   - Most recent first

2. **Index on status**
   ```sql
   CREATE INDEX idx_contact_status 
   ON contact_messages (status);
   ```
   - Fast lookup of failed messages for retry

3. **Index on created_at**
   ```sql
   CREATE INDEX idx_contact_created 
   ON contact_messages (created_at DESC);
   ```
   - Timeline queries

---

## Row Level Security Policies

### Policy 1: Users can SELECT their own messages
```sql
SELECT
  (auth.uid() = user_id)
```
- Users see only messages they created
- Creator (jpdevland) sees all (if they have admin role)

### Policy 2: Users can INSERT with their own user_id
```sql
INSERT
  (auth.uid() = user_id)
```
- Prevents users from creating messages as other users
- Enforces data integrity

### Policy 3: Users can DELETE their own messages
```sql
DELETE
  (auth.uid() = user_id)
```
- Users can delete messages they sent
- Creator can delete messages (with admin role)

---

## Backup & Recovery

### Backup the Table

```bash
# Export as SQL
pg_dump --data-only \
  -t contact_messages \
  postgresql://user:password@db.host/database > contact_messages_backup.sql
```

### Restore from Backup

```bash
# Connect to Supabase and run:
psql -d "postgresql://user:password@db.host/database" \
  -f contact_messages_backup.sql
```

---

## Monitoring Queries

### Get Message Statistics

```sql
SELECT 
  message_type,
  status,
  COUNT(*) as count,
  DATE(created_at) as date
FROM contact_messages
GROUP BY message_type, status, DATE(created_at)
ORDER BY date DESC;
```

### Get Failed Messages to Retry

```sql
SELECT 
  id,
  user_email,
  subject,
  created_at,
  updated_at
FROM contact_messages
WHERE status = 'failed'
  AND updated_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Get User Message Count

```sql
SELECT 
  user_id,
  user_email,
  COUNT(*) as total_messages,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
FROM contact_messages
GROUP BY user_id, user_email
ORDER BY total_messages DESC;
```

### Get Messages from Last 24 Hours

```sql
SELECT 
  id,
  user_email,
  subject,
  message_type,
  status,
  created_at
FROM contact_messages
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

---

## Maintenance

### Clean Up Old Messages (6+ months)

```sql
DELETE FROM contact_messages
WHERE created_at < NOW() - INTERVAL '6 months'
  AND status IN ('sent', 'failed');
```

### Archive Old Messages

```sql
-- Create archive table
CREATE TABLE contact_messages_archive AS
SELECT * FROM contact_messages
WHERE created_at < NOW() - INTERVAL '1 year';

-- Delete from main table
DELETE FROM contact_messages
WHERE created_at < NOW() - INTERVAL '1 year';
```

### Rebuild Indexes (Maintenance)

```sql
REINDEX TABLE contact_messages;
```

---

## Security Audit

### View All Policies

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'contact_messages';
```

### Test RLS (As specific user)

```sql
-- Run as specific user to test
SET ROLE "user-id-here";
SELECT COUNT(*) FROM contact_messages;
RESET ROLE;
```

### Check Encryption Status

```sql
-- Supabase automatically encrypts data at rest
-- Verify via Supabase Dashboard:
-- Settings → Database → SSL
```

---

## Performance Tips

1. **Indexes are created** - Fast queries guaranteed
2. **RLS policies are simple** - No performance impact
3. **Timestamp fields auto-managed** - No manual updates needed
4. **Keep message count reasonable** - Archive old messages quarterly

---

## Scaling Considerations

### If you get 1000+ messages/day:

1. **Add retention policy:**
   ```sql
   CREATE POLICY delete_old_messages
     ON contact_messages
     FOR DELETE
     USING (created_at < NOW() - INTERVAL '90 days');
   ```

2. **Archive to separate table:**
   ```sql
   -- Move to archive monthly
   CREATE TABLE contact_messages_archive PARTITION BY RANGE (DATE(created_at));
   ```

3. **Add read replicas:** (via Supabase console)

---

## Next Steps

1. ✅ Deploy schema (this guide)
2. ✅ Configure environment variables
3. 🔄 Implement backend email service
4. 🔄 Test with mobile app
5. 🔄 Monitor and maintain

---

**Status: ✅ READY TO DEPLOY**

**Deployment Time:** ~2 minutes
**Rollback Time:** ~30 seconds (if needed)

Copy the SQL from `database/contact_messages_schema.sql` and run in Supabase SQL Editor.
