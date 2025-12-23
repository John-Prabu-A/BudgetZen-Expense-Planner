# 🎨 Phase 4 - User Preferences UI Implementation

**Status:** Ready for Implementation  
**Last Updated:** December 21, 2025  
**Objective:** Build UI for users to customize notification settings

---

## 📋 Overview

Phase 4 creates a beautiful, intuitive preferences screen where users can:
- ✅ Enable/disable each notification type
- ✅ Set preferred notification times
- ✅ Select timezone
- ✅ Configure Do Not Disturb hours
- ✅ View current notification status
- ✅ Test notifications

---

## 🎯 File Structure

```
app/
  preferences/
    notifications.tsx (NEW - Main preferences screen)
components/
  NotificationPreferenceToggle.tsx (NEW - Toggle component)
  NotificationTimeSelector.tsx (NEW - Time picker)
  DndHoursEditor.tsx (NEW - DND configuration)
  NotificationPreviewCard.tsx (NEW - Preview notifications)
lib/
  notifications/
    notificationPreferences.ts (EXISTING - Already has methods)
```

---

## 📱 Step 1: Create Notification Preferences Screen

**File:** `app/preferences/notifications.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Switch, Text, ActivityIndicator, Alert } from 'react-native';
import { useNotifications } from '@/context/Notifications';
import { useAuth } from '@/context/Auth';
import { useTheme } from '@/context/Theme';
import { NotificationPreferences } from '@/lib/notifications/types';
import * as Haptics from 'expo-haptics';

export default function NotificationsPreferencesScreen() {
  const { preferences, loadPreferences, savePreferences, isLoading } = useNotifications();
  const { session } = useAuth();
  const { colors, isDark } = useTheme();
  
  const [localPrefs, setLocalPrefs] = useState<NotificationPreferences | null>(preferences);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      loadPreferences(session.user.id);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const handleToggle = async (key: string, value: boolean) => {
    if (!localPrefs) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const updated = { ...localPrefs, [key]: value };
    setLocalPrefs(updated);
  };

  const handleSave = async () => {
    if (!localPrefs) return;
    
    setSaving(true);
    try {
      const success = await savePreferences(localPrefs);
      if (success) {
        Alert.alert('✅ Saved', 'Your notification preferences have been saved.');
      } else {
        Alert.alert('❌ Error', 'Failed to save preferences.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !localPrefs) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16 }}
    >
      {/* Header */}
      <Text style={{ 
        fontSize: 24, 
        fontWeight: '700', 
        color: colors.text, 
        marginBottom: 8 
      }}>
        📬 Notifications
      </Text>
      <Text style={{ 
        fontSize: 14, 
        color: colors.textSecondary, 
        marginBottom: 24 
      }}>
        Customize when and how you receive notifications
      </Text>

      {/* Daily Reminders Section */}
      <Section title="📝 Daily Reminders" colors={colors}>
        <PreferenceRow
          label="Daily Reminder"
          description="Get reminded to log your expenses"
          value={localPrefs.daily_reminder_enabled || false}
          onToggle={(val) => handleToggle('daily_reminder_enabled', val)}
        />
        {localPrefs.daily_reminder_enabled && (
          <>
            <TimeInput
              label="Time"
              value={localPrefs.daily_reminder_time || '19:00'}
              onChangeText={(val) => handleToggle('daily_reminder_time', val as any)}
              colors={colors}
            />
            <TimeZoneSelector
              value={localPrefs.daily_reminder_timezone || 'UTC'}
              onSelect={(tz) => handleToggle('daily_reminder_timezone', tz as any)}
              colors={colors}
            />
          </>
        )}
      </Section>

      {/* Budget Alerts Section */}
      <Section title="💰 Budget Alerts" colors={colors}>
        <PreferenceRow
          label="Budget Warnings"
          description="Alert when approaching budget limit"
          value={localPrefs.budget_warnings_enabled || false}
          onToggle={(val) => handleToggle('budget_warnings_enabled', val)}
        />
        {localPrefs.budget_warnings_enabled && (
          <ThresholdSlider
            label="Alert at % of budget"
            value={localPrefs.budget_warning_threshold || 80}
            onChangeValue={(val) => handleToggle('budget_warning_threshold', val as any)}
            colors={colors}
          />
        )}
      </Section>

      {/* Weekly Summaries Section */}
      <Section title="📊 Weekly Summaries" colors={colors}>
        <PreferenceRow
          label="Weekly Summary"
          description="Get weekly spending overview"
          value={localPrefs.weekly_summary_enabled || false}
          onToggle={(val) => handleToggle('weekly_summary_enabled', val)}
        />
        {localPrefs.weekly_summary_enabled && (
          <>
            <DaySelector
              label="Day"
              value={localPrefs.weekly_summary_day || 0}
              onSelect={(day) => handleToggle('weekly_summary_day', day as any)}
              colors={colors}
            />
            <TimeInput
              label="Time"
              value={localPrefs.weekly_summary_time || '19:00'}
              onChangeText={(val) => handleToggle('weekly_summary_time', val as any)}
              colors={colors}
            />
          </>
        )}
      </Section>

      {/* DND Settings Section */}
      <Section title="🌙 Do Not Disturb" colors={colors}>
        <PreferenceRow
          label="Enable DND"
          description="Pause notifications during quiet hours"
          value={localPrefs.dnd_enabled || false}
          onToggle={(val) => handleToggle('dnd_enabled', val)}
        />
        {localPrefs.dnd_enabled && (
          <>
            <TimeInput
              label="Start Time"
              value={localPrefs.dnd_start_time || '22:00'}
              onChangeText={(val) => handleToggle('dnd_start_time', val as any)}
              colors={colors}
            />
            <TimeInput
              label="End Time"
              value={localPrefs.dnd_end_time || '08:00'}
              onChangeText={(val) => handleToggle('dnd_end_time', val as any)}
              colors={colors}
            />
          </>
        )}
      </Section>

      {/* Other Features Section */}
      <Section title="⚙️ Other Features" colors={colors}>
        <PreferenceRow
          label="Anomaly Detection"
          description="Alert for unusual spending patterns"
          value={localPrefs.unusual_spending_enabled || false}
          onToggle={(val) => handleToggle('unusual_spending_enabled', val)}
        />
        <PreferenceRow
          label="Goal Progress"
          description="Notify of goal milestones"
          value={localPrefs.goal_progress_enabled || false}
          onToggle={(val) => handleToggle('goal_progress_enabled', val)}
        />
        <PreferenceRow
          label="Achievements"
          description="Celebrate savings achievements"
          value={localPrefs.achievement_enabled || false}
          onToggle={(val) => handleToggle('achievement_enabled', val)}
        />
      </Section>

      {/* Save Button */}
      <SaveButton
        onPress={handleSave}
        loading={saving}
        colors={colors}
      />

      {/* Test Button */}
      <TestButton colors={colors} />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ============ Components ============

function Section({ title, colors, children }: any) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ 
        fontSize: 16, 
        fontWeight: '600', 
        color: colors.text, 
        marginBottom: 12,
        paddingHorizontal: 4
      }}>
        {title}
      </Text>
      <View style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
      }}>
        {children}
      </View>
    </View>
  );
}

function PreferenceRow({ label, description, value, onToggle }: any) {
  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '500', color: '#1a1a1a' }}>
          {label}
        </Text>
        <Text style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
      />
    </View>
  );
}

function TimeInput({ label, value, onChangeText, colors }: any) {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
      <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text, marginBottom: 8 }}>
        {label}
      </Text>
      <View style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}>
        <Text style={{ fontSize: 16, color: colors.text }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function TimeZoneSelector({ value, onSelect, colors }: any) {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
      <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text, marginBottom: 8 }}>
        Timezone
      </Text>
      <View style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}>
        <Text style={{ fontSize: 16, color: colors.text }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function ThresholdSlider({ label, value, onChangeValue, colors }: any) {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
      <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text, marginBottom: 12 }}>
        {label}: {value}%
      </Text>
      <View style={{ height: 40 }} />
    </View>
  );
}

function DaySelector({ label, value, onSelect, colors }: any) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
      <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text, marginBottom: 8 }}>
        {label}
      </Text>
      <View style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}>
        <Text style={{ fontSize: 16, color: colors.text }}>
          {days[value] || 'Sunday'}
        </Text>
      </View>
    </View>
  );
}

function SaveButton({ onPress, loading, colors }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={{
        backgroundColor: colors.accent,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 12,
        opacity: loading ? 0.6 : 1,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
        {loading ? 'Saving...' : 'Save Preferences'}
      </Text>
    </TouchableOpacity>
  );
}

function TestButton({ colors }: any) {
  return (
    <TouchableOpacity
      style={{
        backgroundColor: colors.card,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.accent,
      }}
    >
      <Text style={{ color: colors.accent, fontSize: 16, fontWeight: '600' }}>
        🧪 Send Test Notification
      </Text>
    </TouchableOpacity>
  );
}
```

---

## 📝 Step 2: Update App Router

Add preferences screen to your app router in `app.json` or navigation:

```typescript
// In app/(tabs)/_layout.tsx or your navigation setup
<Stack.Screen 
  name="preferences/notifications" 
  options={{ 
    title: 'Notification Preferences',
    headerShown: true 
  }} 
/>
```

---

## 🎨 Step 3: Add Navigation Link

Update your settings/preferences screen to include notification settings:

```typescript
// In your preferences screen
<TouchableOpacity
  onPress={() => router.push('/preferences/notifications')}
  style={styles.settingItem}
>
  <Text style={styles.settingLabel}>📬 Notifications</Text>
  <Text style={styles.settingSubtitle}>Manage notification preferences</Text>
</TouchableOpacity>
```

---

## 🧪 Testing Phase 4

### Test 1: Open Preferences
```
1. Navigate to Notifications preferences
2. Verify all toggles load correctly
3. Check that current values display properly
```

### Test 2: Toggle Settings
```
1. Toggle "Daily Reminder" ON/OFF
2. Verify time picker appears only when enabled
3. Change time and save
```

### Test 3: Save & Load
```
1. Make changes
2. Click "Save Preferences"
3. Close and reopen screen
4. Verify changes persisted
```

### Test 4: DND Testing
```
1. Enable DND
2. Set hours (e.g., 22:00 to 08:00)
3. Send test notification during DND window
4. Verify notification is suppressed
```

---

## ✅ Phase 4 Completion Checklist

- [ ] `app/preferences/notifications.tsx` created
- [ ] Navigation added to preferences
- [ ] All toggles functional
- [ ] Time pickers working
- [ ] Save functionality implemented
- [ ] Data persists across app restarts
- [ ] DND hours prevent notifications
- [ ] UI matches app theme
- [ ] All settings save without errors
- [ ] User can test notifications

---

**Phase 4 Status:** Ready to implement! 🚀
