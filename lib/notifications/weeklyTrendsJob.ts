/**
 * Weekly Trends Job - Analyzes spending trends week-over-week
 * Identifies categories with significant changes (>10% difference)
 * Scheduled once per week (default: Monday 8 AM)
 */

import { supabase } from '@/lib/supabase';
import { notificationService } from './NotificationService';
import { NotificationType } from './types';

export interface SpendingTrend {
  categoryName: string;
  categoryId: string;
  thisWeek: number;
  lastWeek: number;
  change: number;
  changePercentage: number;
  direction: 'up' | 'down' | 'neutral';
}

export class WeeklyTrendsJob {
  private static instance: WeeklyTrendsJob;

  private constructor() {}

  static getInstance(): WeeklyTrendsJob {
    if (!WeeklyTrendsJob.instance) {
      WeeklyTrendsJob.instance = new WeeklyTrendsJob();
    }
    return WeeklyTrendsJob.instance;
  }

  /**
   * Analyze and send trends for a user
   * @param userId - User ID
   */
  async analyzeAndSend(userId: string): Promise<void> {
    try {
      console.log(`📈 [Trends] Analyzing trends for user ${userId}`);

      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!prefs?.trends_report_enabled) {
        console.log(`⏭️ [Trends] Trends report disabled for user ${userId}`);
        return;
      }

      const trends = await this.analyzeTrends(userId);

      if (!trends || trends.length === 0) {
        console.log(`📊 [Trends] No significant trends detected`);
        return;
      }

      await this.sendTrendsNotification(userId, trends);
    } catch (error) {
      console.error('❌ [Trends] Error analyzing trends:', error);
    }
  }

  /**
   * Analyze week-over-week spending trends
   */
  private async analyzeTrends(userId: string): Promise<SpendingTrend[]> {
    try {
      // This week
      const thisWeekStart = new Date();
      const dayOfWeek = thisWeekStart.getDay();
      thisWeekStart.setDate(thisWeekStart.getDate() - dayOfWeek);
      thisWeekStart.setHours(0, 0, 0, 0);

      const thisWeekEnd = new Date(thisWeekStart);
      thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);

      // Last week
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      const lastWeekEnd = new Date(thisWeekStart);

      // Get all categories
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name')
        .eq('user_id', userId);

      if (!categories || categories.length === 0) {
        return [];
      }

      const trends: SpendingTrend[] = [];

      for (const category of categories) {
        try {
          // Get this week
          const { data: thisWeekRecords } = await supabase
            .from('records')
            .select('amount')
            .eq('category_id', category.id)
            .eq('user_id', userId)
            .eq('type', 'expense')
            .gte('transaction_date', thisWeekStart.toISOString())
            .lt('transaction_date', thisWeekEnd.toISOString());

          const thisWeekSpent = (thisWeekRecords || []).reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

          // Get last week
          const { data: lastWeekRecords } = await supabase
            .from('records')
            .select('amount')
            .eq('category_id', category.id)
            .eq('user_id', userId)
            .eq('type', 'expense')
            .gte('transaction_date', lastWeekStart.toISOString())
            .lt('transaction_date', lastWeekEnd.toISOString());

          const lastWeekSpent = (lastWeekRecords || []).reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

          // Calculate change
          if (lastWeekSpent === 0 && thisWeekSpent === 0) {
            continue; // No data
          }

          let changePercentage = 0;
          if (lastWeekSpent > 0) {
            changePercentage = ((thisWeekSpent - lastWeekSpent) / lastWeekSpent) * 100;
          } else if (thisWeekSpent > 0) {
            changePercentage = 100; // Started spending
          }

          // Only include if change > 10%
          if (Math.abs(changePercentage) >= 10) {
            trends.push({
              categoryName: category.name,
              categoryId: category.id,
              thisWeek: Math.round(thisWeekSpent),
              lastWeek: Math.round(lastWeekSpent),
              change: Math.round(thisWeekSpent - lastWeekSpent),
              changePercentage: Math.round(changePercentage),
              direction: thisWeekSpent > lastWeekSpent ? 'up' : thisWeekSpent < lastWeekSpent ? 'down' : 'neutral',
            });
          }
        } catch (error) {
          console.warn(`Error analyzing category ${category.id}:`, error);
        }
      }

      // Sort by absolute change percentage
      trends.sort((a, b) => Math.abs(b.changePercentage) - Math.abs(a.changePercentage));

      return trends;
    } catch (error) {
      console.error('Error analyzing trends:', error);
      return [];
    }
  }

  /**
   * Send trends notification
   */
  private async sendTrendsNotification(userId: string, trends: SpendingTrend[]): Promise<void> {
    try {
      // Show top 3 trends
      const topTrends = trends.slice(0, 3);

      let body = `📈 Spending Trends This Week\n\n`;

      for (const trend of topTrends) {
        const icon = trend.direction === 'up' ? '⬆️' : '⬇️';
        const changeStr = trend.changePercentage > 0 ? `+${trend.changePercentage}%` : `${trend.changePercentage}%`;
        body += `${icon} ${trend.categoryName}: ${changeStr}\n   ₹${trend.thisWeek.toLocaleString('en-IN')} (was ₹${trend.lastWeek.toLocaleString('en-IN')})\n\n`;
      }

      if (trends.length > 3) {
        body += `+${trends.length - 3} more trends`;
      }

      const payload = {
        type: NotificationType.SPENDING_TRENDS,
        title: `📈 Check your spending trends`,
        body,
        data: {
          screen: 'analysis',
          action: 'view_trends',
          trendsCount: trends.length.toString(),
        },
      };

      const result = await notificationService.sendNotification(payload);

      if (result.success) {
        console.log(`✅ [Trends] Sent ${trends.length} trend(s) to user ${userId}`);
        await this.recordJobExecution(userId, 'trends_report', result.notificationId);
      } else {
        console.warn(`❌ [Trends] Failed to send: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ [Trends] Error sending notification:', error);
    }
  }

  /**
   * Process for all users
   */
  async processAllUsers(): Promise<void> {
    try {
      console.log(`🔄 [Trends] Processing all users...`);

      const { data: preferences, error } = await supabase
        .from('notification_preferences')
        .select('user_id')
        .eq('trends_report_enabled', true);

      if (error || !preferences || preferences.length === 0) {
        console.log(`📊 [Trends] No users with trends report enabled`);
        return;
      }

      console.log(`📊 [Trends] Processing ${preferences.length} users`);

      for (const pref of preferences) {
        await this.analyzeAndSend(pref.user_id);
      }

      console.log(`✅ [Trends] Processing complete`);
    } catch (error) {
      console.error('❌ [Trends] Error processing users:', error);
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

export const weeklyTrendsJob = WeeklyTrendsJob.getInstance();
