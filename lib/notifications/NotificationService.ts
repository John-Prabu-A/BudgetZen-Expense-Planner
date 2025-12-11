/**
 * Notification Service - Core Notification Management
 * Handles sending, scheduling, and managing all push notifications
 */

import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { getCategoryForNotificationType } from './notificationCategories';
import { getChannelForNotificationType } from './notificationChannels';
import { NotificationPayload, NotificationResult } from './types';

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
