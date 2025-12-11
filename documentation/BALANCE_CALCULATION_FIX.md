# Balance Calculation Fix - Complete Solution

## Problem
After removing the `initial_balance` input field from the UI, users had no way to set starting account balances. This meant:
- New accounts always started at 0
- Users couldn't record existing account balances
- Transfers would show correct changes, but starting amounts were missing

**Example Test Case:**
- Create Account 1, add 1000 as starting balance
- Create Account 2, add 500 as starting balance  
- Transfer 200 from Account 1 to Account 2
- Expected: Account 1 = 800, Account 2 = 700
- Actual (before fix): Account 1 = -200, Account 2 = 200 (because starting balances weren't captured)

## Root Cause
The balance formula was:
```
Balance = Income - Expense + (Transfers In - Transfers Out)
```

This formula correctly calculates the NET change from transactions, but it doesn't include the starting balance. Without an initial_balance field being populated, accounts always started at 0.

## Solution
1. **Restored the Initial Balance Input Field** in `add-account-modal.tsx`:
   - Added a new state: `initialBalance`
   - Added input field labeled "Starting Balance (Optional)"
   - Passes `parseFloat(initialBalance) || 0` to `createAccount()`

2. **Updated Balance Formula** in both files:

   **In `accounts.tsx` (line 66-90):**
   ```typescript
   const initialBalance = account?.initial_balance || 0;
   const balance = initialBalance + income - expense + (transfersIn - transfersOut);
   ```

   **In `analysis.tsx` (line 108-137):**
   ```typescript
   const initialBalance = account?.initial_balance || 0;
   const currentBalance = initialBalance + monthlyNet;
   ```

3. **Formula is now:**
   ```
   Balance = Initial Balance + Income - Expense + (Transfers In - Transfers Out)
   ```

## Files Modified
1. `app/(modal)/add-account-modal.tsx`
   - Added `initialBalance` state
   - Added input field for Starting Balance
   - Passes value to createAccount

2. `app/(tabs)/accounts.tsx`
   - Updated calculateAccountBalance to include initial_balance in formula

3. `app/(tabs)/analysis.tsx`
   - Updated accountAnalysisData to include initial_balance in calculation

## How It Works Now
1. User creates a new account
2. User can optionally enter a Starting Balance (e.g., 5000)
3. Account starts with that balance in the database
4. All income/expense/transfer transactions modify the balance from that starting point
5. Balance is always: Starting Balance + (All Transactions Since)

## Testing
Test with the scenario:
1. Create Account 1 with Starting Balance = 1000
2. Create Account 2 with Starting Balance = 500
3. Transfer 200 from Account 1 → Account 2
4. Check Accounts tab: Account 1 should show 800, Account 2 should show 700
5. Check Analysis page: Same balances should appear in the chart

## Benefits
- ✅ Users can set realistic starting balances
- ✅ Transfers work correctly
- ✅ Balance formula is consistent across all views
- ✅ No breaking changes to database schema
- ✅ Simple and intuitive for users
