# 📲 SMS/Notification to Record Update Service - Integration Guide

## Overview

The SMS and Notification to Record Update Service has been successfully integrated into the BudgetZen app. This service automatically detects financial transactions from SMS messages and notifications, extracts transaction details, and creates expense/income records.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│           App Root Layout (_layout.tsx)          │
├─────────────────────────────────────────────────┤
│                                                   │
│  ┌──────────────────────────────────────────┐  │
│  │  IngestionProvider (New)                 │  │
│  │  ├─ CrossPlatformIngestionManager        │  │
│  │  ├─ Background SMS/Notification Listeners│  │
│  │  ├─ Transaction Detection Engine         │  │
│  │  └─ Database Persistence                 │  │
│  └──────────────────────────────────────────┘  │
│           ↓                                      │
│  ┌──────────────────────────────────────────┐  │
│  │  NotificationsProvider (Existing)        │  │
│  └──────────────────────────────────────────┘  │
│           ↓                                      │
│  ┌──────────────────────────────────────────┐  │
│  │  InitialLayout & Navigation              │  │
│  └──────────────────────────────────────────┘  │
│                                                   │
└─────────────────────────────────────────────────┘
```

---

## Components Integrated

### 1. **Context & Providers**

#### `context/TransactionIngestion.tsx` (Updated)
- **IngestionProvider**: Main context provider for ingestion service
- **useTransactionIngestion()**: Hook to access ingestion functionality
- Auto-initializes with user ID from Auth context
- Manages ingestion settings, listener state, and manual ingestion

#### `app/_layout.tsx` (Updated)
- Added IngestionProvider to root layout
- Wrapped around InitialLayout for app-wide availability
- Initializes after Auth and before Navigation

### 2. **Core Ingestion System** (`lib/transactionDetection/`)

#### Types & Interfaces (`types.ts`)
```typescript
// Main types used throughout the system
- UnifiedMessage: Standardized message from all sources
- NormalizedMessage: Cleaned message ready for processing
- TransactionCandidate: Detected transaction with confidence scores
- ExtractedTransactionData: Final extracted fields
- IngestionResult: Result of ingestion operation
- IngestionSettings: User preferences for ingestion
```

#### Platform-Specific Listeners (`sources/`)
- **AndroidSmsListener.ts**: Background SMS listening on Android
- **IosNotificationListener.ts**: Notification interception on iOS

#### Processing Engines (`engines/`)
- **Message Normalization**: Cleans noise, URLs, OTPs
- **Transaction Detection**: Identifies if message contains transaction
- **Entity Extraction**: Pulls amount, date, bank, description
- **Transaction Classification**: Maps to Income/Expense/Transfer
- **Deduplication**: Prevents duplicate record creation

#### Managers
- **CrossPlatformIngestionManager.ts**: Main orchestrator
- **UnifiedTransactionIngestionService.ts**: Service layer for database persistence

### 3. **UI Integration**

#### Settings Screens (`app/preferences/`)
- **transaction-ingestion.tsx**: Configure auto-detection settings
- **manual-ingestion.tsx**: Manual message parsing interface

---

## Usage Guide

### For App Users

#### 1. Enable Auto-Detection
Navigate to **Settings → Transaction Ingestion**:
- Toggle "Automatic Detection" on/off
- Select which sources to enable:
  - SMS (Android)
  - Notifications (iOS)
  - Email (future)
  - Manual input

#### 2. Configure Confidence Threshold
- Adjust slider to control how strict detection should be
- Lower = more records detected (may include false positives)
- Higher = fewer records (only high-confidence matches)

#### 3. Manual Entry
Navigate to **Settings → Manual Entry**:
- Paste a bank SMS/message text
- System parses and creates record immediately
- Useful for testing or one-off messages

---

## For Developers

### Accessing Ingestion Context

```typescript
import { useTransactionIngestion } from '@/context/TransactionIngestion';

export function MyComponent() {
  const {
    settings,
    isInitialized,
    ingestManually,
    setConfidenceThreshold,
    enableAutoDetection,
    debugMode,
  } = useTransactionIngestion();

  // Use ingestion features
}
```

### Manual Ingestion API

```typescript
// Manually trigger ingestion for a message
const result = await ingestManually('Debit alert: ₹1,200 spent at merchant');

if (result.success) {
  console.log('Record created:', result.recordId);
  console.log('Amount:', result.metadata.extractedData.amount);
  console.log('Type:', result.metadata.extractedData.type);
} else {
  console.error('Ingestion failed:', result.reason);
}
```

### Result Structure

```typescript
interface IngestionResult {
  success: boolean;
  error?: string;
  reason?: string;
  messageId: string;
  recordId?: string;           // Database record ID if successful
  
  metadata: {
    candidateId?: string;
    sourceType: SourceType;
    timestamp: Date;
    extractedData?: ExtractedTransactionData;
    confidenceScore?: number;
    duplicateOf?: string;       // If deduplicated
    classification?: {
      category: string;
      subcategory: string;
    };
  };
}
```

### Configuration Options

```typescript
interface IngestionSettings {
  // Master controls
  autoDetectionEnabled: boolean;
  autoCategoryEnabled: boolean;
  
  // Source controls
  sourceSettings: {
    SMS: { enabled: boolean; permissions: string[] };
    Notification: { enabled: boolean; permissions: string[] };
    Email: { enabled: boolean; permissions: string[] };
    Manual: { enabled: boolean };
  };
  
  // Thresholds
  confidenceThreshold: number;  // 0-1, default 0.6
  deduplicationWindow: number;  // minutes, default 60
  
  // Behavior
  autoCreateFromAutoDetection: boolean;
  markAsAutoGenerated: boolean;
  notifyOnDetection: boolean;
  
  // Debug
  debugMode: boolean;
  logRejectedMessages: boolean;
}
```

---

## Database Integration

### New Transaction Fields

Transactions created via auto-detection include:
```typescript
{
  // Standard fields
  id: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  
  // Ingestion-specific fields
  source: 'SMS' | 'Notification' | 'Email' | 'Manual';
  autoGenerated: boolean;
  confidenceScore: number;
  bankProvider: string;
  
  // Metadata for editing/review
  originalMessage: string;  // Encrypted or hashed
  extractionDetails: {
    patterns: string[];      // What patterns matched
    confidence: number;
    detectionModel: string;
  };
}
```

---

## Permission Requirements

### Android

**AndroidManifest.xml** should include:
```xml
<!-- For SMS reading -->
<uses-permission android:name="android.permission.READ_SMS" />
<uses-permission android:name="android.permission.RECEIVE_SMS" />

<!-- For notifications -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- For background execution -->
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

### iOS

**Info.plist** should include:
```xml
<key>NSLocalNetworkUsageDescription</key>
<string>App needs access to process notifications for transaction detection</string>
```

Note: iOS cannot read SMS directly. Use notification interception instead.

---

## Troubleshooting

### Issue: Auto-detection not working

1. **Check Permissions**
   - Settings → App Permissions → SMS/Notifications
   - Ensure permissions are granted

2. **Check Settings**
   - Go to Settings → Transaction Ingestion
   - Verify "Automatic Detection" is enabled
   - Verify relevant sources are enabled

3. **Check Debug Mode**
   ```typescript
   const { debugMode, toggleDebugMode } = useTransactionIngestion();
   // Enable to see detailed logs
   toggleDebugMode();
   // Check console for processing details
   ```

4. **Confidence Threshold**
   - Lower the threshold if messages aren't being detected
   - Default is 0.6 (60% confidence required)

### Issue: Duplicate records being created

1. **Check Deduplication Settings**
   - Settings → Transaction Ingestion → Advanced
   - Increase deduplication window if needed

2. **Manual Cleanup**
   - Review recent transactions
   - Delete duplicates manually
   - Report patterns to help improve deduplication

### Issue: Wrong categories assigned

1. **Manual Correction**
   - Edit transaction → Change category
   - Changes are logged for ML model improvement

2. **Disable Auto-Category**
   - Settings → Transaction Ingestion
   - Toggle off "Auto-Categorize"
   - Manually set categories for better accuracy

---

## Testing

### Test Messages (India - ICICI Bank Example)

```
Debit alert: ₹1,200 at AMAZON ONLINE @ 28-NOV-2024 15:30 IST
Remaining balance: ₹45,678

Credit alert: ₹25,000 salary credited @ 01-DEC-2024
New balance: ₹70,678

Transfer alert: ₹5,000 sent to Alice @ 02-DEC-2024
Reference: NEFT12345
```

### Manual Testing

1. Go to **Settings → Manual Entry**
2. Paste one of the test messages
3. Review extracted data
4. Confirm record creation

### Debug Logs

Enable debug mode to see:
- Raw message received
- Normalization steps
- Detected patterns
- Confidence scores
- Classification reasoning
- Duplication check results

---

## Performance Considerations

### Battery Usage
- Background listener optimized for minimal CPU
- Uses native OS mechanisms (SMS broadcast receiver, notification delegate)
- Runs only when messages arrive, not continuously

### Storage
- Extracted data cached locally
- Original messages not stored permanently
- Metadata retained for 30 days by default
- Configurable retention policy

### Network
- Deduplication happens on-device first
- Database writes batched
- Sync happens during app's next batch operation

---

## Future Enhancements

1. **Email Parsing**
   - Parse bank statement emails
   - Auto-detect email alerts from banks

2. **ML-Based Learning**
   - Learn from user corrections
   - Improve categorization accuracy
   - Detect new transaction patterns

3. **Multi-Currency Support**
   - Automatic currency detection
   - Exchange rate handling
   - Multi-account tracking

4. **Analytics Integration**
   - Track ingestion accuracy metrics
   - Heatmaps of false positives
   - A/B testing confidence thresholds

---

## API Reference

### Core Manager Methods

```typescript
// Initialize manager
manager.initialize(userId: string, accountId: string): Promise<void>

// Get current settings
manager.getSettings(): IngestionSettings

// Update settings
manager.updateSettings(settings: Partial<IngestionSettings>): void

// Set confidence threshold
manager.setConfidenceThreshold(threshold: number): void

// Enable/disable source
manager.setSourceEnabled(source: string, enabled: boolean): void

// Manual ingestion
manager.manualIngest(text: string): Promise<IngestionResult>

// Cleanup resources
manager.cleanup(): void

// Get statistics
manager.getStatistics(): Promise<{
  totalDetected: number;
  totalCreated: number;
  totalRejected: number;
  accuracyMetrics: { precision: number; recall: number };
}>
```

### Context Hook Methods

```typescript
// Access context
const ingestion = useTransactionIngestion();

// Available methods
ingestion.settings                    // Current settings
ingestion.isInitialized              // Initialization status
ingestion.isListening                // Listener active status
ingestion.confidenceThreshold        // Current threshold
ingestion.debugMode                  // Debug mode status

ingestion.updateSettings()            // Update settings
ingestion.enableAutoDetection()       // Turn on auto-detect
ingestion.disableAutoDetection()      // Turn off auto-detect
ingestion.setConfidenceThreshold()    // Update threshold
ingestion.setSourceEnabled()          // Enable/disable source
ingestion.ingestManually()            // Manual ingestion
ingestion.toggleDebugMode()           // Toggle debug
ingestion.getManager()                // Access raw manager
```

---

## Support & Resources

- **Feature Documentation**: `sms_to_record_update_feature.md`
- **Architecture Details**: `lib/transactionDetection/`
- **Database Schema**: `database/transaction_ingestion_schema.sql`
- **Settings UI**: `app/preferences/transaction-ingestion.tsx`
- **Manual Testing**: `app/preferences/manual-ingestion.tsx`

---

## Changelog

### v1.0.0 (2024-12-19)
- ✅ Initial integration of IngestionProvider
- ✅ SMS listener for Android
- ✅ Notification listener for iOS
- ✅ Transaction detection engine
- ✅ Deduplication system
- ✅ Settings UI
- ✅ Manual ingestion interface
- ✅ Debug mode support

---

**Last Updated**: December 19, 2024  
**Maintainer**: BudgetZen Development Team
