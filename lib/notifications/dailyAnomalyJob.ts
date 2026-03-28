/**
 * Daily Anomaly Job - Detects unusual spending patterns
 * Identifies categories with spending >40% above average
 * Scheduled once per day at user's preferred time
 */

import { supabase } from '@/lib/supabase';
import { notificationService } from './NotificationService';
import { NotificationType } from './types';

export interface SpendingAnomaly {
  categoryName: string;
  categoryId: string;
  todaySpent: number;
  dayAverage: number;
  percentageAboveAverage: number;
}

export class DailyAnomalyJob {
  private static instance: DailyAnomalyJob;

  private constructor() {}

  static getInstance(): DailyAnomalyJob {
    if (!DailyAnomalyJob.instance) {
      DailyAnomalyJob.instance = new DailyAnomalyJob();
    }
    return DailyAnomalyJob.instance;
  }

  /**
   * Check for spending anomalies for a user
   * @param userId - User ID
   * @param threshold - Percentage above average (default: 40%)
   */
  async detectAnomalies(userId: string, threshold: number = 40): Promise<void> {
    try {
      console.log(`📊 [DailyAnomaly] Detecting anomalies for user ${userId}`);

      // Get user preferences
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!prefs?.daily_anomaly_enabled) {
        console.log(`⏭️ [DailyAnomaly] Anomaly detection disabled for user ${userId}`);
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get all categories
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id, name, type')
        .eq('user_id', userId);

      if (catError || !categories || categories.length === 0) {
        console.log(`📊 [DailyAnomaly] No categories found for user ${userId}`);
        return;
      }

      const anomalies: SpendingAnomaly[] = [];

      // Check each category
      for (const category of categories) {
        try {
          // Get today's spending
          const { data: todayRecords } = await supabase
            .from('records')
            .select('amount')
            .eq('category_id', category.id)
            .eq('user_id', userId)
            .eq('type', 'expense')
            .gte('transaction_date', today.toISOString())
            .lt('transaction_date', tomorrow.toISOString());

          const todaySpent = (todayRecords || []).reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

          if (todaySpent === 0) {
            continue; // No spending today
          }

          // Get last 30 days average (excluding today)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const { data: historyRecords } = await supabase
            .from('records')
            .select('amount')
            .eq('category_id', category.id)
            .eq('user_id', userId)
            .eq('type', 'expense')
            .gte('transaction_date', thirtyDaysAgo.toISOString())
            .lt('transaction_date', today.toISOString());

          if (!historyRecords || historyRecords.length < 5) {
            continue; // Not enough history
          }

          const totalHistory = historyRecords.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
          const dayAverage = totalHistory / 30; // Average per day

          const percentageAboveAverage = ((todaySpent - dayAverage) / dayAverage) * 100;

          if (percentageAboveAverage >= threshold) {
            anomalies.push({
              categoryName: category.name,
              categoryId: category.id,
              todaySpent,
              dayAverage: Math.round(dayAverage),
              percentageAboveAverage: Math.round(percentageAboveAverage),
            });
          }
        } catch (error) {
          console.warn(`Error checking anomaly for category ${category.id}:`, error);
        }
      }

      // Send notification if anomalies found
      if (anomalies.length > 0) {
        await this.sendAnomalyNotification(userId, anomalies);
      } else {
        console.log(`✅ [DailyAnomaly] No anomalies detected for user ${userId}`);
      }
    } catch (error) {
      console.error('❌ [DailyAnomaly] Error detecting anomalies:', error);
    }
  }

  /**
   * Send anomaly notification
   */
  private async sendAnomalyNotification(userId: string, anomalies: SpendingAnomaly[]): Promise<void> {
    try {
      // Sort by percentage descending
      anomalies.sort((a, b) => b.percentageAboveAverage - a.percentageAboveAverage);

      // Show top 2 anomalies
      const topAnomalies = anomalies.slice(0, 2);

      let body = `${anomalies.length} category/categories with unusual spending:\n`;
      for (const anomaly of topAnomalies) {
        body += `\n${anomaly.categoryName}: ₹${anomaly.todaySpent.toLocaleString('en-IN')} (${anomaly.percentageAboveAverage}% above average)`;
      }

      if (anomalies.length > 2) {
        body += `\n\n+${anomalies.length - 2} more unusual category/categories`;
      }

      const payload = {
        type: NotificationType.DAILY_ANOMALY,
        title: `📈 Unusual spending detected`,
        body,
        data: {
          screen: 'analysis',
          action: 'view_trends',
          anomaliesCount: anomalies.length.toString(),
        },
      };

      const result = await notificationService.sendNotification(payload);

      if (result.success) {
        console.log(`✅ [DailyAnomaly] Sent notification with ${anomalies.length} anomaly/anomalies`);
        await this.recordJobExecution(userId, 'daily_anomaly', result.notificationId);
      } else {
        console.warn(`❌ [DailyAnomaly] Failed to send: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ [DailyAnomaly] Error sending notification:', error);
    }
  }

  /**
   * Process anomalies for all users
   */
  async processAllUsers(): Promise<void> {
    try {
      console.log(`🔄 [DailyAnomaly] Processing all users...`);

      const { data: preferences, error } = await supabase
        .from('notification_preferences')
        .select('user_id')
        .eq('daily_anomaly_enabled', true);

      if (error || !preferences || preferences.length === 0) {
        console.log(`📊 [DailyAnomaly] No users with anomaly detection enabled`);
        return;
      }

      console.log(`📊 [DailyAnomaly] Processing ${preferences.length} users`);

      for (const pref of preferences) {
        await this.detectAnomalies(pref.user_id, 40);
      }

      console.log(`✅ [DailyAnomaly] Processing complete`);
    } catch (error) {
      console.error('❌ [DailyAnomaly] Error processing users:', error);
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
        .eq('job_type', 'daily_anomaly')
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

export const dailyAnomalyJob = DailyAnomalyJob.getInstance();
