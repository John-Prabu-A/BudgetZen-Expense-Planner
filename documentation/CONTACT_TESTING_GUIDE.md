## Contact System - Complete Testing Guide

---

## Overview

This guide provides step-by-step instructions for testing every aspect of the contact system.

**Total Testing Time:** 30-45 minutes
**Prerequisites:** Backend deployed, database schema created

---

## Part 1: Frontend Testing (No Backend Required)

### Test 1.1: Form Rendering

**What to test:** The help modal displays correctly

1. Open the app
2. Navigate to: Settings → Help & Support
3. Click "Contact" tab

**Expected Result:**
```
✓ Form displays without errors
✓ Message type selector visible (4 buttons)
✓ Subject field visible
✓ Message field visible
✓ User email shows
✓ Send button visible
✓ No red error messages
```

**Pass/Fail:** ___

---

### Test 1.2: Message Type Selection

**What to test:** Can select different message types

1. Click each button:
   - 🐛 Bug Report
   - ✨ Feature Request
   - 💬 General Feedback
   - ❓ Other

2. Observe the selection state

**Expected Result:**
```
✓ Selected button appears highlighted
✓ messageType state updates
✓ Can switch between types
✓ No console errors
```

**Pass/Fail:** ___

---

### Test 1.3: Subject Validation (Too Short)

**What to test:** Form rejects subject < 3 chars

1. Type in subject: "Hi"
2. Click Send Message

**Expected Result:**
```
✓ Alert appears: "Subject must be between 3 and 100 characters"
✓ Form NOT submitted
✓ Form NOT cleared
✓ User can correct
```

**Pass/Fail:** ___

---

### Test 1.4: Subject Validation (Too Long)

**What to test:** Form rejects subject > 100 chars

1. Type 101 characters in subject field
2. Try to click Send

**Expected Result:**
```
✓ TextInput stops accepting input at 100 chars
✓ Counter shows "100/100"
✓ Cannot type more
✓ Alert shows if you try to send over limit
```

**Pass/Fail:** ___

---

### Test 1.5: Subject Character Counter

**What to test:** Counter updates in real-time

1. Type in subject: "Test Subject"
2. Observe counter changes

**Expected Result:**
```
✓ Counter shows "12/100"
✓ Updates as you type
✓ Shows correct number
✓ Formatted correctly
```

**Pass/Fail:** ___

---

### Test 1.6: Message Validation (Too Short)

**What to test:** Form rejects message < 5 chars

1. Type in message: "Test"
2. Click Send Message

**Expected Result:**
```
✓ Alert appears: "Message must be between 5 and 5000 characters"
✓ Form NOT submitted
✓ Can correct and retry
```

**Pass/Fail:** ___

---

### Test 1.7: Message Validation (Too Long)

**What to test:** Form rejects message > 5000 chars

1. Generate 5001 characters in message
2. Try to click Send

**Expected Result:**
```
✓ TextInput stops accepting input at 5000 chars
✓ Counter shows "5000/5000"
✓ Cannot type more
```

**Pass/Fail:** ___

---

### Test 1.8: Message Character Counter

**What to test:** Counter updates for message field

1. Type a message
2. Observe counter

**Expected Result:**
```
✓ Counter shows accurate count
✓ Updates as you type
✓ Reaches "5000/5000" at limit
✓ Positioned correctly in UI
```

**Pass/Fail:** ___

---

### Test 1.9: User Email Display

**What to test:** Shows logged-in user's email

1. Check the "Replying to:" section
2. Verify email matches your login

**Expected Result:**
```
✓ Shows: "Replying to: yourmail@example.com"
✓ Correct email displayed
✓ Formatted clearly
```

**Pass/Fail:** ___

---

### Test 1.10: Not Logged In

**What to test:** Form shows error if not logged in

1. Log out from the app
2. Navigate to Settings → Help → Contact
3. Fill form and click Send

**Expected Result:**
```
✓ Alert appears: "You must be logged in"
✓ Form does not submit
✓ User directed to login
```

**Pass/Fail:** ___

---

### Test 1.11: Loading Spinner

**What to test:** Spinner shows while sending (needs backend)

1. Fill valid form
2. Click Send Message
3. Watch for spinner

**Expected Result:**
```
✓ Spinner appears immediately
✓ Send button disabled
✓ Cannot click Send again
✓ Spinner disappears when done
```

**Pass/Fail:** ___

---

### Test 1.12: Form Clear on Success

**What to test:** Form clears after successful send

1. Send valid message
2. Observe form after success

**Expected Result:**
```
✓ Subject field cleared
✓ Message field cleared
✓ Message type reset to default
✓ Ready for new message
✓ Character counters reset to 0
```

**Pass/Fail:** ___

---

## Part 2: Service Layer Testing

### Test 2.1: Email Validation Function

**What to test:** isValidEmail() works correctly

Open console and run:
```javascript
import { isValidEmail } from '@/lib/contact/contactService';

// Valid emails
isValidEmail('user@example.com')        // true
isValidEmail('test.email@company.co.uk') // true
isValidEmail('name+tag@gmail.com')      // true

// Invalid emails
isValidEmail('invalid@')                // false
isValidEmail('@example.com')            // false
isValidEmail('noatsign.com')            // false
isValidEmail('')                        // false
```

**Expected Result:**
```
✓ Valid emails return true
✓ Invalid emails return false
✓ Edge cases handled
```

**Pass/Fail:** ___

---

### Test 2.2: Subject Validation Function

**What to test:** isValidSubject() works correctly

```javascript
import { isValidSubject } from '@/lib/contact/contactService';

// Valid subjects
isValidSubject('App Crashes')           // true (11 chars)
isValidSubject('   Test   ')            // true (trimmed)

// Invalid subjects
isValidSubject('Hi')                    // false (< 3)
isValidSubject('a'.repeat(101))         // false (> 100)
isValidSubject('')                      // false (empty)
isValidSubject('   ')                   // false (only spaces)
```

**Expected Result:**
```
✓ 3-100 character subjects accepted
✓ Outside range rejected
✓ Trimming works
✓ Empty rejected
```

**Pass/Fail:** ___

---

### Test 2.3: Message Validation Function

**What to test:** isValidMessage() works correctly

```javascript
import { isValidMessage } from '@/lib/contact/contactService';

// Valid messages
isValidMessage('This is a valid message')      // true
isValidMessage('   Trimmed   ')                // true

// Invalid messages
isValidMessage('test')                         // false (< 5)
isValidMessage('a'.repeat(5001))               // false (> 5000)
isValidMessage('')                             // false (empty)
```

**Expected Result:**
```
✓ 5-5000 character messages accepted
✓ Outside range rejected
✓ Trimming works
```

**Pass/Fail:** ___

---

## Part 3: Backend Integration Testing

### Test 3.1: Backend Endpoint Exists

**What to test:** Backend is reachable

Run in terminal:
```bash
curl -X POST https://your-backend-url/api/contact/send-email \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"userEmail":"test@example.com","subject":"Test","message":"This is a test"}'
```

**Expected Result:**
```
✓ Response code 200 or 401 (not 404)
✓ Valid JSON response
✓ Takes < 5 seconds
```

**Pass/Fail:** ___

---

### Test 3.2: API Key Validation

**What to test:** Backend validates API key

Run with wrong key:
```bash
curl -X POST https://your-backend-url/api/contact/send-email \
  -H "X-API-Key: wrong-key" \
  -d '{...}'
```

**Expected Result:**
```
✓ Response code 401 (Unauthorized)
✓ Error message returned
✓ Request rejected
```

**Pass/Fail:** ___

---

### Test 3.3: Request Validation

**What to test:** Backend validates required fields

Run with missing subject:
```bash
curl -X POST https://your-backend-url/api/contact/send-email \
  -H "X-API-Key: your-api-key" \
  -d '{"userEmail":"test@example.com","message":"Message"}'
```

**Expected Result:**
```
✓ Response code 400 (Bad Request)
✓ Error message about missing subject
✓ Request rejected
```

**Pass/Fail:** ___

---

### Test 3.4: Email Sending

**What to test:** Backend sends email to creator

1. Send message from app with valid data
2. Check email inbox for jpdevland@gmail.com

**Expected Result:**
```
✓ Email arrives within 5 seconds
✓ From line shows sender
✓ Subject matches form input
✓ Message content visible
✓ No spam folder (whitelist sender)
```

**Pass/Fail:** ___

---

### Test 3.5: Email Format

**What to test:** Email is properly formatted

Check received email:

**Expected Result:**
```
✓ Header: Blue with "📧 New Message from BudgetZen"
✓ From section shows: user@example.com
✓ Type section shows: 🐛 Bug Report (or selected type)
✓ Subject section shows: "User's Subject"
✓ Message section shows: "User's message content"
✓ Metadata section shows:
  - Platform: android
  - App Version: 1.0.0
  - Sent: [timestamp]
✓ Footer: "This is an automated message"
```

**Pass/Fail:** ___

---

### Test 3.6: Response Time

**What to test:** Backend responds quickly

Time the full request:
```bash
time curl -X POST https://your-backend-url/api/contact/send-email ...
```

**Expected Result:**
```
✓ Response time < 2 seconds
✓ Real time ≈ Network + Backend processing
✓ Consistent across multiple requests
```

**Pass/Fail:** ___

---

## Part 4: Database Testing

### Test 4.1: Message Stored

**What to test:** Message saved to Supabase

After sending, run in Supabase SQL Editor:
```sql
SELECT * FROM contact_messages 
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected Result:**
```
✓ New row appears
✓ Has correct user_id
✓ Has correct user_email
✓ Has correct subject
✓ Has correct message
✓ Has correct message_type
✓ Has status = 'pending' or 'sent'
✓ created_at is recent
```

**Pass/Fail:** ___

---

### Test 4.2: Status Updates

**What to test:** Status changes after email sent

1. Send message
2. Wait 2 seconds
3. Run: `SELECT * FROM contact_messages WHERE user_id = 'your-id' ORDER BY created_at DESC LIMIT 1;`

**Expected Result:**
```
✓ Status = 'sent' (if email succeeded)
✓ Or status = 'failed' (if email failed)
✓ updated_at is recent
✓ updated_at > created_at
```

**Pass/Fail:** ___

---

### Test 4.3: RLS Security

**What to test:** User can only see their own messages

1. Create message as User A
2. Switch to User B
3. Run: `SELECT * FROM contact_messages;` as User B

**Expected Result:**
```
✓ User B sees no rows (or only their own)
✓ Cannot see User A's message
✓ RLS policy enforced
```

**Pass/Fail:** ___

---

### Test 4.4: Multiple Messages

**What to test:** Can send multiple messages

1. Send 3 different messages
2. Check database

**Expected Result:**
```
✓ All 3 appear in database
✓ Each has unique ID
✓ Each has correct content
✓ Timestamps in correct order
```

**Pass/Fail:** ___

---

### Test 4.5: Historical Data

**What to test:** Can retrieve message history

```javascript
import { getContactMessageHistory } from '@/lib/contact/contactService';

const history = await getContactMessageHistory(userId);
console.log(history);
```

**Expected Result:**
```
✓ Returns array of messages
✓ All messages belong to user
✓ Sorted by most recent first
✓ Includes all fields (subject, message, type, status)
```

**Pass/Fail:** ___

---

## Part 5: Error Handling Testing

### Test 5.1: Network Offline

**What to test:** Graceful handling when network unavailable

1. Turn off WiFi/cellular
2. Try to send message
3. Observe alert

**Expected Result:**
```
✓ Alert shows appropriate message
✓ Form NOT cleared (user can retry)
✓ Message stored in DB
✓ Shows option to retry
```

**Pass/Fail:** ___

---

### Test 5.2: Backend Timeout

**What to test:** Handles slow/unresponsive backend

Temporarily disable backend service.

1. Try to send message
2. Wait for timeout

**Expected Result:**
```
✓ Doesn't hang forever
✓ Timeout after ~5-10 seconds
✓ Shows error alert
✓ Message still saved to DB
✓ User can manually retry
```

**Pass/Fail:** ___

---

### Test 5.3: Invalid Email

**What to test:** Rejects invalid email on send

1. Somehow bypass UI validation (edit in debugger)
2. Send with invalid email like "notanemail"

**Expected Result:**
```
✓ Service rejects it
✓ Alert shows: "Please provide a valid email address"
✓ Message NOT sent
✓ Message NOT stored
```

**Pass/Fail:** ___

---

### Test 5.4: Retry Mechanism

**What to test:** Failed messages can be retried

1. Send message while backend is down
2. Message stored with status = 'failed'
3. Turn backend back on
4. Manually call: `retryFailedMessages()`

**Expected Result:**
```
✓ Function finds failed message
✓ Attempts to resend
✓ Updates status to 'sent'
✓ Email arrives
```

**Pass/Fail:** ___

---

### Test 5.5: Character Validation in Console

**What to test:** Service validates at runtime

```javascript
import { sendContactMessage } from '@/lib/contact/contactService';

// This should fail
await sendContactMessage(
  userId,
  userEmail,
  'Hi',  // Too short
  'This is a message'
);
// Expected: { success: false, error: "Subject must be..." }

// This should fail
await sendContactMessage(
  userId,
  userEmail,
  'Valid Subject',
  'No'  // Too short
);
// Expected: { success: false, error: "Message must be..." }
```

**Expected Result:**
```
✓ Returns success: false
✓ Provides helpful error message
✓ Does not attempt to send
✓ Does not store in DB
```

**Pass/Fail:** ___

---

## Part 6: Performance Testing

### Test 6.1: Send Speed

**What to test:** Response time for sending

Time from clicking Send to success alert:

**Target:** < 3 seconds

**Actual:** ___ seconds

**Pass/Fail:** ___

---

### Test 6.2: Character Counter Performance

**What to test:** Counter updates don't lag

Type quickly in message field:

**Expected Result:**
```
✓ Counter updates instantly
✓ No lag or delay
✓ No jumpy text
✓ Smooth experience
```

**Pass/Fail:** ___

---

### Test 6.3: Database Query Speed

**What to test:** Getting message history is fast

```sql
SELECT COUNT(*) FROM contact_messages WHERE user_id = 'xxx';
EXPLAIN ANALYZE SELECT * FROM contact_messages WHERE user_id = 'xxx' ORDER BY created_at DESC;
```

**Expected Result:**
```
✓ Query < 100ms
✓ Uses index (shows in EXPLAIN)
✓ Consistent even with 1000+ messages
```

**Pass/Fail:** ___

---

## Part 7: Cross-Platform Testing

### Test 7.1: Android

**What to test:** Works on Android device/emulator

Repeat all tests above on Android.

**Special Checks:**
```
✓ KeyboardAvoidingView works
✓ Form scrolls with keyboard
✓ Character counter visible
✓ No layout issues
```

**Pass/Fail:** ___

---

### Test 7.2: iOS

**What to test:** Works on iOS device/simulator

Repeat all tests above on iOS.

**Special Checks:**
```
✓ Safe area respected
✓ Keyboard handling works
✓ No layout issues
✓ Touch targets adequate
```

**Pass/Fail:** ___

---

### Test 7.3: Landscape Orientation

**What to test:** Form works in landscape

1. Rotate device to landscape
2. Fill and send message

**Expected Result:**
```
✓ Form still visible
✓ No cut-off content
✓ Keyboard handling works
✓ Character counter visible
```

**Pass/Fail:** ___

---

## Part 8: Security Testing

### Test 8.1: XSS Prevention

**What to test:** HTML injection in message doesn't execute

Send message with HTML:
```
Subject: <script>alert('XSS')</script>Test
Message: <img src=x onerror=alert('XSS')>
```

**Expected Result:**
```
✓ Email received safely
✓ HTML shown as text (escaped)
✓ No script executes
✓ No alert appears
```

**Pass/Fail:** ___

---

### Test 8.2: API Key Security

**What to test:** API key not exposed in logs

Check browser console and network tab:

**Expected Result:**
```
✓ API key not in console logs
✓ API key in header (not URL)
✓ API key not in request body
✓ Backend URL in env (not hardcoded)
```

**Pass/Fail:** ___

---

### Test 8.3: User Isolation

**What to test:** User cannot see other users' messages

```sql
-- As User A
SELECT COUNT(*) FROM contact_messages;  -- Should see own only

-- As User B
SELECT COUNT(*) FROM contact_messages;  -- Should see different set

-- As superuser
SELECT COUNT(*) FROM contact_messages;  -- Should see all
```

**Expected Result:**
```
✓ Each user sees only own messages
✓ RLS enforces isolation
✓ No data leakage
```

**Pass/Fail:** ___

---

## Testing Summary

### Critical Tests (Must Pass)
- [ ] 1.1 Form Rendering
- [ ] 1.3 Subject Validation (Too Short)
- [ ] 1.6 Message Validation (Too Short)
- [ ] 3.1 Backend Endpoint Exists
- [ ] 3.4 Email Sending
- [ ] 4.1 Message Stored
- [ ] 5.1 Network Offline Handling

### Important Tests (Should Pass)
- [ ] 1.5 Subject Counter
- [ ] 1.8 Message Counter
- [ ] 2.1 Email Validation
- [ ] 2.2 Subject Validation
- [ ] 2.3 Message Validation
- [ ] 3.2 API Key Validation
- [ ] 4.3 RLS Security
- [ ] 5.4 Retry Mechanism

### Nice-to-Have Tests
- [ ] 6.1 Send Speed
- [ ] 6.2 Character Counter Performance
- [ ] 6.3 Database Query Speed
- [ ] 7.1 Android Compatibility
- [ ] 7.2 iOS Compatibility

---

## Test Results Summary

| Category | Total | Passed | Failed | Notes |
|----------|-------|--------|--------|-------|
| Frontend (12 tests) | 12 | ___ | ___ | |
| Service Layer (3 tests) | 3 | ___ | ___ | |
| Backend (6 tests) | 6 | ___ | ___ | |
| Database (5 tests) | 5 | ___ | ___ | |
| Error Handling (5 tests) | 5 | ___ | ___ | |
| Performance (3 tests) | 3 | ___ | ___ | |
| Cross-Platform (3 tests) | 3 | ___ | ___ | |
| Security (3 tests) | 3 | ___ | ___ | |
| **TOTAL** | **40** | **___** | **___** | |

---

## Sign-Off

**Tester Name:** _______________

**Date:** _______________

**Overall Result:** ✅ PASS / ❌ FAIL

**Ready for Production:** YES / NO

**Comments/Issues Found:**
```
_________________________________
_________________________________
_________________________________
```

---

## Regression Testing (After Updates)

If you make changes to the contact system, re-run:
- 1.1 Form Rendering
- 2.1-2.3 Validation Functions
- 3.4 Email Sending
- 4.1 Message Stored
- 5.1 Network Handling

This ensures your changes don't break existing functionality.

---

Good luck with testing! 🧪
