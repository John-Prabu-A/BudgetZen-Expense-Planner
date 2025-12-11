# Push Notifications - Code Location Reference

## 📍 Quick Location Index

### Active Code (Currently Working)
- ✅ **Token Registration**: `app/_layout.tsx` (lines 27-92)
- ✅ **Token Storage**: `lib/notifications/pushTokens.ts` (complete file)
- ✅ **Supabase Integration**: `lib/supabase.ts`

### Inactive Code (Built but Not Used)
- ❌ **Daily Reminders**: `lib/notifications/notificationScheduler.ts` (lines 25-49)
- ❌ **Budget Alerts**: `lib/notifications/notificationScheduler.ts` (lines 116-156)
- ❌ **Preferences Loading**: `context/Notifications.tsx` (lines 39-62)
- ❌ **Notification Hook**: `hooks/useNotifications.ts` (imported in index.tsx but not used)

---

## 🔍 Detailed File Breakdown

### 1. app/_layout.tsx - TOKEN REGISTRATION (ACTIVE ✅)

**Lines 17-22:** Imports
```typescript
import { NotificationsProvider, useNotifications } from '../context/Notifications';
```

**Lines 25-45:** Initialize notifications on app startup
```typescript
useEffect(() => {
    const initializeNotifications = async () => {
        try {
            await setupNotificationChannels();
            await setupNotificationCategories();
            setupDeepLinking();
            console.log('✅ Notifications initialized');
        } catch (error) {
            console.error('❌ Error initializing notifications:', error);
        }
    };
    initializeNotifications();
}, []);
```

**Lines 47-92:** Register token when user logs in
```typescript
useEffect(() => {
    let mounted = true;
    if (!session?.user?.id) return;

    (async () => {
        try {
            console.log('[NOTIF] Initializing user notification state...');
            
            // ✅ THIS ACTUALLY RUNS
            const registered = await registerPushToken();
            console.log('[NOTIF] registerPushToken ->', registered);

            if (registered === true) {
                // ✅ THIS ACTUALLY RUNS
                const synced = await syncTokenWithBackend(session.user.id);
                console.log('[NOTIF] syncTokenWithBackend ->', synced);
            }

            // ❌ THIS DOES NOT ACTUALLY RUN (but should)
            try {
                await loadNotificationPreferences(session.user.id);
                console.log('[NOTIF] Loaded notification preferences for user');
            } catch (prefsErr) {
                console.warn('[NOTIF] Loading notification preferences failed', prefsErr);
            }
        } catch (err) {
            console.error('[NOTIF] Error initializing notifications for user:', err);
        }
    })();

    return () => { mounted = false; };
}, [session?.user?.id, registerPushToken, syncTokenWithBackend, loadNotificationPreferences]);
```

**Lines 94-186:** Navigation logic (token registration doesn't stop execution here)

---

### 2. lib/notifications/pushTokens.ts - TOKEN MANAGEMENT

**Key Methods:**

#### registerDevice() - Lines 48-124
```typescript
async registerDevice(): Promise<string | ErrorCode> {
  // 1. Check if Android + Expo Go → return error
  // 2. Request permissions
  // 3. Call Notifications.getExpoPushTokenAsync()
  // 4. Returns: ExponentPushToken[...] or error code
  // 5. Store in SecureStore
}
```

#### syncTokenWithBackend() - Lines 177-218
```typescript
async syncTokenWithBackend(userId: string): Promise<boolean> {
  // 1. Get stored token
  // 2. Delete old token for user
  // 3. INSERT new token to Supabase notification_tokens table
  // 4. Returns: boolean success
}
```

#### getToken() - Lines 126-145
```typescript
async getToken(): Promise<string | null> {
  // 1. Check memory cache
  // 2. Check SecureStore
  // 3. If not found, call registerDevice()
}
```

---

### 3. context/Notifications.tsx - STATE MANAGEMENT

**Lines 39-62:** loadPreferences() - EXISTS BUT NEVER CALLED
```typescript
const loadPreferences = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
        // ❌ NEVER CALLED - but should be called when user logs in
        const prefs = await notificationPreferencesManager.getPreferences(userId);
        if (prefs) {
            setPreferences(prefs);
            console.log('✅ Preferences loaded');
        }
    } catch (err) {
        // error handling
    } finally {
        setIsLoading(false);
    }
}, []);
```

**Issue:** This function loads user's notification preferences from database but is never invoked.

---

### 4. hooks/useNotifications.ts - NOTIFICATION API

**Lines 31-42:** sendNotification() - Exists but not used
```typescript
const sendNotification = useCallback(
    async (payload: NotificationPayload): Promise<NotificationResult> => {
        if (!context.isNotificationAllowed()) {
            console.log('⚠️ Notification blocked by DND or user settings');
            return { success: false, message: 'Notifications are currently disabled' };
        }
        return notificationService.sendNotification(payload);
    },
    [context]
);
```

**Lines 46-53:** scheduleDailyReminder() - Exists but not used
```typescript
const scheduleDailyReminder = useCallback(async () => {
    if (!context.preferences?.dailyReminder.enabled) {
        console.log('⚠️ Daily reminder is disabled');
        return;
    }
    await notificationScheduler.scheduleDailyReminder(context.preferences);
}, [context.preferences]);
```

**Lines 55-62:** scheduleWeeklyReport() - Exists but not used
```typescript
const scheduleWeeklyReport = useCallback(async () => {
    if (!context.preferences?.weeklyReport.enabled) {
        console.log('⚠️ Weekly report is disabled');
        return;
    }
    await notificationScheduler.scheduleWeeklyReport(context.preferences);
}, [context.preferences]);
```

**Lines 65-72:** scheduleMonthlyReport() - Exists but not used
```typescript
const scheduleMonthlyReport = useCallback(async () => {
    if (!context.preferences?.monthlyReport.enabled) {
        console.log('⏭️ Monthly report is disabled');
        return;
    }
    await notificationScheduler.scheduleMonthlyReport(context.preferences);
}, [context.preferences]);
```

**Lines 77-89:** sendBudgetWarning() - Imported in index.tsx but never used
```typescript
const sendBudgetWarning = useCallback(
    async (categoryName: string, spent: number, budget: number) => {
        if (!context.preferences?.budgetAlerts.enabled || !context.isNotificationAllowed()) {
            return;
        }
        const percentage = (spent / budget) * 100;
        await notificationScheduler.sendBudgetWarning(categoryName, spent, budget, percentage);
    },
    [context]
);
```

---

### 5. lib/notifications/notificationScheduler.ts - SCHEDULING LOGIC

**Lines 25-49:** scheduleDailyReminder() - Never called
```typescript
async scheduleDailyReminder(preferences: NotificationPreferences): Promise<void> {
    if (!preferences.dailyReminder.enabled) {
        console.log('⏭️ Daily reminder disabled');
        return;
    }

    const [hour, minute] = preferences.dailyReminder.time.split(':').map(Number);

    const payload: NotificationPayload = {
        type: NotificationType.DAILY_REMINDER,
        title: '📝 Time to update your finances',
        body: "Quick! Log your today's expenses before you forget",
        data: {
            screen: 'records',
            type: 'daily_reminder',
        },
    };

    // ❌ This line would schedule the notification, but it's never called
    await notificationService.scheduleNotificationAtTime(
        payload,
        hour,
        minute,
        true  // recurring daily
    );

    console.log(`✅ Daily reminder scheduled for ${hour}:${minute}`);
}
```

**Lines 116-156:** sendBudgetWarning() & sendBudgetExceeded() - Never called
```typescript
// When spending reaches 80%:
async sendBudgetWarning(
    categoryName: string, 
    spent: number, 
    budget: number, 
    percentage: number
): Promise<void> {
    // ❌ NEVER CALLED - would need to be triggered when user adds expense
    const payload: NotificationPayload = {
        type: NotificationType.BUDGET_WARNING,
        title: `⚠️ Budget Alert: ${categoryName}`,
        body: `You've spent ₹${spent} of ₹${budget} (${percentage.toFixed(0)}%)`,
        data: {
            screen: 'analysis',
            category: categoryName,
            type: 'budget_warning',
        },
    };

    await notificationService.sendNotification(payload);
}

// When spending exceeds 100%:
async sendBudgetExceeded(
    categoryName: string, 
    spent: number, 
    budget: number, 
    exceededAmount: number
): Promise<void> {
    // ❌ NEVER CALLED - would need to be triggered when user adds expense
    const payload: NotificationPayload = {
        type: NotificationType.BUDGET_EXCEEDED,
        title: `❌ Budget Exceeded: ${categoryName}`,
        body: `You've exceeded by ₹${exceededAmount}. Total spent: ₹${spent}`,
        data: {
            screen: 'analysis',
            category: categoryName,
            type: 'budget_exceeded',
        },
    };

    await notificationService.sendNotification(payload);
}
```

---

### 6. app/(tabs)/index.tsx - WHERE TO ADD BUDGET CHECKING

**Line 30:** Imports but doesn't use
```typescript
const { sendBudgetWarning } = useNotifications();
```

**Missing Code - Should be added in expense handling:**
The Records screen imports `sendBudgetWarning` but never calls it when expenses are added.

**Location where it should be added:** In the data loading/transformation section (lines 54-108), when you retrieve records or in the modal submission handler.

---

### 7. lib/notifications/NotificationService.ts - CORE SERVICE

**Lines 62-103:** sendNotification() - Can send but never called
```typescript
async sendNotification(
    payload: NotificationPayload
): Promise<NotificationResult> {
    try {
        if (!payload.type || !payload.title || !payload.body) {
            console.warn('❌ Invalid notification payload');
            return { success: false, message: 'Invalid payload' };
        }

        const categoryId = getCategoryForNotificationType(payload.type);
        const channelId = getChannelForNotificationType(payload.type);

        // ❌ Scheduled with null trigger = immediate send
        // But since this is never called, nothing happens
        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: payload.title,
                body: payload.body,
                data: payload.data || {},
                badge: payload.badge,
                sound: payload.sound || true,
                categoryIdentifier: categoryId,
            },
            trigger: null, // null = send immediately
        });

        console.log(`✅ Notification sent: ${payload.title} (ID: ${notificationId})`);
        return { success: true, notificationId };
    } catch (error) {
        console.error('❌ Error sending notification:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
```

**Lines 105-168:** scheduleNotificationAtTime() - Can schedule but never called
```typescript
async scheduleNotificationAtTime(
    payload: NotificationPayload,
    hour: number,
    minute: number,
    recurring: boolean = false
): Promise<void> {
    // Calculates next occurrence of hour:minute
    // Schedules notification to trigger at that time
    // If recurring, schedules again after delivery
    // ❌ Never called, so nothing gets scheduled
}
```

---

## 🎯 Summary: What's Missing

| Feature | File | Lines | Status | What's Missing |
|---------|------|-------|--------|-----------------|
| Token Registration | `app/_layout.tsx` | 47-92 | ✅ Works | N/A |
| Load Preferences | `context/Notifications.tsx` | 39-62 | ❌ Unused | Never called after login |
| Daily Reminder | `hooks/useNotifications.ts` | 46-53 | ❌ Unused | Never called anywhere |
| Budget Warning | `hooks/useNotifications.ts` | 77-89 | ❌ Unused | Never called when adding expense |
| Send Notification | `lib/notifications/NotificationService.ts` | 62-103 | ❌ Unused | Never called from anywhere |
| Schedule Reminder | `lib/notifications/notificationScheduler.ts` | 25-49 | ❌ Unused | Never called from anywhere |

---

## 🚀 How to Activate (Code to Add)

### Option 1: Add to app/_layout.tsx (after preferences load)

```typescript
// Around line 86, after loading preferences:
try {
    await loadNotificationPreferences(session.user.id);
    console.log('[NOTIF] Loaded notification preferences for user');
    
    // ✅ ADD THIS: Schedule reminders if preferences exist
    const context = useNotificationsContext(); // You'll need to get context
    if (context.preferences?.dailyReminder.enabled) {
        await scheduleDailyReminder();
        console.log('✅ Daily reminder scheduled');
    }
} catch (prefsErr) {
    console.warn('[NOTIF] Loading notification preferences failed', prefsErr);
}
```

### Option 2: Add to add-record-modal.tsx (when saving expense)

```typescript
// After successfully saving expense record
const handleSaveRecord = async () => {
    const result = await saveRecord(recordData);
    
    if (result && recordData.type === 'EXPENSE' && recordData.category_id) {
        // ✅ ADD THIS: Check budget
        try {
            const budget = await getBudgetForCategory(recordData.category_id);
            const spent = await getSpentInCurrentMonth(recordData.category_id);
            const percentage = (spent / budget) * 100;
            
            if (percentage >= 100) {
                await sendBudgetExceeded(categoryName, spent, budget);
            } else if (percentage >= 80) {
                await sendBudgetWarning(categoryName, spent, budget);
            }
        } catch (error) {
            console.error('Failed to check budget alerts', error);
        }
    }
};
```

### Option 3: Add to app/preferences.tsx (when user saves preferences)

```typescript
const handleSaveNotificationPreferences = async (newPreferences) => {
    const saved = await savePreferences(newPreferences);
    
    if (saved) {
        // ✅ ADD THIS: Reschedule all reminders
        if (newPreferences.dailyReminder.enabled) {
            await scheduleDailyReminder();
        }
        if (newPreferences.weeklyReport.enabled) {
            await scheduleWeeklyReport();
        }
        if (newPreferences.monthlyReport.enabled) {
            await scheduleMonthlyReport();
        }
        
        Toast.success('Preferences saved and reminders updated');
    }
};
```

---

## 📝 Files to Modify to Activate All Features

1. **app/_layout.tsx** - Add preference loading & daily reminder scheduling
2. **app/(modal)/add-record-modal.tsx** - Add budget checking & alerts
3. **app/preferences.tsx** (if exists) - Add reminder scheduling on preference changes
4. **app/(onboarding)/reminders.tsx** or similar - Schedule initial reminders on onboarding complete

**No new files need to be created.** All code exists; just needs to be called.
