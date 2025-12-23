# ⚡ Phase 3 Quick Reference Card

**Print or Bookmark This!**

---

## 🎯 What Phase 3 Does

| Component | Function | When |
|-----------|----------|------|
| **Queue Manager** | Stores notifications pending delivery | Backend queues them |
| **Real-Time Listener** | Shows notifications instantly | When app is open |
| **5-Min Processor** | Sends queued notifications | Every 5 minutes |

---

## 📱 User Experience Flow

```
┌─────────────────────────────────────┐
│  Something Happens                  │
│  (Budget exceeded, reminder time)    │
└──────────────────┬──────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
   APP OPEN?            APP CLOSED?
    │                      │
    │ Real-Time           │ Queue
    │ (< 1 sec)           │ (< 5 min)
    │                      │
    ▼                      ▼
   🔔 NOTIFICATION APPEARS 🔔
```

---

## 🔧 Code Files Modified

| File | Added | Lines |
|------|-------|-------|
| `context/Notifications.tsx` | Queue methods | ~80 |
| `app/_layout.tsx` | Queue processor | ~45 |
| `app/_layout.tsx` | Real-time listener | ~45 |

---

## 💻 Using in Your Components

```typescript
// Import
import { useNotifications } from '@/context/Notifications';

// Use in component
const { queueNotification, getQueueStats } = useNotifications();

// Queue a notification
await queueNotification(
  userId,
  'budget_alert',
  'Budget Alert!',
  'You exceeded your budget',
  { category: 'Food' },
  `alert_${userId}_${new Date().toDateString()}`
);

// Get stats
const stats = await getQueueStats(userId);
console.log(`Pending: ${stats.pending}, Sent: ${stats.sent}`);

// Manually process queue
await sendPendingNotifications(userId);
```

---

## 🗄️ Database Tables Used

```
notification_queue
├─ Stores pending notifications
├─ Status: pending → sent → delivered
└─ Real-time triggers on INSERT

notification_log
├─ Audit trail of all sends
├─ Tracks delivery status
└─ Captures any error messages

notification_preferences
├─ User notification settings
├─ DND hours, timezone, enabled types
└─ Controls which notifications send
```

---

## 🧪 Quick Test Commands

### Real-Time Test (App Must Be Open)
```sql
INSERT INTO notification_queue (
  user_id, notification_type, title, body,
  status, scheduled_for, idempotency_key
) VALUES (
  'YOUR-ID', 'test', '🧪 Test',
  'Should appear instantly',
  'pending', NOW(), 'test_' || NOW()::text
);
-- Expected: Notification appears < 1 second
```

### Queue Test (App Can Be Closed)
```sql
-- Same INSERT as above, restart app
-- Expected: Notification appears on resume
```

### Check Queue Status
```typescript
const stats = await getQueueStats(userId);
console.log(stats); // { pending: X, sent: Y, failed: Z, total: W }
```

---

## 🔴 Error Troubleshooting

| Error | Solution |
|-------|----------|
| `Cannot find name 'supabase'` | Add import to `app/_layout.tsx` |
| Real-time not triggering | Enable Realtime on `notification_queue` table |
| Queue processor not running | Verify app is initialized properly |
| Duplicate notifications | Ensure unique idempotency keys |
| Notifications not sent | Check RLS policies allow read/insert |

---

## 📊 Console Log Indicators

### ✅ Everything Working
```
[NOTIF] registerPushToken -> true
[NOTIF] syncTokenWithBackend -> true
[NOTIF] Loaded notification preferences
[NOTIF] Queue processed: 5 sent, 0 failed
[NOTIF] 🔔 New notification from queue: ...
```

### ⚠️ Something Wrong
```
[NOTIF] registerPushToken -> false
[NOTIF] Error processing queue: ...
❌ Error initializing notifications
```

---

## 🎯 Testing Checklist

- [ ] App starts without errors
- [ ] Real-time notification appears < 1 sec when app open
- [ ] Queued notification appears when app reopens
- [ ] No duplicate notifications appear
- [ ] Console shows "Queue processed" messages
- [ ] `notification_log` table has entries
- [ ] `notification_queue` status changes pending→sent

---

## ⏱️ Timing Summary

| Operation | Timing | When |
|-----------|--------|------|
| Real-time delivery | < 1 second | App must be open |
| Queue processing | Every 5 minutes | Even when app closed |
| Startup check | Immediate | When app launches |
| Retry attempt 1 | 1 minute | After first failure |
| Retry attempt 2 | 3 minutes | After second failure |
| Retry attempt 3 | 7 minutes | After third failure |

---

## 🚀 Environment Variables Needed

```bash
# .env file (should already exist)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📞 Quick Help

**Real-Time Not Working?**
```
1. Check Supabase Dashboard → Table → notification_queue → Realtime is ON
2. Verify user_id in context matches test data
3. Check browser console for errors
4. Verify RLS policies allow SELECT
```

**Queue Processor Not Running?**
```
1. Check if interval initialized: look for setup log
2. Force test: restart app while notification pending
3. Check if app actually backgrounded (not just minimized)
4. Verify no errors in console
```

**Notifications Never Arriving?**
```
1. Verify push tokens registered: SELECT * FROM push_tokens
2. Check if tokens marked valid: is_valid = true
3. Check notification_log for errors
4. Verify Expo push credentials configured
```

---

## 📈 Performance Metrics to Track

```typescript
// Monitor these in your app:
const metrics = {
  realTimeLatency: '<1s',        // How fast real-time shows
  queueProcessingDelay: '<5min',  // How long queue takes
  deliveryRate: '95%+',           // How many reach devices
  retrySuccess: '90%+',           // How many succeed after retry
};
```

---

## 🎓 Learning Resources

- Real-time docs: `NOTIFICATION_ARCHITECTURE_DIAGRAMS.md` → "Real-Time Alert Flow"
- Queue docs: `NOTIFICATION_SYSTEM_ANALYSIS.md` → "Queue Processing"
- Full guide: `NOTIFICATION_IMPLEMENTATION_GUIDE.md`

---

**Save this card!** You'll reference it while testing. 📌
