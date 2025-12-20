## 🔧 DATABASE SCHEMA DEPLOYMENT - REQUIRED

**Status:** ⚠️ Database table needs to be created  
**Time:** 5 minutes  
**Difficulty:** Easy

---

## 🎯 The Issue

The Edge Function is working ✅ but the database table `contact_messages` doesn't exist yet.

**Error received:**
```
Could not find the 'appVersion' column of 'contact_messages' in the schema cache
```

This means the table hasn't been created in your Supabase database.

---

## ✅ Solution: Deploy the Schema

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com
2. Select your project
3. Click **SQL Editor** (left sidebar)

### Step 2: Create New Query

1. Click **New Query**
2. Copy the entire schema from: `database/contact_messages_schema.sql`

### Step 3: Paste and Execute

1. Paste the schema SQL into the editor
2. Click **Run** (or Ctrl+Enter)
3. Wait for success message

### Step 4: Verify Table Created

In SQL Editor, run:
```sql
SELECT * FROM public.contact_messages LIMIT 1;
```

Should show the table structure (no error).

---

## 📋 What Gets Created

Running the schema script creates:

✅ **Table:** `contact_messages` (11 columns)
```
id              UUID (primary key)
user_id         UUID (foreign key)
user_email      TEXT
subject         TEXT
message         TEXT
message_type    TEXT (enum)
app_version     TEXT
platform        TEXT (enum)
status          TEXT (enum, default='pending')
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

✅ **Security:** Row Level Security (RLS) enabled with 4 policies
✅ **Performance:** 5 indexes created
✅ **Automation:** Timestamp trigger for updated_at

---

## 🚀 Quick Copy-Paste Steps

1. **Open file:** `database/contact_messages_schema.sql`
2. **Select all:** Ctrl+A
3. **Copy:** Ctrl+C
4. **Go to:** Supabase Dashboard → SQL Editor
5. **Click:** New Query
6. **Paste:** Ctrl+V
7. **Run:** Click Run or Ctrl+Enter
8. **Wait:** For success message
9. **Done!** Table created ✅

---

## ✅ After Deployment

Once the table is created:

1. **Rebuild app** (or restart Expo)
2. **Try sending message again**
3. **Should succeed now!** ✅

---

## 🧪 Test It

After deployment, test in SQL Editor:

```sql
-- Check table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'contact_messages';

-- Check columns
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'contact_messages';

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'contact_messages';
```

All three queries should return results. ✅

---

## 📊 Table Structure

```sql
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY,
  user_id UUID (references auth.users),
  user_email TEXT,
  subject TEXT (3-100 chars),
  message TEXT (5-5000 chars),
  message_type TEXT ('bug_report', 'feature_request', 'general_feedback', 'other'),
  app_version TEXT (e.g., '1.0.0'),
  platform TEXT ('ios', 'android', 'web'),
  status TEXT ('pending', 'sent', 'failed'),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

---

## 🔒 Security Enabled

4 RLS Policies:
- Users can SELECT their own messages
- Users can INSERT their own messages
- Users can DELETE their own messages
- Users CANNOT UPDATE messages (status managed by backend)

---

## 📈 Indexes Created

5 indexes for performance:
```
idx_contact_messages_user_id
idx_contact_messages_status
idx_contact_messages_created_at
idx_contact_messages_user_created_desc
idx_contact_messages_pending_only
```

---

## ⏱️ Time Required

- **Copy schema:** 1 minute
- **Paste in Supabase:** 1 minute
- **Execute:** 1 minute
- **Verify:** 2 minutes
- **Total:** ~5 minutes ✅

---

## 🎯 Next Steps

1. **Deploy schema** (5 min) ← DO THIS NOW
2. **Rebuild app** (2 min)
3. **Send test message** (1 min)
4. **Verify success** ✅

---

## ✨ Then Your System Will Work Perfectly!

Once table is created:
- ✅ Messages save to database
- ✅ Emails send to jpdevland@gmail.com
- ✅ Status tracked (pending/sent/failed)
- ✅ User audit trail maintained
- ✅ RLS security enforced

---

**ACTION REQUIRED:** Deploy schema NOW (5 min)

→ Go to Supabase SQL Editor
→ Run the schema from `database/contact_messages_schema.sql`
→ Done! ✅
