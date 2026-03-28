# 🚀 Quick Start: Testing Notifications

## **What You Need**
- Physical Android or iOS phone
- Expo Go app installed (free from Play Store/App Store)
- USB cable (for Android) or just iPhone (for iOS)
- Terminal with access to project

---

## **Testing Steps (5 minutes)**

### **Step 1: Start Development Server**
```bash
# In project terminal
npm start
```

Wait for output with QR code. You'll see:
```
✔ Expo development server running on:
  Local:     http://localhost:8081
  LAN:       http://192.168.x.x:8081
  
Scan the QR code above with Expo Go to open your app
```

**✅ Keep this terminal open**

---

### **Step 2: Open App on Your Phone**

**Android:**
1. Open **Expo Go** app
2. Tap **QR code icon** (top right)
3. Scan the QR code from terminal
4. Wait 30-60 seconds for app to load

**iOS:**
1. Open **Expo Go** app
2. Tap **Scan QR Code** at bottom
3. Point camera at QR code from terminal
4. Wait 30-60 seconds for app to load

---

### **Step 3: Navigate to Notification Tester**

Once app loads on your phone:

1. Tap the **hamburger menu** (☰) or bottom navigation
2. Find **Account** tab
3. Scroll down and tap **"🔔 Test Notifications (Dev)"** button
4. You'll see the **Notification Tester Screen**

---

### **Step 4: Run Tests in Order**

You'll see 5 main sections on the tester screen:

#### **Section 1: Permissions & Push Token**
```
1. Tap "Check Permissions" 
   → Should show "Permission Status: granted=true"
   
2. Tap "Get Push Token"
   → Should display your unique device token
   → Save this token (you'll need it for backend)
```

#### **Section 2: Immediate Notifications**
```
3. Tap "Send Test Notification"
   → On your phone you should IMMEDIATELY see:
   
   [TEST NOTIFICATION]
   This is a test notification from the tester
   
   ✅ If you see it = Push is working!
   ❌ If you don't = Check console for errors
```

#### **Section 3: Scheduled Notifications**
```
4. Tap "Schedule Test (5 seconds)"
   → Count to 5...
   → You should see:
   
   [⏰ SCHEDULED TEST]
   Scheduled notification test
   
   ✅ Success = Scheduling works!
   ❌ Nothing = Check battery/power save mode
```

#### **Section 4: Budget Alert Test**
```
5. Tap "Send Budget Alert"
   → You should see:
   
   [⚠️ BUDGET ALERT]
   You have spent 85% of your monthly budget!
   
   ✅ Success = Budget notifications ready!
```

#### **Section 5: Event Logs**
```
- Real-time logs appear here
- Shows all notification events
- Useful for debugging
- Tap "Clear Logs" to reset
```

---

## **Expected Output**

### ✅ All Tests Pass:
```
✅ Permission Status: granted=true
✅ Push token obtained: ExponentPushToken[...]
✅ Notification sent successfully: [ID]
✅ Notification scheduled: [ID]
✅ Budget alert sent: [ID]

Event Logs:
🔔 Notification received (foreground)
👆 Notification tapped
```

### ❌ If Something Fails:

**Problem: "Permission Denied"**
```
Solution:
1. Go to phone settings
2. Find app → Permissions → Notifications
3. Enable "Allow notifications"
4. Go back to app and retry
```

**Problem: No notifications appear**
```
Solution:
1. Check terminal console for errors (npm start terminal)
2. Make sure Expo Go is running (not closed)
3. Try tapping button again
4. Check phone notification center
```

**Problem: Can't find the tester button**
```
Solution:
1. Make sure you're on Account tab
2. Scroll down to see "🔔 Test Notifications (Dev)" button
3. If not there, close and reopen Expo Go
```

---

## **Checking Console Logs**

To see detailed logs on your phone:

**Android:**
- Shake your phone → Select "Show Element Inspector"
- Look for console messages

**iOS:**
- Press Cmd+D (if using Xcode)
- Or check XCode console directly

In the main terminal (where you ran `npm start`), you'll see:
```
🔔 [NOTIFICATION RECEIVED] {
  title: 'Test Notification',
  body: 'This is a test notification from the tester',
  timestamp: '2026-03-28T...'
}

👆 [NOTIFICATION TAPPED] {
  action: 'default',
  timestamp: '2026-03-28T...'
}
```

---

## **Testing Checklist**

Fill this out as you test:

| Test | Did You See It? | Notes |
|------|-----------------|-------|
| Permission Check | ☐ Yes ☐ No | |
| Push Token Displayed | ☐ Yes ☐ No | |
| Immediate Notification | ☐ Yes ☐ No | |
| Scheduled Notification (5s) | ☐ Yes ☐ No | |
| Budget Alert | ☐ Yes ☐ No | |
| Event Logs Updated | ☐ Yes ☐ No | |

---

## **What's Working Now?**

✅ **Immediate notifications** - Sent and received in foreground
✅ **Scheduled notifications** - Set to fire after delay
✅ **Budget alerts** - Custom data notifications
✅ **Real-time logging** - See all events as they happen
✅ **Permission handling** - Check and request permissions
✅ **Platform detection** - Works on iOS and Android

---

## **Next Steps After This**

### 1️⃣ **If all tests pass** ✅
- Notifications are working on your device!
- Next: Test with app in background
- Then: Full production build

### 2️⃣ **If tests fail** ❌
- Check error messages in terminal
- Follow debugging guide in NOTIFICATION_TESTING_GUIDE.md
- Enable verbose logging

### 3️⃣ **Ready for Production Build?**
- Android: `eas build --platform android`
- iOS: `eas build --platform ios`

---

## **Quick Commands Reference**

```bash
# Start dev server
npm start

# Restart if stuck
npm start -- --clear

# Kill dev server
Ctrl+C

# Run specific platform
npm run android    # Android
npm run ios        # iOS

# Full rebuild
npm start -- --clear
```

---

## **Troubleshooting**

### App won't load from QR code?
```bash
# Try this:
npm start -- --clear
# Scan QR code again
```

### Notifications not appearing?
```bash
# Check that:
1. Notifications are enabled on your phone
2. Volume/sound is on
3. App has notification permissions
4. Battery isn't in power save mode
```

### Can't find notification tester button?
```bash
# Make sure:
1. App is fully loaded (wait for tab bar)
2. You're on Account tab (bottom)
3. Scroll down to see button
4. App was reloaded after code changes
```

---

**Need help? Check the full guide:** `NOTIFICATION_TESTING_GUIDE.md`
