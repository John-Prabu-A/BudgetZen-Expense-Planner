# Export & Backup Features - Quick Reference

## 🚀 Quick Start

### Access Features
1. Open **Preferences** from the app
2. Scroll to **Data Management** section
3. Choose:
   - **Export Records** - Download as CSV
   - **Backup & Restore** - Cloud backup management

---

## 📊 Export Records (CSV)

### When to Use
- ✅ Share data with others
- ✅ Import to Excel/Google Sheets
- ✅ Archive data for external storage
- ✅ Data analysis in other tools

### What You Get
- CSV file with records data
- Date, Type, Amount, Category, Account, Notes
- Export summary with statistics
- Preview before download

### How to Export
1. Tap **Export Records** in Preferences
2. Select **From Date** and **To Date**
3. Tap **Generate Export**
4. Review **Preview** modal
5. Tap **Share** to send/save

### Export Format Example
```
date,type,amount,category,account,notes
2025-01-15,INCOME,50000,Salary,Savings Account,Monthly salary
2025-01-14,EXPENSE,1200,Housing,Credit Card,Rent payment
2025-01-13,EXPENSE,500,Food,Cash,Groceries
```

---

## 💾 Backup & Restore

### When to Use
- ✅ Protect all your data
- ✅ Regular backup schedule
- ✅ Disaster recovery
- ✅ App reinstall preparation
- ✅ Device switching

### What Gets Backed Up
- ✅ All Financial Records
- ✅ Accounts & Categories
- ✅ Budget Configurations
- ✅ Timestamps & Metadata

### Backup Storage
- **Location**: Secure Supabase Cloud
- **Access**: Only you can access your backups
- **Encryption**: Encrypted at rest
- **Format**: `.mbak` (JSON-based)

### How to Create Backup
1. Tap **Backup & Restore** in Preferences
2. Tap **Create New Backup** (green button)
3. Wait for upload to complete
4. See backup in "Your Backups" list

### How to Restore Backup
1. Tap **Backup & Restore** in Preferences
2. Find backup in "Your Backups" list
3. Tap the **Restore** button (blue arrow icon)
4. Read warning carefully
5. Confirm restoration
6. App will refresh with restored data

### How to Delete Backup
1. Tap **Backup & Restore** in Preferences
2. Find backup in "Your Backups" list
3. Tap **Delete** button (trash icon)
4. Confirm deletion
5. Backup is permanently removed

---

## 📋 Comparison: Export vs Backup

| Feature | Export (CSV) | Backup (MBAK) |
|---------|------------|-----------|
| Format | CSV (Spreadsheet) | JSON (Complete) |
| Restorable | ❌ No | ✅ Yes |
| Storage | Local File | Cloud (Supabase) |
| Includes Records | ✅ Yes | ✅ Yes |
| Includes Accounts | ❌ No | ✅ Yes |
| Includes Categories | ❌ No | ✅ Yes |
| Includes Budgets | ❌ No | ✅ Yes |
| External Use | ✅ Yes | ❌ No |
| Data Size | Small | Large |
| Best For | Sharing, Analysis | Protection, Recovery |

---

## 🎯 Common Use Cases

### Scenario 1: Monthly Financial Review
1. Export records for the month
2. Import to Excel for analysis
3. Create charts and reports

### Scenario 2: Data Safety
1. Create backup weekly
2. Store multiple versions
3. Restore if needed

### Scenario 3: Switching Devices
1. Create backup on old device
2. Download app on new device
3. Restore backup on new device
4. All data transferred!

### Scenario 4: Sharing with Accountant
1. Export records for specific period
2. Send CSV file
3. Accountant can review in spreadsheet

---

## ⚙️ Settings & Preferences

### Backup Preferences
- Auto-backup: Consider enabling (future feature)
- Backup frequency: Adjust schedule (future feature)
- Retention policy: How long to keep backups (future feature)

### Export Preferences
- Default date range: Set preferred range (future feature)
- Export format: Choose CSV, Excel, PDF (future feature)
- Filters: Save favorite filter combinations (future feature)

---

## 🔒 Security & Privacy

### Your Data is Safe Because:
- 🔐 Encrypted storage (Supabase)
- 👤 Only you can access your data
- 🌐 HTTPS secure connection
- 🔑 Authentication required
- 📝 No third-party access

### Best Practices:
- ✅ Create regular backups
- ✅ Keep passcode enabled
- ✅ Don't share backup files
- ✅ Verify restoration works
- ✅ Delete old backups

---

## ⚠️ Important Notes

### Before Restoring Backup
- ⚠️ Current data will be REPLACED
- ⚠️ Cannot be undone
- ⚠️ Make backup of current data first
- ⚠️ Verify backup date and contents

### File Limits
- Maximum file size: Depends on Supabase plan
- Backup history: Keep recent backups
- Storage quota: Monitor available space

---

## 📞 Troubleshooting

### Export Issues

**Q: No records appear in export?**
- A: Check date range, ensure records exist in selected period
- A: Verify filters aren't excluding all records

**Q: CSV file won't open in Excel?**
- A: Try opening with "Data > From Text/CSV"
- A: Ensure file has `.csv` extension

**Q: Can't share file?**
- A: Check device sharing is enabled
- A: Try saving to device instead

### Backup Issues

**Q: Backup won't upload?**
- A: Check internet connection
- A: Verify Supabase is accessible
- A: Check storage quota

**Q: Backup restore failed?**
- A: Ensure backup is valid and not corrupted
- A: Check user authentication
- A: Try downloading backup again

**Q: Can't see recent backup?**
- A: Refresh backup list
- A: Check if upload completed
- A: Verify user account

---

## 📊 Export Statistics

When you export, you'll see:
- **Total Records**: Number of records exported
- **Total Income**: Sum of all income transactions
- **Total Expense**: Sum of all expense transactions
- **Net Balance**: Income minus Expenses
- **Categories**: Number of unique categories used
- **Accounts**: Number of unique accounts included

Example:
```
Total Records: 147
Total Income: ₹450,000
Total Expense: ₹280,000
Net Balance: ₹170,000
Categories: 12
Accounts: 3
```

---

## 🎓 Tips & Tricks

### 💡 Tip 1: Export by Category
1. In export modal, select specific categories
2. Export only records from those categories
3. Perfect for category-specific analysis

### 💡 Tip 2: Regular Backup Schedule
1. Create backup every Sunday
2. Keep at least 4-5 recent backups
3. Delete very old backups to save space

### 💡 Tip 3: Year-End Archive
1. Export entire year at once
2. Save locally for tax/accounting
3. Create final backup before new year

### 💡 Tip 4: Verify Restoration
1. After restore, check data looks correct
2. Verify account balances match
3. Spot-check recent records

---

## 📱 Mobile-Specific Notes

### iPhone Users
- CSV files open in Files app or Mail
- Backups stored on Supabase (not on device)
- No local storage needed for backups

### Android Users
- CSV files save to Downloads
- Use spreadsheet app to view
- Backups stored on Supabase (not on device)

---

## 🔄 Data Flow

### Export Process
```
Records in App
    ↓
Filter by date range & criteria
    ↓
Convert to CSV format
    ↓
Generate preview & statistics
    ↓
Share or save CSV file
```

### Backup Process
```
All App Data (Records, Accounts, Categories, Budgets)
    ↓
Create JSON backup object
    ↓
Add metadata & timestamp
    ↓
Upload to Supabase Cloud
    ↓
Store in user-specific folder
```

### Restore Process
```
Select backup from list
    ↓
Download from Supabase
    ↓
Validate backup structure
    ↓
Show confirmation dialog
    ↓
Replace current data
    ↓
Refresh all views
```

---

## 🆘 Need Help?

### Check These First
1. ✅ Internet connection is stable
2. ✅ User is logged in
3. ✅ Data exists for export
4. ✅ Sufficient storage space
5. ✅ Recent app version

### Common Solutions
- Restart the app
- Check internet connection
- Clear app cache
- Update to latest version
- Contact support if persists

---

## 📅 Recommended Schedule

### Weekly
- ✅ Create backup (Sunday evening)
- ✅ Verify backup succeeded

### Monthly
- ✅ Export records for review
- ✅ Check backup history
- ✅ Delete very old backups

### Quarterly
- ✅ Create full archive backup
- ✅ Save copy externally
- ✅ Review data integrity

### Annually
- ✅ Archive complete year
- ✅ Create final backup
- ✅ Review retention policy

---

**Quick Links:**
- 📖 [Full Documentation](./EXPORT_BACKUP_GUIDE.md)
- 🔧 [Implementation Details](./EXPORT_BACKUP_GUIDE.md#implementation-details)
- ⚙️ [API Reference](./EXPORT_BACKUP_GUIDE.md#api-reference)
- 🧪 [Testing Checklist](./EXPORT_BACKUP_GUIDE.md#testing-checklist)

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready
