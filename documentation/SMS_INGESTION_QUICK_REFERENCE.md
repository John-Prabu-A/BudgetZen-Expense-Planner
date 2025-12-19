# 🎯 SMS/Notification Integration - Quick Reference

## TL;DR

The SMS/Notification to Record Update service is now **integrated and ready to use**. Users can enable automatic transaction detection in Settings.

---

## For End Users

### Enable Auto-Detection
1. Open App → Settings (⚙️)
2. Scroll to "Advanced" section
3. Tap "Transaction Ingestion Settings"
4. Toggle "Automatic Detection" **ON**
5. Ensure SMS or Notification source is enabled (based on platform)

### Test It
1. Go to Settings → Manual Entry
2. Paste a bank message: `Debit ₹1,200 at Amazon @ 19-DEC-2024`
3. Tap "Parse"
4. See extracted data
5. Confirm to create transaction

### Troubleshoot
| Problem | Solution |
|---------|----------|
| Not detecting messages | Enable in settings, check permissions |
| Creating duplicates | Lower confidence threshold |
| Wrong categories | Turn off auto-categorize, set manually |
| App slow | Check device storage, clear old messages |

---

## For React Component Developers

### Basic Usage
```typescript
import { useTransactionIngestion } from '@/context/TransactionIngestion';

export function MyComponent() {
  const { isInitialized, settings } = useTransactionIngestion();
  
  if (!isInitialized) return <Loading />;
  
  return <View>Auto-detection: {settings?.autoDetectionEnabled ? '✅' : '❌'}</View>;
}
```

### Manual Ingestion
```typescript
const { ingestManually } = useTransactionIngestion();

const handleParseMessage = async (text: string) => {
  const result = await ingestManually(text);
  
  if (result.success) {
    console.log('Created transaction:', result.recordId);
    console.log('Amount:', result.metadata.extractedData?.amount);
  } else {
    console.error('Failed:', result.reason);
  }
};
```

### Update Settings
```typescript
const { updateSettings, setConfidenceThreshold } = useTransactionIngestion();

// Enable/disable entire service
updateSettings({ autoDetectionEnabled: false });

// Adjust confidence level (0-1)
setConfidenceThreshold(0.8);

// Enable/disable specific sources
setSourceEnabled('SMS', true);
setSourceEnabled('Notification', false);
```

### Debug Mode
```typescript
const { debugMode, toggleDebugMode } = useTransactionIngestion();

// Enable detailed logging
toggleDebugMode();

// Check logs in console for:
// - Raw messages received
// - Confidence scores
// - Extraction details
// - Deduplication results
```

---

## API Methods Reference

### useTransactionIngestion() Hook

#### Properties
```typescript
settings: IngestionSettings | null        // Current configuration
isInitialized: boolean                    // Ready to use?
isListening: boolean                      // Actively listening?
confidenceThreshold: number               // Current threshold (0-1)
debugMode: boolean                        // Debug logging on?
```

#### Control Methods
```typescript
enableAutoDetection()                     // Turn on auto-detection
disableAutoDetection()                    // Turn off auto-detection
updateSettings(partial)                   // Update any setting
setConfidenceThreshold(number)            // Set 0-1 threshold
setSourceEnabled(type, bool)              // Enable/disable SMS, Notifications, etc.
ingestManually(text)                      // Parse a message manually
toggleDebugMode()                         // Toggle debug logging
getManager()                              // Access raw manager
```

#### Manual Ingestion Return Type
```typescript
{
  success: boolean;
  error?: string;                         // Error message if failed
  reason?: string;                        // Detailed failure reason
  messageId: string;                      // Original message ID
  recordId?: string;                      // DB record ID (if created)
  
  metadata: {
    sourceType: 'SMS' | 'Notification' | 'Email' | 'Manual';
    timestamp: Date;
    extractedData?: {
      type: 'income' | 'expense' | 'transfer';
      amount: number;
      currency: string;
      date: Date;
      description: string;
      bankProvider: string;
    };
    confidenceScore?: number;              // 0-1 confidence
    duplicateOf?: string;                  // If it was deduped
    classification?: {
      category: string;
      subcategory: string;
    };
  };
}
```

---

## Architecture Quick Reference

```
Input Sources (Platform-Specific)
├─ Android: SMS broadcast receiver
└─ iOS: Notification delegate

        ↓

Unified Message Format
├─ Raw text
├─ Timestamp
├─ Source type
└─ Confidence hint

        ↓

Message Normalization
├─ Remove URLs/OTPs
├─ Lowercase conversion
├─ Currency normalization
└─ Date standardization

        ↓

Transaction Detection
├─ Keyword pattern matching
├─ Intent detection (Debit/Credit/Transfer)
└─ Confidence scoring

        ↓

Entity Extraction
├─ Amount
├─ Currency
├─ Date/Time
├─ Bank provider
└─ Reference/Description

        ↓

Classification
├─ Expense
├─ Income
└─ Transfer

        ↓

Deduplication
├─ Check time window
├─ Compare amounts
└─ Match source

        ↓

Database Persistence
└─ Create transaction record
   ├─ source: 'SMS'|'Notification'
   ├─ autoGenerated: true
   ├─ confidenceScore: number
   └─ bankProvider: string
```

---

## Configuration Reference

### IngestionSettings Interface
```typescript
{
  // Master switches
  autoDetectionEnabled: boolean;           // Enable auto-detection
  autoCategoryEnabled: boolean;            // Auto-assign categories
  
  // Source configuration
  sourceSettings: {
    SMS: { enabled: boolean; permissions: string[] };
    Notification: { enabled: boolean; permissions: string[] };
    Email: { enabled: boolean; permissions: string[] };
    Manual: { enabled: boolean };
  };
  
  // Detection tuning
  confidenceThreshold: number;             // 0-1, default 0.6
  deduplicationWindow: number;             // Minutes, default 60
  
  // Behavior flags
  autoCreateFromAutoDetection: boolean;    // Create record automatically
  markAsAutoGenerated: boolean;            // Mark in database
  notifyOnDetection: boolean;              // Show toast on detection
  
  // Debug
  debugMode: boolean;                      // Verbose logging
  logRejectedMessages: boolean;            // Log non-matches
}
```

---

## Platform Differences

### Android
✅ SMS reading (with permission)
✅ Notification interception
✅ Background service support
✅ Multiple message sources

### iOS
❌ No native SMS reading API
✅ Notification interception (only)
✅ Manual entry for SMS
✅ Email parsing (future)

---

## Performance Tips

1. **Optimize Confidence Threshold**
   - Too high → Misses valid transactions
   - Too low → Too many false positives
   - Start at 0.6 (default) and adjust based on results

2. **Manage Deduplication Window**
   - Wider window → Fewer duplicates (but slower queries)
   - Narrower window → Faster, but may miss duplicates
   - Default 60 minutes is usually fine

3. **Disable Unused Sources**
   - Disable SMS if not needed
   - Disable Notifications if using only manual entry
   - Reduces permissions requested

4. **Use Manual Entry for Testing**
   - Test messages before enabling auto-detection
   - Validate confidence scores
   - Understand extraction behavior

---

## Common Patterns

### Pattern 1: Show Auto-Detection Status
```typescript
export function DetectionStatus() {
  const { isInitialized, isListening, settings } = useTransactionIngestion();
  
  if (!isInitialized) return <Text>Loading...</Text>;
  
  const status = settings?.autoDetectionEnabled && isListening
    ? '🟢 Auto-detection active'
    : '⚪ Auto-detection off';
    
  return <Text>{status}</Text>;
}
```

### Pattern 2: Manual Parse with Error Handling
```typescript
async function parseAndCreateTransaction(text: string) {
  try {
    const result = await ingestManually(text);
    
    if (result.success) {
      showToast({
        title: 'Success',
        message: `₹${result.metadata.extractedData?.amount} expense added`,
      });
      // Refresh transaction list
      refreshTransactions();
    } else {
      showAlert({
        title: 'Parsing Failed',
        message: result.reason || 'Could not parse message',
      });
    }
  } catch (error) {
    showAlert({
      title: 'Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
```

### Pattern 3: Settings Panel
```typescript
export function IngestionSettingsPanel() {
  const {
    settings,
    updateSettings,
    setConfidenceThreshold,
  } = useTransactionIngestion();
  
  return (
    <View>
      <Switch
        value={settings?.autoDetectionEnabled}
        onValueChange={(val) => 
          updateSettings({ autoDetectionEnabled: val })
        }
      />
      <Slider
        min={0}
        max={1}
        step={0.1}
        value={settings?.confidenceThreshold || 0.6}
        onChangeValue={setConfidenceThreshold}
      />
    </View>
  );
}
```

---

## Database Fields for Auto-Detected Transactions

```typescript
interface Transaction {
  // Standard fields
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  date: Date;
  description: string;
  
  // Auto-detection specific
  source: 'SMS' | 'Notification' | 'Email' | 'Manual';
  autoGenerated: boolean;
  confidenceScore: number;        // 0-1
  bankProvider: string;
  originalMessage: string;        // (encrypted/hashed)
  
  // Metadata
  extractionDetails: {
    patterns: string[];
    confidence: number;
    detectionModel: string;
  };
  
  // Tracking
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
}
```

---

## Troubleshooting Checklist

### Not Working At All
- [ ] App has necessary permissions
- [ ] IngestionProvider in component tree
- [ ] Auto-detection enabled in settings
- [ ] At least one source enabled
- [ ] Debug mode enabled (check logs)

### Working But Missing Messages
- [ ] Confidence threshold too high
- [ ] Message format not recognized
- [ ] Bank not in supported list
- [ ] Message got filtered as noise
- [ ] Check rejection logs in debug mode

### Creating Wrong Data
- [ ] Confidence score too low
- [ ] Pattern not matching intent
- [ ] Currency extraction failing
- [ ] Manual review and correction needed

### Performance Issues
- [ ] Too many messages in queue
- [ ] Deduplication window too large
- [ ] Database indexes missing
- [ ] Clear old cached data
- [ ] Check memory in debug info

---

## Testing Checklist

```typescript
// ✅ Provider available
const ingestion = useTransactionIngestion();

// ✅ Can access settings
const { autoDetectionEnabled } = ingestion.settings || {};

// ✅ Can toggle features
ingestion.enableAutoDetection();
ingestion.setConfidenceThreshold(0.7);

// ✅ Can parse message
const result = await ingestion.ingestManually(
  'Debit ₹1,200 @ Amazon on 19-Dec'
);

// ✅ Result structure correct
assert(result.success === true);
assert(result.recordId);
assert(result.metadata.extractedData?.amount === 1200);
```

---

## Next Steps

1. **Enable in Production**: Ensure all permissions and settings are configured
2. **Monitor Accuracy**: Track false positives and improve patterns
3. **Collect Feedback**: Let users report missed transactions
4. **Improve Extraction**: Expand bank message pattern library
5. **Future Features**: Email parsing, ML categorization, etc.

---

## Support & Links

- **Integration Guide**: `SMS_INGESTION_INTEGRATION_GUIDE.md`
- **Implementation Summary**: `SMS_INGESTION_IMPLEMENTATION_SUMMARY.md`
- **Developer Checklist**: `SMS_INGESTION_DEVELOPER_CHECKLIST.md`
- **Feature Spec**: `sms_to_record_update_feature.md`
- **Type Definitions**: `lib/transactionDetection/types.ts`
- **Main Context**: `context/TransactionIngestion.tsx`

---

**Last Updated**: December 19, 2024  
**Version**: 1.0  
**Status**: ✅ Ready for Use
