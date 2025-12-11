/**
 * Notification Throttler - Prevents notification spam
 * Tracks when notifications were last sent and enforces minimum intervals
 */

import { supabase } from '@/lib/supabase';
import { NotificationType, MIN_INTERVAL_BETWEEN_NOTIFICATIONS } from './types';

export interface ThrottleRecord {
  user_id: string;
  notification_type: string;
  last_sent_at: string;
  count_today: number;
}

export class NotificationThrottler {
  private static instance: NotificationThrottler;
  // In-memory cache for recent sends to avoid DB roundtrips
  private cache: Map<string, Map<string, number>> = new Map();

  private constructor() {}

  static getInstance(): NotificationThrottler {
    if (!NotificationThrottler.instance) {
      NotificationThrottler.instance = new NotificationThrottler();
    }
    return NotificationThrottler.instance;
  }

  /**
   * Check if a notification should be sent based on throttling rules
   * @param userId - User ID
   * @param type - Notification type
   * @param identifier - Optional identifier for category-specific throttling
   * @returns true if notification should be sent, false if throttled
   */
  async shouldSend(
    userId: string,
    type: NotificationType,
    identifier?: string
  ): Promise<boolean> {
    const minInterval = MIN_INTERVAL_BETWEEN_NOTIFICATIONS[type];
    
    // No throttling for this type
    if (minInterval === 0) {
      return true;
    }

    const key = identifier ? `${type}:${identifier}` : type;
    const throttleKey = `${userId}:${key}`;

    // Check in-memory cache first
    const userCache = this.cache.get(userId);
    if (userCache && userCache.has(key)) {
      const lastSent = userCache.get(key)!;
      const timeSinceLastSent = Date.now() - lastSent;
      
      if (timeSinceLastSent < minInterval) {
        console.log(
          `⏭️ Throttled: ${type} (last sent ${Math.round(timeSinceLastSent / 1000)}s ago, min interval: ${Math.round(minInterval / 1000)}s)`
        );
        return false;
      }
    }

    // Check database for historical data (in case of app restart)
    try {
      const { data, error } = await supabase
        .from('notification_throttle')
        .select('last_sent_at')
        .eq('user_id', userId)
        .eq('notification_type', key)
        .single();

      if (!error && data) {
        const lastSentTime = new Date(data.last_sent_at).getTime();
        const timeSinceLastSent = Date.now() - lastSentTime;

        if (timeSinceLastSent < minInterval) {
          console.log(
            `⏭️ Throttled (DB): ${type} (last sent ${Math.round(timeSinceLastSent / 1000)}s ago)`
          );
          return false;
        }
      }
    } catch (error) {
      console.warn('Error checking throttle in database', error);
      // Continue anyway - don't block notification if DB check fails
    }

    return true;
  }

  /**
   * Record that a notification was sent
   * @param userId - User ID
   * @param type - Notification type
   * @param identifier - Optional identifier for category-specific throttling
   */
  async recordSent(
    userId: string,
    type: NotificationType,
    identifier?: string
  ): Promise<void> {
    const key = identifier ? `${type}:${identifier}` : type;
    const now = Date.now();

    // Update in-memory cache
    if (!this.cache.has(userId)) {
      this.cache.set(userId, new Map());
    }
    this.cache.get(userId)!.set(key, now);

    // Update database
    try {
      const { error } = await supabase.from('notification_throttle').upsert(
        {
          user_id: userId,
          notification_type: key,
          last_sent_at: new Date().toISOString(),
          count_today: (await this.getDayCount(userId, type)) + 1,
        },
        {
          onConflict: 'user_id,notification_type',
        }
      );

      if (error) {
        console.warn('Error recording throttle:', error);
      }
    } catch (error) {
      console.warn('Error recording sent notification', error);
    }
  }

  /**
   * Get the number of notifications sent today of a specific type
   * @param userId - User ID
   * @param type - Notification type
   * @returns Number of notifications sent today
   */
  async getDayCount(userId: string, type: NotificationType): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('notification_throttle')
        .select('count_today')
        .eq('user_id', userId)
        .eq('notification_type', type)
        .gte('last_sent_at', today.toISOString())
        .single();

      if (error || !data) {
        return 0;
      }

      return data.count_today || 0;
    } catch (error) {
      console.warn('Error getting day count', error);
      return 0;
    }
  }

  /**
   * Check if user exceeded max notifications per day
   * @param userId - User ID
   * @param maxPerDay - Maximum notifications allowed per day
   * @returns true if limit exceeded
   */
  async isExceededDailyLimit(
    userId: string,
    maxPerDay: number = 5
  ): Promise<boolean> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('notification_throttle')
        .select('count_today')
        .eq('user_id', userId)
        .gte('last_sent_at', today.toISOString());

      if (error || !data) {
        return false;
      }

      const totalToday = data.reduce((sum, record) => sum + (record.count_today || 0), 0);
      return totalToday >= maxPerDay;
    } catch (error) {
      console.warn('Error checking daily limit', error);
      return false;
    }
  }

  /**
   * Clear throttle cache for a user (useful for testing or reset)
   * @param userId - User ID
   */
  clearUserCache(userId: string): void {
    this.cache.delete(userId);
  }

  /**
   * Clear all throttle cache
   */
  clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * Get throttle stats for debugging
   * @param userId - User ID
   * @returns Throttle statistics
   */
  async getStats(userId: string): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase
        .from('notification_throttle')
        .select('*')
        .eq('user_id', userId);

      if (error || !data) {
        return {};
      }

      return {
        totalRecords: data.length,
        records: data.map((record) => ({
          type: record.notification_type,
          lastSent: record.last_sent_at,
          countToday: record.count_today,
        })),
      };
    } catch (error) {
      console.warn('Error getting throttle stats', error);
      return {};
    }
  }
}

/**
 * Singleton instance of NotificationThrottler
 */
export const notificationThrottler = NotificationThrottler.getInstance();
