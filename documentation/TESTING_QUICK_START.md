# Testing Notifications - Quick Start Guide

## 🎯 5-Minute Testing Flow

### Step 1: Prepare Database (1 minute)
1. Open **Supabase Dashboard** → **SQL Editor**
2. Create new query and copy **all** content from `database/SETUP_INSTRUCTIONS.sql`
3. Click **Run**
4. Verify: All 5 tables created, no errors

### Step 2: Restart App (1 minute)
```bash
# In terminal, stop current app:
Ctrl + C

# Restart:
expo start
```

### Step 3: Import & Add Test Component (1 minute)

Add to any screen temporarily (e.g., in `app/(tabs)/analysis.tsx` or `app/index.tsx`):

```tsx
import TestNotificationButton from '@/components/TestNotificationButton';

// Inside your component's JSX:
<TestNotificationButton />
```

### Step 4: Run Tests (2 minutes)

**Test 1: Large Transaction Alert**
- Press "💰 Test Large Transaction (₹15K)"
- ✅ Expect: Push notification appears on device
- Check: `notification_analytics` table in Supabase

**Test 2: Budget Exceeded Alert**
- Press "💸 Test Budget Exceeded"
- ✅ Expect: Push notification appears

**Test 3: Unusual Spending Alert**
- Press "📈 Test Unusual Spending"
- ✅ Expect: Push notification appears

**Test 4: Throttling Test**
- Press "🚫 Test Throttling (Spam Prevention)"
- ✅ Expect: First alert sends, second is throttled
- Check console for: "⏭️ Notification throttled: large_transaction"

---

## 📊 Database Verification

After running tests, check these tables in Supabase:

### 1. notification_analytics
Should have entries from your tests:
```sql
SELECT notification_type, sent_at, user_id
FROM notification_analytics
ORDER BY sent_at DESC LIMIT 10;
```

Expected columns:
- `notification_type`: large_transaction, budget_exceeded, unusual_spending
- `sent_at`: Timestamp of when alert was sent
- `user_id`: Your user ID
- `opened`: false (until you click notification)

### 2. notification_throttle
Check throttling records:
```sql
SELECT notification_type, user_id, last_sent_at, send_count
FROM notification_throttle
ORDER BY last_sent_at DESC;
```

### 3. job_execution_logs
Check when scheduled jobs will run:
```sql
SELECT job_name, executed_at, success
FROM job_execution_logs
ORDER BY executed_at DESC;
```

---

## ✅ Success Criteria Checklist

- [ ] All 5 tables created in database (run `\d` in SQL to verify)
- [ ] App restarted successfully
- [ ] TestNotificationButton component added to screen
- [ ] Large transaction alert appears as push notification
- [ ] Budget exceeded alert appears as push notification
- [ ] Unusual spending alert appears as push notification
- [ ] notification_analytics table has entries after tests
- [ ] Throttling test shows only 1 alert (2nd is blocked)
- [ ] Console shows "✅ [TEST]" logs for each test

---

## 🐛 Troubleshooting

### Push Notification Doesn't Appear
1. **Check phone settings**: Allow notifications for this app
2. **Check console output**: Look for `[TEST]` logs in VS Code terminal
3. **Check notification_analytics table**: Should have entries even if notification doesn't appear visually
4. **Restart app**: Sometimes helps with push notification service
5. **Check Firebase**: Verify FCM credentials are set up

### Database Error: "relation 'notification_analytics' does not exist"
1. Run SETUP_INSTRUCTIONS.sql again
2. Check Supabase Table Editor to verify tables are created
3. Reload browser if tables don't show up

### Component Won't Import
1. Verify file path: `c:\dev\budgetzen\components\TestNotificationButton.tsx`
2. Check import statement uses correct path alias

---

## 🚀 Next Steps After Testing

1. **Remove test component** from production code
2. **Wait for scheduled jobs** to run:
   - 07:00 AM: Budget warnings job
   - 08:00 AM: Anomaly detection job
   - 19:00 PM: Daily reminder + weekly jobs
3. **Monitor job_execution_logs** for job runs
4. **Check notification_analytics** for automatic alert entries
5. **Deploy to production** when confident

---

## 📚 Full Testing Guide

See `documentation/TESTING_NOTIFICATIONS.md` for:
- Extended 6 test scenarios
- SQL verification queries
- Debugging tips
- Expected console output
- Sample test report template
- Pre-production deployment checklist

---

## 💡 Quick Reference

| Feature | Test Button | Expected Result |
|---------|-------------|-----------------|
| Large Transaction | 💰 (₹15K) | Alert appears, entry in `notification_analytics` |
| Budget Exceeded | 💸 | Alert appears when spending ≥ budget |
| Unusual Spending | 📈 | Alert appears when 2.5x above average |
| Throttling | 🚫 | First sends, second is throttled (1-hour window) |
| Database Check | 📊 | Shows query instructions for manual verification |

---

**Status**: ✅ All components created and tested  
**Ready for**: Testing in development environment  
**Remove before**: Production deployment
