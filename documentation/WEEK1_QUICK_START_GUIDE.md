# Quick Start Implementation - Week 1 (Real-Time Alerts)

## 🚀 Start Here - Day 1 Tasks

### Overview
Implement Tier 1 (Real-Time Alerts) - The most impactful features that drive immediate user action.

**This week:** 40 developer hours
**Impact:** Prevents overspending in real-time
**Expected engagement boost:** 25-35%

---

## 📋 Week 1 Deliverables

### Day 1: Setup & Types (4 hours)

#### Task 1.1: Update notification types
**File:** `lib/notifications/types.ts`

```typescript
// ADD to existing NotificationType enum:

export enum NotificationType {
  // Tier 1: Real-time (ADD THESE)
  LARGE_TRANSACTION = 'large_transaction',
  BUDGET_EXCEEDED = 'budget_exceeded',
  UNUSUAL_SPENDING = 'unusual_spending',
  
  // Existing...
  DAILY_REMINDER = 'daily_reminder',
  // ... rest of types
}

// ADD new constants:
export const NOTIFICATION_PRIORITIES: Record<NotificationType, NotificationPriority> = {
  [NotificationType.LARGE_TRANSACTION]: NotificationPriority.HIGH,
  [NotificationType.BUDGET_EXCEEDED]: NotificationPriority.CRITICAL,
  [NotificationType.UNUSUAL_SPENDING]: NotificationPriority.HIGH,
  // ... rest
};
```

#### Task 1.2: Create NotificationThrottler
**File:** Create `lib/notifications/notificationThrottler.ts` (90 lines)

[See Professional Implementation Plan - Step 2 for full code]

**What it does:**
- Prevents same notification type from being sent more than once per hour
- Tracks when last notification was sent
- Allows for category-specific throttling (e.g., budget exceeded per category)

#### Task 1.3: Create SmartTimingEngine
**File:** Create `lib/notifications/smartTimingEngine.ts` (80 lines)

[See Professional Implementation Plan - Step 3 for full code]

**What it does:**
- Checks if user is in DND (do not disturb) hours
- Prevents notifications if user opened app recently
- Gets optimal send time based on user preferences

**Time estimate:** 4 hours total

---

### Day 2: Real-Time Service Update (4 hours)

#### Task 2.1: Update NotificationService
**File:** `lib/notifications/NotificationService.ts`

Add new method (in existing service):

```typescript
async sendWithSmartFilters(
  userId: string,
  payload: NotificationPayload
): Promise<NotificationResult> {
  const type = payload.type as NotificationType;
  const priority = NOTIFICATION_PRIORITIES[type] || NotificationPriority.LOW;

  // Check throttling
  const shouldSend = await notificationThrottler.shouldSend(userId, type);
  if (!shouldSend) {
    console.log(`⏭️ Throttled: ${type}`);
    return { success: false, message: 'Throttled' };
  }

  // Check DND (skip for critical)
  if (priority !== NotificationPriority.CRITICAL) {
    const inDND = await smartTimingEngine.isInDNDHours(userId);
    if (inDND) {
      console.log(`🌙 In DND`);
      return { success: false, message: 'In DND' };
    }
  }

  // Check if user recently opened app
  const shouldSkip = await smartTimingEngine.shouldSkipBasedOnBehavior(userId);
  if (shouldSkip) {
    console.log(`📱 User in app`);
    return { success: false, message: 'User in app' };
  }

  // Send
  const result = await this.sendNotification(payload);
  
  if (result.success) {
    await notificationThrottler.recordSent(userId, type);
  }

  return result;
}
```

#### Task 2.2: Update useNotifications Hook
**File:** `hooks/useNotifications.ts`

Add new methods:

```typescript
// Add these methods to the hook:

const sendLargeTransactionAlert = useCallback(
  async (amount: number, categoryName: string) => {
    const payload: NotificationPayload = {
      type: 'large_transaction' as any,
      title: `💰 Large transaction: ₹${amount.toLocaleString()}`,
      body: `[${categoryName}] Consider reviewing this spending.`,
      data: {
        screen: 'records',
        screen_params: { category: categoryName },
      },
    };
    await context.sendNotificationWithFilters(payload);
  },
  [context]
);

const sendBudgetExceededAlert = useCallback(
  async (categoryName: string, spent: number, budget: number) => {
    const exceeded = spent - budget;
    const payload: NotificationPayload = {
      type: 'budget_exceeded' as any,
      title: `❌ Budget exceeded: ${categoryName}`,
      body: `You've exceeded by ₹${exceeded.toLocaleString()} (${Math.round((spent/budget)*100)}%)`,
      data: {
        screen: 'analysis',
        screen_params: { category: categoryName },
      },
    };
    await context.sendNotificationWithFilters(payload);
  },
  [context]
);

const sendUnusualSpendingAlert = useCallback(
  async (categoryName: string, amount: number, average: number) => {
    const percentage = Math.round((amount / average) * 100);
    const payload: NotificationPayload = {
      type: 'unusual_spending' as any,
      title: `📈 Unusual spending: ${categoryName}`,
      body: `₹${amount.toLocaleString()} is ${percentage}% above your average`,
      data: {
        screen: 'records',
        screen_params: { category: categoryName },
      },
    };
    await context.sendNotificationWithFilters(payload);
  },
  [context]
);

// Export new methods
return {
  // ... existing methods
  sendLargeTransactionAlert,
  sendBudgetExceededAlert,
  sendUnusualSpendingAlert,
};
```

**Time estimate:** 4 hours

---

### Day 3: Add Large Transaction Alert (6 hours)

#### Task 3.1: Add to Add-Record Modal
**File:** `app/(modal)/add-record-modal.tsx`

Find where record is saved and add:

```typescript
// After successfully saving record
const handleRecordSaved = async (record: any) => {
  // Existing save logic...

  // NEW: Check if large transaction
  if (record.type === 'EXPENSE') {
    const [monthlyAverage, allRecords] = await Promise.all([
      getMonthlyAverageExpense(),
      readRecords(),
    ]);

    const largeTransactionThreshold = monthlyAverage * 0.5; // 50% of avg

    if (record.amount > largeTransactionThreshold && record.amount > 10000) {
      // Send large transaction alert
      try {
        await sendLargeTransactionAlert(
          record.amount,
          record.category // category name
        );
        console.log('✅ Large transaction alert sent');
      } catch (error) {
        console.warn('Failed to send alert', error);
      }
    }
  }

  // Close modal and refresh
  router.back();
  handleLoad();
};
```

**Implementation approach:**
1. Get user's monthly average spending
2. Check if new transaction > 50% of average
3. Check if amount > ₹10,000 (minimum threshold)
4. Send alert if both conditions met

**Time estimate:** 6 hours (includes testing)

---

### Day 4: Add Budget Exceeded Alert (6 hours)

#### Task 4.1: Add Budget Check to Record Modal
**File:** `app/(modal)/add-record-modal.tsx`

Add after transaction check:

```typescript
const handleRecordSaved = async (record: any) => {
  // ... existing code + large transaction check ...

  // NEW: Check budget exceeded
  if (record.type === 'EXPENSE' && record.category_id) {
    try {
      // Get category budget
      const { data: budget } = await supabase
        .from('budgets')
        .select('amount')
        .eq('category_id', record.category_id)
        .eq('user_id', session?.user?.id)
        .single();

      if (budget) {
        // Get total spent this month for category
        const { data: categoryRecords } = await supabase
          .from('records')
          .select('amount')
          .eq('category_id', record.category_id)
          .eq('user_id', session?.user?.id)
          .gte('transaction_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

        const totalSpent = (categoryRecords || []).reduce((sum, r) => sum + (r.amount || 0), 0);
        const percentage = (totalSpent / budget.amount) * 100;

        // Send alert if exceeded
        if (percentage > 100) {
          await sendBudgetExceededAlert(
            record.categories?.name,
            totalSpent,
            budget.amount
          );
          console.log('✅ Budget exceeded alert sent');
        }
      }
    } catch (error) {
      console.warn('Budget check failed', error);
      // Don't fail record save due to alert error
    }
  }

  router.back();
  handleLoad();
};
```

**Assumptions:**
- `budgets` table exists with `category_id`, `amount`, `user_id`
- `records` table has `transaction_date` field

**Time estimate:** 6 hours

---

### Day 5: Add Unusual Spending Alert (6 hours)

#### Task 5.1: Add Unusual Spending Detection
**File:** `app/(modal)/add-record-modal.tsx`

Add after budget check:

```typescript
const handleRecordSaved = async (record: any) => {
  // ... existing code + budget check ...

  // NEW: Check unusual spending
  if (record.type === 'EXPENSE' && record.category_id) {
    try {
      // Get last 30 days of spending for category
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: categoryRecords } = await supabase
        .from('records')
        .select('amount')
        .eq('category_id', record.category_id)
        .eq('user_id', session?.user?.id)
        .gte('transaction_date', thirtyDaysAgo.toISOString())
        .neq('id', record.id); // Exclude current transaction

      if (categoryRecords && categoryRecords.length > 5) {
        const total = categoryRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
        const average = total / categoryRecords.length;

        // Alert if > 2x average
        if (record.amount > average * 2) {
          await sendUnusualSpendingAlert(
            record.categories?.name,
            record.amount,
            average
          );
          console.log('✅ Unusual spending alert sent');
        }
      }
    } catch (error) {
      console.warn('Unusual spending check failed', error);
    }
  }

  router.back();
  handleLoad();
};
```

**Thresholds:**
- Need at least 5 prior transactions for comparison
- Alert if > 2x the average
- Only for expenses

**Time estimate:** 6 hours

---

## 🧪 Testing Plan (Day 5 Afternoon)

### Test 1: Large Transaction Alert
```
Steps:
1. Check user's monthly average (e.g., ₹1000/day = ₹30K/month)
2. Add expense of ₹20K
3. Expected: Alert "Large transaction: ₹20,000"
4. Verify: Notification received on device
```

### Test 2: Budget Exceeded
```
Steps:
1. Set budget for Food = ₹5000
2. Current spent = ₹4900
3. Add expense = ₹200
4. Total = ₹5100 (exceeds ₹5000)
5. Expected: Alert "Budget exceeded: Food"
6. Verify: Alert received
```

### Test 3: Unusual Spending
```
Steps:
1. User's average coffee spending = ₹300
2. Add coffee expense = ₹750 (2.5x average)
3. Expected: Alert "Unusual spending: Food"
4. Verify: Alert received
```

### Test 4: Throttling
```
Steps:
1. Send budget exceeded alert at 10:00 AM
2. Try to send another budget exceeded alert at 10:05 AM
3. Expected: Second alert NOT sent (throttled)
4. Send alert at 11:05 AM
5. Expected: Alert sent (1 hour passed)
```

### Test 5: DND (Do Not Disturb)
```
Steps:
1. Enable DND 22:00 - 08:00
2. Try to send alert at 23:00
3. Expected: Alert queued but not sent immediately
4. Try at 09:00 AM
5. Expected: Alert sent
```

---

## 📊 Completion Checklist

### By End of Day 1
- [ ] Update notification types
- [ ] Create NotificationThrottler
- [ ] Create SmartTimingEngine
- [ ] All imports working

### By End of Day 2
- [ ] Update NotificationService with smart filters
- [ ] Update useNotifications hook
- [ ] All new methods exported
- [ ] No TypeScript errors

### By End of Day 3
- [ ] Large transaction alert logic added
- [ ] Integrated with add-record-modal
- [ ] Tested locally
- [ ] Logs showing alerts being sent

### By End of Day 4
- [ ] Budget exceeded check added
- [ ] Integration tested
- [ ] Throttling working
- [ ] DND working

### By End of Day 5
- [ ] Unusual spending check added
- [ ] All 3 alerts working together
- [ ] All test scenarios passing
- [ ] Ready for production testing

---

## 🎯 Success Criteria

✅ **All 3 alerts trigger correctly**
✅ **Throttling prevents spam**
✅ **DND hours respected**
✅ **No crashes or errors**
✅ **Notifications delivered in real-time**
✅ **Deep links work (open to correct screen)**

---

## 📞 Troubleshooting

### Alert not sending?
1. Check user has notification permission
2. Check token is registered in database
3. Check throttler isn't blocking it
4. Check if in DND hours
5. Look at console logs

### Alert sending too often?
1. Check throttler is working
2. Verify min_interval is set
3. Check database throttle table

### Wrong category name?
1. Verify category object is passed
2. Check category_id foreign key
3. Test with console.log

---

## 🚀 After Week 1

Once Week 1 is complete and tested:
1. Do a soft launch (10% of users)
2. Monitor metrics (open rate, action rate)
3. Fix any issues
4. Roll out to 100%
5. Proceed to Week 2 (Daily Batch)

---

*Estimated completion: 26-30 developer hours*
*Expected impact: 25-35% engagement increase*
