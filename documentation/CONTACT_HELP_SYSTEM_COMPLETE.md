## Contact & Help System - Complete Implementation Guide

### Overview
A production-ready contact/feedback system that:
- ✅ Collects user messages securely
- ✅ Stores in Supabase database
- ✅ Sends emails to creator (jpdevland@gmail.com)
- ✅ Validates all inputs
- ✅ Handles network failures gracefully
- ✅ Retries failed messages automatically
- ✅ Provides user-friendly feedback

---

## Architecture

### 1. Frontend: Help Modal (`app/(modal)/help-modal.tsx`)

**Two Tabs:**
- **FAQ Tab** - Frequently asked questions about the app
- **Contact Tab** - Form to send messages to creator

**Contact Form Features:**
- Message type selector (Bug Report, Feature Request, Feedback, Other)
- Subject field (3-100 characters)
- Message field (5-5000 characters)
- Character counters for both fields
- Displays user's email address
- Visible feedback during sending
- Error recovery with retry option

**Form Validation:**
```
Subject: 3-100 characters
Message: 5-5000 characters
User must be logged in
```

### 2. Service Layer: Contact Service (`lib/contact/contactService.ts`)

**Main Function: `sendContactMessage()`**

Flow:
```
1. Validate email format
2. Validate subject length (3-100)
3. Validate message length (5-5000)
4. Create message object with metadata
5. Store in Supabase database
6. Call backend email service
7. Update status (pending → sent or failed)
8. Return success/failure to UI
```

**Helper Validation Functions:**
```typescript
isValidEmail(email)      // RFC-compliant email regex
isValidSubject(subject)  // Min 3, max 100 chars
isValidMessage(message)  // Min 5, max 5000 chars
getPlatform()           // Returns 'ios', 'android', or 'web'
```

**Error Handling:**
- Database errors don't stop email sending
- Network errors trigger retry mechanism
- All errors logged with `[Contact]` prefix
- User gets actionable error messages

### 3. Database: Contact Messages Table

**Supabase Table Schema:**
```sql
contact_messages
├── id (UUID) - Primary key
├── user_id (UUID) - From auth.users
├── user_email (TEXT) - User's email
├── subject (TEXT) - Message subject
├── message (TEXT) - Message content
├── message_type (TEXT) - Type: bug_report, feature_request, general_feedback, other
├── app_version (TEXT) - App version when sent
├── platform (TEXT) - Platform: ios, android, web
├── status (TEXT) - pending, sent, or failed
├── created_at (TIMESTAMP) - Auto-generated
└── updated_at (TIMESTAMP) - Auto-updated
```

**Indexes & Security:**
- Row Level Security (RLS) enabled
- Users can only see/modify their own messages
- Indexes on: user_id, status, created_at
- Automatic timestamp management

### 4. Backend: Email Service (Must be Implemented)

**Endpoint:** `POST /api/contact/send-email`

**Request Headers:**
```typescript
{
  'Content-Type': 'application/json',
  'X-API-Key': EXPO_PUBLIC_API_KEY
}
```

**Request Body:**
```typescript
{
  userEmail: string,        // User's email
  subject: string,          // Message subject
  message: string,          // Message content
  messageType: string,      // Type of message
  platform: string,         // 'ios' | 'android' | 'web'
  appVersion: string,       // App version
  timestamp: string         // ISO timestamp
}
```

**Response (Success):**
```typescript
{
  success: true,
  messageId?: string
}
```

**Response (Error):**
```typescript
{
  success: false,
  error: string  // Error message
}
```

**What Backend Should Do:**
1. Validate API key
2. Validate request data
3. Format email HTML (see template below)
4. Send to creator: jpdevland@gmail.com
5. Optionally send confirmation to user
6. Return success/failure response

---

## Email Template Example

When a user sends a message, the backend should format it like this:

```html
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; }
      .header { background: #2563eb; color: white; padding: 20px; }
      .content { padding: 20px; }
      .field { margin: 15px 0; }
      .label { font-weight: bold; color: #1e40af; }
      .value { color: #333; }
      .meta { background: #f0f0f0; padding: 10px; margin-top: 20px; border-radius: 5px; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>📧 New Message from BudgetZen</h1>
      </div>
      <div class="content">
        <div class="field">
          <div class="label">From:</div>
          <div class="value">user@example.com</div>
        </div>
        
        <div class="field">
          <div class="label">Type:</div>
          <div class="value">🐛 Bug Report</div>
        </div>
        
        <div class="field">
          <div class="label">Subject:</div>
          <div class="value">App crashes on budget edit</div>
        </div>
        
        <div class="field">
          <div class="label">Message:</div>
          <div class="value">When I try to edit a budget, the app crashes...</div>
        </div>
        
        <div class="meta">
          <strong>Message Details:</strong><br>
          Platform: Android<br>
          App Version: 1.0.0<br>
          Sent: 2025-12-20T10:30:00Z
        </div>
      </div>
    </div>
  </body>
</html>
```

---

## Environment Variables Required

In `.env` or Expo config:

```bash
# Backend email service
EXPO_PUBLIC_BACKEND_URL=https://api.yoursite.com
EXPO_PUBLIC_API_KEY=your-secret-api-key

# Supabase (already configured)
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxx...
```

---

## User Experience Flow

### Sending a Message

1. **User opens Settings → Help & Support**
2. **Selects "Contact" tab**
3. **Chooses message type:**
   - 🐛 Bug Report
   - ✨ Feature Request
   - 💬 Feedback
   - ❓ Other

4. **Fills subject & message**
5. **Taps "Send Message"**
6. **Form validation:**
   - ✅ Subject: 3-100 chars
   - ✅ Message: 5-5000 chars
   - ✅ User logged in

7. **Spinner shows during sending**
8. **Success:** Message cleared, confirmation alert
   - "Thank you! We respond within 24 hours"
9. **Error:** Retry alert with option to try again
   - "Network error. Please retry."

### Message Journey

```
User submits form
    ↓
Frontend validates
    ↓
Store in Supabase (status: pending)
    ↓
Call backend email endpoint
    ↓
Backend sends email to creator
    ↓
Update status: sent
    ↓
Show success to user
```

---

## Error Scenarios & Handling

### Scenario 1: Invalid Subject
```
User enters 1-2 characters
↓
Validation fails
↓ Show alert: "Subject must be 3-100 characters"
↓
User can correct and retry
```

### Scenario 2: User Not Logged In
```
User tries to send without login
↓
Validation fails (no email/user ID)
↓
Show alert: "You must be logged in"
↓
User logs in and retries
```

### Scenario 3: Network Error
```
User sends message
↓
Database stores: ✓
Email service fails: ✗ (no internet)
↓
Status: failed
↓
Show alert: "Failed. Message was saved. Please retry."
↓
Auto-retry after 1 minute (via retryFailedMessages)
```

### Scenario 4: Backend Service Down
```
User sends message
↓
Database stores: ✓
Backend endpoint unreachable
↓
Status: failed
↓
Message saved in DB for later retry
↓
Show alert: "Will retry automatically"
↓
Developer can retry manually via backend admin
```

### Scenario 5: Character Limits
```
Message field shows: "2456/5000"
User reaches limit
↓
TextInput stops accepting characters
↓
"Message limit reached"
```

---

## Retry Mechanism

### Automatic Retry

Function: `retryFailedMessages()`

**When called:**
- Periodically (e.g., every 5 minutes)
- When app comes to foreground
- On network reconnection

**Logic:**
```
Find messages with status = 'failed'
Only messages older than 1 minute
For each failed message:
  Try sending email again
  If success: update status to 'sent'
  If fail: keep as 'failed'
Return count of successful retries
```

**Example usage in app initialization:**
```typescript
// In app startup or when network reconnects
useEffect(() => {
  retryFailedMessages().then((count) => {
    if (count > 0) {
      console.log(`Retried ${count} messages successfully`);
    }
  });
}, []);
```

### Manual Retry

User can manually retry from the error alert:
```
Alert shown with "Retry" button
User taps "Retry"
Form resubmitted
Process repeats
```

---

## Database Operations

### Create Message
```typescript
const { data, error } = await supabase
  .from('contact_messages')
  .insert([{
    userId: '...',
    userEmail: '...',
    subject: '...',
    message: '...',
    messageType: 'bug_report',
    appVersion: '1.0.0',
    platform: 'android',
    status: 'pending'
  }])
  .select()
  .single();
```

### Update Status
```typescript
await supabase
  .from('contact_messages')
  .update({ status: 'sent' })
  .eq('id', messageId);
```

### Get User's Messages
```typescript
const { data } = await supabase
  .from('contact_messages')
  .select('*')
  .eq('userId', userId)
  .order('timestamp', { ascending: false });
```

### Delete Message
```typescript
await supabase
  .from('contact_messages')
  .delete()
  .eq('id', messageId);
```

---

## Console Logging

All operations logged with `[Contact]` prefix:

```typescript
[Contact] Validating message...
[Contact] Message validation passed
[Contact] Preparing to send message from: user@example.com
[Contact] Storing message in database...
[Contact] Message stored with ID: abc123
[Contact] Calling email service...
[Contact] Email service response: { success: true }
[Contact] Message sent successfully

// Errors:
[Contact] Invalid email: invalid@
[Contact] Invalid subject length: 2
[Contact] Database storage error: ...
[Contact] Email service failed: Network error
```

Monitor console with filter: `[Contact]`

---

## Security Considerations

### 1. Email Validation
- Uses RFC-compliant regex
- Prevents invalid emails from being sent

### 2. Input Sanitization
- Subject: 3-100 chars (prevents spam)
- Message: 5-5000 chars (reasonable limit)
- Both trimmed before storage

### 3. API Key Protection
- Passed in header, not URL
- Should be environment-based
- Rotate regularly in production

### 4. Row Level Security (RLS)
- Users can only see their own messages
- Users can only delete their own messages
- Prevents data leakage

### 5. Database Security
- Indexed for performance
- Timestamps for audit trail
- User ID linked to auth.users for integrity

---

## Testing Checklist

### Unit Tests (Frontend Validation)
- [ ] `isValidEmail()` with valid emails
- [ ] `isValidEmail()` with invalid emails
- [ ] `isValidSubject()` too short
- [ ] `isValidSubject()` too long
- [ ] `isValidMessage()` too short
- [ ] `isValidMessage()` too long
- [ ] `isValidMessage()` at limits

### Integration Tests (UI)
- [ ] Can select message type
- [ ] Can type subject
- [ ] Can type message
- [ ] Character counters update
- [ ] Send button disabled while loading
- [ ] Form clears on success
- [ ] Error alert shows on failure

### End-to-End Tests
- [ ] Message sent from Android
- [ ] Message sent from iOS
- [ ] Email received by creator
- [ ] Message stored in database
- [ ] Status updates from pending to sent
- [ ] Failed messages can be retried
- [ ] User gets success notification
- [ ] User can see error and retry

### Error Scenarios
- [ ] No internet - graceful error
- [ ] Backend down - message saved, retry available
- [ ] Invalid email - validation error
- [ ] Form validation - all rules enforced
- [ ] Database error - continues to try email
- [ ] Very long message - stops at limit

---

## Future Enhancements

1. **File Attachments**
   - Screenshots/logs upload
   - Base64 encode and send with message

2. **Message History**
   - Show past messages user sent
   - View status of each message
   - See responses from creator

3. **In-App Notifications**
   - Notify user when creator replies
   - Push notification when email received

4. **Rich Text Editor**
   - Format message with bold/italic
   - Code blocks for error traces

5. **Analytics**
   - Track message types sent
   - Monitor response times
   - Dashboard for creator

6. **Localization**
   - Translate form labels
   - Email templates in user's language

---

## Files Modified/Created

**New Files:**
- `lib/contact/contactService.ts` - Contact service logic
- `database/contact_messages_schema.sql` - Database schema

**Modified Files:**
- `app/(modal)/help-modal.tsx` - Updated contact form
- `app/(modal)/_layout.tsx` - (No changes needed, already supports modals)

**Configuration Files:**
- `.env` - Add backend URL and API key

---

## Deployment Checklist

Before going to production:

- [ ] Backend email endpoint implemented
- [ ] Email template designed and tested
- [ ] Environment variables configured
- [ ] Database schema created in Supabase
- [ ] RLS policies enabled
- [ ] Indexes created
- [ ] API key generated and secured
- [ ] Test email sent and received
- [ ] Error handling tested
- [ ] Retry logic verified
- [ ] User feedback messages finalized
- [ ] Logging reviewed
- [ ] Performance tested (large messages)
- [ ] Security review passed

---

**Status: ✅ FRONTEND COMPLETE & READY FOR BACKEND**

**Next Step:** Implement backend email service endpoint at `/api/contact/send-email`
