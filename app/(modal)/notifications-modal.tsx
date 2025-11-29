import { usePreferences } from '@/context/Preferences';
import { useTheme } from '@/context/Theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationsModal() {
  const router = useRouter();
  const { remindDaily, setRemindDaily } = usePreferences();
  const { isDark, colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Notifications
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Reminders Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>
            Reminders
          </Text>

          <View
            style={[
              styles.settingRow,
              { borderBottomColor: colors.border },
            ]}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons
                name="bell-outline"
                size={24}
                color={colors.accent}
              />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Remind Everyday
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Get daily reminders to log expenses
                </Text>
              </View>
            </View>
            <Switch
              value={remindDaily}
              onValueChange={setRemindDaily}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={remindDaily ? colors.accent : colors.textSecondary}
            />
          </View>

          <View
            style={[
              styles.settingRow,
              { borderBottomColor: colors.border },
            ]}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons
                name="calendar-alert-outline"
                size={24}
                color={colors.accent}
              />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Budget Alerts
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Notify when budget limits are reached
                </Text>
              </View>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={true ? colors.accent : colors.textSecondary}
            />
          </View>

          <View
            style={[
              styles.settingRow,
              { borderBottomColor: colors.border },
            ]}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons
                name="bank-transfer-out"
                size={24}
                color={colors.accent}
              />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Low Balance Alerts
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Alert when account balance runs low
                </Text>
              </View>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={true ? colors.accent : colors.textSecondary}
            />
          </View>
        </View>

        {/* Notification Time Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>
            Notification Time
          </Text>

          <TouchableOpacity
            style={[
              styles.timeButton,
              { borderColor: colors.border },
            ]}>
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={24}
                color={colors.accent}
              />
              <View style={styles.buttonText}>
                <Text style={[styles.buttonTitle, { color: colors.text }]}>
                  Set Reminder Time
                </Text>
                <Text style={[styles.buttonDescription, { color: colors.textSecondary }]}>
                  Currently set to 09:00 AM
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Notification Types Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>
            Notification Types
          </Text>

          <View
            style={[
              styles.settingRow,
              { borderBottomColor: colors.border },
            ]}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons
                name="email-outline"
                size={24}
                color={colors.accent}
              />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Email Notifications
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Receive notifications via email
                </Text>
              </View>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={true ? colors.accent : colors.textSecondary}
            />
          </View>

          <View
            style={[
              styles.settingRow,
              { borderBottomColor: colors.border },
            ]}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons
                name="phone-outline"
                size={24}
                color={colors.accent}
              />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Push Notifications
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  App push notifications (recommended)
                </Text>
              </View>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={true ? colors.accent : colors.textSecondary}
            />
          </View>
        </View>

        {/* Info Box */}
        <View
          style={[
            styles.infoBox,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <MaterialCommunityIcons
            name="information-outline"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Notifications help you stay on top of your finances. You can customize
            when and how you receive them.
          </Text>
        </View>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingBottom: 16,
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  buttonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonText: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  buttonDescription: {
    fontSize: 12,
  },
  infoBox: {
    flexDirection: 'row',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
