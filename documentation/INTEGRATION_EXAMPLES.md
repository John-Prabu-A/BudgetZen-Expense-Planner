# 📚 Integration Examples - Transaction Detection Service

This document provides practical examples of integrating the Transaction Detection Service into your app.

## Quick Start Examples

### Example 1: Root Layout Setup

Add the IngestionProvider to your root layout to enable the service across your app:

```typescript
// app/_layout.tsx
import { IngestionProvider } from '@/context/TransactionIngestion';
import { useAuth } from '@/context/Auth';

export default function RootLayout() {
  const { user } = useAuth();
  const accountId = useCurrentAccountId(); // Your function

  return (
    <IngestionProvider 
      accountId={accountId}
      initialSettings={{
        autoDetectionEnabled: true,
        confidenceThreshold: 0.6,
        androidSmsEnabled: true,
        notificationsEnabled: true,
        autoCategoryEnabled: true,
        debugMode: false,
      }}
    >
      <YourAppStack />
    </IngestionProvider>
  );
}
```

### Example 2: Using the Hook in a Component

```typescript
import { useTransactionIngestion } from '@/context/TransactionIngestion';

export function MyComponent() {
  const {
    settings,
    isInitialized,
    ingestManually,
    setConfidenceThreshold,
    setSourceEnabled,
  } = useTransactionIngestion();

  const handleIngest = async (text: string) => {
    const result = await ingestManually(text);
    if (result.success) {
      console.log('Created:', result.recordId);
    } else {
      console.log('Failed:', result.reason);
    }
  };

  return (
    <View>
      {/* Your UI */}
    </View>
  );
}
```

### Example 3: Settings Screen

```typescript
export function SettingsScreen() {
  const {
    settings,
    updateSettings,
    setSourceEnabled,
  } = useTransactionIngestion();

  return (
    <ScrollView>
      {/* Auto-Detection Toggle */}
      <Switch
        value={settings?.autoDetectionEnabled}
        onValueChange={(val) =>
          updateSettings({ autoDetectionEnabled: val })
        }
      />

      {/* SMS Toggle */}
      <Switch
        value={settings?.androidSmsEnabled}
        onValueChange={(val) => setSourceEnabled('SMS', val)}
      />

      {/* Notification Toggle */}
      <Switch
        value={settings?.notificationsEnabled}
        onValueChange={(val) => setSourceEnabled('Notification', val)}
      />
    </ScrollView>
  );
}
```

### Example 4: Manual Transaction Input

```typescript
import { useState } from 'react';
import { TextInput, TouchableOpacity, Alert } from 'react-native';

export function ManualIngestionScreen() {
  const { ingestManually } = useTransactionIngestion();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleParse = async () => {
    setLoading(true);
    try {
      const result = await ingestManually(text);
      if (result.success) {
        Alert.alert('Success', `Transaction ${result.recordId} created`);
        setText('');
      } else {
        Alert.alert('Failed', result.reason);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Paste transaction message..."
        multiline
        numberOfLines={6}
      />
      <TouchableOpacity onPress={handleParse} disabled={loading}>
        <Text>{loading ? 'Processing...' : 'Parse & Create'}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Advanced Examples

### Custom Bank Configuration

```typescript
import { detectionEngine } from '@/lib/transactionDetection';

const myBank = {
  id: 'mybank_banking',
  name: 'MyBank',
  senderIdentifiers: ['9876543210', 'mybank.app'],
  patterns: [
    {
      name: 'debit_transaction',
      pattern: /Amount\s+₹?([\d,]+)\s+debited/i,
      intent: 'Debit' as const,
      fieldExtraction: [{
        field: 'amount',
        extractor: '1',
        transform: (val: string) => parseFloat(val.replace(/,/g, '')),
        required: true,
      }],
      minimumConfidence: 0.8,
      active: true,
    },
  ],
  currency: 'INR',
  active: true,
};

detectionEngine.addBankConfig(myBank);
```

### Custom Category Mapping

```typescript
import { classificationEngine } from '@/lib/transactionDetection';

classificationEngine.addCategoryMapping({
  keywords: ['petrol', 'fuel', 'gas station', 'pump'],
  category: 'Fuel',
  categoryId: 'fuel',
  confidence: 0.9,
});
```

### Debug Mode Usage

```typescript
export function DebugPanel() {
  const { toggleDebugMode, getManager, debugMode } = useTransactionIngestion();

  const viewLogs = async () => {
    const manager = getManager();
    const persistence = manager?.getPersistenceLayer();
    const logs = await persistence?.getIngestionLogs('user-id', 20);
    console.log('Logs:', logs);
  };

  return (
    <View>
      <Switch value={debugMode} onValueChange={toggleDebugMode} />
      <TouchableOpacity onPress={viewLogs}>
        <Text>View Logs</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Common Patterns

### Handle Ingestion Results

```typescript
const result = await ingestManually(text);

if (result.success) {
  // Transaction created
  await refreshTransactionList();
  showNotification(`Transaction ${result.recordId} added`);
} else {
  // Handle different failure reasons
  if (result.reason.includes('Low confidence')) {
    showWarning('Please verify the data');
  } else if (result.reason.includes('Duplicate')) {
    showInfo('Similar transaction exists');
  } else if (result.reason.includes('No transaction')) {
    showInfo('Not a transaction message');
  }
}
```

### Batch Processing

```typescript
async function ingestMultiple(messages: string[]) {
  for (const msg of messages) {
    const result = await ingestManually(msg);
    if (result.success) {
      console.log('✅', result.recordId);
    } else {
      console.log('❌', result.reason);
    }
    await delay(100); // Rate limiting
  }
}
```

### Monitoring Queue

```typescript
const manager = getManager();
const service = manager?.getIngestionService();
const queueSize = service?.getQueueSize();

if (queueSize && queueSize > 0) {
  console.log(`${queueSize} messages waiting to be processed`);
}
```

## Testing Checklist

- [ ] Settings can be toggled
- [ ] Manual ingestion works
- [ ] SMS detected on Android (if enabled)
- [ ] Notifications detected on iOS (if enabled)
- [ ] Transactions appear in records
- [ ] Duplicates are prevented
- [ ] Categories are suggested
- [ ] Confidence threshold affects results
- [ ] Debug mode shows logs
- [ ] Permissions handled gracefully

## Troubleshooting

### SMS Not Detected (Android)

```typescript
// Check permissions
const listener = androidSmsListener;
if (!listener.isActive()) {
  console.log('Listener not active - check permissions');
}

// Test with sample SMS
listener.testSms('+919876543210', 'HDFC Bank: ₹5000 debited');
```

### Transactions Not Detected

```typescript
// Check threshold
const settings = ingestionService.getSettings();
if (settings.confidenceThreshold > 0.7) {
  setConfidenceThreshold(0.5); // Lower threshold
}

// Enable debug
toggleDebugMode();
```

### Database Issues

```sql
-- Check ingestion logs
SELECT * FROM transaction_ingestion_logs 
WHERE user_id = auth.uid() 
ORDER BY ingestion_timestamp DESC;

-- Check dedup hashes
SELECT * FROM transaction_dedup_hashes 
WHERE user_id = auth.uid();
```

---

For more information, see `TRANSACTION_DETECTION_GUIDE.md`
