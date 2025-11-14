# Export & Backup Features - Implementation Guide

## Overview

This document provides a comprehensive guide to the Export Records and Backup & Restore features implemented in BudgetZen. These features enable users to export their data for external use and create complete backups that can be restored at any time.

## Key Distinction

### Export (CSV)
- **Format**: CSV (Comma-Separated Values)
- **Use Case**: External analysis, spreadsheet imports, data migration
- **Restorable**: ❌ NOT restorable in the app
- **Scope**: Financial records only (date, type, amount, category, account, notes)
- **File Extension**: `.csv`

### Backup (MBAK/JSON)
- **Format**: JSON with complete data structure
- **Use Case**: Data protection, disaster recovery, app migration
- **Restorable**: ✅ Fully restorable with all original data
- **Scope**: Records, Accounts, Categories, Budgets + metadata
- **File Extension**: `.mbak` (displayed as `.json` in storage)
- **Storage**: Supabase Cloud Storage (encrypted, user-specific folder)

---

## Implementation Details

### 1. Export Records Feature

#### Location
- **Screen**: `app/export-records-modal.tsx`
- **Service**: `lib/dataExport.ts`

#### Features
- Date range selection (from/to dates)
- Filter by categories, accounts, and record types
- CSV generation using PapaParse
- Export summary statistics
- Preview before export
- Share/download functionality

#### CSV Export Format
```csv
date,type,amount,category,account,notes
2025-01-15,INCOME,50000,Salary,Savings Account,Monthly salary
2025-01-14,EXPENSE,1200,Housing,Credit Card,Rent payment
```

#### API Reference

**Function: `exportRecordsToCSV(options: ExportOptions)`**
```typescript
interface ExportOptions {
  dateFrom: Date;
  dateTo: Date;
  categories?: string[];        // Filter by specific categories
  accounts?: string[];          // Filter by specific accounts
  recordTypes?: ('INCOME' | 'EXPENSE' | 'TRANSFER')[];
}

interface ExportResult {
  filename: string;
  csv: string;                  // Raw CSV content
  csvBase64: string;           // Base64 encoded CSV
  summary: {
    totalRecords: number;
    totalIncome: number;
    totalExpense: number;
    totalTransfer: number;
    netBalance: number;
    uniqueCategories: number;
    uniqueAccounts: number;
  };
}
```

**Function: `shareCSVFile(filename: string, csvBase64: string)`**
- Shares the CSV file using device sharing capabilities
- Shows success alert with file information

**Function: `getExportSummary(records: CsvRecord[])`**
- Calculates and returns export statistics
- Returns breakdown by record type and unique categories/accounts

#### Usage Example

```typescript
import { exportRecordsToCSV, shareCSVFile } from '@/lib/dataExport';

const handleExport = async () => {
  try {
    const options = {
      dateFrom: new Date(2025, 0, 1),
      dateTo: new Date(2025, 11, 31),
      recordTypes: ['INCOME', 'EXPENSE'],
    };

    const result = await exportRecordsToCSV(options);
    
    // Access CSV content
    console.log('CSV Content:', result.csv);
    console.log('Summary:', result.summary);
    
    // Share the file
    await shareCSVFile(result.filename, result.csvBase64);
  } catch (error) {
    console.error('Export failed:', error);
  }
};
```

---

### 2. Backup & Restore Feature

#### Location
- **Screen**: `app/backup-restore-modal.tsx`
- **Service**: `lib/dataBackup.ts`

#### Storage Architecture
```
Supabase Storage: user-backups bucket
├── {userId}/
│   ├── backup-1705255800000.mbak
│   ├── backup-1705342200000.mbak
│   └── backup-1705428600000.mbak
```

#### Features
- Create complete data backups with one tap
- List all existing backups with timestamps
- Download and preview backup contents
- Restore from any backup with confirmation dialog
- Delete old backups
- Backup validation before restoration
- Encrypted storage using Supabase

#### Backup Data Structure

```typescript
interface BackupData {
  version: string;              // Backup format version (1.0.0)
  createdAt: string;           // ISO timestamp
  userId: string;              // User ID who created backup
  records: any[];              // All financial records
  accounts: any[];             // All accounts
  categories: any[];           // All categories
  budgets: any[];              // All budgets
  metadata: {
    recordCount: number;
    accountCount: number;
    categoryCount: number;
    budgetCount: number;
  };
}
```

#### API Reference

**Function: `createBackup(userId: string): Promise<BackupData>`**
- Fetches all user data (records, accounts, categories, budgets)
- Creates structured backup object
- Returns backup data without uploading

**Function: `uploadBackupToStorage(backup: BackupData, userId: string): Promise<string>`**
- Uploads backup to Supabase Storage
- Stores in user-specific folder
- Timestamp-based filename to prevent overwrites
- Returns storage file path

**Function: `listUserBackups(userId: string): Promise<BackupFile[]>`**
- Lists all backups for a specific user
- Filters by `.mbak` extension
- Returns sorted by creation date (newest first)
- Includes file metadata (size, creation time)

```typescript
interface BackupFile {
  id: string;
  name: string;
  createdAt: string;
  size: number;
  url: string;
}
```

**Function: `downloadBackup(userId: string, backupName: string): Promise<BackupData>`**
- Downloads backup file from storage
- Parses JSON and validates structure
- Returns parsed backup data
- Throws error if file format is invalid

**Function: `deleteBackupFile(userId: string, backupName: string): Promise<void>`**
- Permanently deletes a backup from storage
- Requires confirmation from user before calling

**Function: `validateBackup(backup: BackupData): { valid: boolean; errors: string[] }`**
- Validates backup structure before restoration
- Checks for required fields and correct types
- Returns detailed error messages if invalid

**Function: `getBackupInfo(userId: string, backupName: string): Promise<any>`**
- Retrieves metadata for a specific backup
- Includes creation date, size, last modified
- Useful for displaying backup information

#### Usage Example

```typescript
import {
  createBackup,
  uploadBackupToStorage,
  listUserBackups,
  downloadBackup,
  validateBackup,
} from '@/lib/dataBackup';

// Create and upload backup
const handleCreateBackup = async (userId: string) => {
  try {
    // Create backup
    const backup = await createBackup(userId);
    console.log(`Backup contains ${backup.metadata.recordCount} records`);

    // Upload to storage
    const filePath = await uploadBackupToStorage(backup, userId);
    console.log('Backup uploaded:', filePath);
  } catch (error) {
    console.error('Backup failed:', error);
  }
};

// List and restore backup
const handleListAndRestore = async (userId: string) => {
  try {
    // List backups
    const backups = await listUserBackups(userId);
    console.log(`Found ${backups.length} backups`);

    // Download specific backup
    const backup = await downloadBackup(userId, backups[0].name);

    // Validate before restoration
    const validation = validateBackup(backup);
    if (!validation.valid) {
      console.error('Invalid backup:', validation.errors);
      return;
    }

    // Safe to restore
    console.log('Backup is valid, can proceed with restoration');
  } catch (error) {
    console.error('Operation failed:', error);
  }
};
```

---

## Screen Components

### Export Records Modal (`app/export-records-modal.tsx`)

#### Key Features
- Date picker for from/to date selection
- Export summary statistics display
- CSV preview before sharing
- Beautiful modal interface for backup preview

#### Key States
```typescript
const [dateFrom, setDateFrom] = useState<Date>(currentMonth.first);
const [dateTo, setDateTo] = useState<Date>(today);
const [loading, setLoading] = useState(false);
const [exportData, setExportData] = useState<any>(null);
const [showPreview, setShowPreview] = useState(false);
```

#### Main Methods
- `handleExport()`: Generates CSV with date range validation
- `handleShare()`: Shares the exported CSV file
- `PreviewModal()`: Shows CSV preview with statistics

### Backup & Restore Modal (`app/backup-restore-modal.tsx`)

#### Key Features
- One-tap backup creation
- List of all existing backups
- Backup age indicator (e.g., "3 days ago")
- Restore with multi-step confirmation
- Delete backup with safeguard

#### Key States
```typescript
const [backups, setBackups] = useState<BackupFile[]>([]);
const [loading, setLoading] = useState(false);
const [creatingBackup, setCreatingBackup] = useState(false);
const [selectedBackup, setSelectedBackup] = useState<BackupFile | null>(null);
const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
```

#### Main Methods
- `loadBackups()`: Fetches list of user backups
- `handleCreateBackup()`: Creates and uploads new backup
- `handleRestoreBackup()`: Downloads and validates backup
- `confirmRestore()`: Final restoration with user confirmation
- `handleDeleteBackup()`: Deletes selected backup with safeguard

---

## Integration with Preferences

Both features are accessible from the Preferences screen under "Data Management":

1. **Export Records** - Navigate to export with date range selection
2. **Backup & Restore** - Manage backups in cloud storage

Updated in `app/preferences.tsx`:
```typescript
{/* Data Management Section */}
<View style={[styles.section, { marginBottom: 32 }]}>
  <SectionHeader title="Data Management" />
  
  {/* Export Records Button */}
  <TouchableOpacity onPress={() => router.push('export-records-modal' as any)}>
    {/* ... */}
  </TouchableOpacity>

  {/* Backup & Restore Button */}
  <TouchableOpacity onPress={() => router.push('backup-restore-modal' as any)}>
    {/* ... */}
  </TouchableOpacity>
</View>
```

---

## Supabase Configuration

### Required Setup

1. **Storage Bucket**: Create a bucket named `user-backups`
   ```sql
   -- Enable storage if not already enabled
   -- Create bucket for backups
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('user-backups', 'user-backups', false);
   ```

2. **Storage Policy**: Restrict access to user's own backups
   ```sql
   -- Create RLS policy for user-backups
   CREATE POLICY "Users can access their own backups"
   ON storage.objects
   FOR ALL
   USING (bucket_id = 'user-backups' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

### Environment Variables
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## Dependencies

### Installed Packages
- **papaparse**: CSV generation and parsing
- **expo-file-system**: File system operations (if needed for future enhancements)
- **expo-sharing**: Share export files on device
- **@react-native-community/datetimepicker**: Date selection interface
- **@types/papaparse**: TypeScript definitions for PapaParse

### Import statements
```typescript
import Papa from 'papaparse';
import { writeAsStringAsync } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
```

---

## Security Considerations

### Data Privacy
1. **Backup Encryption**: Stored in Supabase with encryption at rest
2. **User Isolation**: Each user can only access their own backups (folder-based)
3. **No Public Access**: Storage bucket is private by default
4. **Secure Transport**: All data sent over HTTPS

### Passcode Protection
- Consider requiring passcode for backup creation/restoration
- Add biometric authentication for sensitive operations
- Log backup/restore operations for audit trail

### Validation
- Validate backup structure before restoration
- Check data integrity before applying
- Show detailed error messages if restoration fails

---

## Error Handling

### Export Errors
- Empty date range
- No records matching filters
- Storage write failures
- Share API unavailable

### Backup Errors
- User not authenticated
- Storage connection failure
- Invalid backup format
- Insufficient storage quota
- Backup file not found

### Common Solutions
```typescript
// Check if user is authenticated
if (!user?.id) {
  throw new Error('User not authenticated');
}

// Validate dates
if (dateFrom > dateTo) {
  throw new Error('Start date must be before end date');
}

// Catch and display errors
try {
  // operation
} catch (error: any) {
  Alert.alert('Error', error.message || 'Operation failed');
}
```

---

## Future Enhancements

1. **Scheduled Backups**: Automatic daily/weekly backups
2. **Backup Encryption**: Additional client-side encryption
3. **Selective Restore**: Restore only specific data categories
4. **Export Formats**: Support additional formats (Excel, PDF)
5. **Incremental Backups**: Only backup changed data
6. **Backup Compression**: Reduce storage usage
7. **Multi-Device Sync**: Sync backups across devices
8. **Backup Versioning**: Keep multiple versions with rollback

---

## Testing Checklist

- [ ] Export records with various date ranges
- [ ] Export with filters (categories, accounts, types)
- [ ] Verify CSV format and content
- [ ] Share CSV file on device
- [ ] Create backup successfully
- [ ] List backups in ascending/descending order
- [ ] Download and validate backup
- [ ] Restore from backup
- [ ] Delete backup with confirmation
- [ ] Test with no backups (empty state)
- [ ] Test with large datasets
- [ ] Test network failures
- [ ] Verify data integrity after restore
- [ ] Check file permissions and isolation

---

## Troubleshooting

### Common Issues

**Issue**: Export returns no records
- **Solution**: Check date range and filters, ensure records exist

**Issue**: Backup upload fails
- **Solution**: Verify Supabase connection, check storage bucket exists

**Issue**: Cannot restore backup
- **Solution**: Validate backup format, check user authentication

**Issue**: Storage quota exceeded
- **Solution**: Delete old backups, upgrade storage plan

---

## Support & Feedback

For issues, feature requests, or questions:
1. Check this documentation
2. Review error messages and logs
3. Contact support with:
   - Device information
   - Error message (if any)
   - Steps to reproduce
   - App version

---

**Last Updated**: January 2025
**Status**: Production Ready ✅
**Version**: 1.0.0
