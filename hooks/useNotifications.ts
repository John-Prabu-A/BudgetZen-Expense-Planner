/**
 * useNotifications Hook
 * Custom hook for managing notifications throughout the app
 */

import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { useNotifications as useNotificationsContext } from '../context/Notifications';
import { notificationService } from '../lib/notifications/NotificationService';
import { notificationScheduler } from '../lib/notifications/notificationScheduler';
import { NotificationPayload, NotificationResult } from '../lib/notifications/types';

interface NotificationListeners {
  onNotificationReceived?: (notification: Notifications.Notification) => void;
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void;
}

/**
 * Hook for notification operations
 */
export const useNotifications = (listeners?: NotificationListeners) => {
  const context = useNotificationsContext();
  const [lastNotification, setLastNotification] = useState<Notifications.Notification | null>(null);
  const [lastResponse, setLastResponse] = useState<Notifications.NotificationResponse | null>(null);

  /**
   * Send immediate notification
   */
  const sendNotification = useCallback(
    async (payload: NotificationPayload): Promise<NotificationResult> => {
      if (!context.isNotificationAllowed()) {
        console.log('⚠️ Notification blocked by DND or user settings');
        return {
          success: false,
          message: 'Notifications are currently disabled',
        };
      }
      return notificationService.sendNotification(payload);
    },
    [context]
  );

  /**
   * Schedule daily reminder
   */
  const scheduleDailyReminder = useCallback(async () => {
    if (!context.preferences?.dailyReminder.enabled) {
      console.log('⚠️ Daily reminder is disabled');
      return;
    }
    await notificationScheduler.scheduleDailyReminder(context.preferences);
  }, [context.preferences]);

  /**
   * Schedule weekly report
   */
  const scheduleWeeklyReport = useCallback(async () => {
    if (!context.preferences?.weeklyReport.enabled) {
      console.log('⚠️ Weekly report is disabled');
      return;
    }
    await notificationScheduler.scheduleWeeklyReport(context.preferences);
  }, [context.preferences]);

  /**
   * Schedule monthly report
   */
  const scheduleMonthlyReport = useCallback(async () => {
    if (!context.preferences?.monthlyReport.enabled) {
      console.log('⚠️ Monthly report is disabled');
      return;
    }
    await notificationScheduler.scheduleMonthlyReport(context.preferences);
  }, [context.preferences]);

  /**
   * Send budget warning
   */
  const sendBudgetWarning = useCallback(
    async (categoryName: string, spent: number, budget: number) => {
      if (!context.preferences?.budgetAlerts.enabled || !context.isNotificationAllowed()) {
        return;
      }
      const percentage = (spent / budget) * 100;
      await notificationScheduler.sendBudgetWarning(categoryName, spent, budget, percentage);
    },
    [context]
  );

  /**
   * Send budget exceeded alert
   */
  const sendBudgetExceeded = useCallback(
    async (categoryName: string, spent: number, budget: number) => {
      if (!context.preferences?.budgetAlerts.enabled || !context.isNotificationAllowed()) {
        return;
      }
      const exceededAmount = spent - budget;
      await notificationScheduler.sendBudgetExceeded(categoryName, spent, budget, exceededAmount);
    },
    [context]
  );

  /**
   * Send achievement notification
   */
  const sendAchievement = useCallback(
    async (title: string, body: string) => {
      if (!context.preferences?.achievements.enabled || !context.isNotificationAllowed()) {
        return;
      }
      await sendNotification({
        type: 'achievement' as any,
        title,
        body,
        priority: 'passive' as any,
      });
    },
    [context, sendNotification]
  );

  /**
   * Send savings goal progress
   */
  const sendSavingsGoalProgress = useCallback(
    async (goalName: string, percentage: number, amount: number, target: number) => {
      if (!context.preferences?.achievements.enabled || !context.isNotificationAllowed()) {
        return;
      }
      await notificationScheduler.sendSavingsGoalProgress(goalName, percentage, amount, target);
    },
    [context]
  );

  /**
   * Send unusual spending alert
   */
  const sendUnusualSpending = useCallback(
    async (amount: number, average: number) => {
      if (!context.preferences?.spendingAnomalies.enabled || !context.isNotificationAllowed()) {
        return;
      }
      const percentage = (amount / average) * 100;
      await notificationScheduler.sendUnusualSpendingAlert(amount, average, percentage);
    },
    [context]
  );

  /**
   * Send low balance alert
   */
  const sendLowBalance = useCallback(
    async (accountName: string, balance: number) => {
      if (!context.preferences?.accountAlerts.enabled || !context.isNotificationAllowed()) {
        return;
      }
      await notificationScheduler.sendLowBalanceAlert(accountName, balance);
    },
    [context]
  );

  /**
   * Cancel notification
   */
  const cancelNotification = useCallback((notificationId: string) => {
    return notificationService.cancelNotification(notificationId);
  }, []);

  /**
   * Cancel all notifications
   */
  const cancelAllNotifications = useCallback(() => {
    return notificationService.cancelAllNotifications();
  }, []);

  /**
   * Get scheduled notifications
   */
  const getScheduledNotifications = useCallback(() => {
    return notificationService.getScheduledNotifications();
  }, []);

  /**
   * Setup notification listeners
   */
  useEffect(() => {
    // Listener for incoming notifications
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📱 Notification received:', notification);
        setLastNotification(notification);
        listeners?.onNotificationReceived?.(notification);
      }
    );

    // Listener for notification responses (when user taps notification)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 Notification response:', response);
        setLastResponse(response);
        listeners?.onNotificationResponse?.(response);
      }
    );

    // Cleanup
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [listeners]);

  return {
    // State
    lastNotification,
    lastResponse,
    isLoading: context.isLoading,
    isPushEnabled: context.isPushEnabled,
    error: context.error,

    // Methods
    sendNotification,
    scheduleDailyReminder,
    scheduleWeeklyReport,
    scheduleMonthlyReport,
    sendBudgetWarning,
    sendBudgetExceeded,
    sendAchievement,
    sendSavingsGoalProgress,
    sendUnusualSpending,
    sendLowBalance,
    cancelNotification,
    cancelAllNotifications,
    getScheduledNotifications,
    registerPushToken: context.registerPushToken,
    syncTokenWithBackend: context.syncTokenWithBackend,
    loadPreferences: context.loadPreferences,
    savePreferences: context.savePreferences,
    updatePreference: context.updatePreference,
    isNotificationAllowed: context.isNotificationAllowed,
    clearError: context.clearError,
  };
};

export default useNotifications;
