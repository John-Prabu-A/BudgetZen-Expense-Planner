/**
 * Smart Timing Engine - Learns and respects user notification preferences
 * Handles DND (Do Not Disturb) times, app usage patterns, and optimal sending times
 */

import { supabase } from '@/lib/supabase';
import { NotificationType } from './types';

export interface UserBehavior {
  lastAppOpenTime: number;
  totalOpensSinceHours: number;
  averageOpenFrequency: number; // minutes between opens
}

export interface OptimalTimeResult {
  shouldSendNow: boolean;
  recommendedTime?: string; // HH:MM format
  reason: string;
}

export class SmartTimingEngine {
  private static instance: SmartTimingEngine;

  private constructor() {}

  static getInstance(): SmartTimingEngine {
    if (!SmartTimingEngine.instance) {
      SmartTimingEngine.instance = new SmartTimingEngine();
    }
    return SmartTimingEngine.instance;
  }

  /**
   * Get optimal send time for a notification based on user preferences
   * @param userId - User ID
   * @param notificationType - Type of notification
   * @returns Optimal time recommendation
   */
  async getOptimalSendTime(
    userId: string,
    notificationType: NotificationType
  ): Promise<OptimalTimeResult> {
    try {
      // Get user preferences
      const { data: prefs, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !prefs) {
        return {
          shouldSendNow: true,
          reason: 'No preferences found, sending immediately',
        };
      }

      // Real-time critical alerts should send immediately
      if (
        [
          NotificationType.LARGE_TRANSACTION,
          NotificationType.BUDGET_EXCEEDED,
          NotificationType.UNUSUAL_SPENDING,
        ].includes(notificationType)
      ) {
        // Check DND for BUDGET_EXCEEDED, but ignore for others
        if (notificationType === NotificationType.BUDGET_EXCEEDED) {
          const inDND = await this.isInDNDHours(userId, prefs);
          if (inDND) {
            return {
              shouldSendNow: false,
              reason: 'In DND hours',
            };
          }
        }

        return {
          shouldSendNow: true,
          reason: 'Real-time critical alert',
        };
      }

      // Daily/weekly notifications use scheduled times
      const preferredTime = this.getPreferredTimeForType(notificationType, prefs);

      return {
        shouldSendNow: false,
        recommendedTime: preferredTime,
        reason: `Scheduled for ${preferredTime}`,
      };
    } catch (error) {
      console.warn('Error getting optimal send time', error);
      return {
        shouldSendNow: true,
        reason: 'Error in timing engine, sending immediately',
      };
    }
  }

  /**
   * Check if user is currently in DND (Do Not Disturb) hours
   * @param userId - User ID
   * @param prefs - Optional preloaded preferences
   * @returns true if in DND hours
   */
  async isInDNDHours(
    userId: string,
    prefs?: any
  ): Promise<boolean> {
    try {
      let preferences = prefs;

      if (!preferences) {
        const { data, error } = await supabase
          .from('notification_preferences')
          .select('dnd_enabled, dnd_start_time, dnd_end_time')
          .eq('user_id', userId)
          .single();

        if (error || !data) {
          return false;
        }
        preferences = data;
      }

      // DND disabled
      if (!preferences.dnd_enabled) {
        return false;
      }

      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const dndStart = preferences.dnd_start_time || '22:00';
      const dndEnd = preferences.dnd_end_time || '08:00';

      const [startHour, startMin] = dndStart.split(':').map(Number);
      const [endHour, endMin] = dndEnd.split(':').map(Number);
      const [currentHour, currentMin] = currentTime.split(':').map(Number);

      const startTotalMin = startHour * 60 + startMin;
      const endTotalMin = endHour * 60 + endMin;
      const currentTotalMin = currentHour * 60 + currentMin;

      // Handle overnight DND (e.g., 22:00 - 08:00)
      if (startTotalMin > endTotalMin) {
        return currentTotalMin >= startTotalMin || currentTotalMin <= endTotalMin;
      }

      return currentTotalMin >= startTotalMin && currentTotalMin <= endTotalMin;
    } catch (error) {
      console.warn('Error checking DND hours', error);
      return false;
    }
  }

  /**
   * Check if should skip notification based on user behavior
   * (e.g., user is actively using the app, so send in-app message instead)
   * @param userId - User ID
   * @param checkWindowMinutes - How many minutes to look back
   * @returns true if should skip sending push notification
   */
  async shouldSkipBasedOnBehavior(
    userId: string,
    checkWindowMinutes: number = 120
  ): Promise<boolean> {
    try {
      // Check if user opened app in the last X minutes
      const minutesAgo = new Date(Date.now() - checkWindowMinutes * 60 * 1000);

      const { data, error } = await supabase
        .from('user_activity')
        .select('last_app_open_time')
        .eq('user_id', userId)
        .gte('last_app_open_time', minutesAgo.toISOString())
        .order('last_app_open_time', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        return false; // User hasn't been active, send notification
      }

      // User was active recently, skip push notification
      console.log(`📱 User in app recently, skipping push`);
      return true;
    } catch (error) {
      console.warn('Error checking user behavior', error);
      return false; // If error, allow notification
    }
  }

  /**
   * Record user behavior for learning optimal timing
   * @param userId - User ID
   * @param action - User action
   */
  async recordUserBehavior(
    userId: string,
    action: 'app_opened' | 'notification_opened' | 'notification_actioned'
  ): Promise<void> {
    try {
      const now = new Date().toISOString();

      if (action === 'app_opened') {
        // Update last app open time
        await supabase
          .from('user_activity')
          .upsert(
            {
              user_id: userId,
              last_app_open_time: now,
            },
            {
              onConflict: 'user_id',
            }
          );
      }

      // Log all behaviors for analytics
      await supabase.from('user_behavior_log').insert({
        user_id: userId,
        action,
        timestamp: now,
      });
    } catch (error) {
      console.warn('Error recording user behavior', error);
    }
  }

  /**
   * Get the preferred notification time for a specific type
   * @param type - Notification type
   * @param prefs - User preferences
   * @returns Time in HH:MM format
   */
  private getPreferredTimeForType(type: NotificationType, prefs: any): string {
    switch (type) {
      case NotificationType.DAILY_REMINDER:
      case NotificationType.BUDGET_WARNING:
      case NotificationType.DAILY_ANOMALY:
        return prefs.daily_reminder_time || '19:00';

      case NotificationType.WEEKLY_SUMMARY:
      case NotificationType.BUDGET_COMPLIANCE:
      case NotificationType.SPENDING_TRENDS:
        return prefs.weekly_summary_time || '19:00';

      default:
        return 'immediate';
    }
  }

  /**
   * Calculate user's peak activity hours
   * @param userId - User ID
   * @returns Array of hours when user is most active
   */
  async getPeakActivityHours(userId: string): Promise<number[]> {
    try {
      // Get app opens in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('user_behavior_log')
        .select('timestamp')
        .eq('user_id', userId)
        .eq('action', 'app_opened')
        .gte('timestamp', thirtyDaysAgo.toISOString());

      if (error || !data || data.length === 0) {
        return [19]; // Default to evening
      }

      // Count opens by hour
      const hourCounts: Record<number, number> = {};
      data.forEach((log) => {
        const hour = new Date(log.timestamp).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      // Find top 3 hours
      const sortedHours = Object.entries(hourCounts)
        .sort(([_, a], [__, b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => Number(hour));

      return sortedHours.length > 0 ? sortedHours : [19];
    } catch (error) {
      console.warn('Error calculating peak hours', error);
      return [19]; // Default
    }
  }

  /**
   * Get notification open rate for a specific type
   * Helps understand which types perform well
   * @param userId - User ID
   * @param type - Notification type
   * @returns Open rate percentage
   */
  async getNotificationOpenRate(
    userId: string,
    type: NotificationType
  ): Promise<number> {
    try {
      const { data: sent, error: sentError } = await supabase
        .from('notification_analytics')
        .select('id')
        .eq('user_id', userId)
        .eq('notification_type', type)
        .eq('sent', true);

      if (sentError || !sent || sent.length === 0) {
        return 0;
      }

      const { data: opened, error: openError } = await supabase
        .from('notification_analytics')
        .select('id')
        .eq('user_id', userId)
        .eq('notification_type', type)
        .not('opened_at', 'is', null);

      if (openError || !opened) {
        return 0;
      }

      return (opened.length / sent.length) * 100;
    } catch (error) {
      console.warn('Error getting open rate', error);
      return 0;
    }
  }

  /**
   * Check if user is a high-engagement user
   * (Opens notifications frequently)
   * @param userId - User ID
   * @returns true if high engagement user
   */
  async isHighEngagementUser(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('notification_analytics')
        .select('opened_at')
        .eq('user_id', userId)
        .not('opened_at', 'is', null)
        .limit(10);

      if (error || !data) {
        return false;
      }

      // Consider high engagement if user has opened >50% of recent notifications
      return (data.length / 10) > 0.5;
    } catch (error) {
      console.warn('Error checking engagement', error);
      return false;
    }
  }
}

/**
 * Singleton instance of SmartTimingEngine
 */
export const smartTimingEngine = SmartTimingEngine.getInstance();
