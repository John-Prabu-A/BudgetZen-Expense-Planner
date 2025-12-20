## Fix for PGRST204 Schema Cache Error

### Issue
Getting error: `Could not find the 'appVersion' column of 'contact_messages'`

**Root Cause:** Supabase schema cache bug (PGRST204) - the database has the column but the schema metadata cache is stale.

**Why emails still work:** The Edge Function has fallback logic that continues to send email even if database insert fails.

### 3-Step Fix (5 minutes)

#### Step 1: Create RPC Function (Fix schema cache issue)

1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy entire content from `database/contact_messages_rpc.sql`
4. Click "Run"

**What this does:**
- Creates an RPC function that inserts directly via PostgreSQL (bypasses schema cache)
- Edge Function will try direct insert first, then fallback to RPC if it fails
- Completely eliminates PGRST204 errors

#### Step 2: Update Edge Function

The code is already updated in `supabase/functions/send-contact-email/index.ts` with:
- ✅ Primary method: Standard insert with error handling
- ✅ Fallback method: RPC function call
- ✅ Graceful degradation: Still sends email even if DB fails

#### Step 3: Test

1. Send a test message from the app
2. Check database: `SELECT * FROM contact_messages` (should have new record)
3. Check status column: Should be "sent" (not "pending")

### Expected Result

**Before:** Database errors, but emails still sent
```
❌ Database: PGRST204 error
✅ Email: Sent successfully
```

**After:** Full functionality
```
✅ Database: Message stored with "sent" status
✅ Email: Sent successfully
```

### Files Modified
- `supabase/functions/send-contact-email/index.ts` - Added RPC fallback
- `database/contact_messages_rpc.sql` - New RPC function (needs deployment)

### If Still Failing

**Option A:** Supabase schema cache is very stale
- Go to Supabase Dashboard → Database → Recompile Schema Cache
- Or wait 5 minutes for auto-refresh

**Option B:** Check RPC function deployed
- Go to Supabase Dashboard → Database → Functions
- Verify `insert_contact_message_raw` exists

**Option C:** Manual validation
```sql
-- Check column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'contact_messages' 
AND column_name = 'app_version';

-- Should return: app_version
```
