# 🎯 DEBUGGING QUICK REFERENCE - Type Lock Issue

## Start Testing NOW

**3 Documents to Read**:
1. **DEBUGGING_PHASE_START.md** - Overview
2. **STEP_BY_STEP_TESTING.md** - Detailed steps ⭐ **START HERE**
3. **DEBUGGING_GUIDE_COMPLETE.md** - Advanced info

---

## 30-Second Summary

I added console.log statements to track type state changes.

**Your job**: Run tests → See console logs → Send screenshots

**My job**: Analyze logs → Fix the bug → Remove logging

---

## 6 Quick Tests

### Test 1: Press Income
- Expected: Console shows `initialTypeFromFAB: INCOME`
- Expected: UI shows green INCOME badge
- Screenshot console output

### Test 2: Check UI
- UI should show locked badge (not tabs)
- Badge should be INCOME in green

### Test 3: Create Account
- Navigate to create account modal
- Console should show type param passed
- Return to record form
- **Critical**: Type should still be INCOME

### Test 4: Create Category  
- Type should still be INCOME
- Form data preserved

### Test 5: Press Expense
- Console should show `params.type: expense`
- Badge should turn RED
- UI should show EXPENSE

### Test 6: Back to Income
- Close and reopen
- Press Income again
- Should show INCOME (green)

---

## Console Output Quick Check

✅ **GOOD** - See these:
```
🔵 params.type: income
🟢 recordType: INCOME
🟢 typeLockFlag: true
🟠 Type is LOCKED - not restoring
```

❌ **BAD** - If you see:
```
🔵 params.type: (empty)
🟡 SETTING recordType to: EXPENSE
🟠 Restoring returnedRecordType: EXPENSE
```

---

## What Each Color Means

| 🔵 Blue | Param parsing |
| 🟢 Green | State value |
| 🟡 Yellow | Type sync effect |
| 🟠 Orange | Form restore effect |
| 🔴 Red | URL cleanup |
| 📊 Chart | State changed |
| 🔒 Lock | Lock status |

---

## Screenshots Needed

For each test, capture:
1. **Console output** (colored logs)
2. **UI** (type badge display)
3. **Any errors** (red text)

---

## When The Bug Appears

Take screenshots showing:
1. When does it break? (Test 1, 3, 4, 5, 6?)
2. What console log appears?
3. What does UI show?

---

## Next Steps

1. **Read**: DEBUGGING_PHASE_START.md
2. **Read**: STEP_BY_STEP_TESTING.md
3. **Run**: All 6 tests (takes ~5 min)
4. **Send**: Console + UI screenshots

---

## Expected Result

After testing:
- ✅ Know if type lock works or not
- ✅ Know exactly where it breaks
- ✅ Have console logs showing problem
- ✅ Ready for me to fix

---

**GO TO: STEP_BY_STEP_TESTING.md** 👈
