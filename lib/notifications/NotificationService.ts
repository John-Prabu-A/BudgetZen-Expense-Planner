/**
 * Notification Service - Core Notification Management
 * Handles sending, scheduling, and managing all push notifications
 */

import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { getCategoryForNotificationType } from './notificationCategories';
import { getChannelForNotificationType } from './notificationChannels';
import { NotificationPayload, NotificationResult, NotificationType, NOTIFICATION_PRIORITIES } from './types';
import { notificationThrottler } from './notificationThrottler';
import { smartTimingEngine } from './smartTimingEngine';

/**
 * Main Notification Service Class
 */
export class NotificationService {
  private static instance: NotificationService;

  private constructor() {
    this.setupNotificationHandler();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Setup notification handlers for when app receives notification
   */
  private setupNotificationHandler(): void {
    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        console.log('📱 Notification received:', notification);
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },
    });
  }

  /**
   * Send immediate notification
   */
  async sendNotification(
    payload: NotificationPayload
  ): Promise<NotificationResult> {
    try {
      // Ensure payload has required fields
      if (!payload.type || !payload.title || !payload.body) {
        console.warn('❌ Invalid notification payload:', { type: payload.type, title: payload.title, body: payload.body });
        return {
          success: false,
          message: 'Invalid notification payload - missing required fields',
        };
      }

      const categoryId = getCategoryForNotificationType(payload.type);
      const channelId = getChannelForNotificationType(payload.type);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          badge: payload.badge,
          sound: payload.sound || true,
          categoryIdentifier: categoryId,
        },
        trigger: null, // null means send immediately
      });

      console.log(
        `✅ Notification sent: ${payload.title} (ID: ${notificationId})`
      );

      return {
        success: true,
        notificationId,
        message: 'Notification sent successfully',
      };
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to send notification',
      };
    }
  }

  /**
   * Schedule notification for specific time
   */
  async scheduleNotificationAtTime(
    payload: NotificationPayload,
    hour: number,
    minute: number,
    repeats: boolean = false
  ): Promise<NotificationResult> {
    try {
      const trigger = {
        hour,
        minute,
      } as Notifications.NotificationTriggerInput;

      const categoryId = getCategoryForNotificationType(payload.type);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          badge: payload.badge,
          sound: payload.sound || true,
          categoryIdentifier: categoryId,
        },
        trigger,
      });

      console.log(
        `⏰ Notification scheduled: ${payload.title} at ${hour}:${minute} (ID: ${notificationId})`
      );

      return {
        success: true,
        notificationId,
        message: `Notification scheduled for ${hour}:${minute}`,
      };
    } catch (error) {
      console.error('❌ Error scheduling notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to schedule notification',
      };
    }
  }

  /**
   * Schedule notification after a time delay (in seconds)
   */
  async scheduleNotificationInSeconds(
    payload: NotificationPayload,
    seconds: number
  ): Promise<NotificationResult> {
    try {
      if (!payload.type || !payload.title || !payload.body) {
        console.warn('❌ Invalid notification payload:', { type: payload.type, title: payload.title, body: payload.body });
        return {
          success: false,
          message: 'Invalid notification payload - missing required fields',
        };
      }

      const categoryId = getCategoryForNotificationType(payload.type);

      const delaySeconds = Math.max(1, Math.floor(seconds));
      const scheduledDate = new Date(Date.now() + delaySeconds * 1000);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          badge: payload.badge,
          sound: payload.sound || true,
          categoryIdentifier: categoryId,
        },
        trigger: scheduledDate,
      });

      console.log(
        `⏳ Notification scheduled at ${scheduledDate.toISOString()}: ${payload.title} (ID: ${notificationId})`
      );

      return {
        success: true,
        notificationId,
        message: `Notification scheduled for ${scheduledDate.toISOString()}`,
      };
    } catch (error) {
      console.error('❌ Error scheduling delayed notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to schedule delayed notification',
      };
    }
  }

  /**
   * Schedule notification for specific day and time (weekly)
   */
  async scheduleWeeklyNotification(
    payload: NotificationPayload,
    weekday: number, // 0 = Sunday, 6 = Saturday
    hour: number,
    minute: number
  ): Promise<NotificationResult> {
    try {
      // Calculate next occurrence of this weekday
      const now = new Date();
      const currentDay = now.getDay();
      let daysUntil = weekday - currentDay;

      if (daysUntil <= 0) {
        daysUntil += 7;
      }

      const nextDate = new Date(now);
      nextDate.setDate(nextDate.getDate() + daysUntil);
      nextDate.setHours(hour, minute, 0, 0);

      const trigger = {
        hour,
        minute,
      } as Notifications.NotificationTriggerInput;

      const categoryId = getCategoryForNotificationType(payload.type);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: {
            ...payload.data,
            weekday: weekday.toString(),
          },
          badge: payload.badge,
          sound: payload.sound || true,
          categoryIdentifier: categoryId,
        },
        trigger,
      });

      console.log(
        `📅 Weekly notification scheduled: ${payload.title} (Day: ${weekday}, Time: ${hour}:${minute})`
      );

      return {
        success: true,
        notificationId,
        message: `Weekly notification scheduled for day ${weekday} at ${hour}:${minute}`,
      };
    } catch (error) {
      console.error('❌ Error scheduling weekly notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to schedule weekly notification',
      };
    }
  }

  /**
   * Schedule notification for specific date and time (monthly)
   */
  async scheduleMonthlyNotification(
    payload: NotificationPayload,
    dayOfMonth: number,
    hour: number,
    minute: number
  ): Promise<NotificationResult> {
    try {
      // Since Notifications API doesn't support monthly directly,
      // we'll use a workaround by calculating next occurrence
      const now = new Date();
      let targetDate = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
      targetDate.setHours(hour, minute, 0, 0);

      if (targetDate < now) {
        targetDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          dayOfMonth
        );
        targetDate.setHours(hour, minute, 0, 0);
      }

      const secondsUntil = (targetDate.getTime() - now.getTime()) / 1000;

      const categoryId = getCategoryForNotificationType(payload.type);

      const trigger = {
        seconds: Math.max(1, Math.floor(secondsUntil)),
      } as Notifications.NotificationTriggerInput;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: {
            ...payload.data,
            dayOfMonth: dayOfMonth.toString(),
          },
          badge: payload.badge,
          sound: payload.sound || true,
          categoryIdentifier: categoryId,
        },
        trigger,
      });

      console.log(
        `📆 Monthly notification scheduled: ${payload.title} (Day: ${dayOfMonth}, Time: ${hour}:${minute})`
      );

      return {
        success: true,
        notificationId,
        message: `Monthly notification scheduled for day ${dayOfMonth} at ${hour}:${minute}`,
      };
    } catch (error) {
      console.error('❌ Error scheduling monthly notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to schedule monthly notification',
      };
    }
  }

  /**
   * Cancel specific notification
   */
  async cancelNotification(notificationId: string): Promise<NotificationResult> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`❌ Notification cancelled: ${notificationId}`);

      return {
        success: true,
        message: `Notification ${notificationId} cancelled`,
      };
    } catch (error) {
      console.error('❌ Error cancelling notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to cancel notification',
      };
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<NotificationResult> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('❌ All notifications cancelled');

      return {
        success: true,
        message: 'All notifications cancelled',
      };
    } catch (error) {
      console.error('❌ Error cancelling all notifications:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to cancel all notifications',
      };
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<
    Notifications.NotificationRequest[]
  > {
    try {
      const notifications =
        await Notifications.getAllScheduledNotificationsAsync();
      console.log(`📋 Found ${notifications.length} scheduled notifications`);
      return notifications;
    } catch (error) {
      console.error('❌ Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Update notification badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
      console.log(`📌 Badge count set to: ${count}`);
    } catch (error) {
      console.error('❌ Error setting badge count:', error);
    }
  }

  /**
   * Send notification with smart filtering and throttling
   * Respects user preferences, DND hours, and prevents spam
   */
  async sendWithSmartFilters(
    userId: string,
    payload: NotificationPayload
  ): Promise<NotificationResult> {
    try {
      const type = payload.type as NotificationType;
      const priority = NOTIFICATION_PRIORITIES[type];

      // Step 1: Check throttling
      const shouldSend = await notificationThrottler.shouldSend(userId, type);
      if (!shouldSend) {
        console.log(`⏭️ Notification throttled: ${type}`);
        return {
          success: false,
          message: 'Notification throttled - too frequent',
        };
      }

      // Step 2: Check DND hours (except for critical alerts)
      if (priority !== 'critical') {
        const inDND = await smartTimingEngine.isInDNDHours(userId);
        if (inDND) {
          console.log(`🌙 In DND hours, notification queued for later`);
          // In production, queue for later instead of dropping
          return {
            success: false,
            message: 'In DND hours, queued for later',
          };
        }
      }

      // Step 3: Check if user is actively using app (skip push, use in-app instead)
      if (priority === 'medium' || priority === 'low') {
        const shouldSkip = await smartTimingEngine.shouldSkipBasedOnBehavior(userId);
        if (shouldSkip) {
          console.log(`📱 User in app, in-app message recommended`);
          return {
            success: false,
            message: 'User in app, recommend in-app messaging',
          };
        }
      }

      // Step 4: Check daily limit
      const maxPerDay = 5;
      const exceededLimit = await notificationThrottler.isExceededDailyLimit(userId, maxPerDay);
      if (exceededLimit && priority === 'low') {
        console.log(`📊 Daily limit exceeded, queuing low-priority notification`);
        return {
          success: false,
          message: 'Daily notification limit exceeded',
        };
      }

      // Step 5: Send notification
      const result = await this.sendNotification(payload);

      // Step 6: Record metrics if successful
      if (result.success) {
        await notificationThrottler.recordSent(userId, type);
        await this.recordAnalytics(userId, payload, result.notificationId!);
      }

      return result;
    } catch (error) {
      console.error('❌ Error in sendWithSmartFilters:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to send notification',
      };
    }
  }

  /**
   * Record notification analytics for tracking
   */
  private async recordAnalytics(
    userId: string,
    payload: NotificationPayload,
    notificationId: string
  ): Promise<void> {
    try {
      const { error } = await (await import('@/lib/supabase')).supabase
        .from('notification_analytics')
        .insert({
          user_id: userId,
          notification_id: notificationId,
          notification_type: payload.type,
          sent_at: new Date().toISOString(),
        });

      if (error) {
        console.warn('Error recording notification analytics:', error);
      }
    } catch (error) {
      console.warn('Error recording analytics', error);
    }
  }

  /**
   * Clear badge count
   */
  async clearBadgeCount(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
      console.log('📌 Badge count cleared');
    } catch (error) {
      console.error('❌ Error clearing badge count:', error);
    }
  }

  /**
   * Check if app is physical device
   */
  static isPhysicalDevice(): boolean {
    // Return true as we assume physical device on mobile
    return true;
  }

  /**
   * Get device info
   */
  static getDeviceInfo() {
    return {
      isPhysical: true,
      osName: 'Unknown',
      osVersion: 'Unknown',
      brand: 'Unknown',
      modelName: 'Unknown',
      appVersion: Constants.expoConfig?.version,
    };
  }
}

/**
 * Convenience export - default instance
 */
export const notificationService = NotificationService.getInstance();
