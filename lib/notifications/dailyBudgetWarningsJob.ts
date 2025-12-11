/**
 * Daily Budget Warnings Job - Alerts when categories reach 80% of budget
 * Batches all warnings into a single notification
 * Scheduled once per day at user's preferred time
 */

import { supabase } from '@/lib/supabase';
import { notificationService } from './NotificationService';
import { NotificationType } from './types';

export interface BudgetWarning {
  categoryName: string;
  categoryId: string;
  spent: number;
  budget: number;
  percentage: number;
}

export class DailyBudgetWarningsJob {
  private static instance: DailyBudgetWarningsJob;

  private constructor() {}

  static getInstance(): DailyBudgetWarningsJob {
    if (!DailyBudgetWarningsJob.instance) {
      DailyBudgetWarningsJob.instance = new DailyBudgetWarningsJob();
    }
    return DailyBudgetWarningsJob.instance;
  }

  /**
   * Check and send budget warnings for a specific user
   * @param userId - User ID
   * @param warningThreshold - Percentage threshold (default: 80)
   */
  async checkBudgetWarnings(userId: string, warningThreshold: number = 80): Promise<void> {
    try {
      console.log(`⚠️ [BudgetWarnings] Checking budgets for user ${userId}`);

      // Get user preferences
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!prefs?.budget_warnings_enabled) {
        console.log(`⏭️ [BudgetWarnings] Budget warnings disabled for user ${userId}`);
        return;
      }

      // Get month start date
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      // Get all categories with budgets
      const { data: budgets, error: budgetError } = await supabase
        .from('budgets')
        .select('id, category_id, amount')
        .eq('user_id', userId);

      if (budgetError || !budgets || budgets.length === 0) {
        console.log(`📊 [BudgetWarnings] No budgets found for user ${userId}`);
        return;
      }

      const warnings: BudgetWarning[] = [];

      // Check each category
      for (const budget of budgets) {
        try {
          const { data: records, error: recordError } = await supabase
            .from('records')
            .select('amount')
            .eq('category_id', budget.category_id)
            .eq('user_id', userId)
            .eq('type', 'expense')
            .gte('transaction_date', monthStart.toISOString());

          if (recordError || !records) {
            console.warn(`Error fetching records for category ${budget.category_id}`);
            continue;
          }

          const spent = records.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
          const percentage = (spent / budget.amount) * 100;

          if (percentage >= warningThreshold) {
            // Get category name
            const { data: category } = await supabase
              .from('categories')
              .select('name')
              .eq('id', budget.category_id)
              .single();

            warnings.push({
              categoryName: category?.name || 'Unknown',
              categoryId: budget.category_id,
              spent,
              budget: budget.amount,
              percentage: Math.round(percentage),
            });
          }
        } catch (error) {
          console.warn(`Error checking budget for category ${budget.category_id}:`, error);
        }
      }

      // Send batched notification if there are warnings
      if (warnings.length > 0) {
        await this.sendBatchedWarnings(userId, warnings);
      } else {
        console.log(`✅ [BudgetWarnings] No warnings for user ${userId}`);
      }
    } catch (error) {
      console.error('❌ [BudgetWarnings] Error checking budgets:', error);
    }
  }

  /**
   * Send batched warning notification
   */
  private async sendBatchedWarnings(userId: string, warnings: BudgetWarning[]): Promise<void> {
    try {
      // Sort by percentage descending
      warnings.sort((a, b) => b.percentage - a.percentage);

      // Build message
      let body = `${warnings.length} category/categories at 80%+ of budget:\n`;
      for (let i = 0; i < Math.min(warnings.length, 3); i++) {
        const w = warnings[i];
        body += `\n${w.categoryName}: ${w.percentage}% (₹${w.spent.toLocaleString('en-IN')}/₹${w.budget.toLocaleString('en-IN')})`;
      }

      if (warnings.length > 3) {
        body += `\n\n+${warnings.length - 3} more...`;
      }

      const payload = {
        type: NotificationType.BUDGET_WARNING,
        title: `⚠️ Budget warning: ${warnings.length} ${warnings.length === 1 ? 'category' : 'categories'}`,
        body,
        data: {
          screen: 'analysis',
          action: 'view_budgets',
          warningsCount: warnings.length.toString(),
        },
      };

      const result = await notificationService.sendNotification(payload);

      if (result.success) {
        console.log(`✅ [BudgetWarnings] Sent ${warnings.length} warning(s) to user ${userId}`);
        await this.recordJobExecution(userId, 'budget_warnings', result.notificationId);
      } else {
        console.warn(`❌ [BudgetWarnings] Failed to send: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ [BudgetWarnings] Error sending batched warnings:', error);
    }
  }

  /**
   * Process budget warnings for all active users
   */
  async processAllUsers(): Promise<void> {
    try {
      console.log(`🔄 [BudgetWarnings] Processing all users...`);

      const { data: preferences, error } = await supabase
        .from('notification_preferences')
        .select('user_id, budget_warning_threshold')
        .eq('budget_warnings_enabled', true);

      if (error || !preferences || preferences.length === 0) {
        console.log(`📊 [BudgetWarnings] No users with budget warnings enabled`);
        return;
      }

      console.log(`📊 [BudgetWarnings] Processing ${preferences.length} users`);

      for (const pref of preferences) {
        await this.checkBudgetWarnings(pref.user_id, pref.budget_warning_threshold || 80);
      }

      console.log(`✅ [BudgetWarnings] Processing complete`);
    } catch (error) {
      console.error('❌ [BudgetWarnings] Error processing users:', error);
    }
  }

  /**
   * Record job execution
   */
  private async recordJobExecution(
    userId: string,
    jobType: string,
    notificationId?: string
  ): Promise<void> {
    try {
      const { error } = await supabase.from('notification_jobs').insert({
        user_id: userId,
        job_type: jobType,
        last_run: new Date().toISOString(),
        notification_id: notificationId,
      });

      if (error) {
        console.warn('Error recording job execution:', error);
      }
    } catch (error) {
      console.warn('Error recording job:', error);
    }
  }

  /**
   * Get statistics
   */
  async getStats(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('notification_jobs')
        .select('*')
        .eq('user_id', userId)
        .eq('job_type', 'budget_warnings')
        .order('last_run', { ascending: false })
        .limit(7);

      if (error) {
        console.warn('Error getting stats:', error);
        return {};
      }

      return {
        totalJobs: data?.length || 0,
        lastRun: data?.[0]?.last_run,
        jobsThisWeek: data?.length || 0,
      };
    } catch (error) {
      console.warn('Error getting stats:', error);
      return {};
    }
  }
}

export const dailyBudgetWarningsJob = DailyBudgetWarningsJob.getInstance();
