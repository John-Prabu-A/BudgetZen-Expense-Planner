/**
 * Android Notification Channels Configuration
 * Defines notification channel behavior for Android 8.0+
 * Channels control sound, vibration, importance, and user visibility
 */

import * as Notifications from 'expo-notifications';
import { AndroidChannel } from './types';

/**
 * Define all notification channels for the app
 * Each channel controls how notifications are presented to users
 */
export const NOTIFICATION_CHANNELS: AndroidChannel[] = [
  {
    id: 'default',
    name: 'General Notifications',
    importance: 'default',
    description: 'General app notifications',
    enableVibration: true,
    vibrationPattern: [0, 250, 250, 250],
    enableLights: true,
    lightColor: '#6366F1',
    sound: 'notification_sound.wav',
  },
  {
    id: 'reminders',
    name: 'Reminders & Tasks',
    importance: 'high',
    description: 'Daily expense reminders and task notifications',
    enableVibration: true,
    vibrationPattern: [0, 250, 250, 250],
    enableLights: true,
    lightColor: '#3B82F6',
    sound: 'notification_sound.wav',
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    importance: 'default',
    description: 'Weekly and monthly financial reports',
    enableVibration: false,
    enableLights: true,
    lightColor: '#10B981',
    sound: 'notification_sound.wav',
  },
  {
    id: 'alerts',
    name: 'Budget & Account Alerts',
    importance: 'max',
    description: 'Critical budget warnings and account alerts',
    bypassDnd: true, // Bypass Do Not Disturb
    enableVibration: true,
    vibrationPattern: [0, 500, 250, 500],
    enableLights: true,
    lightColor: '#EF4444',
    sound: 'critical_alert.wav',
  },
  {
    id: 'achievements',
    name: 'Achievements & Milestones',
    importance: 'default',
    description: 'Celebrate wins and goal achievements',
    enableVibration: true,
    vibrationPattern: [0, 200, 200, 200, 200, 200],
    enableLights: true,
    lightColor: '#F59E0B',
    sound: 'achievement_sound.wav',
  },
  {
    id: 'silent',
    name: 'Silent Notifications',
    importance: 'low',
    description: 'Background notifications without sound/vibration',
    enableVibration: false,
    enableLights: false,
  },
];

/**
 * Get channel ID based on notification type
 */
export const getChannelForNotificationType = (
  notificationType: string | undefined
): string => {
  // SAFETY CHECK: Handle undefined type
  if (!notificationType) {
    console.warn('⚠️ NotificationType is undefined, using default channel');
    return 'default';
  }

  const typeStr = String(notificationType).toLowerCase();
  
  const typeChannelMap: Record<string, string> = {
    daily_reminder: 'reminders',
    weekly_report: 'reports',
    monthly_report: 'reports',
    budget_warning: 'alerts',
    budget_exceeded: 'alerts',
    daily_budget: 'reminders',
    achievement: 'achievements',
    savings_goal: 'achievements',
    unusual_spending: 'alerts',
    low_balance: 'alerts',
  };

  return typeChannelMap[typeStr] || 'default';
};

/**
 * Setup all notification channels on app startup
 * This is required for Android 8.0+ to control notification behavior
 */
export const setupNotificationChannels = async (): Promise<void> => {
  try {
    console.log('📱 Notification channels setup - Skipping for Expo Go (SDK 53+ limitation)');
    // NOTE: Notification channels are only available in development builds
    // Expo Go doesn't support Android push notifications on SDK 53+
    // This would run on physical devices with development build
    return;
  } catch (error) {
    console.error(
      '❌ Error setting up notification channels:',
      error instanceof Error ? error.message : String(error)
    );
  }
};

/**
 * Convert importance string to Notifications enum value
 */
const convertImportance = (
  importance: string | 'min' | 'low' | 'default' | 'high' | 'max' | undefined
): Notifications.AndroidImportance => {
  const safeImportance = String(importance || 'default').toLowerCase();
  
  const importanceMap: Record<
    string,
    Notifications.AndroidImportance
  > = {
    min: Notifications.AndroidImportance.MIN,
    low: Notifications.AndroidImportance.LOW,
    default: Notifications.AndroidImportance.DEFAULT,
    high: Notifications.AndroidImportance.HIGH,
    max: Notifications.AndroidImportance.MAX,
  };

  return importanceMap[safeImportance] || Notifications.AndroidImportance.DEFAULT;
};

/**
 * Delete a notification channel (useful for cleanup)
 */
export const deleteNotificationChannel = async (
  channelId: string
): Promise<void> => {
  try {
    await Notifications.deleteNotificationChannelAsync(channelId);
    console.log(`✓ Notification channel deleted: ${channelId}`);
  } catch (error) {
    console.error(`Error deleting channel ${channelId}:`, error);
  }
};

/**
 * Get all configured channels
 */
export const getConfiguredChannels = (): AndroidChannel[] => {
  return NOTIFICATION_CHANNELS;
};
