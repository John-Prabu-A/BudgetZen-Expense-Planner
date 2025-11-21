# Export & Backup Features - Architecture & Flow Diagrams

## 1. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         BudgetZen App                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐              ┌──────────────────┐          │
│  │  Preferences UI  │              │  Export Records  │          │
│  │   (preferences   │              │     Modal        │          │
│  │   .tsx)          │              │ (export-records- │          │
│  │                  │              │  modal.tsx)      │          │
│  │ ┌──────────────┐ │              │                  │          │
│  │ │ Data Mgmt    │ │              │ ┌──────────────┐ │          │
│  │ │ Section      │ │────────────▶ │ │ Date Picker  │ │          │
│  │ │              │ │              │ │ Filters      │ │          │
│  │ │ • Export     │ │              │ │ Preview      │ │          │
│  │ │ • Backup     │ │              │ │ Share        │ │          │
│  │ └──────────────┘ │              │ └──────────────┘ │          │
│  └──────────────────┘              └──────────────────┘          │
│           │                                 │                    │
│           │                                 │                    │
│           └────────────┬────────────────────┘                    │
│                        │                                         │
│  ┌──────────────────┐  │  ┌──────────────────┐                  │
│  │ Backup & Restore │  │  │ Navigation       │                  │
│  │ Modal (backup-   │◀─┘  │ (_layout.tsx)    │                  │
│  │ restore-modal    │     │                  │                  │
│  │ .tsx)            │     │ ┌──────────────┐ │                  │
│  │                  │     │ │ Routes       │ │                  │
│  │ ┌──────────────┐ │     │ │ - export     │ │                  │
│  │ │ Create Backup│ │     │ │ - backup     │ │                  │
│  │ │ List Backups │ │     │ │ - preferences│ │                  │
│  │ │ Restore      │ │     │ │ - tabs       │ │                  │
│  │ │ Delete       │ │     │ │ - auth       │ │                  │
│  │ └──────────────┘ │     │ └──────────────┘ │                  │
│  └──────────────────┘     └──────────────────┘                  │
│           │                                                      │
└───────────┼──────────────────────────────────────────────────────┘
            │
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Service Layer                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐              ┌──────────────────┐          │
│  │  Data Export     │              │   Data Backup    │          │
│  │ (dataExport.ts)  │              │  (dataBackup.ts) │          │
│  │                  │              │                  │          │
│  │ • exportRecords  │              │ • createBackup   │          │
│  │   ToCSV()        │              │ • uploadBackup   │          │
│  │ • shareCSVFile() │              │ • listBackups()  │          │
│  │ • getExportSum   │              │ • downloadBack   │          │
│  │   mary()         │              │ • deleteBackup   │          │
│  │                  │              │ • validateBack   │          │
│  │                  │              │                  │          │
│  └──────────────────┘              └──────────────────┘          │
│           │                                │                    │
└───────────┼────────────────────────────────┼────────────────────┘
            │                                │
            │                                │
            ▼                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Finance Module                                │
│              (lib/finance.js)                                    │
│                                                                   │
│  • readRecords()   • readAccounts()                              │
│  • readCategories()  • readBudgets()                             │
│  • createRecord()  • deleteRecord()  • updateRecord()           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Supabase Client                                 │
│                (lib/supabase.ts)                                 │
└─────────────────────────────────────────────────────────────────┘
            │
            ├─────────────────────┬─────────────────────┐
            │                     │                     │
            ▼                     ▼                     ▼
        ┌────────┐           ┌──────────┐         ┌──────────┐
        │Database│           │ Storage  │         │Auth      │
        │(Postgres)          │(user-    │         │(JWT)     │
        │                    │backups)  │         │          │
        │Records │           │          │         │Sessions  │
        │Accounts│           │Backups   │         │Users     │
        │Categor │           │(*.mbak)  │         │          │
        │ies     │           │          │         │          │
        │Budgets │           │          │         │          │
        └────────┘           └──────────┘         └──────────┘
```

---

## 2. Data Flow Diagram - Export Records

```
User Interaction
       │
       ▼
┌──────────────────────────┐
│ Export Records Modal     │
│ - Select Date From       │
│ - Select Date To         │
│ - Select Filters         │
└──────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ handleExport()                   │
│ - Validate dates                 │
│ - Create ExportOptions           │
└──────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ exportRecordsToCSV(options)              │
│ - Fetch all records from database        │
│ - Filter by date range                   │
│ - Apply category/account/type filters    │
│ - Transform to CSV format                │
│ - Generate statistics summary            │
└──────────────────────────────────────────┘
       │
       ├─────────────────┬──────────────────┐
       │                 │                  │
       ▼                 ▼                  ▼
   CSV String      CSV Base64        Summary Stats
       │                 │                  │
       └─────────────────┼──────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ ExportResult Object │
              │ - filename          │
              │ - csv content       │
              │ - csvBase64         │
              │ - summary stats     │
              └─────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Show Preview Modal   │
              │ - Display stats      │
              │ - Show CSV snippet   │
              │ - File info          │
              └──────────────────────┘
                         │
                    ┌────┴────┐
                    │          │
                    ▼          ▼
              ┌───────┐   ┌────────┐
              │Cancel │   │ Share  │
              └───────┘   └────────┘
                              │
                              ▼
                      ┌─────────────────┐
                      │ shareCSVFile()  │
                      │ - Use Sharing   │
                      │   API           │
                      │ - Download/Send │
                      └─────────────────┘
```

---

## 3. Data Flow Diagram - Backup & Restore

```
User Interaction
       │
       ▼
┌─────────────────────────────┐
│ Backup & Restore Modal      │
│ - Show existing backups     │
│ - Create backup button      │
└─────────────────────────────┘
       │
       ├──────────────────┬──────────────────┐
       │                  │                  │
       ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│Create Backup │  │List Backups  │  │Delete Backup │
└──────────────┘  └──────────────┘  └──────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌────────────────────────────┐  ┌──────────────────────┐
│ createBackup(userId)       │  │listUserBackups()     │
│ - Fetch records            │  │- List files in       │
│ - Fetch accounts           │  │  user folder         │
│ - Fetch categories         │  │- Parse metadata      │
│ - Fetch budgets            │  │- Sort by date        │
│ - Create metadata          │  └──────────────────────┘
│ - Combine into backup      │           │
└────────────────────────────┘           │
       │                                 │
       ▼                          ┌──────┴──────┐
┌──────────────────────────────┐ │             │
│BackupData JSON               │ ▼             ▼
│{                             │┌──────┐  ┌────────┐
│  version: "1.0.0"            ││ Show │  │Restore │
│  createdAt: ISO              ││ List │  │Selected│
│  records: [],                └──────┘  └────────┘
│  accounts: [],                   │          │
│  categories: [],                 │          ▼
│  budgets: [],                    │    ┌──────────────────┐
│  metadata: {                     │    │downloadBackup()  │
│    recordCount,                  │    │- Download from   │
│    accountCount,                 │    │  Supabase        │
│    ...                           │    │- Parse JSON      │
│  }                               │    │- Validate        │
│}                                 │    └──────────────────┘
│                                  │            │
└──────────────────────────────────┘            ▼
       │                          ┌──────────────────────┐
       │                          │ validateBackup()     │
       │                          │ - Check version      │
       │                          │ - Check structure    │
       │                          │ - Check data types   │
       │                          └──────────────────────┘
       │                                   │
       ▼                                   ▼
┌─────────────────────────────────┐  ┌──────────┐
│uploadBackupToStorage()          │  │ Valid?   │
│- Convert to JSON string         │  └─────┬────┘
│- Upload to Supabase Storage     │        │
│  /user-backups/{userId}         │   ┌────┴─────┐
│- Use timestamp filename         │   │           │
│- Return file path               │   No          Yes
└─────────────────────────────────┘   │           │
       │                              │           │
       ▼                              ▼           ▼
  ┌────────┐                    ┌────────┐  ┌──────────────┐
  │Success │                    │ Error  │  │Show Confirm  │
  │Message │                    │Message │  │Dialog        │
  └────────┘                    └────────┘  └──────────────┘
       │                                          │
       │                     ┌────────┬──────────┘
       │                     │         │
       │                     No        Yes
       │                     │         │
       │                     ▼         ▼
       │                 Cancel    ┌──────────────┐
       │                 │         │Restore Data  │
       └─────────────────┼─────────│- Replace all │
                         │         │  data        │
                         ▼         │- Refresh app │
                    ┌─────────┐    └──────────────┘
                    │Modal    │           │
                    │Closes   │           ▼
                    └─────────┘      ┌────────┐
                                     │Success │
                                     │Message │
                                     └────────┘
```

---

## 4. Data Structure Diagram

### Export Data Structure
```
┌─────────────────────────────────────┐
│        CsvRecord (Array)             │
├─────────────────────────────────────┤
│ [                                   │
│   {                                 │
│     date: "2025-01-15"              │
│     type: "INCOME"                  │
│     amount: 50000                   │
│     category: "Salary"              │
│     account: "Savings Account"      │
│     notes: "Monthly salary"         │
│   },                                │
│   {                                 │
│     date: "2025-01-14"              │
│     type: "EXPENSE"                 │
│     amount: 1200                    │
│     category: "Housing"             │
│     account: "Credit Card"          │
│     notes: "Rent payment"           │
│   },                                │
│   ...                               │
│ ]                                   │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│   Papa.unparse() → CSV String       │
├─────────────────────────────────────┤
│ date,type,amount,category,account,  │
│ notes                               │
│ 2025-01-15,INCOME,50000,Salary,     │
│ Savings Account,Monthly salary      │
│ 2025-01-14,EXPENSE,1200,Housing,    │
│ Credit Card,Rent payment            │
│ ...                                 │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│      Base64 Encoded String          │
├─────────────────────────────────────┤
│ ZGF0ZSx0eXBlLGFtb3VudCxjYXRlZ29yeSAx
│ Y2NvdW50LG5vdGVzCjIwMjUtMDEtMTUsI...
│ ...                                 │
└─────────────────────────────────────┘
```

### Backup Data Structure
```
┌─────────────────────────────────────┐
│        BackupData Object            │
├─────────────────────────────────────┤
│ {                                   │
│   version: "1.0.0"                  │
│   createdAt: "2025-01-15T10:30:00Z" │
│   userId: "user_abc123"             │
│   records: [                        │
│     {                               │
│       id: "rec_1",                  │
│       type: "INCOME",               │
│       amount: 50000,                │
│       category_id: "cat_1",         │
│       account_id: "acc_1",          │
│       transaction_date: "2025-01-15"│
│       notes: "Salary",              │
│       ...                           │
│     },                              │
│     ...                             │
│   ],                                │
│   accounts: [                       │
│     {                               │
│       id: "acc_1",                  │
│       name: "Savings Account",      │
│       balance: 100000,              │
│       ...                           │
│     }                               │
│   ],                                │
│   categories: [                     │
│     {                               │
│       id: "cat_1",                  │
│       name: "Salary",               │
│       icon: "briefcase",            │
│       color: "#10B981",             │
│       ...                           │
│     }                               │
│   ],                                │
│   budgets: [...],                   │
│   metadata: {                       │
│     recordCount: 147,               │
│     accountCount: 3,                │
│     categoryCount: 12,              │
│     budgetCount: 5                  │
│   }                                 │
│ }                                   │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│    JSON.stringify() → JSON String   │
├─────────────────────────────────────┤
│ {                                   │
│   "version":"1.0.0",                │
│   "createdAt":"2025-01-15T...",     │
│   "userId":"user_abc123",           │
│   "records":[...],                  │
│   "accounts":[...],                 │
│   ...                               │
│ }                                   │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Upload to Supabase Storage         │
│  /user-backups/{userId}/            │
│  backup-1705255800000.mbak          │
├─────────────────────────────────────┤
│ Encrypted JSON file                 │
│ (encrypted at rest by Supabase)     │
└─────────────────────────────────────┘
```

---

## 5. User Journey Diagrams

### Export Records Journey

```
User Opens App
    │
    ├─ Navigate to Settings/Preferences
    │       │
    │       ▼
    │   Open Preferences Screen
    │       │
    │       ▼
    │   Find "Data Management" Section
    │       │
    │       ▼
    │   Tap "Export Records"
    │       │
    │       ▼
    │   ┌──────────────────────────┐
    │   │Export Records Modal      │
    │   └──────────────────────────┘
    │       │
    │       ├─ Tap Date From Picker
    │       │   └─ Select start date
    │       │
    │       ├─ Tap Date To Picker
    │       │   └─ Select end date
    │       │
    │       ├─ (Optional) Select Filters
    │       │   └─ Categories, Accounts, Types
    │       │
    │       ▼
    │   ┌──────────────────────────┐
    │   │Tap "Generate Export"     │
    │   └──────────────────────────┘
    │       │
    │       ├─ Loading state shown
    │       │
    │       ├─ CSV generated
    │       │
    │       ├─ Statistics calculated
    │       │
    │       ▼
    │   ┌──────────────────────────┐
    │   │Show "Export Successful"  │
    │   │Alert                     │
    │   └──────────────────────────┘
    │       │
    │       ├─ Option: View Preview
    │       │   │
    │       │   ▼
    │       │   ┌─────────────────────┐
    │       │   │Preview Modal Shows  │
    │       │   │- Summary stats      │
    │       │   │- CSV snippet        │
    │       │   │- File info          │
    │       │   └─────────────────────┘
    │       │
    │       ├─ Tap "Share"
    │       │   │
    │       │   ▼
    │       │   Device Share Menu
    │       │   - Save to Files
    │       │   - Send via Email
    │       │   - Copy to Cloud Storage
    │       │
    │       ▼
    └─ CSV File Available for Use
        └─ Can import to Excel, Google Sheets, etc.
```

### Backup Creation & Restore Journey

```
User Opens App
    │
    ├─ Navigate to Settings/Preferences
    │       │
    │       ▼
    │   Find "Data Management" Section
    │       │
    │       ▼
    │   Tap "Backup & Restore"
    │       │
    │       ▼
    │   ┌──────────────────────────┐
    │   │Backup & Restore Modal    │
    │   └──────────────────────────┘
    │       │
    │       ├─ View "Your Backups" List
    │       │   └─ See existing backups
    │       │       (dates, times, "days ago")
    │       │
    │       ▼
    │   ┌──────────────────────────┐
    │   │Tap "Create New Backup"   │
    │   └──────────────────────────┘
    │       │
    │       ├─ Loading shown
    │       │
    │       ├─ Fetch all data
    │       │   (records, accounts, categories, budgets)
    │       │
    │       ├─ Create backup JSON
    │       │
    │       ├─ Upload to Supabase Storage
    │       │
    │       ├─ Store in user-specific folder
    │       │
    │       ▼
    │   ┌──────────────────────────┐
    │   │Show "Success" Alert      │
    │   │"Backup created..."       │
    │   └──────────────────────────┘
    │       │
    │       ▼
    │   Refresh Backup List
    │   └─ New backup appears at top
    │
    └─ To Restore Later:
        │
        ├─ Open Backup & Restore
        │       │
        │       ▼
        │   ┌─────────────────────────┐
        │   │See Backup in List       │
        │   │Tap Restore Button       │
        │   └─────────────────────────┘
        │       │
        │       ▼
        │   Download Backup
        │   Validate Structure
        │       │
        │       ▼
        │   ┌─────────────────────────┐
        │   │Show Confirmation Dialog │
        │   │"This will REPLACE       │
        │   │ all current data..."    │
        │   └─────────────────────────┘
        │       │
        │       ├─ Tap Cancel
        │       │   └─ Back to list
        │       │
        │       └─ Tap Restore
        │           │
        │           ▼
        │       Replace All Data
        │       with Backup Data
        │           │
        │           ▼
        │       Refresh App
        │           │
        │           ▼
        │       ┌──────────────────┐
        │       │"Restore Complete"│
        │       │All data restored │
        │       └──────────────────┘
        │
        └─ All data now restored from backup
```

---

## 6. API Call Sequence Diagram

### Export Sequence

```
User Interface
    │
    └─ handleExport()
       │
       ├─ Call exportRecordsToCSV(options)
       │   │
       │   ├─ supabase.from('records')
       │   │   .select('*, accounts(*), categories(*)')
       │   │   │
       │   │   ▼
       │   │ Returns: [records with joined data]
       │   │
       │   ├─ Filter by dateFrom, dateTo
       │   │
       │   ├─ Filter by categories, accounts, types
       │   │
       │   ├─ Transform to CsvRecord[]
       │   │
       │   ├─ Papa.unparse(csvRecords)
       │   │   │
       │   │   ▼
       │   │ Returns: CSV string
       │   │
       │   ├─ Buffer.from(csv).toString('base64')
       │   │   │
       │   │   ▼
       │   │ Returns: Base64 string
       │   │
       │   ├─ getExportSummary(csvRecords)
       │   │   │
       │   │   ▼
       │   │ Returns: Statistics object
       │   │
       │   └─ Return ExportResult
       │       │
       │       ▼
       │   {
       │     filename,
       │     csv,
       │     csvBase64,
       │     summary
       │   }
       │
       └─ Display preview and share options
```

### Backup Sequence

```
User Interface
    │
    ├─ handleCreateBackup()
    │   │
    │   ├─ Call createBackup(userId)
    │   │   │
    │   │   ├─ readRecords() → Array
    │   │   ├─ readAccounts() → Array
    │   │   ├─ readCategories() → Array
    │   │   ├─ readBudgets() → Array
    │   │   │
    │   │   └─ Return BackupData object
    │   │
    │   ├─ Call uploadBackupToStorage(backup, userId)
    │   │   │
    │   │   ├─ JSON.stringify(backup)
    │   │   │
    │   │   ├─ Create Blob from JSON
    │   │   │
    │   │   ├─ supabase.storage
    │   │   │   .from('user-backups')
    │   │   │   .upload(
    │   │   │     `${userId}/backup-${timestamp}.mbak`,
    │   │   │     blob
    │   │   │   )
    │   │   │   │
    │   │   │   ▼
    │   │   │ File uploaded to Supabase
    │   │   │ Encrypted at rest
    │   │   │
    │   │   └─ Return: file path
    │   │
    │   └─ Show success message
    │
    ├─ handleRestoreBackup()
    │   │
    │   ├─ Call downloadBackup(userId, backupName)
    │   │   │
    │   │   ├─ supabase.storage
    │   │   │   .from('user-backups')
    │   │   │   .download(`${userId}/${backupName}.mbak`)
    │   │   │   │
    │   │   │   ▼
    │   │   │ File downloaded from Supabase
    │   │   │
    │   │   ├─ data.text() → JSON string
    │   │   │
    │   │   ├─ JSON.parse() → BackupData
    │   │   │
    │   │   └─ Return: BackupData object
    │   │
    │   ├─ Call validateBackup(backup)
    │   │   │
    │   │   ├─ Check version field
    │   │   ├─ Check createdAt field
    │   │   ├─ Check array fields
    │   │   ├─ Check metadata
    │   │   │
    │   │   └─ Return: { valid, errors }
    │   │
    │   ├─ If valid:
    │   │   └─ Show confirmation dialog
    │   │
    │   └─ If confirmed:
    │       └─ Replace all data with backup
    │
    └─ handleDeleteBackup()
        │
        ├─ supabase.storage
        │   .from('user-backups')
        │   .remove([`${userId}/${backupName}.mbak`])
        │   │
        │   ▼
        │ File deleted from Supabase
        │
        └─ Show success message
```

---

## 7. Error Handling Flow

```
Operation Started
    │
    ▼
Try-Catch Block
    │
    ├─ Success Path
    │   │
    │   ├─ Perform operation
    │   │
    │   ▼
    │   Success Result
    │   └─ Display success message
    │
    └─ Error Path
        │
        ├─ Catch error
        │
        ├─ Log error to console
        │
        ├─ Type check error
        │
        ├─────────────────────────────────┐
        │                                 │
        ▼                                 ▼
    Network Error              Validation Error
    (No internet)              (Invalid data)
        │                              │
        ├─ Show: "Check internet"      ├─ Show: Specific error
        │                              │
        ├─ Suggest: "Retry"            ├─ Suggest: Fix input
        │                              │
        └─ Enable: Retry button        └─ Enable: Back button
                                           
    ┌─────────────────────────────────┬──────────────────────┐
    │                                 │                      │
    ▼                                 ▼                      ▼
Storage Error                   Auth Error           Unknown Error
(No quota, perms)               (Not logged in)      (Unexpected)
    │                                 │                      │
    ├─ Show: "Storage full"           ├─ Show: "Reauth"     ├─ Show: "Try again"
    │                                 │                      │
    ├─ Suggest: "Delete old"          ├─ Suggest: "Login"   ├─ Suggest: "Report"
    │                                 │                      │
    └─ Enable: Cleanup button         └─ Enable: Login btn  └─ Enable: Support link

All paths:
    │
    ▼
Alert Dialog Shown
    │
    ├─ Error title
    ├─ Error description
    ├─ Action button(s)
    │
    └─ Dismiss and continue
```

---

## 8. State Management Flow

```
Preferences Component
    │
    ├─ State Variables:
    │   ├─ theme
    │   ├─ uiMode
    │   ├─ currencySign
    │   └─ ... (other preferences)
    │
    └─ Navigation to Features
        │
        ├─────────────────────────────────────────┐
        │                                         │
        ▼                                         ▼
Export Records Modal                 Backup & Restore Modal
        │                                         │
    ├─ dateFrom (State)                      ├─ backups (State)
    ├─ dateTo (State)                        ├─ loading (State)
    ├─ loading (State)                       ├─ creatingBackup (State)
    ├─ exportData (State)                    ├─ selectedBackup (State)
    └─ showPreview (State)                   ├─ showRestoreConfirm (State)
        │                                     └─ restoreLoading (State)
        │                                         │
        ├─ On Mount:                            ├─ On Mount:
        │   └─ N/A                              │   ├─ Call loadBackups()
        │                                       │   └─ Fetch backup list
        │
        ├─ On Date Change:                      ├─ On Create:
        │   └─ Update state                     │   ├─ setCreatingBackup(true)
        │                                       │   ├─ Call createBackup()
        │
        ├─ On Export Click:                     ├─ On List Response:
        │   ├─ setLoading(true)                 │   └─ setBackups(data)
        │   ├─ Call exportRecordsToCSV()        │
        │   └─ setLoading(false)                ├─ On Restore Click:
        │                                       │   ├─ Call downloadBackup()
        │                                       │   ├─ Validate backup
        │                                       │   └─ Show confirm dialog
        │
        └─ On Share Click:                      └─ On Restore Confirm:
            └─ Call shareCSVFile()                  └─ Restore data

Each component maintains its own local state
Updates don't affect other features
Error states are isolated
Loading states per operation
```

---

**Diagram Summary**
- **Architecture**: System-wide component and module layout
- **Data Flows**: Step-by-step data processing paths
- **Data Structures**: JSON/CSV format specifications
- **User Journeys**: Complete user workflows
- **API Sequences**: Function call sequences
- **Error Handling**: Error management logic
- **State Management**: Component state lifecycle

All diagrams show the complete flow from user interaction to backend storage.

---

**Last Updated**: January 2025  
**Version**: 1.0.0
