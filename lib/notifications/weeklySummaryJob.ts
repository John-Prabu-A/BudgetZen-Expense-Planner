/**
 * Weekly Summary Job - Sends weekly financial summary
 * Shows income, expenses, savings, and budget compliance
 * Scheduled once per week (default: Sunday 7 PM)
 */

import { supabase } from '@/lib/supabase';
import { notificationService } from './NotificationService';
import { NotificationType } from './types';

export interface WeeklySummary {
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  budgetCompliance: number;
  topCategories: Array<{
    name: string;
    amount: number;
  }>;
}

export class WeeklySummaryJob {
  private static instance: WeeklySummaryJob;

  private constructor() {}

  static getInstance(): WeeklySummaryJob {
    if (!WeeklySummaryJob.instance) {
      WeeklySummaryJob.instance = new WeeklySummaryJob();
    }
    return WeeklySummaryJob.instance;
  }

  /**
   * Generate and send weekly summary for a user
   * @param userId - User ID
   */
  async generateAndSend(userId: string): Promise<void> {
    try {
      console.log(`📊 [WeeklySummary] Generating summary for user ${userId}`);

      // Get user preferences
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!prefs?.weekly_summary_enabled) {
        console.log(`⏭️ [WeeklySummary] Weekly summary disabled for user ${userId}`);
        return;
      }

      const summary = await this.calculateSummary(userId);

      if (!summary) {
        console.log(`📊 [WeeklySummary] No data for summary`);
        return;
      }

      await this.sendSummaryNotification(userId, summary);
    } catch (error) {
      console.error('❌ [WeeklySummary] Error generating summary:', error);
    }
  }

  /**
   * Calculate weekly financial summary
   */
  private async calculateSummary(userId: string): Promise<WeeklySummary | null> {
    try {
      // Get last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      // Get all transactions
      const { data: records } = await supabase
        .from('records')
        .select('amount, type, category_id')
        .eq('user_id', userId)
        .gte('transaction_date', sevenDaysAgo.toISOString());

      if (!records || records.length === 0) {
        return null;
      }

      let income = 0;
      let expenses = 0;
      const categorySpending: Record<string, number> = {};

      for (const record of records) {
        if (record.type === 'income') {
          income += record.amount;
        } else if (record.type === 'expense') {
          expenses += record.amount;
          categorySpending[record.category_id] = (categorySpending[record.category_id] || 0) + record.amount;
        }
      }

      const savings = income - expenses;
      const savingsRate = income > 0 ? (savings / income) * 100 : 0;

      // Get budget compliance
      const budgetCompliance = await this.calculateBudgetCompliance(userId);

      // Get top categories
      const topCategories = await this.getTopCategories(userId, categorySpending);

      return {
        income: Math.round(income),
        expenses: Math.round(expenses),
        savings: Math.round(savings),
        savingsRate: Math.round(savingsRate),
        budgetCompliance,
        topCategories,
      };
    } catch (error) {
      console.error('Error calculating summary:', error);
      return null;
    }
  }

  /**
   * Calculate budget compliance percentage
   */
  private async calculateBudgetCompliance(userId: string): Promise<number> {
    try {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      // Get all budgets
      const { data: budgets } = await supabase
        .from('budgets')
        .select('id, amount, category_id')
        .eq('user_id', userId);

      if (!budgets || budgets.length === 0) {
        return 100; // No budgets = 100% compliant
      }

      let compliant = 0;

      for (const budget of budgets) {
        const { data: records } = await supabase
          .from('records')
          .select('amount')
          .eq('category_id', budget.category_id)
          .eq('user_id', userId)
          .eq('type', 'expense')
          .gte('transaction_date', monthStart.toISOString());

        const spent = (records || []).reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

        if (spent <= budget.amount) {
          compliant++;
        }
      }

      return Math.round((compliant / budgets.length) * 100);
    } catch (error) {
      console.error('Error calculating compliance:', error);
      return 0;
    }
  }

  /**
   * Get top spending categories
   */
  private async getTopCategories(userId: string, categorySpending: Record<string, number>): Promise<any[]> {
    try {
      const top = Object.entries(categorySpending)
        .sort(([_, a], [__, b]) => b - a)
        .slice(0, 3);

      const result = [];

      for (const [categoryId, amount] of top) {
        const { data: category } = await supabase
          .from('categories')
          .select('name')
          .eq('id', categoryId)
          .single();

        result.push({
          name: category?.name || 'Unknown',
          amount: Math.round(amount),
        });
      }

      return result;
    } catch (error) {
      console.error('Error getting top categories:', error);
      return [];
    }
  }

  /**
   * Send summary notification
   */
  private async sendSummaryNotification(userId: string, summary: WeeklySummary): Promise<void> {
    try {
      let body = `📊 Weekly Financial Summary\n\n`;
      body += `Income: ₹${summary.income.toLocaleString('en-IN')}\n`;
      body += `Expenses: ₹${summary.expenses.toLocaleString('en-IN')}\n`;
      body += `Savings: ₹${summary.savings.toLocaleString('en-IN')} (${summary.savingsRate}%)\n\n`;
      body += `Budget Compliance: ${summary.budgetCompliance}%\n\n`;
      body += `Top Categories:\n`;

      for (const cat of summary.topCategories) {
        body += `• ${cat.name}: ₹${cat.amount.toLocaleString('en-IN')}\n`;
      }

      const payload = {
        type: NotificationType.WEEKLY_SUMMARY,
        title: `📊 Your weekly summary is ready`,
        body,
        data: {
          screen: 'analysis',
          action: 'view_weekly_summary',
        },
      };

      const result = await notificationService.sendNotification(payload);

      if (result.success) {
        console.log(`✅ [WeeklySummary] Sent to user ${userId}`);
        await this.recordJobExecution(userId, 'weekly_summary', result.notificationId);
      } else {
        console.warn(`❌ [WeeklySummary] Failed to send: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ [WeeklySummary] Error sending notification:', error);
    }
  }

  /**
   * Process weekly summaries for all users
   */
  async processAllUsers(): Promise<void> {
    try {
      console.log(`🔄 [WeeklySummary] Processing all users...`);

      const { data: preferences, error } = await supabase
        .from('notification_preferences')
        .select('user_id')
        .eq('weekly_summary_enabled', true);

      if (error || !preferences || preferences.length === 0) {
        console.log(`📊 [WeeklySummary] No users with weekly summary enabled`);
        return;
      }

      console.log(`📊 [WeeklySummary] Processing ${preferences.length} users`);

      for (const pref of preferences) {
        await this.generateAndSend(pref.user_id);
      }

      console.log(`✅ [WeeklySummary] Processing complete`);
    } catch (error) {
      console.error('❌ [WeeklySummary] Error processing users:', error);
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
}

export const weeklySummaryJob = WeeklySummaryJob.getInstance();
