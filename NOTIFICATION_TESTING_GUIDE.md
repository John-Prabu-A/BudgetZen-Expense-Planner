# BudgetZen Notification System - Testing & Debugging Guide

## 📋 Table of Contents
1. [Notification Pipeline Overview](#notification-pipeline-overview)
2. [Current Issues & Solutions](#current-issues--solutions)
3. [Testing on Real Device](#testing-on-real-device)
4. [Debugging Checklist](#debugging-checklist)
5. [Common Issues & Fixes](#common-issues--fixes)

---

## Notification Pipeline Overview

### Architecture Flow
```
User Action
    ↓
Preferences Check
    ↓
Notification Payload Created
    ↓
NotificationService.sendNotification()
    ↓
Expo Notifications API
    ↓
Device OS (iOS/Android)
    ↓
User sees notification
```

### Key Components
1. **NotificationService** - Core sending logic
2. **NotificationScheduler** - Time-based scheduling
3. **JobScheduler** - Background job orchestration
4. **Notification Jobs** - Daily/Weekly notification generators
5. **Notification Channels (Android)** - Define notification appearance
6. **Notification Categories (iOS)** - Define interactive actions

---

## Current Issues & Solutions

### Issue 1: Push Notifications Not Reaching Device
**Root Cause:** Expo push token not properly registered or persisted

**Solution:**
```typescript
// 1. Check if push token is being saved correctly
const { data, error } = await supabase
  .from('user_push_tokens')
  .select('push_token')
  .eq('user_id', userId)
  .single();

if (!data?.push_token) {
  console.error('❌ No push token found for user!');
}
```

### Issue 2: Job Scheduler Not Running
**Root Cause:** JobScheduler.start() not called or not properly initializing

**Solution:**
```typescript
// Ensure scheduler is started in app initialization
useEffect(() => {
  const scheduler = JobScheduler.getInstance();
  scheduler.start(); // Must be called!
  return () => scheduler.stop();
}, []);
```

### Issue 3: Time-based Notifications Not Firing
**Root Cause:** Device sleep mode or incomplete time calculation

**Solution:** Use Expo TaskManager for background task handling (add to roadmap)

---

## Testing on Real Device

### Prerequisites
- Physical Android or iOS device
- USB cable (Android) or Xcode (iOS)
- Latest Expo Go app installed
- Valid Firebase config (for Android)
- Valid APNs credentials (for iOS)

### Step 1: Setup Development Environment

#### For Android:
```bash
# Install Android Studio or ADB
adb --version

# Connect device
adb devices

# Enable developer mode on device:
# Settings → About → Tap "Build Number" 7 times → Developer Options → USB Debugging
```

#### For iOS:
```bash
# Ensure Xcode is installed
xcode-select --install

# Connect device via USB
# Trust the computer when prompted on device
```

### Step 2: Create Test Helper Component

Create `app/admin/notification-tester.tsx`:

```typescript
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Text } from 'react-native';
import { useTheme } from '@/context/Theme';
import { useAuth } from '@/context/Auth';
import { notificationService } from '@/lib/notifications/NotificationService';
import { NotificationType } from '@/lib/notifications/types';
import AnimatedButton from '@/components/AnimatedButton';
import * as Notifications from 'expo-notifications';

export default function NotificationTester() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getPushToken = async () => {
    try {
      setLoading(true);
      const { data } = await Notifications.getDevicePushTokenAsync();
      setPushToken(data.data);
      Alert.alert('Push Token', data.data);
      console.log('📱 Push Token:', data.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to get push token');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const testImmediateNotification = async () => {
    try {
      setLoading(true);
      const result = await notificationService.sendNotification({
        type: NotificationType.ACHIEVEMENT,
        title: '🎉 Test Notification',
        body: 'This is an immediate test notification!',
        data: { test: true, timestamp: new Date().toISOString() },
      });
      Alert.alert('Success', `Notification ID: ${result.notificationId}`);
      console.log('✅ Test notification sent:', result);
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const testScheduledNotification = async () => {
    try {
      setLoading(true);
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Scheduled Test',
          body: 'This notification is scheduled for 5 seconds from now',
          data: { test: true },
        },
        trigger: { seconds: 5 },
      });
      Alert.alert('Scheduled', `Notification ID: ${notificationId}`);
      console.log('✅ Scheduled notification:', notificationId);
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule notification');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const testBudgetAlert = async () => {
    try {
      setLoading(true);
      const result = await notificationService.sendNotification({
        type: NotificationType.BUDGET_WARNING,
        title: '⚠️ Budget Alert',
        body: 'You have spent 85% of your monthly budget!',
        data: {
          category: 'Food',
          spent: 4250,
          budget: 5000,
          percentage: 85,
        },
      });
      Alert.alert('Success', `Budget alert sent: ${result.notificationId}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to send budget alert');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 20,
    },
    section: {
      marginBottom: 20,
      padding: 15,
      backgroundColor: colors.surface,
      borderRadius: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 10,
    },
    infoText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 10,
      fontFamily: 'monospace',
    },
    button: {
      marginBottom: 10,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>📱 Device Info</Text>
        <Text style={styles.infoText}>User ID: {user?.id || 'Not logged in'}</Text>
        <Text style={styles.infoText}>Push Token: {pushToken ? pushToken.substring(0, 30) + '...' : 'Not retrieved'}</Text>
        <AnimatedButton
          onPress={getPushToken}
          loading={loading}
          style={styles.button}
        >
          Get Push Token
        </AnimatedButton>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>🧪 Immediate Notifications</Text>
        <AnimatedButton
          onPress={testImmediateNotification}
          loading={loading}
          style={styles.button}
        >
          Send Immediate Notification
        </AnimatedButton>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>⏱️ Scheduled Notifications</Text>
        <Text style={styles.infoText}>Fires in 5 seconds</Text>
        <AnimatedButton
          onPress={testScheduledNotification}
          loading={loading}
          style={styles.button}
        >
          Schedule Test (5 seconds)
        </AnimatedButton>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>💰 Test Budget Alert</Text>
        <AnimatedButton
          onPress={testBudgetAlert}
          loading={loading}
          style={styles.button}
        >
          Send Budget Alert
        </AnimatedButton>
      </View>

      <View style={styles.section}>
        <Text style={styles.infoText}>
          Check console (Cmd+D on iOS/Shake on Android) for detailed logs
        </Text>
      </View>
    </ScrollView>
  );
}
```

### Step 3: Run on Device

#### Android:
```bash
# Terminal 1: Start Expo development server
npm start

# Terminal 2: Run on Android device
npm run android

# Or with specific device:
adb devices
npm run android -- --device <device-id>
```

#### iOS:
```bash
# Terminal 1: Start Expo development server
npm start

# Terminal 2: Run on iOS device
npm run ios

# Or to list devices:
xcrun simctl list devices
```

### Step 4: Test Sequence

**✅ Basic Tests (5-10 minutes):**
1. Navigate to notification tester screen
2. Tap "Get Push Token" → Should display token in alert
3. Tap "Send Immediate Notification" → Should see notification immediately
4. Tap "Schedule Test" → Should see notification after 5 seconds
5. Check console for any error messages

**✅ Advanced Tests (15-20 minutes):**
1. Send notification with app in foreground → Check displayed
2. Send notification with app in background → Check received
3. Tap notification → Verify deep link works
4. Change notification preferences → Verify affects next notification
5. Test with screen locked → Verify notification appears

---

## Debugging Checklist

### Console Logging
Enable verbose logging:

```typescript
// Add to app/_layout.tsx
if (__DEV__) {
  // Log all notification events
  Notifications.addNotificationReceivedListener(notification => {
    console.log('🔔 [NOTIFICATION RECEIVED]', {
      title: notification.request.content.title,
      body: notification.request.content.body,
      data: notification.request.content.data,
      timestamp: new Date().toISOString(),
    });
  });

  Notifications.addNotificationResponseReceivedListener(response => {
    console.log('👆 [NOTIFICATION TAPPED]', {
      action: response.actionIdentifier,
      notification: response.notification.request.content,
      timestamp: new Date().toISOString(),
    });
  });
}
```

### Permission Checks

```typescript
// Check notification permissions
const checkPermissions = async () => {
  const { granted, canAskAgain } = await Notifications.getPermissionsAsync();
  console.log('📋 Notification Permissions:', {
    granted,
    canAskAgain,
    timestamp: new Date().toISOString(),
  });

  if (!granted && canAskAgain) {
    const response = await Notifications.requestPermissionsAsync();
    console.log('📋 Permission Request Response:', response);
  }
};
```

### Firebase Cloud Messaging (FCM) Verification

For Android push notifications:

```bash
# Check if google-services.json is properly configured
cat google-services.json | grep -i "project_id"

# Verify in Firebase Console:
# 1. Go to Firebase Console
# 2. Select your project
# 3. Settings → Service Accounts → Generate new private key
# 4. Verify FCM credentials are active
```

### APNs Verification (iOS)

For iOS push notifications:

```bash
# Verify APNs certificate is configured in Expo
# 1. Go to Expo Dashboard → Build → Credentials
# 2. Check if iOS credentials section shows APNs certificate
# 3. If missing, upload APNs certificate from Apple Developer Account
```

---

## Common Issues & Fixes

### Issue: "Permission Denied" on Push Token Request
```typescript
// Solution: Request permissions first
async function setupPushNotifications() {
  const { granted } = await Notifications.getPermissionsAsync();
  
  if (!granted) {
    const result = await Notifications.requestPermissionsAsync();
    if (!result.granted) {
      console.error('❌ Notifications permission denied');
      return;
    }
  }

  const token = await Notifications.getDevicePushTokenAsync();
  console.log('✅ Push token obtained:', token.data.data);
}
```

### Issue: Notifications Not Received in Background
```typescript
// Solution: Ensure handler is configured for background
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Background mode: must return true to show notification
    console.log('📱 Background notification:', notification.request.content.title);
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});
```

### Issue: Scheduled Notifications Not Firing
```typescript
// Solution: Check if device has enough battery and isn't in power save mode
// Also verify trigger time is in the future
async function scheduleNotification() {
  const now = new Date();
  const futureTime = new Date(now.getTime() + 10 * 60000); // 10 minutes from now
  
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test',
      body: 'Testing scheduled notification',
    },
    trigger: {
      hour: futureTime.getHours(),
      minute: futureTime.getMinutes(),
      repeats: false,
    },
  });

  console.log('✅ Scheduled:', notificationId);
}
```

### Issue: Job Scheduler Not Executing Jobs
```typescript
// Solution: Verify jobs are enabled and scheduler is started
const scheduler = JobScheduler.getInstance();

// Check job status
const jobs = scheduler.getRegisteredJobs();
console.log('📊 Registered jobs:', jobs.map(j => ({
  name: j.name,
  enabled: j.enabled,
  nextRun: j.nextRun,
})));

// Start scheduler
await scheduler.start();
console.log('✅ Scheduler started');
```

---

## Testing Matrix

| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| Get Push Token | Token displayed in alert | ⬜ |
| Immediate Notification | Notification visible | ⬜ |
| Scheduled Notification (5s) | Notification after 5s | ⬜ |
| Budget Alert | Budget notification sent | ⬜ |
| App Background | Notification still received | ⬜ |
| Notification Tap | Opens correct screen | ⬜ |
| Permission Denied | Graceful fallback | ⬜ |

---

## Monitoring in Production

### Firebase Cloud Messaging Dashboard
- Monitor delivery rates
- Check error logs
- Verify token health

### Sentry Integration (Optional)
```typescript
import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: 'YOUR_DSN',
  environment: __DEV__ ? 'development' : 'production',
});

// Log notification events
Notifications.addNotificationReceivedListener(notification => {
  Sentry.captureMessage('Notification received', {
    level: 'info',
    contexts: {
      notification: {
        title: notification.request.content.title,
        type: notification.request.content.data.type,
      },
    },
  });
});
```

---

## Next Steps

1. **Implement Notification Tester Component** ← Start here
2. **Test on Real Device** (Follow Step 3 above)
3. **Debug Using Checklist** (Debug any issues)
4. **Enable Background Task Manager** (For reliable scheduled notifications)
5. **Add Sentry Monitoring** (For production debugging)
6. **Implement Notification Queue** (For reliability)

