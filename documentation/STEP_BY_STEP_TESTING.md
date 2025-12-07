# Step-by-Step Testing Instructions

## Setup

### 1. Make Sure App Is Running
```bash
# In your project root directory
npm start
# or
npx expo start
```

### 2. Open Console
**For Expo CLI**:
- The console logs will appear in your terminal directly
- Look for logs starting with 🔵, 🟢, 🟡, etc.

**For DevTools (Web)**:
- Press F12 to open DevTools
- Go to Console tab
- Clear with `console.clear()`

**For Mobile (Android/iOS)**:
- Open Expo app
- Connect to metro bundler
- Console logs appear in terminal

---

## The Exact Test Sequence

### TEST 1: Press Income Button
**Time**: ~30 seconds

1. **Open your app**
2. **Clear console** (Ctrl+L in Expo CLI, or `console.clear()` in DevTools)
3. **Open the FAB menu** - Tap the "+" icon
4. **Press the "Income" button**
5. **Immediately screenshot/copy the console output**

**What You Should See**:
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

**Visual Check**:
- [ ] Type tabs are HIDDEN
- [ ] Green badge shows "INCOME"
- [ ] Lock icon visible on badge

**⚠️ If You Don't See This**:
- Stop here and take screenshot
- Message me the output

---

### TEST 2: Verify UI Shows INCOME
**Time**: ~10 seconds

1. **Look at the form**
2. **Check the type badge**
3. **Take screenshot of UI**

**Expected UI**:
- [ ] No type tabs (tabs hidden)
- [ ] Green badge with "INCOME" text
- [ ] Lock icon on badge

---

### TEST 3: Create an Account
**Time**: ~1 minute

1. **Clear console** 
2. **Tap "Select Account"**
3. **Scroll to bottom and tap "Create Account"**
4. **Fill in account name** (e.g., "Test Bank")
5. **Tap "Create Account" button to submit**
6. **Screenshot console output** as modal closes

**What You Should See**:
```
🔵 [INIT] params.type: income
🟢 [STATE] recordType: INCOME
🟢 [STATE] typeLockFlag: true
(after creating account and returning)
🟡 [EFFECT-SYNC-TYPE] Running: initialTypeFromFAB= INCOME typeLockFlag= true
🟠 [EFFECT-RESTORE] Running with typeLockFlag= true
🟠 [EFFECT-RESTORE] Type is LOCKED - not restoring anything
```

**Visual Check**:
- [ ] Type badge still shows "INCOME" (green)
- [ ] Account is now selected
- [ ] Form fields preserved (if you entered them)

**⚠️ Critical Check**: 
- Does it say `Type is LOCKED`? ✅ YES = Good
- Is the badge INCOME? ✅ YES = Good
- Did it change to EXPENSE? ❌ NO = This is the bug!

---

### TEST 4: Create a Category
**Time**: ~1 minute

1. **In the record form, tap "Select Category"**
2. **Tap "Create Category"**
3. **Fill in category name** (e.g., "Test Salary")
4. **Leave type as INCOME** (should be locked)
5. **Tap "Create Category" button**
6. **Screenshot console as it closes**

**What You Should See**:
```
(after creating category and returning)
🟡 [EFFECT-SYNC-TYPE] Running: initialTypeFromFAB= INCOME typeLockFlag= true
🟠 [EFFECT-RESTORE] Running with typeLockFlag= true
🟠 [EFFECT-RESTORE] Type is LOCKED - not restoring anything
```

**Visual Check**:
- [ ] Type badge still shows "INCOME" (green)
- [ ] Category is now selected
- [ ] Account still selected

---

### TEST 5: Close and Try Expense
**Time**: ~30 seconds

1. **Close the record modal** (tap X)
2. **Clear console**
3. **Open FAB again** (tap "+")
4. **Press "Expense" button**
5. **Screenshot console output**

**What You Should See**:
```
🔵 [INIT] params.type: expense
🔵 [INIT] rawType: expense
🔵 [INIT] initialTypeFromFAB: EXPENSE
🔵 [INIT] shouldLockType: true
🟢 [STATE] recordType: EXPENSE
🟢 [STATE] typeLockFlag: true
```

**Visual Check**:
- [ ] Type badge shows "EXPENSE" (red)
- [ ] Different from INCOME badge
- [ ] Not INCOME anymore

---

### TEST 6: Go Back to Income
**Time**: ~30 seconds

1. **Close the expense modal**
2. **Clear console**
3. **Open FAB again**
4. **Press "Income" button again**
5. **Screenshot console**

**What You Should See**:
```
🔵 [INIT] params.type: income
🟢 [STATE] recordType: INCOME
```

**Visual Check**:
- [ ] Type badge shows "INCOME" (green)
- [ ] Type switches back properly

---

## Collection Instructions

### For Expo CLI Users
```bash
# 1. Start your app
npm start

# 2. Run test cases above while watching the terminal
# 3. Copy the console output from your terminal
# 4. Paste into a document/screenshot
```

### For DevTools Users
```javascript
// In DevTools Console:
// 1. Run: console.clear()
// 2. Do test case
// 3. Right-click in console
// 4. Select "Save As" or screenshot
```

### For Mobile Users
```bash
# 1. Terminal shows all logs
# 2. Select and copy logs from terminal
# 3. Paste into document
```

---

## What To Collect

**For Each Test Case, Collect**:

1. **Console Output** (the logs)
   - Screenshot OR
   - Copy-paste text

2. **UI Screenshot**
   - What type is showing?
   - What color is the badge?

3. **Any Error Messages**
   - Red text in console?

---

## Example Good Output

### When Pressing Income:
```
🔵 [INIT] params.type: income ✅
🔵 [INIT] initialTypeFromFAB: INCOME ✅
🟢 [STATE] recordType: INCOME ✅
🟢 [STATE] typeLockFlag: true ✅
(UI shows: Green INCOME badge) ✅
```

### When Creating Account (Return):
```
🟠 [EFFECT-RESTORE] Type is LOCKED - not restoring anything ✅
(UI shows: Still INCOME, not changed to EXPENSE) ✅
```

### When Pressing Expense:
```
🔵 [INIT] params.type: expense ✅
🟢 [STATE] recordType: EXPENSE ✅
(UI shows: Red EXPENSE badge) ✅
```

---

## Example Bad Output (The Bug)

### When Pressing Income:
```
🔵 [INIT] params.type: income ✅
🟢 [STATE] recordType: INCOME ✅
... but then ...
🟡 [EFFECT-SYNC-TYPE] SETTING recordType to: EXPENSE ❌ WRONG!
📊 [TRACK] recordType changed to: EXPENSE ❌ SHOULDN'T CHANGE!
(UI shows: EXPENSE instead of INCOME) ❌
```

This would tell us: **An effect is overriding the type after initialization**

---

## If The Bug Appears

**Share With Me**:
1. The exact console output where it goes wrong
2. Screenshot of the UI showing the wrong type
3. Which test case triggers it (Test 1? Test 3? Test 4?)

**I Will**:
1. Analyze the output
2. Find the problematic code
3. Fix it permanently
4. Remove console logs
5. Test again with clean code

---

## Estimated Total Time

| Test | Time |
|------|------|
| Setup | 2 min |
| Test 1 (Income) | 30 sec |
| Test 2 (UI Check) | 10 sec |
| Test 3 (Account) | 1 min |
| Test 4 (Category) | 1 min |
| Test 5 (Expense) | 30 sec |
| Test 6 (Income Again) | 30 sec |
| **TOTAL** | **~6 minutes** |

---

## Troubleshooting

### "I Don't See Any Logs"
- [ ] Is the app actually running?
- [ ] Try console.log('test') in DevTools
- [ ] Check app is reloaded after code changes

### "Logs Look Different"
- [ ] Make sure you have latest code
- [ ] Close app and restart
- [ ] Clear bundle cache: `expo start -c`

### "Something Crashed"
- [ ] Check for red error messages
- [ ] Take screenshot of error
- [ ] Share the error text

---

## Next: Send Results

Once you complete these tests, send me:
1. All console outputs (copy-paste or screenshots)
2. All UI screenshots showing type badges
3. Which test case shows the bug (if any)
4. Any error messages

**Then I can**:
- Identify the exact problem
- Apply the permanent fix
- Remove debugging logs
- Verify it works
