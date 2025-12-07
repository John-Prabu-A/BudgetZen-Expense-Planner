# Transfer Implementation Guide

## Overview
This document describes how transfers are handled in BudgetZen. Transfers are special transactions that move money from one account to another without affecting income or expense calculations.

## Key Concepts

### What is a Transfer?
A transfer is a transaction that moves funds between two accounts:
- **Source Account**: The account money is transferred FROM
- **Destination Account**: The account money is transferred TO
- **No Category**: Transfers don't use categories (they're not income/expense)
- **No Impact on Budget**: Transfers don't affect budget calculations

### Database Schema Updates

The `records` table now includes:
```sql
to_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE -- For transfers only
transfer_group_id UUID -- Links paired transfer records
```

## How Transfers Work

### Creating a Transfer

1. **User selects TRANSFER type** in the Add Record Modal
   - Category selector is hidden
   - "To Account" selector appears

2. **User enters amount** using the keypad
   - Amount must be valid and non-zero

3. **User selects source account** (From Account)
   - This is the account money leaves from

4. **User selects destination account** (To Account)
   - This is the account money goes to
   - Cannot be the same as the source account

5. **Backend Processing**
   - When `createRecord` is called with `type: 'transfer'`:
     - A `transfer_group_id` is generated (timestamp + random)
     - **Two records are created**:
       - **Record 1**: Source account record
         - `account_id`: source account
         - `to_account_id`: destination account
         - `type`: 'transfer'
         - `transfer_group_id`: linking ID
       - **Record 2**: Destination account record
         - `account_id`: destination account
         - `to_account_id`: source account (for reference)
         - `type`: 'transfer'
         - `transfer_group_id`: same linking ID

### Why Two Records?

Each account needs to see the transfer:
- **Source Account**: Shows the money went OUT
- **Destination Account**: Shows the money came IN

The `transfer_group_id` links them together so:
- Editing one updates both
- Deleting one deletes both (atomic operation)

### Editing a Transfer

1. User can edit the amount, date, or notes
2. Backend finds the `transfer_group_id`
3. Updates **both** records simultaneously
4. Maintains consistency across both accounts

### Deleting a Transfer

1. User initiates delete on any transfer record
2. Backend finds the `transfer_group_id`
3. Deletes **both** linked records
4. Maintains consistency (no orphaned records)

## Frontend Implementation

### Add Record Modal Changes

**Hidden when TRANSFER selected:**
- Category selector (transfers don't use categories)

**Shown when TRANSFER selected:**
- "From Account" selector (renamed from "Account")
- "To Account" selector

**Modal Types:**
- `'ACCOUNT'`: For selecting source account
- `'TO_ACCOUNT'`: For selecting destination account
- `'CATEGORY'`: For selecting category (income/expense only)

### Validation Rules

```typescript
// Must have a valid amount
if (!amount || parseFloat(amount) === 0) return error

// Must select source account (always)
if (!selectedAccount) return error

// Must select category (for income/expense only)
if (recordType !== 'TRANSFER' && !selectedCategory) return error

// Must select destination account (for transfers only)
if (recordType === 'TRANSFER' && !selectedToAccount) return error

// Cannot transfer to same account
if (recordType === 'TRANSFER' && selectedAccount.id === selectedToAccount.id) return error
```

## Backend Implementation (finance.js)

### createRecord Function
```javascript
if (recordData.type === 'transfer' && recordData.to_account_id) {
  // Generate transfer group ID
  const transferGroupId = `transfer_${Date.now()}_${randomId}`;
  
  // Create source record
  const sourceRecord = { account_id, type: 'transfer', transfer_group_id };
  
  // Create destination record
  const destRecord = { account_id: to_account_id, type: 'transfer', transfer_group_id };
  
  // Insert both
  const source = await supabase.from('records').insert(sourceRecord);
  const dest = await supabase.from('records').insert(destRecord);
  
  return source[0];
}
```

### updateRecord Function
```javascript
if (updatedData.type === 'transfer') {
  // Find original transfer group
  const originalRecord = await supabase.from('records')
    .select('transfer_group_id')
    .eq('id', id)
    .single();
  
  // Find both linked records
  const linkedRecords = await supabase.from('records')
    .select('*')
    .eq('transfer_group_id', originalRecord.transfer_group_id);
  
  // Update both records with new data
  await update(recordId1, newData);
  await update(recordId2, newData);
}
```

### deleteRecord Function
```javascript
const record = await supabase.from('records')
  .select('transfer_group_id, type')
  .eq('id', id)
  .single();

if (record.type === 'transfer' && record.transfer_group_id) {
  // Delete all records with this transfer_group_id
  await supabase.from('records')
    .delete()
    .eq('transfer_group_id', record.transfer_group_id);
}
```

### readRecords Function
```javascript
// Updated query to include destination account
const { data } = await supabase.from('records')
  .select('*, accounts(*), categories(*), to_account:to_account_id(id, name)');
```

## Display in Other Components

### Important Notes for Display

When displaying records:
- **Transfers should be marked distinctly** (purple color from theme: `colors.transfer`)
- **Show both accounts**: "From Account → To Account"
- **No category** should be displayed for transfers
- **Don't count in budgets**: Filter out transfers when calculating budget spending
- **Show in transaction list**: Users should see all transfers they make

### Example Query in Records Screen
```typescript
// Exclude transfers from budget calculations
const expenseRecords = records.filter(r => r.type.toLowerCase() === 'expense');
const incomeRecords = records.filter(r => r.type.toLowerCase() === 'income');

// Include transfers in transaction list (for auditing)
const allTransactions = records; // includes transfers
```

## Account Balance Calculations

### Logic
- **Expense**: Balance decreases
- **Income**: Balance increases
- **Transfer**: 
  - From Account: Balance decreases
  - To Account: Balance increases

### Implementation Example
```typescript
let balance = account.initial_balance;

records.forEach(record => {
  if (record.account_id === account.id) {
    if (record.type === 'expense' || 
        (record.type === 'transfer' && record.account_id === accountId)) {
      balance -= record.amount;
    } else if (record.type === 'income' || 
               (record.type === 'transfer' && record.to_account_id === accountId)) {
      balance += record.amount;
    }
  }
});

return balance;
```

## Edge Cases & Validation

### Cannot Transfer
- ❌ To the same account
- ❌ With zero amount
- ❌ Without selecting both accounts
- ❌ Between accounts of different currencies (future: if multi-currency supported)

### Atomic Operations
- ✅ Create transfer: both records created or none
- ✅ Update transfer: both records updated or none
- ✅ Delete transfer: both records deleted or none

## Testing Checklist

- [ ] Create transfer between two accounts
- [ ] Verify two records created with same `transfer_group_id`
- [ ] Edit transfer and verify both records update
- [ ] Delete transfer and verify both records deleted
- [ ] View transfer in transaction list
- [ ] Verify account balances correct after transfer
- [ ] Test validation (same account, zero amount, missing fields)
- [ ] Edit existing record of different types
- [ ] Verify category hidden when TRANSFER selected
- [ ] Verify "To Account" shown only for transfers

## Future Enhancements

1. **Transfer Templates**: Save common transfers
2. **Scheduled Transfers**: Recurring transfers between accounts
3. **Multi-currency Transfers**: Convert between different currencies
4. **Transfer Reports**: Separate transfer analytics
5. **Bulk Transfers**: Move amounts between multiple accounts
6. **Transfer Notes**: Special fields for transfer metadata
