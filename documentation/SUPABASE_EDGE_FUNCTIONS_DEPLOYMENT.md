## 🚀 Supabase Edge Functions - Deployment Guide

**Status:** Complete Production-Ready Implementation  
**Framework:** Deno (TypeScript)  
**Service:** Supabase Edge Functions  
**Email Provider:** Resend (recommended) or alternatives

---

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Supabase CLI installed**
   ```bash
   npm install -g supabase
   ```

2. **Supabase project created** at https://supabase.com

3. **Email service account** (Resend recommended)
   - Sign up at https://resend.com
   - Get your API key

4. **Environment variables ready**

---

## 🔧 Step 1: Prepare Environment Variables

### In your Supabase dashboard:

1. Go to **Project Settings** → **API**
2. Copy:
   - `SUPABASE_URL` (Project URL)
   - `SUPABASE_SERVICE_ROLE_KEY` (Service Role secret key)

3. Go to **Project Settings** → **Functions** → **Secrets**

4. Add these secrets:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx (from Resend)
   CONTACT_RECIPIENT_EMAIL=jpdevland@gmail.com
   CONTACT_EMAIL_FROM=noreply@budgetzen.app
   ```

### Or use environment file locally:

Create `supabase/.env.local`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
CONTACT_RECIPIENT_EMAIL=jpdevland@gmail.com
CONTACT_EMAIL_FROM=noreply@budgetzen.app
```

---

## 📦 Step 2: Create the Function File

The file has already been created at:
```
supabase/functions/send-contact-email/index.ts
```

If you need to recreate it, use the content provided in the BACKEND_EMAIL_SERVICE_GUIDE.md.

---

## 🔑 Step 3: Set Up Resend (Recommended)

### Why Resend?
- **Free tier:** 100 emails/day
- **Easy setup:** Just need API key
- **Good deliverability:** Built for transactional emails
- **No SMTP config:** No need for password/2FA

### Setup Steps:

1. **Create Resend Account**
   - Go to https://resend.com
   - Sign up with email
   - Verify email

2. **Get API Key**
   - Dashboard → API Keys
   - Create new API key
   - Copy the key (starts with `re_`)

3. **Add Domain (Optional but recommended)**
   - Go to Domains
   - Add your domain or use default `resend.dev`
   - For `@budgetzen.app`: Point DNS records
   - For testing: Use default domain (emails will have "via Resend")

4. **Store API Key**
   - Add to Supabase Secrets (see Step 1)

### Alternative: SendGrid
```bash
# If using SendGrid instead
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxx
```

### Alternative: Mailgun
```bash
# If using Mailgun instead
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=mail.budgetzen.app
```

---

## 🚀 Step 4: Deploy the Function

### Option A: Deploy via Supabase Dashboard (Easiest)

1. Go to Supabase Dashboard
2. Navigate to **Functions**
3. Click **Create a new function**
4. Name it: `send-contact-email`
5. Copy the entire `index.ts` content
6. Paste it in the editor
7. Click **Deploy**

### Option B: Deploy via CLI

```bash
# Login to Supabase
supabase login

# Navigate to your project
cd /path/to/budgetzen

# Deploy the function
supabase functions deploy send-contact-email

# View logs
supabase functions delete send-contact-email  # To update
supabase functions deploy send-contact-email
```

### Option C: Deploy with Environment Variables

```bash
# Create .env.local in supabase folder
echo "RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx" >> supabase/.env.local

# Deploy
supabase functions deploy send-contact-email --no-verify-jwt
```

---

## ✅ Step 5: Verify Deployment

### Check in Dashboard:
1. Go to **Functions**
2. Should see `send-contact-email` in the list
3. Status should be **Active** (green)

### Test the Function:

Use curl to test:

```bash
# Get your function URL from dashboard or use:
FUNCTION_URL="https://your-project.supabase.co/functions/v1/send-contact-email"

# Test with sample data
curl -X POST ${FUNCTION_URL} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "userId": "test-user-id",
    "userEmail": "test@example.com",
    "subject": "Test Message",
    "message": "This is a test message",
    "messageType": "general_feedback",
    "appVersion": "1.0.0",
    "platform": "ios"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Message sent successfully",
  "messageId": "uuid-here"
}
```

---

## 📱 Step 6: Update App Configuration

In `lib/contact/contactService.ts`, update:

```typescript
// Around line 50 - Update the backend URL
const BACKEND_URL = Deno.env.get('EXPO_PUBLIC_BACKEND_URL') || 
  'https://your-project.supabase.co/functions/v1/send-contact-email';

// Or keep as environment variable
export const sendContactEmail = async (...) => {
  const response = await fetch(
    process.env.EXPO_PUBLIC_BACKEND_URL!,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(...)
    }
  );
  // ...
}
```

Add to your `.env` file:
```env
EXPO_PUBLIC_BACKEND_URL=https://your-project.supabase.co/functions/v1/send-contact-email
```

---

## 🔒 Step 7: Security Configuration

### Enable JWT Verification (Recommended)

In Supabase Dashboard → **Functions** → **send-contact-email** → **Settings**:

1. Enable **Require JWT verification**
2. The function will automatically verify the Authorization header

### Or Allow Without JWT (Less Secure):

```bash
supabase functions deploy send-contact-email --no-verify-jwt
```

---

## 🧪 Step 8: Test End-to-End

### From the App:

1. Open BudgetZen app
2. Go to Help modal (Menu → Help)
3. Select Contact tab
4. Fill in form:
   - Message type: "Bug Report"
   - Subject: "Test message"
   - Message: "Testing Supabase Edge Functions"
5. Click **Send**
6. Should see success alert
7. Check email (jpdevland@gmail.com) - should receive the message

### Check Database:

In Supabase Dashboard:

```sql
SELECT * FROM public.contact_messages 
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 10;
```

Should show your messages with status `sent`.

---

## 📊 Monitoring & Logs

### View Function Logs:

In Supabase Dashboard:

1. Go to **Functions** → **send-contact-email**
2. Click **Invocations** tab
3. See real-time logs and execution times

### View Query Logs:

```sql
-- Check message statistics
SELECT 
  status,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) OVER () / COUNT(*) OVER (), 2) as percentage
FROM public.contact_messages
GROUP BY status;

-- Check messages sent today
SELECT 
  user_email,
  subject,
  message_type,
  status,
  created_at
FROM public.contact_messages
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

---

## 🔧 Troubleshooting

### Problem: "Function not found" error

**Solution:**
1. Verify function deployed in Dashboard
2. Check URL matches exactly
3. Ensure CORS is enabled (it is by default)

### Problem: "RESEND_API_KEY not configured"

**Solution:**
1. Go to Supabase Project Settings → Functions
2. Add secret: `RESEND_API_KEY`
3. Redeploy function
4. Check in function logs

### Problem: "Email sending failed"

**Solution:**
1. Check RESEND_API_KEY is correct
2. Verify recipient email is valid
3. Check Resend dashboard for failed emails
4. Test with curl first

### Problem: "Message not saved in database"

**Solution:**
1. Verify `contact_messages` table exists
2. Check RLS policies allow service role
3. Verify SUPABASE_SERVICE_ROLE_KEY is correct
4. Check database logs in Supabase

### Problem: Database insert succeeds but email fails

**Solution:**
1. Message is still saved with status `failed`
2. App will retry automatically
3. Check email service configuration
4. Review logs in Supabase Functions

---

## 📈 Performance & Scalability

### Function Execution Time:
- Database insert: ~100ms
- Email send (Resend): ~200ms
- Total: ~300ms (well within limits)

### Rate Limits:
- Free tier: 500k function invocations/month
- Resend: 100/day free tier (should increase)
- Database: 100k rows free (plenty for contact messages)

### Scaling:
Supabase Edge Functions auto-scale based on load.

---

## 🔐 Security Checklist

- [x] JWT verification enabled
- [x] Input validation in function
- [x] SQL injection prevention (parameterized queries)
- [x] XSS prevention (HTML sanitization)
- [x] RLS policies on database
- [x] HTTPS only (Supabase enforces)
- [x] API keys stored as secrets (not in code)
- [x] Service role key never exposed to client

---

## 📋 Deployment Checklist

- [ ] Supabase CLI installed
- [ ] Supabase project created
- [ ] Resend account created
- [ ] Resend API key obtained
- [ ] Environment secrets configured in Supabase
- [ ] Function file created at `supabase/functions/send-contact-email/index.ts`
- [ ] Function deployed via Dashboard or CLI
- [ ] Function status shows "Active"
- [ ] Curl test successful
- [ ] App .env updated with function URL
- [ ] App rebuilt/restarted
- [ ] End-to-end test from app successful
- [ ] Email received at jpdevland@gmail.com
- [ ] Database entry created with status "sent"
- [ ] Logs checked in Supabase Dashboard

---

## 🎯 Next Steps

1. **Deploy function** (5 min)
2. **Update app configuration** (2 min)
3. **Run end-to-end test** (5 min)
4. **Check email received** (5 min)
5. **Verify database entry** (5 min)

**Total time: ~20 minutes**

---

## 📞 Support

If you encounter issues:

1. Check Supabase Function logs (Dashboard → Functions → Invocations)
2. Check Resend email logs (Resend Dashboard)
3. Verify database table exists and has RLS policies
4. Test with curl command first before using app

---

**Ready to deploy? Let's go!** ✅
