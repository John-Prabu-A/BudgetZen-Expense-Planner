import { supabase } from '@/lib/supabase';

/**
 * Phase 5: Real-World Triggers
 * Integration points for triggering notifications based on real events
 */

export const NotificationTriggers = {
  /**
   * Call when user adds a new expense
   * Triggers: Budget alert, Anomaly detection
   */
  async onExpenseAdded(userId: string, expenseData: {
    category_id: string;
    amount: number;
    date: string;
  }) {
    try {
      // Check budget alert
      await supabase.functions.invoke('check-budget-alert', {
        body: {
          user_id: userId,
          category_id: expenseData.category_id,
          amount: expenseData.amount,
          transaction_date: expenseData.date,
        },
      });

      // Detect anomaly
      await supabase.functions.invoke('detect-anomaly', {
        body: {
          user_id: userId,
          category_id: expenseData.category_id,
          amount: expenseData.amount,
          transaction_date: expenseData.date,
        },
      });
    } catch (error) {
      console.error('Error triggering expense notifications:', error);
    }
  },

  /**
   * Call when user updates a goal
   * Triggers: Goal progress milestone
   */
  async onGoalUpdated(userId: string, goalId: string) {
    try {
      await supabase.functions.invoke('track-goal-progress', {
        body: {
          user_id: userId,
          goal_id: goalId,
        },
      });
    } catch (error) {
      console.error('Error triggering goal notification:', error);
    }
  },

  /**
   * Call daily to check for achievements
   * Triggers: Various achievement notifications
   */
  async checkAchievements(userId: string) {
    try {
      await supabase.functions.invoke('award-achievements', {
        body: {
          user_id: userId,
        },
      });
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  },

  /**
   * Call when user syncs bank transactions
   * Triggers: Budget, Anomaly, Achievements
   */
  async onBankSyncCompleted(userId: string, transactions: Array<{
    category_id: string;
    amount: number;
    date: string;
  }>) {
    try {
      for (const transaction of transactions) {
        await this.onExpenseAdded(userId, transaction);
      }
    } catch (error) {
      console.error('Error processing synced transactions:', error);
    }
  },
};

export default NotificationTriggers;
