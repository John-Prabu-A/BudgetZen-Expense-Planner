# 🧪 Complete Debugging & Testing Guide - Type Lock Issue

## Step-by-Step Testing Instructions

### Prerequisites
- App should be running on simulator/device
- Open terminal/console (Chrome DevTools for web, or Expo CLI output)
- Have the app ready to test

---

## Phase 1: Initial Mount Testing

### Test Case 1.1: Press Income Button
**Steps**:
1. Open Records screen
2. Tap "+" button (FAB)
3. **Tap "Income" button**
4. Look at console output

**Expected Console Output** (in order):
```
🔵 [INIT] params.type: income
🔵 [INIT] rawType: income
🔵 [INIT] initialTypeFromFAB: INCOME
🔵 [INIT] shouldLockType: true
🟢 [STATE] recordType: INCOME
🟢 [STATE] typeLockFlag: true
🟡 [EFFECT-SYNC-TYPE] Running: initialTypeFromFAB= INCOME typeLockFlag= true
🟡 [EFFECT-SYNC-TYPE] Condition not met. initialTypeFromFAB: INCOME !typeLockFlag: false
📊 [TRACK] recordType changed to: INCOME typeLockFlag: true
🔒 [TRACK] typeLockFlag changed to: true
```

**What This Means**:
- ✅ Type param correctly parsed from URL
- ✅ initialTypeFromFAB is INCOME
- ✅ recordType initialized to INCOME
- ✅ typeLockFlag initialized to true
- ✅ Type lock effect ran but skipped (already locked)

**If You See Different Output**: ❌ PROBLEM FOUND
- If `params.type` is empty → Issue with FAB button not passing param
- If `initialTypeFromFAB` is null → Issue with type parsing
- If `typeLockFlag` is false → Issue with lock initialization

---

### Test Case 1.2: Press Expense Button
**Steps**:
1. Close the modal
2. Tap "+" button again
3. **Tap "Expense" button**
4. Look at console output

**Expected Console Output**:
```
🔵 [INIT] params.type: expense
🔵 [INIT] rawType: expense
🔵 [INIT] initialTypeFromFAB: EXPENSE
🔵 [INIT] shouldLockType: true
🟢 [STATE] recordType: EXPENSE
🟢 [STATE] typeLockFlag: true
```

**Verify**: Should show EXPENSE, not INCOME

---

## Phase 2: UI Verification

### Test Case 2.1: Visual Confirmation - Income
**Steps**:
1. Press Income button
2. Look at the screen

**Visual Checks**:
- [ ] Type tabs are NOT visible (should show locked badge instead)
- [ ] Badge shows "INCOME" text
- [ ] Badge color is GREEN (income color)
- [ ] Badge has lock icon

**If Tabs Are Visible** ❌ Problem
- typeLockFlag is false or effect not running

---

### Test Case 2.2: Visual Confirmation - Expense
**Steps**:
1. Press Expense button
2. Look at the screen

**Visual Checks**:
- [ ] Badge shows "EXPENSE" text
- [ ] Badge color is RED (expense color)
- [ ] Lock icon visible

---

## Phase 3: Account Creation Flow

### Test Case 3.1: Create Account in Income Flow
**Steps**:
1. Press Income button (see INCOME badge)
2. Tap "Select Account"
3. Scroll down and tap "Create Account" button
4. **Monitor console**

**Expected Console Output** (in create account modal):
```
🔵 [INIT] params.type: income
🔵 [INIT] initialTypeFromFAB: INCOME
🟢 [STATE] recordType: INCOME
🟢 [STATE] typeLockFlag: true
```

**What Should Happen**:
- Account creation modal should open
- Type should STILL be INCOME
- Lock should STILL be active

**Check The Logs**:
- Does console show `params.type: income`? ✅ YES = type param preserved
- Does console show `typeLockFlag: true`? ✅ YES = lock passed through

**If Type is Missing** ❌ Problem
- Check router.replace() in account modal button is passing typeLockedFlag param

---

### Test Case 3.2: Create Account and Return
**Steps**:
1. While in Create Account modal, fill in form (e.g., "Test Bank")
2. Tap "Create Account" button
3. **Monitor console** as modal closes

**Expected Behavior**:
- Create Account modal closes
- Should return to Add Record modal
- Type should STILL be INCOME
- Type lock badge still visible

**Expected Console Output**:
```
🟡 [EFFECT-SYNC-TYPE] Running: initialTypeFromFAB= INCOME typeLockFlag= true
🟡 [EFFECT-SYNC-TYPE] Condition not met. (already locked)
🟠 [EFFECT-RESTORE] Running with typeLockFlag= true
🟠 [EFFECT-RESTORE] Type is LOCKED - not restoring anything
```

**Verification**:
- [ ] Console shows `Type is LOCKED - not restoring anything`
- [ ] UI shows INCOME badge (not switched to EXPENSE)
- [ ] Account is selected in the list

---

## Phase 4: Category Creation Flow

### Test Case 4.1: Create Category in Income Flow
**Steps**:
1. In Add Record modal (with INCOME visible)
2. Tap "Select Category"
3. Tap "Create Category"
4. **Monitor console**

**Expected Output**:
```
🔵 [INIT] params.recordType: INCOME
🔵 [INIT] initialTypeFromFAB: INCOME (or could be null if not passed)
🟢 [STATE] recordType: INCOME
🟢 [STATE] typeLockFlag: true (or should be based on typeLockedFlag param)
```

**Check**:
- Does the category modal show INCOME badge? ✅
- Does console show type is passed? ✅

---

### Test Case 4.2: Create Category and Return
**Steps**:
1. Fill category name in Create Category modal
2. Tap "Create Category"
3. **Monitor console** as modal closes

**Expected**:
- Type still INCOME
- Lock still active
- Console shows: `Type is LOCKED - not restoring anything`

**Critical Check**:
- Does it say `typeLockFlag: true`? If NO ❌ → typeLockedFlag not being passed through

---

## Phase 5: The Critical Test - Switching Between FAB Types

### Test Case 5.1: Income → Close → Expense
**Steps**:
1. Press Income button
2. **Note the INCOME badge**
3. Close modal (tap X)
4. Open FAB again
5. **Press Expense button**

**Expected Console Output**:
```
// First press (Income)
🔵 [INIT] params.type: income
🟢 [STATE] recordType: INCOME
🟢 [STATE] typeLockFlag: true

// Then after closing and pressing Expense
🔵 [INIT] params.type: expense  ← DIFFERENT NOW
🟢 [STATE] recordType: EXPENSE   ← CHANGED CORRECTLY
🟢 [STATE] typeLockFlag: true
```

**Visual Verification**:
- [ ] First modal shows INCOME badge (GREEN)
- [ ] After closing and reopening, shows EXPENSE badge (RED)
- [ ] Colors are different
- [ ] Type actually switched (not stuck on INCOME)

---

## Phase 6: The Bug-Finding Tests

If you see the EXPENSE issue (always showing EXPENSE despite pressing Income), run these tests:

### Test Case 6.1: Check Initial Type Parsing
**What to Look For**:
```
❌ BAD: 🔵 [INIT] params.type: (empty or null)
✅ GOOD: 🔵 [INIT] params.type: income
```

**If params.type is empty**:
- Problem: FAB button not passing type param
- Fix needed in: `app/(tabs)/index.tsx` FAB Income button

---

### Test Case 6.2: Check Type Lock Initialization
**What to Look For**:
```
❌ BAD: 🟢 [STATE] typeLockFlag: false
✅ GOOD: 🟢 [STATE] typeLockFlag: true
```

**If typeLockFlag is false**:
- Problem: shouldLockType not set correctly
- Problem: initialTypeFromFAB is null
- Check params are being passed

---

### Test Case 6.3: Check Effect Execution
**What to Look For**:
```
❌ BAD: 🟡 [EFFECT-SYNC-TYPE] Setting recordType to: EXPENSE
✅ GOOD: 🟡 [EFFECT-SYNC-TYPE] Condition not met. (already locked)
```

**If it says "Setting to EXPENSE"**:
- Problem: Effect is overriding the initial value
- Problem: Either initialTypeFromFAB is wrong OR typeLockFlag is not in dependencies

---

### Test Case 6.4: Check Restore Effect
**What to Look For**:
```
❌ BAD: 🟠 [EFFECT-RESTORE] Restoring returnedRecordType: EXPENSE
✅ GOOD: 🟠 [EFFECT-RESTORE] Type is LOCKED - not restoring anything
```

**If it's restoring EXPENSE**:
- Problem: typeLockFlag is not preventing restoration
- Problem: typeLockFlag might be false when it should be true

---

## Console Log Color Legend

- 🔵 **BLUE** - Initialization (params parsing, initial state)
- 🟢 **GREEN** - State current value
- 🟡 **YELLOW** - Effect: Sync Type
- 🟠 **ORANGE** - Effect: Restore Form
- 🔴 **RED** - Effect: Cleanup URL params
- 📊 **CHART** - State changes tracking
- 🔒 **LOCK** - Lock flag changes

---

## Common Issues & Solutions

### Issue 1: Type Always Shows EXPENSE
**Root Cause to Check**:
```
Look for: 🔵 [INIT] params.type: (empty)
```
**Solution**: Check FAB buttons in `app/(tabs)/index.tsx`

---

### Issue 2: Type Switches After Create Account
**Root Cause to Check**:
```
Look for: 🟠 [EFFECT-RESTORE] Restoring returnedRecordType: EXPENSE
While: 🟠 [EFFECT-RESTORE] Type is LOCKED should appear instead
```
**Solution**: typeLockFlag is being reset or not persisted

---

### Issue 3: Lock Badge Doesn't Appear
**Root Cause to Check**:
```
Look for: 🟢 [STATE] typeLockFlag: true
```
**Solution**: If false, check shouldLockType calculation

---

## How to Use These Logs

1. **Open your app's console**:
   - Expo CLI: You'll see logs directly
   - Mobile: Install Expo DevTools or use metro bundler logs

2. **Perform test cases above**

3. **Copy all console output**

4. **Compare with Expected Output**

5. **Find first mismatch** - That's where the bug is

6. **Share the logs with me** showing the issue

---

## Quick Checklist Before Testing

- [ ] Latest code pushed/saved
- [ ] App reloaded/rebuilt
- [ ] Console is visible
- [ ] You can see console logs in real-time
- [ ] Have a test account with data
- [ ] Have test categories created

---

## After Testing

**Please provide**:
1. Screenshot of console when pressing Income button
2. Screenshot showing what the UI displays
3. Console output when creating account and returning
4. Console output when pressing Expense after Income

This will help identify exactly where the issue is!
