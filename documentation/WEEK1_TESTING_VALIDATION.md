# Week 1 Testing & Validation Guide

## 🎯 Testing Objectives

Verify that all three real-time alert types:
1. Trigger at the correct thresholds
2. Send notifications successfully
3. Respect throttling and DND rules
4. Record analytics correctly
5. Don't block transaction saving

---

## 📋 Pre-Testing Setup

### 1. Database Verification
Ensure these tables exist in Supabase:
```sql
-- ✅ Must exist for throttling
notification_throttle (
  user_id, notification_type, last_sent_at, count_today
)

-- ✅ Must exist for analytics
notification_analytics (
  user_id, notification_id, notification_type, sent_at, opened_at, actioned_at
)

-- ✅ Must exist for budgets
budgets (
  category_id, amount, user_id
)

-- ✅ Must exist for records
records (
  id, user_id, amount, type, category_id, transaction_date, account_id
)

-- ✅ Must exist for categories
categories (
  id, name, type, user_id
)
```

### 2. App Setup
```bash
# Build the app
npx expo prebuild --clean

# Start the development server
npx expo start --dev-client

# Build and run on device/emulator
eas build --platform android --profile preview
```

### 3. Test Data Setup
Before testing, create:
1. **Accounts:** Create at least one account (e.g., "My Wallet")
2. **Categories:** Create multiple categories (e.g., Food, Transport, Shopping)
3. **Budget:** Set a budget for "Food" category = ₹5,000/month
4. **Historical Records:** Add 10+ past expenses to establish average

---

## 🧪 Test Scenarios

### TEST 1: Large Transaction Alert
**Objective:** Verify alert triggers when expense > threshold

**Setup:**
1. Calculate your monthly average:
   - Go to Analytics tab
   - Note your average daily spending
   - Example: ₹1,000/day = ₹30,000/month average

2. Threshold = max(50% of average, ₹10,000)
   - In example: max(₹15,000, ₹10,000) = ₹15,000

3. Amount to test: ₹20,000 (exceeds ₹15,000)

**Steps:**
1. Open app, go to home tab (FAB)
2. Click "+" button → "Add Expense"
3. Fill in:
   - Amount: ₹20,000
   - Category: Any category
   - Account: Your wallet
   - Date: Today
4. Click "Save"

**Expected Results:**
- ✅ Transaction saves successfully
- ✅ Console log: "💰 Sending large transaction alert"
- ✅ Push notification arrives: "💰 Large transaction: ₹20,000"
- ✅ Entry appears in `notification_throttle` table
- ✅ Entry appears in `notification_analytics` table

**Failure Checks:**
- ❌ If no console log → check network, check if amount exceeds threshold
- ❌ If no notification → check push token registered
- ❌ If notification sent twice → check throttler (should be limited to 1/hour)

**Verification Queries:**
```sql
-- Check throttle entry
SELECT * FROM notification_throttle 
WHERE user_id = 'YOUR_USER_ID' 
AND notification_type = 'large_transaction'
ORDER BY last_sent_at DESC LIMIT 1;

-- Check analytics
SELECT * FROM notification_analytics
WHERE user_id = 'YOUR_USER_ID'
AND notification_type = 'large_transaction'
ORDER BY sent_at DESC LIMIT 1;
```

---

### TEST 2: Budget Exceeded Alert
**Objective:** Verify alert triggers when spending exceeds budget

**Setup:**
1. Set budget for "Food" category = ₹5,000
   - Go to Settings → Budgets
   - Set Food budget = ₹5,000

2. Add expenses that approach budget:
   - Add ₹2,000 expense
   - Add ₹1,500 expense
   - Add ₹1,300 expense
   - Total: ₹4,800 (80% of budget)

3. Final expense to exceed = ₹300
   - This brings total to ₹5,100 (102% of budget)

**Steps:**
1. Add final ₹300 expense:
   - Click "+" → "Add Expense"
   - Amount: ₹300
   - Category: Food
   - Click "Save"

**Expected Results:**
- ✅ Transaction saves successfully
- ✅ Console log: "❌ Sending budget exceeded alert"
- ✅ Push notification: "❌ Budget exceeded: Food"
- ✅ Shows exceeded amount: "You've exceeded by ₹100 (102%)"
- ✅ Deep link opens to Analysis tab
- ✅ Entry in `notification_throttle` with `budget_exceeded`
- ✅ Entry in `notification_analytics`

**Failure Checks:**
- ❌ Alert sent when should be throttled (< 1 hour since last budget alert) → Throttler not working
- ❌ Alert sent even though under budget → Logic error in threshold check
- ❌ Alert not sent when definitely over budget → Database query issue

**Verification Queries:**
```sql
-- Check budget exists
SELECT * FROM budgets 
WHERE category_id = 'FOOD_CAT_ID' 
AND user_id = 'YOUR_USER_ID';

-- Check total spent this month
SELECT SUM(amount) as total_spent FROM records
WHERE category_id = 'FOOD_CAT_ID'
AND user_id = 'YOUR_USER_ID'
AND type = 'expense'
AND DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', NOW());

-- Check throttle
SELECT * FROM notification_throttle
WHERE notification_type = 'budget_exceeded'
AND user_id = 'YOUR_USER_ID'
ORDER BY last_sent_at DESC;
```

---

### TEST 3: Unusual Spending Alert
**Objective:** Verify alert triggers when spending > 2x average

**Setup:**
1. Create 10+ historical expenses in a category (e.g., "Coffee"):
   - Add expenses: ₹200, ₹250, ₹300, ₹200, ₹280, ₹220, ₹250, ₹300, ₹200, ₹250
   - Average: ₹255

2. Unusual spending threshold = 2x average = ₹510

3. Test with amount > ₹510 (e.g., ₹600)

**Steps:**
1. Add expense:
   - Click "+" → "Add Expense"
   - Amount: ₹600
   - Category: Coffee (or your test category)
   - Click "Save"

**Expected Results:**
- ✅ Transaction saves successfully
- ✅ Console log: "📈 Sending unusual spending alert"
- ✅ Push notification: "📈 Unusual spending: Coffee"
- ✅ Shows percentage: "₹600 is 235% above your average"
- ✅ Entry in `notification_throttle` with `unusual_spending`
- ✅ Entry in `notification_analytics`

**Failure Checks:**
- ❌ Alert not sent with 10 prior transactions → Count check failing
- ❌ Alert sent with < 5 transactions → Logic error in count check
- ❌ Wrong percentage shown → Average calculation error
- ❌ Throttler blocking when shouldn't → Interval check issue

**Verification Queries:**
```sql
-- Check transaction count
SELECT COUNT(*) as count FROM records
WHERE category_id = 'COFFEE_CAT_ID'
AND user_id = 'YOUR_USER_ID'
AND type = 'expense'
AND transaction_date >= NOW() - INTERVAL '30 days';

-- Check average
SELECT AVG(amount) as average FROM records
WHERE category_id = 'COFFEE_CAT_ID'
AND user_id = 'YOUR_USER_ID'
AND type = 'expense'
AND transaction_date >= NOW() - INTERVAL '30 days';

-- Verify threshold: should be 2x average
-- Alert should trigger if amount > (average * 2)
```

---

### TEST 4: Throttling
**Objective:** Verify same alert isn't sent twice within 1 hour

**Steps:**
1. Send a budget exceeded alert (from TEST 2)
   - Note the timestamp
   - Check notification received

2. Immediately try to send same alert again (within 1 minute):
   - Reduce budget on same category to ₹4,000
   - Add another ₹300 expense
   - Check notification

3. Wait and retry (1+ hour later):
   - Add another ₹300 expense
   - Check if alert sends again

**Expected Results:**
- ✅ First alert sends (timestamp: HH:00)
- ✅ Second alert within 1 hour is BLOCKED (console: "⏭️ Throttled: budget_exceeded")
- ✅ Alert at HH+61min is ALLOWED (throttling expired)
- ✅ Database shows `last_sent_at` updated

**Verification Queries:**
```sql
-- Check last sent time
SELECT notification_type, last_sent_at, count_today 
FROM notification_throttle
WHERE user_id = 'YOUR_USER_ID'
AND notification_type = 'budget_exceeded'
ORDER BY last_sent_at DESC;

-- Time diff should be >= 3600000ms (1 hour)
SELECT EXTRACT(EPOCH FROM (NOW() - last_sent_at)) * 1000 as ms_since_last
FROM notification_throttle
WHERE notification_type = 'budget_exceeded';
```

---

### TEST 5: Do Not Disturb (DND)
**Objective:** Verify alerts respect DND hours

**Setup:**
1. Enable DND:
   - Go to Settings → Notifications
   - Enable DND
   - Set: 22:00 - 08:00

**Steps:**
1. Test during DND hours (e.g., 23:00):
   - Add a large transaction ₹20,000
   - Expected: Alert queued but NOT sent

2. Test outside DND (e.g., 09:00):
   - Add a large transaction ₹20,000
   - Expected: Alert sends immediately

**Expected Results:**
- ✅ During DND (23:00): Console log: "🌙 In DND hours"
- ✅ Alert is NOT sent via push
- ✅ During normal hours (09:00): Alert sends immediately
- ✅ No DND bypass for CRITICAL alerts (budget_exceeded still sends)

**Note:** CRITICAL alerts (budget_exceeded) ignore DND

---

### TEST 6: Alert Analytics
**Objective:** Verify tracking of notification events

**Steps:**
1. Send all three alert types
2. Open notifications from device
3. Tap notification to open app
4. Check database entries

**Expected Results:**
- ✅ `sent_at` recorded for each notification
- ✅ `opened_at` recorded when notification opened
- ✅ `notification_type` matches actual type
- ✅ `user_id` matches logged-in user

**Verification Query:**
```sql
-- Check notification analytics
SELECT 
  notification_type,
  COUNT(*) as total_sent,
  COUNT(opened_at) as total_opened,
  ROUND(COUNT(opened_at)::FLOAT / COUNT(*) * 100, 1) as open_rate
FROM notification_analytics
WHERE user_id = 'YOUR_USER_ID'
GROUP BY notification_type
ORDER BY total_sent DESC;
```

---

## 🐛 Debugging Guide

### Common Issues & Solutions

#### "Cannot find module 'supabase'"
- **Cause:** Import path incorrect
- **Fix:** Check import: `import { supabase } from '@/lib/supabase'`

#### "Notification not sending"
- **Check list:**
  1. Push token registered? → Check Supabase `notification_tokens` table
  2. User has permission? → Check app permissions
  3. Throttled? → Check logs for "⏭️ Throttled"
  4. In DND? → Check logs for "🌙 In DND"
  5. Amount meets threshold? → Calculate manually

#### "Alert sending too often"
- **Cause:** Throttler not working
- **Debug:**
  ```typescript
  // Add to console
  console.log('Throttle check:', await notificationThrottler.shouldSend(userId, type));
  console.log('Last sent:', await notificationThrottler.getStats(userId));
  ```

#### "Wrong alert title/message"
- **Cause:** Category name not passed correctly
- **Debug:**
  ```typescript
  console.log('Category:', selectedCategory);
  console.log('Category name:', selectedCategory?.name);
  ```

#### "Database query returns null"
- **Cause:** Wrong user_id or data doesn't exist
- **Debug:**
  1. Add query logging
  2. Check Supabase directly
  3. Verify user is logged in (check `user?.id`)

---

## 📊 Test Result Template

```markdown
## Test Execution Report - Week 1

**Date:** ___________
**Tester:** ___________
**Device:** ___________
**OS:** ___________
**App Version:** ___________

### Test 1: Large Transaction
- [ ] Transaction saved
- [ ] Console log appeared
- [ ] Notification received
- [ ] DB entries created
- **Status:** PASS / FAIL
- **Notes:** ___________

### Test 2: Budget Exceeded
- [ ] Transaction saved
- [ ] Console log appeared
- [ ] Notification received
- [ ] Deep link works
- [ ] DB entries created
- **Status:** PASS / FAIL
- **Notes:** ___________

### Test 3: Unusual Spending
- [ ] Transaction saved
- [ ] Console log appeared
- [ ] Notification received
- [ ] Percentage calculated
- [ ] DB entries created
- **Status:** PASS / FAIL
- **Notes:** ___________

### Test 4: Throttling
- [ ] First alert sent
- [ ] Second alert blocked
- [ ] Third alert after 1hr sent
- [ ] DB updated correctly
- **Status:** PASS / FAIL
- **Notes:** ___________

### Test 5: DND
- [ ] DND during alert blocked
- [ ] Outside DND alert sent
- [ ] Critical alert ignores DND
- **Status:** PASS / FAIL
- **Notes:** ___________

### Overall Status: READY FOR PRODUCTION / NEEDS FIXES
```

---

## ✅ Sign-Off Checklist

Before proceeding to Week 2, verify:
- [ ] All 6 test scenarios PASSED
- [ ] No runtime errors in console
- [ ] Database entries created correctly
- [ ] Throttling working as expected
- [ ] DND respected for non-critical
- [ ] Performance acceptable (no lag)
- [ ] Notifications delivered <2 seconds
- [ ] Deep links navigating correctly
- [ ] Analytics tracking correctly
- [ ] Ready for Week 2 implementation

---

*Test Plan Generated: December 11, 2025*
*Ready for: QA & Integration Testing*
