# 🧪 Phase 4 - Testing Guide

**Phase:** 4 - User Preferences UI  
**Date:** December 21, 2025  
**Duration:** ~30 minutes for complete testing

---

## 🚀 Quick Start Testing (5 minutes)

### Test 1: Open Preferences Screen

```
1. Start the app
2. Navigate to Settings
3. Tap "Notifications" or "Notification Preferences"
4. Screen should load without errors
5. All sections should be visible:
   - 📝 Daily Reminders
   - 💰 Budget Alerts
   - 📊 Weekly Summaries
   - 🌙 Do Not Disturb
   - ⚙️ Other Features
6. All toggles should show OFF by default
```

**Expected Result:** ✅ Screen loads and displays all sections  
**Failure Mode:** ❌ Red screen error or missing sections

---

### Test 2: Toggle Daily Reminder

```
1. In "📝 Daily Reminders" section
2. Tap the toggle next to "Daily Reminder"
3. Toggle should animate to ON position
4. You should feel haptic feedback (light vibration)
5. Two new inputs should appear:
   - Time field (showing "19:00")
   - Timezone field (showing "UTC")
6. Tap toggle again to turn OFF
7. Time/Timezone fields should disappear
```

**Expected Result:** ✅ Toggle works, fields appear/disappear, haptic feedback felt  
**Failure Mode:** ❌ No animation, no haptic, fields don't appear

---

### Test 3: Save Preferences

```
1. Toggle "Daily Reminder" ON
2. Change time if desired
3. Tap "Save Preferences" button
4. Button should show "Saving..." briefly
5. Success alert should appear: "✅ Saved"
6. Close and reopen preferences screen
7. Daily Reminder should still be ON
8. Time should be preserved
```

**Expected Result:** ✅ Preferences saved and persist  
**Failure Mode:** ❌ Alert doesn't appear, settings reset after reopen

---

### Test 4: Test Notification Button

```
1. Scroll to bottom of screen
2. Tap "🧪 Send Test Notification" button
3. You should feel haptic feedback (notification pattern)
4. Alert should appear: "🧪 Test - Test notification sent!"
5. If app supports Expo Notifications, a notification should appear
```

**Expected Result:** ✅ Haptic feedback occurs, alert shown  
**Failure Mode:** ❌ No haptic, no alert, app crashes

---

## 🔍 Detailed Feature Testing (15 minutes)

### Test 5: Daily Reminder Settings

```
1. Toggle Daily Reminder ON
2. Tap Time field
3. Field should be interactive (ready for time input)
4. Tap Timezone field
5. Field should show current timezone
6. Save preferences
7. Reopen and verify settings preserved
```

**Verification Steps:**
- [ ] Time field accepts input
- [ ] Timezone field shows current setting
- [ ] Values persist after save
- [ ] No errors in console

---

### Test 6: Budget Alerts

```
1. In "💰 Budget Alerts" section
2. Toggle "Budget Warnings" ON
3. Five percentage buttons should appear: 50%, 70%, 80%, 90%, 100%
4. Tap each percentage
5. Selected percentage should highlight in accent color
6. Save and reopen
7. Selected percentage should be preserved
```

**Expected Behavior:**
- Selected button shows accent color (#accent)
- Unselected buttons show border color (#border)
- Text shows "Alert at % of budget: 80%"

**Failure Indicators:**
- ❌ Buttons don't respond to taps
- ❌ Selection doesn't change on tap
- ❌ Settings don't persist

---

### Test 7: Weekly Summary

```
1. In "📊 Weekly Summaries" section
2. Toggle "Weekly Summary" ON
3. Day selector should appear: Sun, Mon, Tue, Wed, Thu, Fri, Sat
4. Time field should appear
5. Tap each day - one should highlight
6. Verify only one day can be selected at a time
7. Change time value
8. Save and verify persistence
```

**Expected Results:**
- Selected day highlights in accent color
- Only one day selected at a time
- Time field shows selected time
- Settings persist

---

### Test 8: Do Not Disturb

```
1. In "🌙 Do Not Disturb" section
2. Toggle DND ON
3. Two time fields should appear:
   - Start Time (default: 22:00)
   - End Time (default: 08:00)
4. Modify start and end times
5. Informational text should display:
   "💡 Notifications during DND hours will be 
    queued and sent after the end time"
6. Save preferences
7. During DND hours, no notifications should appear
```

**Verification:**
- [ ] DND toggle works
- [ ] Time fields appear when enabled
- [ ] Helper text displays
- [ ] No notifications between start/end time
- [ ] Settings persist

---

### Test 9: Other Features

```
1. In "⚙️ Other Features" section
2. Toggle "Anomaly Detection" ON/OFF
   - Should detect unusual spending patterns
3. Toggle "Achievements" ON/OFF
   - Should award savings achievements
4. All toggles should have haptic feedback
5. Save preferences
```

**Expected Results:**
- All toggles respond to taps
- Haptic feedback on each toggle
- Settings save without errors

---

## 🎨 UI/UX Testing (5 minutes)

### Test 10: Theme Colors

```
Light Mode:
- Background: White or very light gray
- Text: Dark gray or black
- Cards: Slightly darker than background
- Accent: Your app's primary color

Dark Mode:
- Background: Dark gray or black
- Text: White
- Cards: Slightly lighter than background
- Accent: Same (should work in both modes)
```

**Check:**
- [ ] All text is readable in both modes
- [ ] No harsh color contrasts
- [ ] Cards distinct from background
- [ ] Accent color visible and accessible

### Test 11: Responsive Layout

```
Test on different screen sizes:
1. Small phone (320px width)
   - All text readable
   - Buttons not truncated
   - No horizontal scrolling
2. Regular phone (375px width)
   - Normal layout
3. Tablet (600px+ width)
   - Layout adapts properly
   - Maximum width respected
```

### Test 12: Touch Targets

```
Verify all interactive elements:
1. Toggle switches: Tap-able
2. Buttons (50%, 70%, etc): Each > 44px in height
3. Day selector: Each day > 44px wide
4. Save button: Full width, easy to tap
5. Percentage buttons: Clearly distinguishable
```

---

## 🔧 Database Integration Testing

### Test 13: Data Persistence

```
1. Open preferences screen
2. Make multiple changes:
   - Toggle 3+ settings
   - Change time values
   - Adjust budget percentage
3. Click "Save Preferences"
4. Verify success alert appears
5. Force close the app (swipe away from app switcher)
6. Reopen app
7. Navigate back to preferences
8. Verify ALL changes are still there
```

**Database Check (in Supabase):**
```sql
SELECT * FROM notification_preferences 
WHERE user_id = 'your-user-id';
```

You should see all your changes saved with updated timestamps.

---

### Test 14: Multi-User Isolation

```
If you have access to test accounts:
1. Login with User A
2. Set specific preferences
3. Save them
4. Logout
5. Login with User B
6. Navigate to preferences
7. Should see User B's preferences (not User A's)
8. Change some settings
9. Save
10. Logout and login as User A
11. Verify User A's original preferences are intact
```

---

## 🚨 Error Handling Testing

### Test 15: No Network Scenario

```
1. Turn off WiFi/mobile data
2. Open preferences
3. Toggle a setting and click "Save"
4. Should see error alert: "❌ Error - Failed to save..."
5. Turn network back on
6. Try saving again
7. Should succeed
```

### Test 16: Invalid Values

```
Current implementation uses UI constraints, but test edge cases:
1. Manually set time to "25:00" (should be invalid)
2. Set negative percentage (impossible via UI)
3. Verify UI validation prevents these
```

---

## 📊 Performance Testing

### Test 17: Load Time

```
1. Note the time when you open preferences
2. Screen should fully load and display within 2 seconds
3. All sections should render smoothly
4. No jank or stuttering when scrolling
```

**Performance Metrics:**
- Initial load: < 2 seconds
- Scrolling: 60 FPS
- Toggle animation: Smooth (no lag)

### Test 18: Save Performance

```
1. Click "Save Preferences"
2. Should show "Saving..." for 0.5-2 seconds
3. Then success alert
4. Should not freeze or become unresponsive
```

---

## 🎯 Integration Testing

### Test 19: Navigation Flow

```
1. From any screen, navigate to Settings
2. Tap "Notifications" → Should go to preferences
3. From preferences, go back → Should return to Settings
4. From preferences, rotate device → Should maintain state
5. During rotation, values should not change
```

### Test 20: Theme Integration

```
1. Open preferences in light mode
2. Change theme to dark mode (or system setting)
3. Preferences should immediately update colors
4. All text still readable
5. No visual glitches
```

---

## ✅ Complete Testing Checklist

### Functional Tests
- [ ] Screen opens without errors
- [ ] All sections display correctly
- [ ] All toggles work with haptic feedback
- [ ] Time inputs are interactive
- [ ] Budget percentage slider has 5 options
- [ ] Day selector shows 7 days
- [ ] Save button works
- [ ] Test button works
- [ ] Preferences persist after app restart

### UI/UX Tests
- [ ] Layout is responsive
- [ ] Colors match theme
- [ ] Text is readable
- [ ] Touch targets are adequate (44px+)
- [ ] Spacing is consistent
- [ ] Loading states show properly

### Integration Tests
- [ ] Uses correct user ID from auth
- [ ] Loads preferences on startup
- [ ] Saves to correct database table
- [ ] Multi-user isolation works
- [ ] Theme changes reflected
- [ ] Navigation works properly

### Error Handling
- [ ] Graceful error on network failure
- [ ] Clear error messages shown
- [ ] Retry works after network restored
- [ ] No silent failures

### Performance
- [ ] Loads in < 2 seconds
- [ ] Saves in < 5 seconds
- [ ] Scrolling smooth (60 FPS)
- [ ] No memory leaks
- [ ] No excessive renders

---

## 🐛 Troubleshooting

### Issue: "Property X does not exist on type NotificationPreferences"
**Solution:** Check that you're accessing nested properties correctly
```typescript
// Wrong:
localPrefs.daily_reminder_enabled

// Correct:
localPrefs.dailyReminder.enabled
```

### Issue: Changes not saving
**Solution:** 
1. Check network connectivity
2. Verify Supabase connection
3. Check browser console for errors
4. Verify user is authenticated

### Issue: Haptic feedback not working
**Solution:**
1. Ensure device has haptics enabled (Settings)
2. Check that `expo-haptics` is installed: `npm list expo-haptics`
3. Try restarting app

### Issue: Preferences not persisting
**Solution:**
1. Check that `savePreferences()` succeeds (alert appears)
2. Verify database has data: Query Supabase
3. Check RLS policies allow write access
4. Verify user ID is correct

---

## 🎓 Success Criteria

**Phase 4 is complete when:**

✅ Preferences screen opens without errors  
✅ All settings toggle/change correctly  
✅ Haptic feedback works on interactions  
✅ Preferences save to database  
✅ Preferences load on app startup  
✅ Changes persist after app restart  
✅ Theme colors adapt correctly  
✅ No console errors  
✅ All touch targets are ≥ 44px  
✅ No network errors on save failure  

---

## 📝 Test Report Template

Use this to document your testing:

```markdown
## Phase 4 Testing Report

**Date:** [DATE]  
**Tester:** [YOUR NAME]  
**Device:** [iPhone 14 Pro / Android Phone / etc]  
**OS Version:** [iOS 17.2 / Android 14 / etc]  

### Test Results
- [x] Test 1: Preferences screen opens
- [ ] Test 2: Daily reminder toggle works
- [ ] Test 3: Save functionality works
... (rest of tests)

### Issues Found
1. [Issue description and steps to reproduce]
2. [Another issue if found]

### Overall Status
✅ Ready for Phase 5 / ❌ Needs Fixes

### Notes
[Any additional observations]
```

---

**Ready to test Phase 4! 🎉**

All tests should pass before moving to Phase 5 (Real-World Triggers).
