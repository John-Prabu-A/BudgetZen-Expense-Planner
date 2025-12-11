/**
 * Notification Scheduler
 * Manages scheduling of various notification types based on user preferences
 */

import { notificationService } from './NotificationService';
import { NotificationPayload, NotificationPreferences, NotificationPriority, NotificationType } from './types';

/**
 * Notification Scheduler Class
 */
export class NotificationScheduler {
  private static instance: NotificationScheduler;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler();
    }
    return NotificationScheduler.instance;
  }

  /**
   * Schedule daily reminder notification
   */
  async scheduleDailyReminder(preferences: NotificationPreferences): Promise<void> {
    if (!preferences.dailyReminder.enabled) {
      console.log('⏭️ Daily reminder disabled');
      return;
    }

    const [hour, minute] = preferences.dailyReminder.time.split(':').map(Number);

    const payload: NotificationPayload = {
      type: NotificationType.DAILY_REMINDER,
      title: '📝 Time to update your finances',
      body: "Quick! Log your today's expenses before you forget",
      data: {
        screen: 'records',
        type: 'daily_reminder',
      },
    };

    await notificationService.scheduleNotificationAtTime(
      payload,
      hour,
      minute,
      true
    );

    console.log(`✅ Daily reminder scheduled for ${hour}:${minute}`);
  }

  /**
   * Schedule weekly report notification
   */
  async scheduleWeeklyReport(preferences: NotificationPreferences): Promise<void> {
    if (!preferences.weeklyReport.enabled) {
      console.log('⏭️ Weekly report disabled');
      return;
    }

    const [hour, minute] = preferences.weeklyReport.time.split(':').map(Number);
    const dayOfWeek = preferences.weeklyReport.dayOfWeek;

    const payload: NotificationPayload = {
      type: NotificationType.WEEKLY_REPORT,
      title: '📊 Your Weekly Financial Report',
      body: 'You spent ₹X this week. Tap to see breakdown',
      data: {
        screen: 'analysis',
        view: 'weekly',
        type: 'weekly_report',
      },
    };

    await notificationService.scheduleWeeklyNotification(
      payload,
      dayOfWeek,
      hour,
      minute
    );

    console.log(`✅ Weekly report scheduled for day ${dayOfWeek} at ${hour}:${minute}`);
  }

  /**
   * Schedule monthly report notification
   */
  async scheduleMonthlyReport(preferences: NotificationPreferences): Promise<void> {
    if (!preferences.monthlyReport.enabled) {
      console.log('⏭️ Monthly report disabled');
      return;
    }

    const [hour, minute] = preferences.monthlyReport.time.split(':').map(Number);
    const dayOfMonth = preferences.monthlyReport.dayOfMonth;

    const payload: NotificationPayload = {
      type: NotificationType.MONTHLY_REPORT,
      title: '📈 Your Monthly Financial Report',
      body: 'Detailed insights into your spending & savings',
      data: {
        screen: 'analysis',
        view: 'monthly',
        type: 'monthly_report',
      },
    };

    await notificationService.scheduleMonthlyNotification(
      payload,
      dayOfMonth,
      hour,
      minute
    );

    console.log(`✅ Monthly report scheduled for day ${dayOfMonth} at ${hour}:${minute}`);
  }

  /**
   * Send budget warning alert
   */
  async sendBudgetWarning(
    categoryName: string,
    spent: number,
    budget: number,
    percentage: number
  ): Promise<void> {
    const payload: NotificationPayload = {
      type: NotificationType.BUDGET_WARNING,
      title: `⚠️ Budget Alert: ${categoryName} at ${percentage}%`,
      body: `You've used ₹${spent} of ₹${budget}. Spend wisely!`,
      data: {
        screen: 'budgets',
        action: 'view_budget',
        category: categoryName,
        spent: spent.toString(),
        budget: budget.toString(),
        percentage: percentage.toString(),
      },
      sound: 'notification_sound.wav',
      priority: NotificationPriority.TIME_SENSITIVE,
      categoryId: 'budget_alert',
    };

    await notificationService.sendNotification(payload);
    console.log(`✅ Budget warning sent for ${categoryName}`);
  }

  /**
   * Send budget exceeded alert
   */
  async sendBudgetExceeded(
    categoryName: string,
    spent: number,
    budget: number,
    exceededAmount: number
  ): Promise<void> {
    const payload: NotificationPayload = {
      type: NotificationType.BUDGET_EXCEEDED,
      title: `🚨 Budget Exceeded: ${categoryName}`,
      body: `You've exceeded your budget by ₹${exceededAmount}. Review spending!`,
      data: {
        screen: 'budgets',
        action: 'view_budget',
        category: categoryName,
        spent: spent.toString(),
        budget: budget.toString(),
        exceeded_amount: exceededAmount.toString(),
      },
      sound: 'critical_alert.wav',
      priority: NotificationPriority.TIME_SENSITIVE,
      categoryId: 'budget_alert',
      badge: 1,
    };

    await notificationService.sendNotification(payload);
    await notificationService.setBadgeCount(1);
    console.log(`✅ Budget exceeded alert sent for ${categoryName}`);
  }

  /**
   * Send zero spending achievement
   */
  async sendZeroSpendingAchievement(): Promise<void> {
    const payload: NotificationPayload = {
      type: NotificationType.ACHIEVEMENT,
      title: '🎉 Great Job!',
      body: "You didn't spend anything today. Keep it up!",
      data: {
        screen: 'analysis',
        action: 'view_achievements',
        type: 'zero_spending',
      },
      priority: NotificationPriority.PASSIVE,
      categoryId: 'achievement',
    };

    await notificationService.sendNotification(payload);
    console.log('✅ Zero spending achievement sent');
  }

  /**
   * Send savings goal progress
   */
  async sendSavingsGoalProgress(
    goalName: string,
    percentage: number,
    amount: number,
    target: number
  ): Promise<void> {
    const payload: NotificationPayload = {
      type: NotificationType.SAVINGS_GOAL,
      title: `🏆 Savings Goal ${percentage}% Reached!`,
      body: "You're on track to reach your goal!",
      data: {
        screen: 'analysis',
        action: 'view_goals',
        goal_name: goalName,
        percentage: percentage.toString(),
        amount: amount.toString(),
        target: target.toString(),
      },
      priority: NotificationPriority.ACTIVE,
      categoryId: 'achievement',
    };

    await notificationService.sendNotification(payload);
    console.log(`✅ Savings goal progress sent: ${goalName} - ${percentage}%`);
  }

  /**
   * Send unusual spending alert
   */
  async sendUnusualSpendingAlert(
    amount: number,
    average: number,
    percentage: number
  ): Promise<void> {
    const payload: NotificationPayload = {
      type: NotificationType.UNUSUAL_SPENDING,
      title: '📌 Unusual Spending Detected',
      body: `Your spending is ₹${(amount - average).toFixed(2)} higher than usual`,
      data: {
        screen: 'analysis',
        action: 'view_details',
        amount: amount.toString(),
        average: average.toString(),
        percentage: percentage.toString(),
      },
      priority: NotificationPriority.ACTIVE,
      categoryId: 'spending_alert',
    };

    await notificationService.sendNotification(payload);
    console.log('✅ Unusual spending alert sent');
  }

  /**
   * Send low balance alert
   */
  async sendLowBalanceAlert(
    accountName: string,
    balance: number
  ): Promise<void> {
    const payload: NotificationPayload = {
      type: NotificationType.LOW_BALANCE,
      title: '⚠️ Low Balance Alert',
      body: `Account ${accountName}: ₹${balance} remaining`,
      data: {
        screen: 'accounts',
        action: 'view_accounts',
        account_name: accountName,
        balance: balance.toString(),
      },
      sound: 'notification_sound.wav',
      priority: NotificationPriority.TIME_SENSITIVE,
      categoryId: 'account_alert',
    };

    await notificationService.sendNotification(payload);
    console.log(`✅ Low balance alert sent for ${accountName}`);
  }

  /**
   * Schedule daily budget notification
   */
  async scheduleDailyBudgetNotif(preferences: NotificationPreferences): Promise<void> {
    if (!preferences.dailyBudgetNotif.enabled) {
      console.log('⏭️ Daily budget notification disabled');
      return;
    }

    const [hour, minute] = preferences.dailyBudgetNotif.time.split(':').map(Number);

    const payload: NotificationPayload = {
      type: NotificationType.DAILY_BUDGET,
      title: '💰 Today\'s Spending Budget',
      body: 'You have ₹{DailyBudget} available today',
      data: {
        screen: 'records',
        type: 'daily_budget',
      },
      priority: NotificationPriority.PASSIVE,
    };

    await notificationService.scheduleNotificationAtTime(
      payload,
      hour,
      minute,
      true
    );

    console.log(`✅ Daily budget notification scheduled for ${hour}:${minute}`);
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    const result = await notificationService.cancelAllNotifications();
    if (result.success) {
      console.log('✅ All notifications cancelled');
    } else {
      console.error('❌ Failed to cancel notifications:', result.error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getAllScheduledNotifications() {
    return await notificationService.getScheduledNotifications();
  }
}

/**
 * Convenience export - default instance
 */
export const notificationScheduler = NotificationScheduler.getInstance();
