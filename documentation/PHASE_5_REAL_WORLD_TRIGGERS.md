# 🔔 Phase 5 - Real-World Notification Triggers Implementation

**Status:** Ready for Implementation  
**Last Updated:** December 21, 2025  
**Objective:** Implement automatic triggers for all 8 notification types

---

## 📋 Overview

Phase 5 implements the actual business logic that triggers notifications based on real user actions:

- ✅ Budget exceeded detection
- ✅ Unusual spending pattern detection  
- ✅ Goal milestone tracking
- ✅ Achievement rewards
- ✅ Real-time processing

---

## 🎯 Notification Types & Triggers

### 1️⃣ Budget Exceeded Alert

**When:** User spending exceeds budget threshold

**Implementation Location:** `supabase/functions/check-budget-alert/index.ts`

```typescript
// Backend Edge Function (runs on every record insert)
export async function checkBudgetAlert(
  userId: string,
  categoryId: string,
  amount: number
) {
  // Get user's budget for category
  const { data: budget } = await supabase
    .from('budgets')
    .select('limit_amount')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .single();

  if (!budget) return;

  // Get total spent this month
  const { data: records } = await supabase
    .from('records')
    .select('amount')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .gte('date', monthStart)
    .lte('date', monthEnd);

  const totalSpent = records.reduce((sum, r) => sum + r.amount, 0);
  const percentageOfBudget = (totalSpent / budget.limit_amount) * 100;

  // Get user preferences
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('budget_warning_threshold, budget_warnings_enabled')
    .eq('user_id', userId)
    .single();

  // Queue notification if threshold exceeded
  if (prefs?.budget_warnings_enabled && percentageOfBudget >= prefs.budget_warning_threshold) {
    await supabase.rpc('queue_notification', {
      p_user_id: userId,
      p_notification_type: 'budget_exceeded',
      p_title: `💸 Budget Alert: ${categoryName}`,
      p_body: `You've spent ${percentageOfBudget.toFixed(0)}% of your budget`,
      p_data: {
        screen: 'budget',
        category_id: categoryId,
        spent: totalSpent,
        budget: budget.limit_amount,
      },
      p_idempotency_key: `budget_${userId}_${categoryId}_${date}`,
    });
  }
}
```

**Trigger Points:**
- When user adds expense (from mobile app)
- When amount synced from bank (auto-import)

---

### 2️⃣ Unusual Spending Detection

**When:** User's spending pattern is significantly different

**Implementation Location:** `supabase/functions/detect-anomaly/index.ts`

```typescript
export async function detectAnomaly(
  userId: string,
  categoryId: string,
  amount: number,
  date: string
) {
  // Get average spending for this category
  const { data: history } = await supabase
    .from('records')
    .select('amount')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .gte('date', lastNinetyDaysStart)
    .lte('date', date);

  if (history.length < 10) return; // Need history to detect anomalies

  const amounts = history.map(r => r.amount);
  const average = amounts.reduce((a, b) => a + b) / amounts.length;
  const stdDev = calculateStdDev(amounts);

  // Detect if outlier (more than 2x standard deviations)
  if (amount > average + 2 * stdDev) {
    // Get user preferences
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('unusual_spending_enabled')
      .eq('user_id', userId)
      .single();

    if (prefs?.unusual_spending_enabled) {
      await supabase.rpc('queue_notification', {
        p_user_id: userId,
        p_notification_type: 'unusual_spending',
        p_title: '⚠️ Unusual Spending Detected',
        p_body: `Your $${amount} transaction is unusually high for this category`,
        p_data: {
          screen: 'analytics',
          category_id: categoryId,
          amount,
          average: average.toFixed(2),
        },
        p_idempotency_key: `anomaly_${userId}_${date}_${amount}`,
      });
    }
  }
}
```

**Trigger Points:**
- When expense amount > 2 standard deviations from average
- Only for categories with 10+ transaction history

---

### 3️⃣ Goal Progress Notification

**When:** User reaches milestone in their savings goal

**Implementation Location:** `supabase/functions/track-goal-progress/index.ts`

```typescript
export async function trackGoalProgress(
  userId: string,
  goalId: string
) {
  // Get goal details
  const { data: goal } = await supabase
    .from('goals')
    .select('target_amount, current_amount')
    .eq('id', goalId)
    .eq('user_id', userId)
    .single();

  // Get milestones (25%, 50%, 75%, 100%)
  const milestones = [25, 50, 75, 100];
  const percentProgress = (goal.current_amount / goal.target_amount) * 100;

  for (const milestone of milestones) {
    // Check if this milestone was just reached
    const { data: notified } = await supabase
      .from('goal_milestones_notified')
      .select('id')
      .eq('goal_id', goalId)
      .eq('milestone_percent', milestone)
      .single();

    if (!notified && percentProgress >= milestone) {
      // Mark milestone as notified
      await supabase
        .from('goal_milestones_notified')
        .insert({
          goal_id: goalId,
          milestone_percent: milestone,
          notified_at: new Date(),
        });

      // Queue notification
      await supabase.rpc('queue_notification', {
        p_user_id: userId,
        p_notification_type: 'goal_progress',
        p_title: `🎯 Goal Progress: ${milestone}% Complete`,
        p_body: `You're ${milestone}% toward your goal!`,
        p_data: {
          screen: 'goals',
          goal_id: goalId,
          milestone_percent: milestone,
        },
        p_idempotency_key: `goal_${goalId}_${milestone}`,
      });
    }
  }
}
```

**Trigger Points:**
- When goal amount updated
- Only notify on 25%, 50%, 75%, 100% milestones
- Only once per milestone

---

### 4️⃣ Achievement Rewards

**When:** User accomplishes a financial milestone

**Implementation Location:** `supabase/functions/award-achievements/index.ts`

```typescript
export async function awardAchievements(userId: string) {
  // Achievement 1: First transaction
  const { count: transactionCount } = await supabase
    .from('records')
    .select('id', { count: 'exact' })
    .eq('user_id', userId);

  if (transactionCount === 1) {
    await awardAchievement(userId, 'first_transaction', 'First Transaction', '🎉 You logged your first transaction!');
  }

  // Achievement 2: 7-day streak of logging
  const { data: lastSevenDays } = await supabase
    .from('records')
    .select('date')
    .eq('user_id', userId)
    .gte('date', sevenDaysAgo)
    .distinct();

  if (lastSevenDays.length === 7) {
    await awardAchievement(userId, 'seven_day_streak', '7-Day Logging Streak', '🔥 You\'ve logged expenses 7 days in a row!');
  }

  // Achievement 3: Under budget for month
  // ... similar logic

  // Achievement 4: $1000 saved in month
  // ... similar logic
}

async function awardAchievement(
  userId: string,
  achievementKey: string,
  title: string,
  message: string
) {
  // Check if already awarded
  const { data: existing } = await supabase
    .from('user_achievements')
    .select('id')
    .eq('user_id', userId)
    .eq('achievement_key', achievementKey)
    .single();

  if (existing) return; // Already awarded

  // Award achievement
  await supabase
    .from('user_achievements')
    .insert({
      user_id: userId,
      achievement_key: achievementKey,
      awarded_at: new Date(),
    });

  // Queue notification
  await supabase.rpc('queue_notification', {
    p_user_id: userId,
    p_notification_type: 'achievement',
    p_title: `🏆 ${title}`,
    p_body: message,
    p_data: {
      screen: 'achievements',
      achievement_key: achievementKey,
    },
    p_idempotency_key: `achievement_${userId}_${achievementKey}`,
  });
}
```

**Trigger Points:**
- First transaction logged
- 7-day logging streak
- Month completed under budget
- Saved $1000+ in a month

---

### 5️⃣ Daily Reminder (Already Implemented)

**When:** Every day at user's preferred time

**Implementation Location:** `supabase/functions/schedule-daily-jobs/index.ts`

Already has logic for daily reminders. No changes needed!

---

## 🔧 Integration Points

### Point 1: Add Expense Trigger

**File:** `app/(tabs)/add-record.tsx` or your expense entry screen

```typescript
async function saveExpense(expense: ExpenseData) {
  // ... existing save logic ...

  const { data: saved, error } = await supabase
    .from('records')
    .insert([expense])
    .select()
    .single();

  if (!error && saved) {
    // ✨ NEW: Trigger backend notification checks
    await supabase.functions.invoke('check-budget-alert', {
      body: {
        user_id: userId,
        category_id: saved.category_id,
        amount: saved.amount,
      },
    });

    await supabase.functions.invoke('detect-anomaly', {
      body: {
        user_id: userId,
        category_id: saved.category_id,
        amount: saved.amount,
        date: saved.date,
      },
    });

    showNotification('💾 Expense saved!');
  }
}
```

### Point 2: Goal Update Trigger

**File:** `app/(tabs)/goals.tsx` or goal tracking screen

```typescript
async function updateGoalAmount(goalId: string, newAmount: number) {
  const { error } = await supabase
    .from('goals')
    .update({ current_amount: newAmount })
    .eq('id', goalId)
    .eq('user_id', userId);

  if (!error) {
    // ✨ NEW: Trigger goal progress check
    await supabase.functions.invoke('track-goal-progress', {
      body: {
        user_id: userId,
        goal_id: goalId,
      },
    });
  }
}
```

### Point 3: Achievement Check (Optional)

Can run as daily background job or on-demand:

```typescript
// In app._layout.tsx, in the initialization useEffect
await supabase.functions.invoke('award-achievements', {
  body: { user_id: userId },
});
```

---

## 📊 Database Schema Requirements

All required tables already exist from Phase 1! No migrations needed.

Required tables (verify they exist):
- ✅ `notification_queue` - Stores pending notifications
- ✅ `notification_log` - Delivery tracking
- ✅ `notification_preferences` - User settings
- ✅ `goal_milestones_notified` - Track which milestones notified
- ✅ `user_achievements` - Track achievements awarded
- ✅ `records` - Expense records
- ✅ `budgets` - User budgets
- ✅ `goals` - User goals

---

## ✅ Phase 5 Implementation Checklist

**Backend Edge Functions:**
- [ ] `check-budget-alert` Edge Function created
- [ ] `detect-anomaly` Edge Function created
- [ ] `track-goal-progress` Edge Function created
- [ ] `award-achievements` Edge Function created
- [ ] All 4 functions deployed to Supabase

**Frontend Integration:**
- [ ] Budget alert trigger added to expense save
- [ ] Anomaly detection trigger added to expense save
- [ ] Goal progress trigger added to goal update
- [ ] Achievement check integrated (optional)

**Testing:**
- [ ] Add expense that exceeds budget → Budget alert fires
- [ ] Add unusual transaction → Anomaly alert fires
- [ ] Reach goal milestone → Goal progress notification
- [ ] Trigger achievement → Achievement notification

**Monitoring:**
- [ ] Check `job_execution_logs` for errors
- [ ] Verify notifications in `notification_log`
- [ ] Check queue for pending items

---

## 🧪 Quick Testing

```sql
-- Test Budget Alert
INSERT INTO notification_queue (
  user_id,
  notification_type,
  title,
  body,
  status,
  scheduled_for,
  idempotency_key
) VALUES (
  'user-id',
  'budget_exceeded',
  '💸 Budget Alert',
  'Test budget exceeded',
  'pending',
  NOW(),
  'test_budget_' || NOW()::text
);

-- Test Anomaly
INSERT INTO notification_queue (...) VALUES (
  'user-id',
  'unusual_spending',
  '⚠️ Unusual Spending',
  'Test anomaly detection',
  ...
);
```

---

**Phase 5 Status:** Ready to implement! 🚀

Once implemented, your app will send notifications automatically for all major user actions!
