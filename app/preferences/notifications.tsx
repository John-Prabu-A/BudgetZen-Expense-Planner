import { useAuth } from '@/context/Auth';
import { useNotifications } from '@/context/Notifications';
import { useTheme } from '@/context/Theme';
import { NotificationPreferences } from '@/lib/notifications/types';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function NotificationsPreferencesScreen() {
  const { preferences, loadPreferences, savePreferences, isLoading } = useNotifications();
  const { session } = useAuth();
  const { colors } = useTheme();

  const normalizePrefs = (prefs: NotificationPreferences | null): NotificationPreferences | null => {
    if (!prefs) return null;
    const defaults: NotificationPreferences = {
      userId: prefs.userId,
      enabled: true,
      dailyReminder: { enabled: false, time: '09:00', timezone: 'UTC' },
      weeklyReport: { enabled: false, dayOfWeek: 1, time: '09:00', timezone: 'UTC' },
      monthlyReport: { enabled: false, dayOfMonth: 1, time: '09:00', timezone: 'UTC' },
      budgetAlerts: { enabled: true, warningPercentage: 80, alertSound: true, vibration: true },
      spendingAnomalies: { enabled: true, threshold: 150 },
      dailyBudgetNotif: { enabled: false, time: '00:00' },
      achievements: { enabled: true },
      accountAlerts: { enabled: true, lowBalanceThreshold: 20 },
      doNotDisturb: { enabled: false, startTime: '22:00', endTime: '07:00' },
      createdAt: prefs.createdAt ?? new Date(),
      updatedAt: prefs.updatedAt ?? new Date(),
    };

    return {
      ...defaults,
      ...prefs,
      dailyReminder: { ...defaults.dailyReminder, ...prefs.dailyReminder },
      weeklyReport: { ...defaults.weeklyReport, ...prefs.weeklyReport },
      monthlyReport: { ...defaults.monthlyReport, ...prefs.monthlyReport },
      budgetAlerts: { ...defaults.budgetAlerts, ...prefs.budgetAlerts },
      spendingAnomalies: { ...defaults.spendingAnomalies, ...prefs.spendingAnomalies },
      dailyBudgetNotif: { ...defaults.dailyBudgetNotif, ...prefs.dailyBudgetNotif },
      achievements: { ...defaults.achievements, ...prefs.achievements },
      accountAlerts: { ...defaults.accountAlerts, ...prefs.accountAlerts },
      doNotDisturb: { ...defaults.doNotDisturb, ...prefs.doNotDisturb },
    };
  };
  
  const [localPrefs, setLocalPrefs] = useState<NotificationPreferences | null>(
    normalizePrefs(preferences)
  );
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      loadPreferences(session.user.id);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    setLocalPrefs(normalizePrefs(preferences));
    setHasChanges(false);
  }, [preferences]);

  // Daily Reminder Handlers
  const handleDailyToggle = async (value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!localPrefs) return;
    setLocalPrefs({
      ...localPrefs,
      dailyReminder: { ...localPrefs.dailyReminder, enabled: value }
    });
    setHasChanges(true);
  };

  const handleDailyTimeChange = (value: string) => {
    if (!localPrefs) return;
    setLocalPrefs({
      ...localPrefs,
      dailyReminder: { ...localPrefs.dailyReminder, time: value }
    });
    setHasChanges(true);
  };

  const handleDailyTimezoneChange = (value: string) => {
    if (!localPrefs) return;
    setLocalPrefs({
      ...localPrefs,
      dailyReminder: { ...localPrefs.dailyReminder, timezone: value }
    });
    setHasChanges(true);
  };

  // Budget Alerts Handlers
  const handleBudgetToggle = async (value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!localPrefs) return;
    setLocalPrefs({
      ...localPrefs,
      budgetAlerts: { ...localPrefs.budgetAlerts, enabled: value }
    });
    setHasChanges(true);
  };

  const handleBudgetThresholdChange = (value: number) => {
    if (!localPrefs) return;
    setLocalPrefs({
      ...localPrefs,
      budgetAlerts: { ...localPrefs.budgetAlerts, warningPercentage: value }
    });
    setHasChanges(true);
  };

  // Weekly Report Handlers
  const handleWeeklyToggle = async (value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!localPrefs) return;
    setLocalPrefs({
      ...localPrefs,
      weeklyReport: { ...localPrefs.weeklyReport, enabled: value }
    });
    setHasChanges(true);
  };

  const handleWeeklyDayChange = (value: number) => {
    if (!localPrefs) return;
    setLocalPrefs({
      ...localPrefs,
      weeklyReport: { ...localPrefs.weeklyReport, dayOfWeek: value }
    });
    setHasChanges(true);
  };

  const handleWeeklyTimeChange = (value: string) => {
    if (!localPrefs) return;
    setLocalPrefs({
      ...localPrefs,
      weeklyReport: { ...localPrefs.weeklyReport, time: value }
    });
    setHasChanges(true);
  };

  // Do Not Disturb Handlers
  const handleDNDToggle = async (value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!localPrefs) return;
    setLocalPrefs({
      ...localPrefs,
      doNotDisturb: { ...localPrefs.doNotDisturb, enabled: value }
    });
    setHasChanges(true);
  };

  const handleDNDStartChange = (value: string) => {
    if (!localPrefs) return;
    setLocalPrefs({
      ...localPrefs,
      doNotDisturb: { ...localPrefs.doNotDisturb, startTime: value }
    });
    setHasChanges(true);
  };

  const handleDNDEndChange = (value: string) => {
    if (!localPrefs) return;
    setLocalPrefs({
      ...localPrefs,
      doNotDisturb: { ...localPrefs.doNotDisturb, endTime: value }
    });
    setHasChanges(true);
  };

  // Other Features Handlers
  const handleAnomaliesToggle = async (value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!localPrefs) return;
    setLocalPrefs({
      ...localPrefs,
      spendingAnomalies: { ...localPrefs.spendingAnomalies, enabled: value }
    });
    setHasChanges(true);
  };

  const handleAchievementsToggle = async (value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!localPrefs) return;
    setLocalPrefs({
      ...localPrefs,
      achievements: { ...localPrefs.achievements, enabled: value }
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!localPrefs) return;
    
    setSaving(true);
    try {
      const success = await savePreferences(localPrefs);
      if (success) {
        setHasChanges(false);
        Alert.alert('✅ Saved', 'Your notification preferences have been saved.');
      } else {
        Alert.alert('❌ Error', 'Failed to save preferences. Please try again.');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('❌ Error', 'An error occurred while saving preferences.');
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
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}
    >
      {/* Header */}
      <Text style={{ 
        fontSize: 28, 
        fontWeight: '700', 
        color: colors.text, 
        marginBottom: 8 
      }}>
        📬 Notifications
      </Text>
      <Text style={{ 
        fontSize: 14, 
        color: colors.textSecondary, 
        marginBottom: 28 
      }}>
        Customize when and how you receive notifications
      </Text>

      {/* Daily Reminders Section */}
      <Section title="📝 Daily Reminders" colors={colors}>
        <PreferenceRow
          label="Daily Reminder"
          description="Get reminded to log your expenses"
          value={localPrefs.dailyReminder.enabled}
          onToggle={handleDailyToggle}
          colors={colors}
        />
        {localPrefs.dailyReminder.enabled && (
          <>
            <TimeInput
              label="Time"
              value={localPrefs.dailyReminder.time}
              onChangeText={handleDailyTimeChange}
              colors={colors}
            />
            <TimeZoneSelector
              value={localPrefs.dailyReminder.timezone || 'UTC'}
              onSelect={handleDailyTimezoneChange}
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
          value={localPrefs.budgetAlerts.enabled}
          onToggle={handleBudgetToggle}
          colors={colors}
        />
        {localPrefs.budgetAlerts.enabled && (
          <ThresholdSlider
            label="Alert at % of budget"
            value={localPrefs.budgetAlerts.warningPercentage}
            onChangeValue={handleBudgetThresholdChange}
            colors={colors}
          />
        )}
      </Section>

      {/* Weekly Summaries Section */}
      <Section title="📊 Weekly Summaries" colors={colors}>
        <PreferenceRow
          label="Weekly Summary"
          description="Get weekly spending overview"
          value={localPrefs.weeklyReport.enabled}
          onToggle={handleWeeklyToggle}
          colors={colors}
        />
        {localPrefs.weeklyReport.enabled && (
          <>
            <DaySelector
              label="Day"
              value={localPrefs.weeklyReport.dayOfWeek}
              onSelect={handleWeeklyDayChange}
              colors={colors}
            />
            <TimeInput
              label="Time"
              value={localPrefs.weeklyReport.time}
              onChangeText={handleWeeklyTimeChange}
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
          value={localPrefs.doNotDisturb.enabled}
          onToggle={handleDNDToggle}
          colors={colors}
        />
        {localPrefs.doNotDisturb.enabled && (
          <>
            <TimeInput
              label="Start Time"
              value={localPrefs.doNotDisturb.startTime}
              onChangeText={handleDNDStartChange}
              colors={colors}
            />
            <TimeInput
              label="End Time"
              value={localPrefs.doNotDisturb.endTime}
              onChangeText={handleDNDEndChange}
              colors={colors}
            />
            <Text style={{ fontSize: 12, color: colors.textSecondary, paddingHorizontal: 16, paddingVertical: 8 }}>
              💡 Notifications during DND hours will be queued and sent after the end time
            </Text>
          </>
        )}
      </Section>

      {/* Other Features Section */}
      <Section title="⚙️ Other Features" colors={colors}>
        <PreferenceRow
          label="Anomaly Detection"
          description="Alert for unusual spending patterns"
          value={localPrefs.spendingAnomalies.enabled}
          onToggle={handleAnomaliesToggle}
          colors={colors}
        />
        <PreferenceRow
          label="Achievements"
          description="Celebrate savings achievements"
          value={localPrefs.achievements.enabled}
          onToggle={handleAchievementsToggle}
          colors={colors}
        />
      </Section>

      {/* Save Button */}
      <SaveButton
        onPress={handleSave}
        loading={saving}
        disabled={!hasChanges}
        colors={colors}
      />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ============ Components ============

function Section({ title, colors, children }: { title: string; colors: any; children: React.ReactNode }) {
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

function PreferenceRow({ label, description, value, onToggle, colors }: { 
  label: string; 
  description: string; 
  value: boolean; 
  onToggle: (val: boolean) => Promise<void>; 
  colors: any;
}) {
  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '500', color: colors.text }}>
          {label}
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#767577', true: colors.accent }}
        thumbColor={value ? colors.accent : '#f4f3f4'}
      />
    </View>
  );
}

function TimeInput({ label, value, onChangeText, colors }: { 
  label: string; 
  value: string; 
  onChangeText: (val: string) => void; 
  colors: any;
}) {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text, marginBottom: 8 }}>
        {label}
      </Text>
      <TouchableOpacity style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: colors.background,
      }}>
        <Text style={{ fontSize: 16, color: colors.text, fontWeight: '500' }}>
          {value || 'Not set'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function TimeZoneSelector({ value, onSelect, colors }: { 
  value: string; 
  onSelect: (tz: string) => void; 
  colors: any;
}) {
  const timezones = ['UTC', 'EST', 'CST', 'MST', 'PST', 'GMT', 'IST'];
  
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text, marginBottom: 8 }}>
        Timezone
      </Text>
      <TouchableOpacity style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: colors.background,
      }}>
        <Text style={{ fontSize: 16, color: colors.text, fontWeight: '500' }}>
          {value || 'UTC'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function ThresholdSlider({ label, value, onChangeValue, colors }: { 
  label: string; 
  value: number; 
  onChangeValue: (val: number) => void; 
  colors: any;
}) {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text }}>
          {label}
        </Text>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.accent }}>
          {value}%
        </Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {[50, 70, 80, 90, 100].map((percentage) => (
          <TouchableOpacity
            key={percentage}
            onPress={() => onChangeValue(percentage)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor: value === percentage ? colors.accent : colors.border,
            }}
          >
            <Text style={{ 
              fontSize: 12, 
              fontWeight: '600',
              color: value === percentage ? '#fff' : colors.textSecondary
            }}>
              {percentage}%
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function DaySelector({ label, value, onSelect, colors }: { 
  label: string; 
  value: number; 
  onSelect: (val: number) => void; 
  colors: any;
}) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text, marginBottom: 12 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {days.map((day, index) => (
          <TouchableOpacity
            key={day}
            onPress={() => onSelect(index)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 8,
              borderRadius: 6,
              backgroundColor: value === index ? colors.accent : colors.border,
            }}
          >
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: value === index ? '#fff' : colors.textSecondary,
            }}>
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function SaveButton({ onPress, loading, disabled, colors }: { 
  onPress: () => Promise<void>; 
  loading: boolean; 
  disabled: boolean; 
  colors: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      style={{
        backgroundColor: disabled ? colors.textSecondary : colors.accent,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 12,
        opacity: loading || disabled ? 0.5 : 1,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
        {loading ? 'Saving...' : 'Save Preferences'}
      </Text>
    </TouchableOpacity>
  );
}

