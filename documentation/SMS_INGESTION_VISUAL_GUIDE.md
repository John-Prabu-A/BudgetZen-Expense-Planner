# 🎨 SMS/Notification Integration - Visual Quick Start

## 📱 User Interface Flow

### For End Users

```
┌─────────────────────────────────────────────────────────┐
│           Main App Screen (Any Tab)                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  💰 Dashboard                                            │
│  [Latest Transactions]                                   │
│                                                          │
│  ⚙️ Tap Settings (top right)                             │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
         ┌───────────────────────┐
         │  Settings Screen      │
         ├───────────────────────┤
         │ Theme                 │
         │ Appearance            │
         │ Security              │
         │ Notifications         │
         │ Data                  │
         │ 📲 Transaction        │
         │    Ingestion ◄────┐   │
         │ About                 │
         └───────────────────────┘
                                 │
                 ┌───────────────┴────────────┐
                 ▼                            ▼
        ┌──────────────────────┐    ┌──────────────────────┐
        │ Transaction         │    │ Manual Entry         │
        │ Ingestion Settings  │    │ (Testing Screen)     │
        ├──────────────────────┤    ├──────────────────────┤
        │ Enable/Disable       │    │ Paste message here   │
        │ ✅ Auto-Detection    │    │ [Text input box]     │
        │                      │    │                      │
        │ Sources:             │    │ [Parse Button]       │
        │ ☑️ SMS               │    │                      │
        │ ☑️ Notifications     │    │ Results:             │
        │                      │    │ Amount: ₹1,200       │
        │ Confidence:          │    │ Type: Expense        │
        │ [========●---------] │    │ Date: 19-Dec-2024    │
        │ 0.6                  │    │                      │
        │                      │    │ [Create Button]      │
        │ ℹ️ Debug Mode         │    │                      │
        └──────────────────────┘    └──────────────────────┘
```

---

## 👨‍💻 Developer Component Flow

### React Components Using Ingestion

```
MyComponent.tsx
    │
    ├─ import { useTransactionIngestion } from '@/context/TransactionIngestion'
    │
    ├─ const { 
    │   isInitialized, 
    │   ingestManually, 
    │   updateSettings 
    │ } = useTransactionIngestion()
    │
    ├─ if (!isInitialized) return <Loading />
    │
    └─ return (
       <View>
         <Button onPress={() => ingestManually(text)} />
       </View>
    )
```

### Context Tree

```
RootLayout ──────────────────────────────────┐
    │                                         │
    └─ AuthProvider                           │
        │                                     │
        └─ PreferencesProvider                │
            │                                 │
            └─ OnboardingProvider             │
                │                             │
                └─ ThemeProvider              │
                    │                         │
                    └─ ToastProvider          │
                        │                     │
                        └─ NotificationsProvider
                            │                 │
                            └─ IngestionProvider ◄──┐
                                │                    │
                                └─ InitialLayout     │
                                    │                │
                                    └─ useTransactionIngestion() ──┘
                                        │
                                        └─ [Your Component]
                                            ├─ settings
                                            ├─ isInitialized
                                            ├─ ingestManually()
                                            └─ updateSettings()
```

---

## 🔄 Data Flow Diagram

### Message Processing Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│ Input: Bank SMS or App Notification                          │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 │  "Debit alert: ₹1,200 at AMAZON @ 19-DEC"
                 ▼
         ┌─────────────────────────────────┐
         │ Platform Listener               │
         ├─────────────────────────────────┤
         │ • AndroidSmsListener (Android)  │
         │ • IosNotificationListener (iOS) │
         └────────────┬────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────────┐
         │ UnifiedMessage Format           │
         ├─────────────────────────────────┤
         │ rawText: "Debit alert: ..."     │
         │ sourceType: "SMS"               │
         │ platform: "Android"             │
         │ timestamp: 2024-12-19T10:30Z    │
         │ senderIdentifier: "+91XXXX..."  │
         │ confidenceHint: 0.9             │
         └────────────┬────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────────┐
         │ Normalization Engine            │
         ├─────────────────────────────────┤
         │ • Remove URLs & OTPs            │
         │ • Lowercase conversion          │
         │ • Clean noise                   │
         │ Output: "debit ₹1200 amazon.."  │
         └────────────┬────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────────┐
         │ Detection Engine                │
         ├─────────────────────────────────┤
         │ ❓ Is this a transaction?      │
         │ Pattern Match: "Debit"          │
         │ Amount Found: "₹1200"           │
         │ Confidence: 0.95                │
         │ ✅ YES → Proceed                │
         │ ❌ NO → Skip                    │
         └────────────┬────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────────┐
         │ Extraction Engine               │
         ├─────────────────────────────────┤
         │ Amount: 1200 ✓                  │
         │ Currency: INR ✓                 │
         │ Type: Debit ✓                   │
         │ Date: 19-DEC-2024 ✓             │
         │ Bank: Amazon ✓                  │
         │ Description: \"at AMAZON\" ✓   │
         └────────────┬────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────────┐
         │ Classification Engine           │
         ├─────────────────────────────────┤
         │ Type: Debit → Expense           │
         │ Suggest Category: Shopping      │
         │ Confidence: 0.92                │
         └────────────┬────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────────┐
         │ Deduplication Engine            │
         ├─────────────────────────────────┤
         │ Check: Similar in last 60 min?  │
         │ ❌ Not found → New record       │
         │ ✅ Found → Skip or update       │
         └────────────┬────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────────┐
         │ Database Persistence           │
         ├─────────────────────────────────┤
         │ INSERT Transaction {            │
         │   amount: 1200,                 │
         │   type: 'expense',              │
         │   category: 'shopping',         │
         │   source: 'SMS',                │
         │   autoGenerated: true,          │
         │   confidenceScore: 0.95,        │
         │   bankProvider: 'Amazon'        │
         │ }                               │
         └────────────┬────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────────┐
         │ UI Sync & Notification          │
         ├─────────────────────────────────┤
         │ ✅ Refresh dashboard            │
         │ 🔔 Show optional toast:         │
         │    \"₹1,200 expense added\"     │
         │ 📊 Update analytics             │
         └─────────────────────────────────┘
```

---

## 🎛️ Settings UI Map

### Settings Screen Structure

```
Transaction Ingestion Settings
├─ 📲 Enable Auto-Detection
│  ├─ Toggle: [ON/OFF]
│  ├─ Description: "Automatically detect transactions"
│  └─ Status: "Listening for SMS & Notifications"
│
├─ 📨 Select Sources
│  ├─ ☑️ SMS (Android only)
│  │  └─ Description: "Read bank SMS messages"
│  ├─ 🔔 Notifications
│  │  └─ Description: "Intercept bank notifications"
│  ├─ 📧 Email (Coming soon)
│  │  └─ Description: "Parse bank statement emails"
│  └─ ✋ Manual Entry
│     └─ Description: "Always available"
│
├─ 🎚️ Confidence Threshold
│  ├─ Label: "Detection Sensitivity"
│  ├─ Slider: [====●---------] 0.6
│  ├─ Low: "Catch more (more false positives)"
│  └─ High: "Only confident matches (miss some)"
│
├─ ⚙️ Behavior
│  ├─ ☑️ Auto-Categorize
│  │  └─ "Suggest categories automatically"
│  ├─ ☑️ Notify on Detection
│  │  └─ "Show toast when transaction detected"
│  └─ ☑️ Create Immediately
│     └─ "Save records without review"
│
├─ 🐛 Developer Options
│  ├─ Button: [Enable Debug Mode]
│  ├─ Status: "Debug logs visible in console"
│  └─ Help: "Check browser dev tools (F12)"
│
└─ ℹ️ Information
   ├─ "Based on SMS parsing technology"
   ├─ "Your financial data stays on device"
   └─ "Powered by BudgetZen Intelligence"
```

---

## 🧪 Test Message Examples

### Bank Alert Formats (India)

```
┌──────────────────────────────────────────────┐
│ ICICI Bank Debit Alert                       │
├──────────────────────────────────────────────┤
│ "Debit alert: ₹1,200 at AMAZON ONLINE        │
│  @ 28-NOV-2024 15:30 IST                     │
│  Remaining balance: ₹45,678"                 │
│                                              │
│ Expected Extraction:                         │
│ • Amount: 1200                               │
│ • Type: expense                              │
│ • Currency: INR                              │
│ • Date: 2024-11-28 15:30                     │
│ • Bank: ICICI Bank                           │
│ • Description: "at AMAZON ONLINE"            │
│ • Confidence: 0.95+                          │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ HDFC Bank Credit Alert                       │
├──────────────────────────────────────────────┤
│ "Credit alert: ₹25,000 salary credited       │
│  @ 01-DEC-2024 09:15 IST                     │
│  New balance: ₹70,678"                       │
│                                              │
│ Expected Extraction:                         │
│ • Amount: 25000                              │
│ • Type: income                               │
│ • Currency: INR                              │
│ • Date: 2024-12-01 09:15                     │
│ • Bank: HDFC Bank                            │
│ • Description: "salary credited"             │
│ • Confidence: 0.98+                          │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Axis Bank Transfer Alert                     │
├──────────────────────────────────────────────┤
│ "Transfer alert: ₹5,000 sent to Alice        │
│  @ 02-DEC-2024 14:45 IST                     │
│  Reference: NEFT12345"                       │
│                                              │
│ Expected Extraction:                         │
│ • Amount: 5000                               │
│ • Type: transfer                             │
│ • Currency: INR                              │
│ • Date: 2024-12-02 14:45                     │
│ • Bank: Axis Bank                            │
│ • Description: "sent to Alice"               │
│ • Confidence: 0.92+                          │
└──────────────────────────────────────────────┘
```

---

## 📊 API Response Examples

### Success Response

```json
{
  "success": true,
  "messageId": "msg_12345",
  "recordId": "txn_67890",
  
  "metadata": {
    "sourceType": "SMS",
    "timestamp": "2024-12-19T10:30:45Z",
    
    "extractedData": {
      "type": "expense",
      "amount": 1200,
      "currency": "INR",
      "date": "2024-12-19T10:30:00Z",
      "description": "at AMAZON ONLINE",
      "bankProvider": "ICICI Bank"
    },
    
    "confidenceScore": 0.95,
    
    "classification": {
      "category": "Shopping",
      "subcategory": "Online Shopping"
    }
  }
}
```

### Failure Response

```json
{
  "success": false,
  "error": "LOW_CONFIDENCE",
  "reason": "Message doesn't match any known transaction pattern",
  "messageId": "msg_12345",
  
  "metadata": {
    "sourceType": "SMS",
    "timestamp": "2024-12-19T10:30:45Z",
    "confidenceScore": 0.35
  }
}
```

### Duplicate Response

```json
{
  "success": false,
  "error": "DUPLICATE",
  "reason": "Similar transaction found in last 60 minutes",
  "messageId": "msg_12345",
  
  "metadata": {
    "sourceType": "SMS",
    "timestamp": "2024-12-19T10:30:45Z",
    "confidenceScore": 0.92,
    "duplicateOf": "txn_67890",
    "extractedData": {
      "amount": 1200
    }
  }
}
```

---

## 🚀 Integration Points

### Where Ingestion Integrates

```
App Modules

├─ Transactions Module
│  ├─ Uses: Auto-created transaction records
│  ├─ Feature: Filter by "Auto-Detected"
│  └─ Action: Edit/delete auto-created records
│
├─ Dashboard
│  ├─ Shows: Auto-detected transactions
│  ├─ Feature: "New auto-detected" badge
│  └─ Action: Quick review of new entries
│
├─ Analytics
│  ├─ Includes: Auto-detected spending
│  ├─ Filter: Show/hide auto-detected
│  └─ Insight: "X transactions detected this week"
│
├─ Categories
│  ├─ Uses: Auto-suggested categories
│  ├─ Feature: Override category for auto-detected
│  └─ Learning: Use corrections for ML training
│
├─ Budgets
│  ├─ Includes: Auto-detected spending
│  ├─ Feature: "Auto-detected alerts"
│  └─ Action: Review auto-detected overspends
│
└─ Settings
   ├─ Transaction Ingestion Settings
   ├─ Manual Entry Testing
   └─ Debug Mode & Logs
```

---

## 🔍 Debug Info Shown in Logs

### What You See with Debug Mode Enabled

```
[IngestionProvider] Initialized successfully for user: user_abc123

[TransactionDetection] Processing SMS from +91XXXXX:
  - Raw: "Debit alert: ₹1,200 at AMAZON @ 28-NOV-2024"
  - Normalized: "debit ₹1200 amazon"
  - Patterns matched: ["debit_keyword", "amount_pattern", "date_pattern"]
  - Confidence: 0.95
  - Extracted: {
      "type": "expense",
      "amount": 1200,
      "currency": "INR",
      "date": "2024-11-28",
      "bank": "Amazon"
    }

[Deduplication] Checking for duplicates:
  - Time window: 60 minutes
  - Query: amount=1200, date~2024-11-28
  - Result: Not found
  - Action: Create new record ✓

[Database] Saving transaction:
  - Table: transactions
  - RecordID: txn_12345678
  - Status: SUCCESS ✓

[UI] Invalidating queries:
  - Refreshing transaction list
  - Updating dashboard
  - Recalculating totals
```

---

## 📈 Performance Timeline

### App Startup (First Load)

```
0ms      ├─ App starts
         │
50ms     ├─ AuthProvider initializes
         │
100ms    ├─ PreferencesProvider initializes
         │
150ms    ├─ OnboardingProvider initializes
         │
200ms    ├─ ThemeProvider initializes
         │
250ms    ├─ ToastProvider initializes
         │
300ms    ├─ NotificationsProvider initializes
         │
350ms    ├─ IngestionProvider initializes ← NEW
         │  │
         │  ├─ Loading manager: 50ms
         │  ├─ Initializing listeners: 50ms
         │  └─ Ready: ✓
         │
400ms    ├─ InitialLayout renders
         │
450ms    └─ ✅ App ready for user
```

### Per-Message Processing (After Initialization)

```
0ms      ├─ SMS/Notification received
         │
5ms      ├─ Parsed by platform listener
         │
10ms     ├─ Converted to UnifiedMessage
         │
15ms     ├─ Normalization engine: 10ms
         │
25ms     ├─ Detection engine: 15ms
         │
40ms     ├─ Extraction engine: 20ms
         │
60ms     ├─ Classification engine: 10ms
         │
70ms     ├─ Deduplication check: 30ms
         │
100ms    ├─ Database write: 15ms
         │
115ms    └─ ✅ UI updated
```

---

## ✨ Feature Highlights

```
╔════════════════════════════════════════════════════════╗
║           SMS/Notification Integration v1.0            ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  ✅ Auto-Detect Transactions                           ║
║     • From SMS (Android)                              ║
║     • From Notifications (iOS)                        ║
║     • Manual entry for testing                        ║
║                                                        ║
║  ✅ Smart Extraction                                   ║
║     • Amount, currency, date                          ║
║     • Bank provider identification                    ║
║     • Transaction type detection                      ║
║                                                        ║
║  ✅ Deduplication                                      ║
║     • Prevents duplicate records                      ║
║     • Smart matching algorithm                        ║
║     • Configurable time window                        ║
║                                                        ║
║  ✅ User Control                                       ║
║     • Enable/disable per source                       ║
║     • Confidence threshold adjustment                 ║
║     • Debug mode for developers                       ║
║                                                        ║
║  ✅ Privacy First                                      ║
║     • On-device processing                            ║
║     • No message storage                              ║
║     • User consent required                           ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

---

**Last Updated**: December 19, 2024  
**Version**: 1.0  
**Status**: ✅ Ready to Use
