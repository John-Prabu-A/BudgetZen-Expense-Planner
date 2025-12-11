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
      return data as NotificationPreferences;
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
    if (!preferences.enabled) return false;

    if (preferences.doNotDisturb.enabled) {
      const now = new Date();
      const [currentHour, currentMinute] = [now.getHours(), now.getMinutes()];
      const [dndStartHour, dndStartMin] = preferences.doNotDisturb.startTime.split(':').map(Number);
      const [dndEndHour, dndEndMin] = preferences.doNotDisturb.endTime.split(':').map(Number);

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
