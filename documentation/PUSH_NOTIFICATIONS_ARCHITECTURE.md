# Push Notifications - Visual Architecture & Data Flow

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        BudgetZen App                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
                    ┌──────────────────┐
                    │  App Initialization  │
                    │  (_layout.tsx)   │
                    └──────────────────┘
                              │
                              ↓
                    ┌──────────────────────────┐
                    │ registerPushToken()      │ ✅ ACTIVE
                    │ (app/_layout.tsx)        │
                    └──────────────────────────┘
                              │
                              ↓
        ┌─────────────────────┴──────────────────────┐
        │                                            │
        ↓                                            ↓
 ┌─────────────────┐                    ┌─────────────────────┐
 │  Expo Services  │                    │   Supabase Backend  │
 │  (getToken)     │                    │   (save token)      │
 └─────────────────┘                    └─────────────────────┘
        │                                            │
        │ ExponentPushToken[...]                    │
        │                                            │
        └──────────────────┬─────────────────────────┘
                           │
                           ↓
                ┌──────────────────────┐
                │ Firebase Cloud       │
                │ Messaging (FCM)      │
                │ Server Ready         │
                └──────────────────────┘
                 (Can receive push tokens
                  but NO client sending)
```

---

## 📋 What's Implemented vs. What's Missing

### ✅ IMPLEMENTED - Token Registration Flow

```
App Launch
    ↓
┌──────────────────────────────────────────────┐
│ app/_layout.tsx                              │
│ useEffect() → registerPushToken()            │ ✅ RUNNING
└──────────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────┐
│ lib/notifications/pushTokens.ts              │
│ PushTokenManager.registerDevice()            │ ✅ RUNNING
└──────────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────┐
│ Expo.Notifications.getExpoPushTokenAsync()   │ ✅ RUNNING
│ Returns: ExponentPushToken[...]              │
└──────────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────┐
│ Supabase (notification_tokens table)         │ ✅ RUNNING
│ Save token with user_id, device_id, os_type │
└──────────────────────────────────────────────┘
```

### ❌ NOT IMPLEMENTED - Daily Reminder Scheduling

```
User Completes Onboarding
    ↓
❌ scheduleDailyReminder() NOT CALLED ANYWHERE
    ↓
❌ Preferences NOT checked at app startup
    ↓
❌ Reminder timers NEVER scheduled
    ↓
❌ Users get NO daily "log expenses" reminders
```

### ❌ NOT IMPLEMENTED - Budget Alerts

```
User Adds Expense
    ↓
┌──────────────────────────────────────────────┐
│ app/(modal)/add-record-modal.tsx             │
│ handleAddRecord() saves to database          │ ✅ WORKS
└──────────────────────────────────────────────┘
    ↓
❌ NO CODE to:
   - Fetch budget for category
   - Calculate spent amount
   - Compare to 80% or 100% threshold
   - Call sendBudgetWarning() or sendBudgetExceeded()
    ↓
❌ Users get NO budget warnings
```

---

## 🔄 Complete Notification Flow Diagram

### Current State (Only Token Registration Works)
```
┌─────────────────────────────────────────────────────────────┐
│                    DEVICE SIDE (App)                         │
│                                                               │
│  Token Registration: ✅ WORKS                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. App starts                                        │  │
│  │ 2. registerPushToken() called                        │  │
│  │ 3. Get token from Expo                               │  │
│  │ 4. Store locally in SecureStore                      │  │
│  │ 5. Send to Supabase                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  Daily Reminders: ❌ DOESN'T WORK                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. scheduleDailyReminder() function exists           │  │
│  │ 2. BUT: Never called                                │  │
│  │ 3. Preferences exist but unused                      │  │
│  │ 4. No timers scheduled                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  Budget Alerts: ❌ DOESN'T WORK                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. sendBudgetWarning() function exists              │  │
│  │ 2. BUT: Never called when adding expense            │  │
│  │ 3. No budget checking logic                          │  │
│  │ 4. No comparisons to thresholds                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND SIDE (Supabase)                   │
│                                                               │
│  Tables:                                                     │
│  ├─ notification_tokens (populated ✅)                      │
│  │  ├─ user_id                                              │
│  │  ├─ expo_push_token (has real tokens ✅)               │
│  │  ├─ device_id                                            │
│  │  └─ os_type                                              │
│  │                                                           │
│  ├─ notification_preferences (exists but unused ❌)        │
│  │  ├─ daily_reminder                                       │
│  │  ├─ weekly_report                                        │
│  │  ├─ budget_alerts                                        │
│  │  └─ monthly_report                                       │
│  │                                                           │
│  └─ Sending mechanism: NOT YET IMPLEMENTED ❌              │
│     (Would need backend job or webhook)                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              FIREBASE CLOUD MESSAGING (FCM)                  │
│                                                               │
│  Status: ✅ Connected (app can receive)                     │
│  Can receive push tokens from: ✅                            │
│  Can send messages to: ❌ (no sender implementation)        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    USER DEVICE                               │
│                                                               │
│  Status: Ready to receive notifications ✅                  │
│  Notifications received: 0 ❌                               │
│  Notifications showing: 0 ❌                                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Where Each Piece Is Located

### File Structure & Status

```
lib/notifications/
├─ NotificationService.ts ✅
│  ├─ sendNotification() ✅ method exists
│  ├─ scheduleNotificationAtTime() ✅ method exists
│  ├─ scheduleWeeklyNotification() ✅ method exists
│  └─ scheduleMonthlyNotification() ✅ method exists
│
├─ notificationScheduler.ts ✅
│  ├─ scheduleDailyReminder() ✅ method exists (NOT CALLED ❌)
│  ├─ scheduleWeeklyReport() ✅ method exists (NOT CALLED ❌)
│  ├─ scheduleMonthlyReport() ✅ method exists (NOT CALLED ❌)
│  ├─ sendBudgetWarning() ✅ method exists (NOT CALLED ❌)
│  ├─ sendBudgetExceeded() ✅ method exists (NOT CALLED ❌)
│  ├─ sendAchievement() ✅ method exists (NOT CALLED ❌)
│  ├─ sendSavingsGoalProgress() ✅ method exists (NOT CALLED ❌)
│  ├─ sendUnusualSpendingAlert() ✅ method exists (NOT CALLED ❌)
│  └─ sendLowBalanceAlert() ✅ method exists (NOT CALLED ❌)
│
├─ pushTokens.ts ✅
│  ├─ registerDevice() ✅ CALLED in _layout.tsx
│  ├─ syncTokenWithBackend() ✅ CALLED in _layout.tsx
│  └─ removeTokenFromBackend() ✅ method exists
│
├─ notificationPreferences.ts ✅
│  ├─ getPreferences() ✅ method exists (NOT CALLED ❌)
│  ├─ savePreferences() ✅ method exists (NOT CALLED ❌)
│  └─ updatePreferences() ✅ method exists (NOT CALLED ❌)
│
├─ notificationChannels.ts ✅
│  └─ setupNotificationChannels() ✅ CALLED in _layout.tsx
│
├─ notificationCategories.ts ✅
│  └─ setupNotificationCategories() ✅ CALLED in _layout.tsx
│
└─ types.ts ✅
   └─ Type definitions

context/
├─ Notifications.tsx ✅
│  ├─ loadPreferences() ✅ exists (NEVER CALLED ❌)
│  ├─ savePreferences() ✅ exists (NEVER CALLED ❌)
│  ├─ updatePreference() ✅ exists (NEVER CALLED ❌)
│  └─ registerPushToken() ✅ CALLED in _layout.tsx
│
└─ App.tsx (other contexts)

hooks/
└─ useNotifications.ts ✅
   ├─ sendNotification() ✅ exists (NEVER CALLED ❌)
   ├─ scheduleDailyReminder() ✅ exists (NEVER CALLED ❌)
   ├─ sendBudgetWarning() ✅ exists (IMPORTED ✅ but NEVER USED ❌)
   ├─ sendAchievement() ✅ exists (NEVER CALLED ❌)
   ├─ registerPushToken() ✅ exists (CALLED in _layout.tsx ✅)
   └─ ... (many more methods)

app/
├─ _layout.tsx
│  ├─ registerPushToken() ✅ CALLED
│  ├─ syncTokenWithBackend() ✅ CALLED
│  └─ scheduleDailyReminder() ❌ NOT CALLED
│
├─ (tabs)/
│  └─ index.tsx
│     ├─ Imports: sendBudgetWarning ✅
│     └─ Usage: ❌ NEVER USED
│
├─ (modal)/
│  └─ add-record-modal.tsx
│     ├─ Saves expense ✅
│     └─ Checks budget ❌ NO BUDGET CHECK CODE
│
├─ preferences.tsx
│  └─ Saves preferences ✅ BUT doesn't schedule reminders ❌
│
└─ (onboarding)/
   └─ (any screen)
      └─ Completes onboarding ✅ BUT doesn't schedule reminders ❌
```

---

## 🔌 How to Activate Features

### 1. Daily Reminders - Add to app/_layout.tsx

```typescript
// When user session is available and onboarding complete
useEffect(() => {
  if (session?.user?.id && currentStep === OnboardingStep.COMPLETED) {
    (async () => {
      try {
        const prefs = await notificationPreferencesManager.getPreferences(session.user.id);
        if (prefs?.dailyReminder.enabled) {
          await scheduleDailyReminder();
          console.log('✅ Daily reminder scheduled');
        }
      } catch (error) {
        console.error('Failed to schedule reminders', error);
      }
    })();
  }
}, [session?.user?.id, currentStep]);
```

### 2. Budget Alerts - Add to add-record-modal.tsx

```typescript
// After successfully adding record
const handleAddRecord = async () => {
  const result = await createRecord(recordData);
  
  if (result && recordData.type === 'EXPENSE') {
    // Check budget
    const budget = await getBudgetForCategory(recordData.category_id);
    const spent = await getTotalSpentForCategory(recordData.category_id);
    const percentage = (spent / budget) * 100;
    
    if (percentage >= 100) {
      await sendBudgetExceeded(categoryName, spent, budget);
    } else if (percentage >= 80) {
      await sendBudgetWarning(categoryName, spent, budget);
    }
  }
};
```

### 3. Preferences Management - Add to preferences.tsx

```typescript
const handleSavePreferences = async (newPrefs) => {
  await savePreferences(newPrefs);
  
  // Reschedule notifications
  if (newPrefs.dailyReminder.enabled) {
    await scheduleDailyReminder();
  }
  if (newPrefs.weeklyReport.enabled) {
    await scheduleWeeklyReport();
  }
  if (newPrefs.monthlyReport.enabled) {
    await scheduleMonthlyReport();
  }
};
```

---

## 📊 Current vs. Ideal State

### Current Implementation
```
User Journey:
1. Install app
2. Go through onboarding
3. Log in
4. Add transactions
5. Get NO notifications (no reminders, no alerts)
6. App stays idle unless user opens it
```

### Ideal Implementation
```
User Journey:
1. Install app
2. Go through onboarding
   → Daily reminders scheduled ✅
   → Preferences saved ✅
3. Log in
4. Add transaction
   → Budget checked ✅
   → Alert sent if over threshold ✅
5. Every day at scheduled time
   → Reminder sent to log expenses ✅
6. Every week/month
   → Report sent to app ✅
7. User taps notification
   → App opens to relevant screen ✅
```

---

## 📞 Function Call Chain Comparison

### ✅ What Actually Happens (Token Registration)
```
App Launch
  ↓
_layout.tsx: useEffect()
  ↓
registerPushToken()
  ↓
pushTokenManager.registerDevice()
  ↓
Notifications.getExpoPushTokenAsync()
  ↓
syncTokenWithBackend(userId)
  ↓
Supabase: INSERT into notification_tokens
  ↓
✅ Token saved
```

### ❌ What Should Happen (Daily Reminder)
```
User Completes Onboarding OR Opens App
  ↓
Check if daily reminder enabled (preferences)
  ↓
Call scheduleDailyReminder()
  ↓
Set up recurring notification at user's time
  ↓
[EVERYDAY at scheduled time]:
  Notification Service sends notification
  ↓
[User receives]: "Time to log expenses"
  ↓
[User taps]: Opens Records screen
  ✅ Goal achieved
```

**Currently stops at:** "User Completes Onboarding" (nothing happens after)

---

## 🎯 Summary

| Component | Exists | Working | Used Actively | Status |
|-----------|--------|---------|---------------|--------|
| Push Token Registration | ✅ | ✅ | ✅ | 🟢 LIVE |
| Token Storage (Supabase) | ✅ | ✅ | ✅ | 🟢 LIVE |
| Notification Service | ✅ | ✅ | ❌ | 🔴 UNUSED |
| Notification Scheduler | ✅ | ✅ | ❌ | 🔴 UNUSED |
| Daily Reminder Logic | ✅ | ✅ | ❌ | 🔴 UNUSED |
| Budget Alert Logic | ✅ | ✅ | ❌ | 🔴 UNUSED |
| Preferences Management | ✅ | ✅ | ❌ | 🔴 UNUSED |
| DND (Do Not Disturb) | ✅ | ✅ | ❌ | 🔴 UNUSED |

**Conclusion:** All infrastructure exists, but 90% is dormant waiting for integration points to be added.
