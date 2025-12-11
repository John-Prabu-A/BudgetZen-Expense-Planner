/**
 * Goal Progress Job - Tracks progress towards savings goals
 * Sends milestone notifications at 25%, 50%, 75%, 100% completion
 */

import { supabase } from '@/lib/supabase';
import { notificationService } from './NotificationService';
import { NotificationType } from './types';

export interface GoalMilestone {
  percentage: number;
  icon: string;
  message: string;
}

export const GOAL_MILESTONES: GoalMilestone[] = [
  { percentage: 25, icon: '🌱', message: 'Just starting' },
  { percentage: 50, icon: '📈', message: 'Halfway there' },
  { percentage: 75, icon: '🎯', message: 'Almost done' },
  { percentage: 100, icon: '🏆', message: 'Goal achieved!' },
];

export class GoalProgressJob {
  private static instance: GoalProgressJob;

  private constructor() {}

  static getInstance(): GoalProgressJob {
    if (!GoalProgressJob.instance) {
      GoalProgressJob.instance = new GoalProgressJob();
    }
    return GoalProgressJob.instance;
  }

  /**
   * Check and send goal progress notification
   * Called after each transaction or periodically
   * @param userId - User ID
   * @param goalId - Goal ID (optional - check all if not provided)
   */
  async checkAndNotify(userId: string, goalId?: string): Promise<void> {
    try {
      console.log(`🎯 [Goals] Checking progress for user ${userId}`);

      // Get user preferences
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('goal_progress_enabled')
        .eq('user_id', userId)
        .single();

      if (!prefs?.goal_progress_enabled) {
        console.log(`⏭️ [Goals] Goal notifications disabled for user ${userId}`);
        return;
      }

      // Get all goals for user (or specific goal)
      let query = supabase.from('goals').select('*').eq('user_id', userId);

      if (goalId) {
        query = query.eq('id', goalId);
      }

      const { data: goals } = await query;

      if (!goals || goals.length === 0) {
        console.log(`📊 [Goals] No goals found for user ${userId}`);
        return;
      }

      // Check each goal
      for (const goal of goals) {
        await this.checkGoalProgress(userId, goal);
      }
    } catch (error) {
      console.error('❌ [Goals] Error checking progress:', error);
    }
  }

  /**
   * Check progress for a specific goal
   */
  private async checkGoalProgress(userId: string, goal: any): Promise<void> {
    try {
      // Calculate current progress
      const progress = await this.calculateProgress(goal);

      if (!progress) {
        console.log(`📊 [Goals] No progress data for goal ${goal.id}`);
        return;
      }

      // Get current milestone recorded
      const { data: recordedMilestone } = await supabase
        .from('goal_milestones_notified')
        .select('milestone_percentage')
        .eq('goal_id', goal.id)
        .order('milestone_percentage', { ascending: false })
        .limit(1)
        .single();

      const lastNotifiedPercentage = recordedMilestone?.milestone_percentage || 0;
      const currentPercentage = Math.round(progress.percentage);

      // Find next milestone to notify
      const nextMilestone = GOAL_MILESTONES.find(m => m.percentage > lastNotifiedPercentage && m.percentage <= currentPercentage);

      if (!nextMilestone) {
        console.log(`📊 [Goals] No new milestones for goal ${goal.id}`);
        return;
      }

      // Send notification
      await this.sendMilestoneNotification(userId, goal, progress, nextMilestone);

      // Record that we notified this milestone
      await this.recordMilestoneNotified(goal.id, nextMilestone.percentage);
    } catch (error) {
      console.warn(`Error checking goal ${goal.id}:`, error);
    }
  }

  /**
   * Calculate current progress for a goal
   */
  private async calculateProgress(goal: any): Promise<any> {
    try {
      // Get current savings towards goal
      const startDate = new Date(goal.created_at);
      const now = new Date();

      let currentAmount = 0;

      // If goal is tied to a category
      if (goal.category_id) {
        const { data: savings } = await supabase
          .from('records')
          .select('amount')
          .eq('category_id', goal.category_id)
          .eq('user_id', goal.user_id)
          .eq('type', 'income') // Savings are recorded as income to savings category
          .gte('transaction_date', startDate.toISOString())
          .lte('transaction_date', now.toISOString());

        currentAmount = (savings || []).reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
      } else {
        // Goal is for total savings (if savings category exists)
        const { data: savingsCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('user_id', goal.user_id)
          .eq('name', 'Savings')
          .single();

        if (savingsCategory) {
          const { data: savings } = await supabase
            .from('records')
            .select('amount')
            .eq('category_id', savingsCategory.id)
            .eq('user_id', goal.user_id)
            .eq('type', 'income')
            .gte('transaction_date', startDate.toISOString())
            .lte('transaction_date', now.toISOString());

          currentAmount = (savings || []).reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
        }
      }

      const percentage = (currentAmount / goal.target_amount) * 100;

      return {
        currentAmount: Math.round(currentAmount),
        targetAmount: Math.round(goal.target_amount),
        percentage: Math.min(percentage, 100), // Cap at 100%
        daysElapsed: Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      };
    } catch (error) {
      console.error('Error calculating progress:', error);
      return null;
    }
  }

  /**
   * Send milestone notification
   */
  private async sendMilestoneNotification(
    userId: string,
    goal: any,
    progress: any,
    milestone: GoalMilestone
  ): Promise<void> {
    try {
      const body =
        `${milestone.icon} ${milestone.message}!\n` +
        `${goal.name}: ₹${progress.currentAmount.toLocaleString('en-IN')} of ₹${progress.targetAmount.toLocaleString('en-IN')}\n` +
        `${milestone.percentage}% complete`;

      const payload = {
        type: NotificationType.GOAL_PROGRESS,
        title: `🎯 ${goal.name} ${milestone.percentage}% complete`,
        body,
        data: {
          screen: 'goals',
          action: 'view_goal',
          goalId: goal.id,
          milestone: milestone.percentage.toString(),
        },
      };

      const result = await notificationService.sendNotification(payload);

      if (result.success) {
        console.log(`✅ [Goals] Sent milestone notification for ${goal.name} (${milestone.percentage}%)`);
      } else {
        console.warn(`❌ [Goals] Failed to send: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ [Goals] Error sending notification:', error);
    }
  }

  /**
   * Record that we've notified a milestone
   */
  private async recordMilestoneNotified(goalId: string, percentage: number): Promise<void> {
    try {
      const { error } = await supabase.from('goal_milestones_notified').insert({
        goal_id: goalId,
        milestone_percentage: percentage,
        notified_at: new Date().toISOString(),
      });

      if (error) {
        console.warn('Error recording milestone notification:', error);
      }
    } catch (error) {
      console.warn('Error recording milestone:', error);
    }
  }

  /**
   * Process for all users (for daily/weekly check)
   */
  async processAllUsers(): Promise<void> {
    try {
      console.log(`🔄 [Goals] Processing all users for goal progress...`);

      const { data: preferences, error } = await supabase
        .from('notification_preferences')
        .select('user_id')
        .eq('goal_progress_enabled', true);

      if (error || !preferences || preferences.length === 0) {
        console.log(`📊 [Goals] No users with goal notifications enabled`);
        return;
      }

      console.log(`📊 [Goals] Processing ${preferences.length} users`);

      for (const pref of preferences) {
        await this.checkAndNotify(pref.user_id);
      }

      console.log(`✅ [Goals] Processing complete`);
    } catch (error) {
      console.error('❌ [Goals] Error processing users:', error);
    }
  }
}

export const goalProgressJob = GoalProgressJob.getInstance();
