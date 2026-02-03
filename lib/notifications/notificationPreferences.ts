/**
 * Notification Preferences Manager
 * Handles CRUD operations for user notification preferences in Supabase
 */

import { supabase } from '../supabase';
import { NotificationPreferences } from './types';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  userId: '',
  enabled: true,
  dailyReminder: {
    enabled: true,
    time: '21:00', // 9 PM
    timezone: 'UTC',
  },
  weeklyReport: {
    enabled: true,
    dayOfWeek: 0, // Sunday
    time: '10:00',
    timezone: 'UTC',
  },
  monthlyReport: {
    enabled: true,
    dayOfMonth: 1,
    time: '08:00',
    timezone: 'UTC',
  },
  budgetAlerts: {
    enabled: true,
    warningPercentage: 80,
    alertSound: true,
    vibration: true,
  },
  spendingAnomalies: {
    enabled: true,
    threshold: 150,
  },
  dailyBudgetNotif: {
    enabled: true,
    time: '00:00',
  },
  achievements: {
    enabled: true,
  },
  accountAlerts: {
    enabled: true,
    lowBalanceThreshold: 10,
  },
  doNotDisturb: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

type RawPreferences = Record<string, any>;

/**
 * Notification Preferences Manager
 */
export class NotificationPreferencesManager {
  private static instance: NotificationPreferencesManager;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): NotificationPreferencesManager {
    if (!NotificationPreferencesManager.instance) {
      NotificationPreferencesManager.instance = new NotificationPreferencesManager();
    }
    return NotificationPreferencesManager.instance;
  }

  /**
   * Get user's notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found, return defaults
          console.log('📝 No preferences found, returning defaults');
          return { ...DEFAULT_PREFERENCES, userId };
        }
        console.error('❌ Error fetching preferences:', error);
        return null;
      }

      console.log('✅ Preferences fetched');
      return this.normalizePreferences(data as RawPreferences, userId);
    } catch (error) {
      console.error('❌ Error getting preferences:', error);
      return null;
    }
  }

  /**
   * Save or update user's notification preferences
   */
  async savePreferences(preferences: NotificationPreferences): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: preferences.userId,
          enabled: preferences.enabled,
          daily_reminder: preferences.dailyReminder,
          weekly_report: preferences.weeklyReport,
          monthly_report: preferences.monthlyReport,
          budget_alerts: preferences.budgetAlerts,
          spending_anomalies: preferences.spendingAnomalies,
          daily_budget_notif: preferences.dailyBudgetNotif,
          achievements: preferences.achievements,
          account_alerts: preferences.accountAlerts,
          do_not_disturb: preferences.doNotDisturb,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('❌ Error saving preferences:', error);
        return false;
      }

      console.log('✅ Preferences saved');
      return true;
    } catch (error) {
      console.error('❌ Error saving preferences:', error);
      return false;
    }
  }

  /**
   * Update specific preference
   */
  async updatePreference(
    userId: string,
    path: string[],
    value: any
  ): Promise<boolean> {
    try {
      const currentPreferences = await this.getPreferences(userId);
      if (!currentPreferences) {
        console.error('❌ Could not fetch current preferences');
        return false;
      }

      // Navigate to the nested property and update it
      let obj: any = currentPreferences;
      for (let i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]];
      }
      obj[path[path.length - 1]] = value;

      return this.savePreferences(currentPreferences);
    } catch (error) {
      console.error('❌ Error updating preference:', error);
      return false;
    }
  }

  /**
   * Reset preferences to default
   */
  async resetToDefaults(userId: string): Promise<boolean> {
    try {
      const defaultPrefs = { ...DEFAULT_PREFERENCES, userId };
      return this.savePreferences(defaultPrefs);
    } catch (error) {
      console.error('❌ Error resetting preferences:', error);
      return false;
    }
  }

  /**
   * Delete user's preferences
   */
  async deletePreferences(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error deleting preferences:', error);
        return false;
      }

      console.log('✅ Preferences deleted');
      return true;
    } catch (error) {
      console.error('❌ Error deleting preferences:', error);
      return false;
    }
  }

  /**
   * Check if notifications are allowed (respect DND)
   */
  isNotificationAllowed(preferences: NotificationPreferences): boolean {
    if (!preferences?.enabled) return false;

    if (preferences.doNotDisturb?.enabled) {
      const now = new Date();
      const [currentHour, currentMinute] = [now.getHours(), now.getMinutes()];
      const startTime = preferences.doNotDisturb.startTime ?? DEFAULT_PREFERENCES.doNotDisturb.startTime;
      const endTime = preferences.doNotDisturb.endTime ?? DEFAULT_PREFERENCES.doNotDisturb.endTime;
      const [dndStartHour, dndStartMin] = startTime.split(':').map(Number);
      const [dndEndHour, dndEndMin] = endTime.split(':').map(Number);

      const currentTime = currentHour * 60 + currentMinute;
      const dndStart = dndStartHour * 60 + dndStartMin;
      const dndEnd = dndEndHour * 60 + dndEndMin;

      if (dndStart > dndEnd) {
        // DND spans midnight
        return currentTime < dndEnd || currentTime >= dndStart ? false : true;
      } else {
        // Normal DND range
        return currentTime >= dndStart && currentTime < dndEnd ? false : true;
      }
    }

    return true;
  }

  /**
   * Normalize raw DB preferences to full NotificationPreferences shape
   */
  private normalizePreferences(raw: RawPreferences, userId: string): NotificationPreferences {
    const base = { ...DEFAULT_PREFERENCES, userId };
    if (!raw) return base;

    const mapped: NotificationPreferences = {
      ...base,
      userId: raw.user_id ?? raw.userId ?? userId,
      enabled: raw.enabled ?? base.enabled,
      dailyReminder: raw.daily_reminder ?? raw.dailyReminder ?? base.dailyReminder,
      weeklyReport: raw.weekly_report ?? raw.weeklyReport ?? base.weeklyReport,
      monthlyReport: raw.monthly_report ?? raw.monthlyReport ?? base.monthlyReport,
      budgetAlerts: raw.budget_alerts ?? raw.budgetAlerts ?? base.budgetAlerts,
      spendingAnomalies: raw.spending_anomalies ?? raw.spendingAnomalies ?? base.spendingAnomalies,
      dailyBudgetNotif: raw.daily_budget_notif ?? raw.dailyBudgetNotif ?? base.dailyBudgetNotif,
      achievements: raw.achievements ?? base.achievements,
      accountAlerts: raw.account_alerts ?? raw.accountAlerts ?? base.accountAlerts,
      doNotDisturb: raw.do_not_disturb ?? raw.doNotDisturb ?? base.doNotDisturb,
      createdAt: raw.created_at ? new Date(raw.created_at) : base.createdAt,
      updatedAt: raw.updated_at ? new Date(raw.updated_at) : base.updatedAt,
    };

    return {
      ...mapped,
      dailyReminder: { ...base.dailyReminder, ...mapped.dailyReminder },
      weeklyReport: { ...base.weeklyReport, ...mapped.weeklyReport },
      monthlyReport: { ...base.monthlyReport, ...mapped.monthlyReport },
      budgetAlerts: { ...base.budgetAlerts, ...mapped.budgetAlerts },
      spendingAnomalies: { ...base.spendingAnomalies, ...mapped.spendingAnomalies },
      dailyBudgetNotif: { ...base.dailyBudgetNotif, ...mapped.dailyBudgetNotif },
      achievements: { ...base.achievements, ...mapped.achievements },
      accountAlerts: { ...base.accountAlerts, ...mapped.accountAlerts },
      doNotDisturb: { ...base.doNotDisturb, ...mapped.doNotDisturb },
    };
  }

  /**
   * Get default preferences
   */
  getDefaults(): NotificationPreferences {
    return { ...DEFAULT_PREFERENCES };
  }
}

/**
 * Convenience export - default instance
 */
export const notificationPreferencesManager =
  NotificationPreferencesManager.getInstance();
