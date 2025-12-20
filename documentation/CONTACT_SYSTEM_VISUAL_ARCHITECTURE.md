## Contact System - Visual Implementation & Architecture

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         📱 BudgetZen Mobile App                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Help Modal → Contact Tab                                           │   │
│  │  ┌────────────────────────────────────────────────────────────┐     │   │
│  │  │ Message Type Selector (4 buttons)                         │     │   │
│  │  │  [🐛 Bug] [✨ Feature] [💬 Feedback] [❓ Other]            │     │   │
│  │  ├────────────────────────────────────────────────────────────┤     │   │
│  │  │ Subject: _________________________ (0/100)                 │     │   │
│  │  ├────────────────────────────────────────────────────────────┤     │   │
│  │  │ Message: _________________________                          │     │   │
│  │  │          _________________________  (0/5000)               │     │   │
│  │  │          _________________________                          │     │   │
│  │  ├────────────────────────────────────────────────────────────┤     │   │
│  │  │ Replying to: user@example.com                             │     │   │
│  │  ├────────────────────────────────────────────────────────────┤     │   │
│  │  │ [SEND MESSAGE]                                            │     │   │
│  │  └────────────────────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ (Validate inputs)
                                     ↓
        ┌────────────────────────────────────────────────────────┐
        │  Frontend Validation                                   │
        │  ├─ Email: RFC format                                  │
        │  ├─ Subject: 3-100 chars                               │
        │  ├─ Message: 5-5000 chars                              │
        │  └─ User logged in                                     │
        └────────────────────────────────────────────────────────┘
                                     │
                        (Validation passes)
                                     ↓
        ┌────────────────────────────────────────────────────────┐
        │  contactService.sendContactMessage()                   │
        │  ├─ Validate inputs again                              │
        │  ├─ Create message object with metadata                │
        │  └─ Return promise with status                         │
        └────────────────────────────────────────────────────────┘
                          │                      │
              (Success) ↙  │                      │  ↖ (Failure)
                            │                      │
        ┌───────────────────────────────┐         ┌─────────────────┐
        │  Two parallel operations:     │         │  Show error     │
        │  1. Store in database         │         │  Alert with     │
        │  2. Send email via backend    │         │  Retry option   │
        │                               │         └─────────────────┘
        └───────────────────────────────┘
                   │                 │
                   ↓                 ↓
        ┌──────────────────┐    ┌──────────────────┐
        │  Supabase DB     │    │  Backend Email   │
        │  ┌────────────┐  │    │  Service         │
        │  │ contact_   │  │    │  ┌────────────┐  │
        │  │ messages   │  │    │  │ POST /api/ │  │
        │  │ table      │  │    │  │ contact/   │  │
        │  │ (status:   │  │    │  │ send-email │  │
        │  │ pending)   │  │    │  └────────────┘  │
        │  └────────────┘  │    │  (Sends to      │
        │                  │    │   jpdevland@    │
        │  ✅ Always       │    │   gmail.com)    │
        │    succeeds      │    │                  │
        │  (backup)        │    │  ❓ May fail     │
        │                  │    │    (network,    │
        │                  │    │     service)    │
        │                  │    │                  │
        └──────────────────┘    └──────────────────┘
                   │                 │
                   │      ┌──────────┘
                   │      │
                   └──────┼──────────────┐
                          │              │
                ┌─────────────────┐   ┌──────────────────┐
                │ Email Sent      │   │ Email Failed     │
                │ Status: sent    │   │ Status: failed   │
                │                 │   │ (Will retry)     │
                │ ✅ Success      │   │                  │
                │    Alert        │   │ ⚠️ Warning       │
                │    shown        │   │    Alert with    │
                │ Form cleared    │   │    Retry button  │
                │                 │   │                  │
                └─────────────────┘   └──────────────────┘
                        │                      │
                        └──────────┬───────────┘
                                   │
                                   ↓
                    ┌───────────────────────────────┐
                    │ User sees confirmation        │
                    │ "We respond within 24 hours"  │
                    │ or                            │
                    │ "Message saved, will retry"   │
                    └───────────────────────────────┘
```

---

## Data Model

```
┌─────────────────────────────────────────────────────────────┐
│ contact_messages (Supabase Table)                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ id: UUID                                                    │
│ ├─ Primary Key                                              │
│ └─ Auto-generated                                           │
│                                                              │
│ user_id: UUID (Foreign Key)                                │
│ ├─ Links to auth.users                                     │
│ ├─ Used for RLS (user sees own only)                       │
│ └─ Indexed for fast lookups                                │
│                                                              │
│ user_email: TEXT                                            │
│ ├─ User's email address                                    │
│ ├─ Used for reply-to header                               │
│ └─ Extracted from auth.users.email                         │
│                                                              │
│ subject: TEXT (3-100 characters)                           │
│ ├─ Message subject                                         │
│ ├─ Required field                                          │
│ └─ Indexed for search                                      │
│                                                              │
│ message: TEXT (5-5000 characters)                          │
│ ├─ Message content                                         │
│ ├─ Required field                                          │
│ └─ Stored with HTML escaping                              │
│                                                              │
│ message_type: ENUM                                         │
│ ├─ 'bug_report'        🐛 Bug Report                       │
│ ├─ 'feature_request'   ✨ Feature Request                  │
│ ├─ 'general_feedback'  💬 General Feedback                │
│ └─ 'other'             ❓ Other                            │
│                                                              │
│ app_version: TEXT                                          │
│ ├─ App version when sent                                   │
│ ├─ Example: "1.0.0"                                        │
│ └─ Helps track version-specific issues                    │
│                                                              │
│ platform: ENUM                                             │
│ ├─ 'ios', 'android', 'web'                                │
│ ├─ Helps identify platform issues                         │
│ └─ Auto-set by app                                         │
│                                                              │
│ status: ENUM (default: 'pending')                          │
│ ├─ 'pending'  ⏳ Created, not sent                         │
│ ├─ 'sent'     ✅ Email delivered                           │
│ ├─ 'failed'   ❌ Email failed, will retry                  │
│ └─ Indexed for retry queries                              │
│                                                              │
│ created_at: TIMESTAMP                                      │
│ ├─ When message created                                   │
│ ├─ Auto-set by database                                   │
│ └─ Used for sorting & audit trail                         │
│                                                              │
│ updated_at: TIMESTAMP                                      │
│ ├─ When message last modified                             │
│ ├─ Auto-updated by trigger                                │
│ └─ Tracks status changes                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘


RLS POLICIES:
┌─────────────────────────────────────────────────────────────┐
│ Security (Row Level Security Enabled)                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ SELECT Policy:                                              │
│ Users see only: user_id = auth.uid()                       │
│ └─ Cannot see other users' messages                        │
│                                                              │
│ INSERT Policy:                                              │
│ Can insert only: user_id = auth.uid()                      │
│ └─ Cannot insert as another user                           │
│                                                              │
│ DELETE Policy:                                              │
│ Can delete only: user_id = auth.uid()                      │
│ └─ Cannot delete other users' messages                     │
│                                                              │
│ UPDATE Policy:                                              │
│ Can update only: user_id = auth.uid()                      │
│ └─ Used by system to update status                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘


INDEXES (Performance):
┌─────────────────────────────────────────────────────────────┐
│ Index 1: (user_id, created_at DESC)                        │
│ └─ Fast user message retrieval, most recent first           │
│                                                              │
│ Index 2: (status)                                           │
│ └─ Fast failed message lookup for retry                     │
│                                                              │
│ Index 3: (created_at DESC)                                 │
│ └─ Timeline queries, recent messages first                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Message Status Lifecycle

```
┌─────────────┐
│ User sends  │
│  message    │
└──────┬──────┘
       │
       ↓
┌──────────────────────────────────┐
│ CREATE message                   │
│ status = 'pending'               │
│ Storage: ✅ Database             │
│ Email: ⏳ Attempting             │
└──────┬───────────────────────────┘
       │
       ├─────────────┬──────────────────┐
       │             │                  │
       ↓ (Success)   ↓ (Fail)           ↓ (Timeout)
   ┌────────┐    ┌────────┐        ┌────────┐
   │ UPDATE │    │ UPDATE │        │ UPDATE │
   │ status │    │ status │        │ status │
   │= sent  │    │=failed │        │=failed │
   └────┬───┘    └────┬───┘        └────┬───┘
        │             │                  │
        │ ✅ Email    │ ⏳ Will retry     │ ⏳ Will retry
        │ delivered  │  after 1 min      │  after 1 min
        │             │                  │
        │             └──────────┬───────┘
        │                        │
        │                        ↓
        │             ┌──────────────────┐
        │             │ retryFailedMsgs()│
        │             │ (runs in bg)      │
        │             │ (every 5 min)     │
        │             │ (on reconnect)    │
        │             └────────┬──────────┘
        │                      │
        │              ┌───────┴────────┐
        │              │                │
        │              ↓ (Success)      ↓ (Still fails)
        │          ┌────────┐       ┌────────┐
        │          │ Update │       │ Stays  │
        │          │ to sent│       │ failed │
        │          └────────┘       │ ⏳      │
        │              │            └────────┘
        │              │
        └──────┬───────┘
               │
               ↓
        ┌──────────────┐
        │ Final Status │
        │ ✅ SENT      │
        │ (archived)   │
        └──────────────┘
```

---

## Component Interaction

```
help-modal.tsx (UI Component)
│
├─ State:
│  ├─ [subject, setSubject]        (3-100 chars)
│  ├─ [message, setMessage]        (5-5000 chars)
│  ├─ [messageType, setMessageType] (4 options)
│  ├─ [loading, setLoading]        (during send)
│  └─ [userEmail, userId]          (from auth)
│
├─ Handlers:
│  └─ handleSendMessage()
│     └─ Calls: sendContactMessage(
│        userId, userEmail, subject, message, messageType
│     )
│
└─ UI Elements:
   ├─ MessageTypeSelector
   │  └─ 4 buttons: bug, feature, feedback, other
   │
   ├─ SubjectInput
   │  ├─ TextInput (3-100 chars)
   │  └─ CharacterCounter
   │
   ├─ MessageInput
   │  ├─ TextInput (5-5000 chars)
   │  └─ CharacterCounter
   │
   ├─ EmailDisplay
   │  └─ Shows user email
   │
   ├─ LoadingSpinner
   │  └─ Shown while sending
   │
   └─ Alerts
      ├─ Success: "Thank you!"
      └─ Error: "Failed. [Retry]"


contactService.ts (Business Logic)
│
├─ Validation Functions:
│  ├─ isValidEmail()
│  ├─ isValidSubject()
│  ├─ isValidMessage()
│  └─ getPlatform()
│
├─ Main Function:
│  └─ sendContactMessage()
│     ├─ Validates inputs
│     ├─ Creates message object
│     ├─ Stores in Supabase (backup)
│     ├─ Calls sendContactEmail()
│     ├─ Updates status
│     └─ Returns response
│
├─ Email Function:
│  └─ sendContactEmail()
│     ├─ Builds API request
│     ├─ Calls /api/contact/send-email
│     ├─ Handles network errors
│     └─ Returns success/failure
│
└─ History Functions:
   ├─ getContactMessageHistory()
   ├─ deleteContactMessage()
   └─ retryFailedMessages()


Backend Service (Node.js/Express)
│
├─ Endpoint: POST /api/contact/send-email
│
├─ Middleware:
│  └─ verifyApiKey() - Check X-API-Key header
│
├─ Logic:
│  ├─ Validate request
│  ├─ Create email template
│  ├─ Send via nodemailer
│  ├─ Send confirmation (optional)
│  └─ Return response
│
└─ External Services:
   └─ Gmail SMTP (nodemailer)
      └─ Sends to jpdevland@gmail.com


Supabase (Database)
│
├─ Table: contact_messages
│  ├─ 11 columns
│  ├─ 3 indexes
│  ├─ RLS enabled
│  └─ Auto-timestamps
│
├─ Security:
│  └─ Row Level Security
│     ├─ Users see own only
│     ├─ Users insert with own user_id
│     └─ Users delete own only
│
└─ Operations:
   ├─ INSERT (create message)
   ├─ SELECT (get history)
   ├─ UPDATE (update status)
   └─ DELETE (remove message)
```

---

## Error Handling Flow

```
User Action
   │
   ↓
Form Validation
   │
   ├─ ✅ Pass
   │  └─ Continue
   │
   └─ ❌ Fail
      └─ Show input error
         (e.g., "Subject too short")
         User can correct & retry


sendContactMessage()
   │
   ├─ Input Validation
   │  ├─ ✅ Pass
   │  │  └─ Continue
   │  │
   │  └─ ❌ Fail (invalid email/subject/message)
   │     └─ Return { success: false, error: "..." }
   │        Show alert to user
   │
   ├─ Database Insert
   │  ├─ ✅ Success
   │  │  └─ Continue to email
   │  │
   │  └─ ❌ Error
   │     └─ Log error, continue anyway
   │        (email still may succeed)
   │
   ├─ Send Email (Backend)
   │  │
   │  ├─ Network Unreachable
   │  │  └─ Catch error
   │  │     └─ Leave status: pending
   │  │        └─ Show: "Network error. Message saved."
   │  │           └─ Will retry in background
   │  │
   │  ├─ Backend Down
   │  │  └─ Catch error
   │  │     └─ Set status: failed
   │  │        └─ Show: "Service error. Will retry."
   │  │           └─ Will retry in background
   │  │
   │  ├─ Invalid Request
   │  │  └─ Backend returns 400
   │  │     └─ Set status: failed
   │  │        └─ Show: "Message format error"
   │  │           └─ Won't auto-retry (invalid data)
   │  │
   │  └─ ✅ Success
   │     └─ Set status: sent
   │        └─ Show: "Message sent!"
   │           └─ Form cleared
   │
   └─ Unexpected Error
      └─ Catch-all
         └─ Log full error
            └─ Show: "Unexpected error. Please try again."
               └─ User can retry


Background: retryFailedMessages()
   │
   ├─ Find messages with status = 'failed'
   │
   ├─ For each message:
   │  ├─ Try sendContactEmail() again
   │  │
   │  ├─ ✅ Success
   │  │  └─ Update status → sent
   │  │
   │  └─ ❌ Still fails
   │     └─ Keep status → failed
   │        Next retry in 5 minutes
   │
   └─ Return count of retried messages
      (For logging/monitoring)
```

---

## Deployment Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                   Development Machine                          │
│                   (Your computer)                              │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Source Code                                              │ │
│  │ ├─ lib/contact/contactService.ts                         │ │
│  │ ├─ app/(modal)/help-modal.tsx                            │ │
│  │ ├─ database/contact_messages_schema.sql                  │ │
│  │ └─ .env (with BACKEND_URL & API_KEY)                    │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                             │
                             │ (npm run build/eas build)
                             ↓
┌────────────────────────────────────────────────────────────────┐
│                        App Stores                              │
│  ┌──────────────────────────────────────┐                      │
│  │     Apple App Store                  │                      │
│  │     (iOS Users)                      │                      │
│  └──────────────────────────────────────┘                      │
│  ┌──────────────────────────────────────┐                      │
│  │     Google Play Store                │                      │
│  │     (Android Users)                  │                      │
│  └──────────────────────────────────────┘                      │
└────────────────────────────────────────────────────────────────┘
                             │
                             │ (User installs)
                             ↓
┌────────────────────────────────────────────────────────────────┐
│                    User's Mobile Device                        │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ BudgetZen App                                         │   │
│  │ ├─ contactService.ts (bundled in app)               │   │
│  │ ├─ help-modal.tsx (bundled in app)                  │   │
│  │ └─ Environment variables:                            │   │
│  │    ├─ EXPO_PUBLIC_SUPABASE_URL → Supabase          │   │
│  │    └─ EXPO_PUBLIC_BACKEND_URL → Your API           │   │
│  └────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
                       │
           ┌───────────┼───────────┐
           │           │           │
           ↓           ↓           ↓
  ┌──────────────┐ ┌──────────┐ ┌──────────────────┐
  │ Supabase     │ │ Backend  │ │ External         │
  │ Database     │ │ Service  │ │ Services         │
  │              │ │          │ │                  │
  │ contact_     │ │ POST     │ │ ├─ Gmail SMTP    │
  │ messages     │ │ /api/    │ │ │  (email)       │
  │ table        │ │ contact/ │ │ │                │
  │ (messages)   │ │ send-    │ │ └─ Optional:    │
  │              │ │ email    │ │    SendGrid,    │
  │              │ │          │ │    AWS SES      │
  │              │ │          │ │                  │
  └──────────────┘ └──────────┘ └──────────────────┘
        │               │
        ├─ Backup       │ Sends email to
        │   of all      │ jpdevland@gmail.com
        │   messages    │
        │               │
        ├─ RLS enforces ├─ API key protection
        │   privacy     │
        │               │
        └─ Indexes for  └─ Rate limiting
          performance     for security
```

---

## Performance Metrics

```
Operation                    Time Expected    Notes
────────────────────────────────────────────────────────────
Form Validation              < 100ms         Client-side
Service Validation           < 50ms          Email/subject/msg
Database Insert              100-500ms       Depends on network
Email Service Call           500-2000ms      Network + backend
Total (Success)              1-3 seconds     User sees feedback
Retry Attempt                500-2000ms      Background, no UI
RLS Policy Check             < 50ms          Per-row security
Character Count Update       < 10ms          Real-time feedback
────────────────────────────────────────────────────────────
```

---

## Security Model

```
Layer 1: Frontend
├─ Input validation (email, length)
├─ Character limits (prevent spam)
└─ User authentication check

Layer 2: Service
├─ Input re-validation
├─ Sanitization (HTML escape)
└─ Error message filtering (no secrets leaked)

Layer 3: Network
├─ HTTPS only
├─ API key in header (not URL)
└─ CORS protection

Layer 4: Backend
├─ API key verification
├─ Request validation
├─ Rate limiting
└─ Secure email service

Layer 5: Database
├─ Row Level Security (RLS)
├─ Encryption at rest
├─ Secure connection (SSL)
└─ User isolation (can't see other's messages)

Layer 6: Email
├─ User email validated
├─ Message content escaped
└─ Secure SMTP with credentials
```

---

This comprehensive visual guide shows:
- 🏗️ System architecture
- 📊 Data model
- 🔄 Message lifecycle
- 🔌 Component interactions  
- 🚀 Deployment flow
- ⚡ Performance expectations
- 🔒 Security layers

All integrated into one cohesive contact system!
