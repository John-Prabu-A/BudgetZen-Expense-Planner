# Transfer Feature - Quick Reference & Migration Guide

## 🚀 Quick Start for Implementation

### Step 1: Database Migration
Run the updated SQL schema (`lib/finance.sql`) on your Supabase database:

```sql
-- Add new columns to existing records table
ALTER TABLE records ADD COLUMN to_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE records ADD COLUMN transfer_group_id UUID;

-- Create index for performance
CREATE INDEX idx_transfer_group_id ON records(transfer_group_id);
```

### Step 2: Backend Updates
The `lib/finance.js` file has been updated with:
- ✅ `createRecord()` - Creates dual records for transfers
- ✅ `updateRecord()` - Updates both linked records
- ✅ `deleteRecord()` - Deletes both linked records atomically
- ✅ `readRecords()` - Includes destination account data

### Step 3: Frontend Updates
The `app/(modal)/add-record-modal.tsx` has been updated with:
- ✅ Transfer destination account selection
- ✅ Hidden category selector for transfers
- ✅ Proper validation for all record types
- ✅ Improved modal for account/category selection

---

## 🔍 Key Implementation Details

### How Transfers Work

```
User creates transfer: Checking → Savings ($500)
                            ↓
                    Backend processing:
                            ↓
            transfer_group_id = "transfer_1734159600000_abc123"
                            ↓
        Creates TWO records with same transfer_group_id:
            ↓                                    ↓
    Record 1 (Checking)                 Record 2 (Savings)
    - account_id: checking              - account_id: savings
    - to_account_id: savings            - to_account_id: checking
    - amount: 500                       - amount: 500
    - type: transfer                    - type: transfer
    - transfer_group_id: xxx            - transfer_group_id: xxx
            ↓                                    ↓
    Debit from Checking                 Credit to Savings
```

### Transfer Group ID Benefits
- **Edit**: Update both records when amount/date changes
- **Delete**: Remove both records together (no orphans)
- **Query**: Find all transfers between specific accounts
- **Audit**: Track bidirectional transfer data

---

## 📊 State Management (Modal Component)

### Before (INCOME/EXPENSE only)
```typescript
[selectedAccount]
[selectedCategory]
[recordType] → INCOME | EXPENSE
```

### After (+ TRANSFER support)
```typescript
[selectedAccount]        // Source account (all types)
[selectedCategory]       // For INCOME/EXPENSE only
[selectedToAccount]      // For TRANSFER only
[recordType]            // INCOME | EXPENSE | TRANSFER
[modalType]             // ACCOUNT | TO_ACCOUNT | CATEGORY
```

---

## 🎨 UI/UX Changes

### When TRANSFER Selected:
```
✅ Hidden:
   └─ Category Selector

✅ Shown:
   ├─ "From Account" (instead of "Account")
   └─ "To Account" (new selector)

✅ Labels Update:
   └─ Account selector becomes "From Account"
```

### When INCOME/EXPENSE Selected:
```
✅ Hidden:
   └─ "To Account" selector

✅ Shown:
   ├─ "Account" selector
   └─ Category selector
```

---

## 🧪 Testing Transfer Flow

### Create Transfer
```
1. Open Add Record Modal
2. Click "TRANSFER" button
3. Enter amount: 500
4. Select "From Account": Checking
5. Select "To Account": Savings
6. Add notes (optional): "Monthly savings"
7. Click SAVE
```

**Expected Result:**
```
✅ Two records created with same transfer_group_id
✅ Checking balance: -500
✅ Savings balance: +500
✅ Modal closes, redirect to home
```

### Edit Transfer
```
1. Navigate to transaction
2. Long press or select transfer record
3. Change amount to 600
4. Click SAVE
```

**Expected Result:**
```
✅ Both linked records updated to 600
✅ Checking balance: -600
✅ Savings balance: +600
```

### Delete Transfer
```
1. Navigate to transaction
2. Long press or select transfer record
3. Click DELETE
```

**Expected Result:**
```
✅ Both linked records deleted
✅ No orphaned records remain
✅ Balances reset
```

---

## 🛡️ Validation Rules

```typescript
// Amount validation (all types)
if (!amount || parseFloat(amount) === 0) 
  → Error: "Enter a valid amount"

// Account selection (all types)
if (!selectedAccount) 
  → Error: "Select an account"

// Category (INCOME/EXPENSE only)
if (recordType !== 'TRANSFER' && !selectedCategory) 
  → Error: "Select a category"

// Destination account (TRANSFER only)
if (recordType === 'TRANSFER' && !selectedToAccount) 
  → Error: "Select destination account"

// Same account check (TRANSFER only)
if (recordType === 'TRANSFER' && selectedAccount.id === selectedToAccount.id) 
  → Error: "Cannot transfer to the same account"
```

---

## 📈 Budget Calculation Rules

### Income Calculation
```typescript
const income = records
  .filter(r => r.type === 'INCOME')
  .reduce((sum, r) => sum + r.amount, 0);
```

### Expense Calculation
```typescript
const expense = records
  .filter(r => r.type === 'EXPENSE')
  .reduce((sum, r) => sum + r.amount, 0);
```

### Transfer Handling
```typescript
// Transfers should NOT be included in budget calculations
const budgetRecords = records.filter(r => r.type !== 'TRANSFER');

// But they should appear in transaction history
const allRecords = records; // includes transfers
```

---

## 🔗 Integration Points

### Other Components That Need Updates

#### 1. **Records/Transactions Screen**
- Show transfer icon and label
- Display "From Account → To Account"
- Use transfer color from theme

#### 2. **Account Details Screen**
- Show all transfers in/out of that account
- Calculate impact on balance correctly

#### 3. **Budget Analysis**
- Exclude transfers from spending calculations
- Treat as separate transaction type

#### 4. **Data Export (CSV)**
- Include transfer records
- Show both linked records or just source
- Document transfer format

#### 5. **Search/Filter**
- Allow filtering by transfer type
- Search by account name

---

## 🐛 Common Issues & Solutions

### Issue 1: Transfer appears twice in list
**Solution**: This is CORRECT behavior
- User sees both perspective records
- One from each account
- Both are linked by transfer_group_id

### Issue 2: Orphaned transfer records after edit
**Solution**: Use transfer_group_id to update both
```javascript
const linkedRecords = await supabase
  .from('records')
  .select('*')
  .eq('transfer_group_id', transferGroupId);
  
// Update ALL records with this group_id
```

### Issue 3: Wrong account balance after transfer
**Solution**: Check balance calculation logic
```javascript
// Account balance should include:
let balance = initialBalance;

records.forEach(r => {
  if (r.account_id === accountId && r.type === 'EXPENSE') balance -= r.amount;
  if (r.account_id === accountId && r.type === 'INCOME') balance += r.amount;
  if (r.account_id === accountId && r.type === 'TRANSFER') balance -= r.amount;
  if (r.to_account_id === accountId && r.type === 'TRANSFER') balance += r.amount;
});
```

### Issue 4: Can't delete transfer
**Solution**: Delete by transfer_group_id
```javascript
const { transfer_group_id } = record;
await supabase
  .from('records')
  .delete()
  .eq('transfer_group_id', transfer_group_id);
```

---

## 📋 Checklist: Before Going Live

### Database
- [ ] Added `to_account_id` column to records
- [ ] Added `transfer_group_id` column to records
- [ ] Created index on transfer_group_id
- [ ] RLS policies updated if needed

### Backend
- [ ] `createRecord()` creates dual records for transfers
- [ ] `updateRecord()` updates both linked records
- [ ] `deleteRecord()` removes both linked records
- [ ] `readRecords()` includes to_account data
- [ ] Error handling for transfer operations

### Frontend
- [ ] Category hidden when TRANSFER selected
- [ ] "To Account" selector shown for transfers
- [ ] Validation prevents same-account transfers
- [ ] Modal handles TO_ACCOUNT selection
- [ ] UI labels update correctly

### Testing
- [ ] Create income/expense records (existing functionality)
- [ ] Create transfer records (new functionality)
- [ ] Edit transfer records (new functionality)
- [ ] Delete transfer records (new functionality)
- [ ] Verify account balances after transfer
- [ ] Test all validation rules
- [ ] Test modal interactions

### Documentation
- [ ] Update other components to handle transfers
- [ ] Update balance calculation logic
- [ ] Update budget calculation (exclude transfers)
- [ ] Update display rules (transfer color/icon)

---

## 🔗 File Changes Summary

| File | Change | Impact |
|------|--------|--------|
| `lib/finance.sql` | Add 2 columns | Database schema |
| `lib/finance.js` | Update 4 functions | Backend transfer logic |
| `app/(modal)/add-record-modal.tsx` | Add state + UI | Frontend modal |
| (Other screens) | TBD | Display updates needed |

---

## 💡 Pro Tips

1. **Use transfer_group_id**: Always query/update/delete using this for transfers
2. **Atomic Operations**: Always update/delete both records together
3. **Balance Calculation**: Include transfers in account balance logic
4. **Budget Exclusion**: Exclude transfers from budget/spending calculations
5. **Display**: Show transfers distinctly from income/expense

---

## 📞 Support Notes

### For Future Developers
- Transfer logic creates TWO records (one per account perspective)
- They're linked by `transfer_group_id` for atomicity
- Always treat transfer operations as pair operations
- Never update/delete just one half of a transfer

### API Contract
```typescript
// Create transfer
POST /records
{
  type: "transfer",
  account_id: "uuid",      // Source
  to_account_id: "uuid",   // Destination
  amount: 500,
  notes: "optional"
}

// Response includes: transfer_group_id
```

---

