/**
 * Daily Reminder Job - Notifies user to log expenses
 * Scheduled once per day at user's preferred time
 */

import { supabase } from '@/lib/supabase';
import { notificationService } from './NotificationService';
import { smartTimingEngine } from './smartTimingEngine';
import { NotificationType } from './types';

export class DailyReminderJob {
  private static instance: DailyReminderJob;

  private constructor() {}

  static getInstance(): DailyReminderJob {
    if (!DailyReminderJob.instance) {
      DailyReminderJob.instance = new DailyReminderJob();
    }
    return DailyReminderJob.instance;
  }

  /**
   * Schedule daily reminder for a user
   * @param userId - User ID
   * @param time - Time in HH:MM format (default: 19:00)
   */
  async scheduleDailyReminder(userId: string, time: string = '19:00'): Promise<void> {
    try {
      console.log(`📝 [DailyReminder] Scheduling for user ${userId} at ${time}`);

      // Get user preferences
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!prefs?.daily_reminder_enabled) {
        console.log(`⏭️ [DailyReminder] Daily reminder disabled for user ${userId}`);
        return;
      }

      // Check if should skip (user in app recently)
      const shouldSkip = await smartTimingEngine.shouldSkipBasedOnBehavior(userId, 120);
      if (shouldSkip) {
        console.log(`📱 [DailyReminder] User in app, skipping reminder`);
        return;
      }

      // Send notification
      const payload = {
        type: NotificationType.DAILY_REMINDER,
        title: '📝 Time to log today\'s expenses',
        body: 'Ready to track your spending?',
        data: {
          screen: 'add-record',
          action: 'create_expense',
        },
      };

      const result = await notificationService.sendNotification(payload);

      if (result.success) {
        console.log(`✅ [DailyReminder] Sent to user ${userId}`);
        
        // Record in jobs table
        await this.recordJobExecution(userId, 'daily_reminder', result.notificationId);
      } else {
        console.warn(`❌ [DailyReminder] Failed to send: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ [DailyReminder] Error scheduling reminder:', error);
    }
  }

  /**
   * Check and send reminders for all active users
   * Called by background task/cron job
   */
  async processAllUsers(): Promise<void> {
    try {
      console.log(`🔄 [DailyReminder] Processing all users...`);

      // Get all users with daily reminder enabled
      const { data: preferences, error } = await supabase
        .from('notification_preferences')
        .select('user_id, daily_reminder_time')
        .eq('daily_reminder_enabled', true);

      if (error) {
        console.error('❌ [DailyReminder] Error fetching preferences:', error);
        return;
      }

      if (!preferences || preferences.length === 0) {
        console.log(`📊 [DailyReminder] No users with daily reminder enabled`);
        return;
      }

      console.log(`📊 [DailyReminder] Processing ${preferences.length} users`);

      // Check each user
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      for (const pref of preferences) {
        const preferredTime = pref.daily_reminder_time || '19:00';

        // Check if current time matches preferred time (within 5 minute window)
        if (this.isTimeWindow(currentTime, preferredTime, 5)) {
          await this.scheduleDailyReminder(pref.user_id, preferredTime);
        }
      }

      console.log(`✅ [DailyReminder] Processing complete`);
    } catch (error) {
      console.error('❌ [DailyReminder] Error processing users:', error);
    }
  }

  /**
   * Record job execution in database
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
   * Check if current time is within a window of preferred time
   */
  private isTimeWindow(current: string, preferred: string, windowMinutes: number): boolean {
    const [currHour, currMin] = current.split(':').map(Number);
    const [prefHour, prefMin] = preferred.split(':').map(Number);

    const currentTotalMin = currHour * 60 + currMin;
    const preferredTotalMin = prefHour * 60 + prefMin;

    const diff = Math.abs(currentTotalMin - preferredTotalMin);
    return diff <= windowMinutes;
  }

  /**
   * Get statistics for daily reminders
   */
  async getStats(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('notification_jobs')
        .select('*')
        .eq('user_id', userId)
        .eq('job_type', 'daily_reminder')
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

export const dailyReminderJob = DailyReminderJob.getInstance();
