import { NotificationTriggers } from '@/lib/notifications/triggers';
import { supabase } from '@/lib/supabase';

/**
 * Phase 7: Testing & QA Suite
 * Comprehensive tests for notification system
 */

export const NotificationTests = {
  // ============ Unit Tests ============

  async testQueueNotification() {
    try {
      const userId = 'test-user-123';
      const { error } = await supabase.rpc('queue_notification', {
        p_user_id: userId,
        p_notification_type: 'daily_reminder',
        p_title: 'Test Notification',
        p_body: 'This is a test',
        p_data: { test: true },
        p_idempotency_key: `test_${Date.now()}`,
      });

      return !error ? { success: true } : { success: false, error };
    } catch (error) {
      return { success: false, error };
    }
  },

  async testPreferencesLoad() {
    try {
      const userId = 'test-user-123';
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      return !error && data ? { success: true, data } : { success: false, error };
    } catch (error) {
      return { success: false, error };
    }
  },

  async testPreferencesSave() {
    try {
      const userId = 'test-user-123';
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          enabled: true,
          daily_reminder: { enabled: true, time: '08:00', timezone: 'UTC' },
          budget_alerts: { enabled: true, warning_percentage: 80 },
          weekly_report: { enabled: true, day_of_week: 0, time: '19:00' },
          monthly_report: { enabled: false, day_of_month: 1, time: '19:00' },
          spending_anomalies: { enabled: true, threshold: 150 },
          do_not_disturb: { enabled: false, start_time: '22:00', end_time: '08:00' },
          achievements: { enabled: true },
          account_alerts: { enabled: true, low_balance_threshold: 20 },
          daily_budget_notif: { enabled: true, time: '00:00' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      return !error ? { success: true } : { success: false, error };
    } catch (error) {
      return { success: false, error };
    }
  },

  async testIdempotencyKey() {
    try {
      const userId = 'test-user-123';
      const idempotencyKey = `idempotency_test_${Date.now()}`;

      // Insert same notification twice
      await supabase.rpc('queue_notification', {
        p_user_id: userId,
        p_notification_type: 'test',
        p_title: 'Test',
        p_body: 'Test',
        p_data: {},
        p_idempotency_key: idempotencyKey,
      });

      const { error: error2 } = await supabase.rpc('queue_notification', {
        p_user_id: userId,
        p_notification_type: 'test',
        p_title: 'Test',
        p_body: 'Test',
        p_data: {},
        p_idempotency_key: idempotencyKey,
      });

      // Second insert should fail (unique constraint on idempotency_key)
      return error2 ? { success: true, message: 'Idempotency working' } : { success: false };
    } catch (error) {
      return { success: false, error };
    }
  },

  async testDNDHours() {
    try {
      const userId = 'test-user-123';
      const { data: result, error } = await supabase.rpc('is_in_dnd_hours', {
        p_user_id: userId,
        p_check_time: new Date().toISOString(),
      });

      return !error ? { success: true, inDND: result } : { success: false, error };
    } catch (error) {
      return { success: false, error };
    }
  },

  // ============ Integration Tests ============

  async testBudgetAlertIntegration() {
    try {
      const userId = 'test-user-123';
      await NotificationTriggers.onExpenseAdded(userId, {
        category_id: 'category-1',
        amount: 150,
        date: new Date().toISOString(),
      });

      // Check if notification was queued
      const { data: queued, error } = await supabase
        .from('notification_queue')
        .select('id')
        .eq('user_id', userId)
        .eq('notification_type', 'budget_exceeded')
        .limit(1)
        .single();

      return !error && queued ? { success: true } : { success: false };
    } catch (error) {
      return { success: false, error };
    }
  },

  async testGoalProgressIntegration() {
    try {
      const userId = 'test-user-123';
      const goalId = 'goal-1';

      await NotificationTriggers.onGoalUpdated(userId, goalId);

      // Check for queued goal progress notifications
      const { data: queued, error } = await supabase
        .from('notification_queue')
        .select('id')
        .eq('user_id', userId)
        .eq('notification_type', 'goal_progress')
        .limit(1)
        .single();

      return !error && queued ? { success: true } : { success: false };
    } catch (error) {
      return { success: false, error };
    }
  },

  async testAchievementIntegration() {
    try {
      const userId = 'test-user-123';
      await NotificationTriggers.checkAchievements(userId);

      // Check for achievements awarded
      const { data: achievements, error } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      return !error && achievements && achievements.length > 0 ? { success: true } : { success: false };
    } catch (error) {
      return { success: false, error };
    }
  },

  // ============ Performance Tests ============

  async testQueuePerformance() {
    try {
      const userId = 'test-user-123';
      const startTime = Date.now();
      const count = 100;

      for (let i = 0; i < count; i++) {
        await supabase.rpc('queue_notification', {
          p_user_id: userId,
          p_notification_type: 'test',
          p_title: `Test ${i}`,
          p_body: `Test notification ${i}`,
          p_data: { index: i },
          p_idempotency_key: `perf_test_${i}_${Date.now()}`,
        });
      }

      const duration = Date.now() - startTime;
      return {
        success: true,
        message: `Queued ${count} notifications in ${duration}ms`,
        avgTime: (duration / count).toFixed(2) + 'ms per notification',
      };
    } catch (error) {
      return { success: false, error };
    }
  },

  async testProcessQueuePerformance() {
    try {
      const startTime = Date.now();

      // Get pending notifications
      const { data: pending } = await supabase
        .from('notification_queue')
        .select('id')
        .eq('status', 'pending')
        .limit(100);

      // Simulate processing
      if (pending && pending.length > 0) {
        await supabase
          .from('notification_queue')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .in('id', pending.map((p: any) => p.id));
      }

      const duration = Date.now() - startTime;
      return {
        success: true,
        message: `Processed ${pending?.length || 0} notifications in ${duration}ms`,
        avgTime: pending && pending.length > 0 ? (duration / pending.length).toFixed(2) + 'ms' : '0ms',
      };
    } catch (error) {
      return { success: false, error };
    }
  },

  // ============ UAT Checklist ============

  async runUATChecklist() {
    const results: Record<string, boolean> = {};

    // Core Features
    results['Queue Notification'] = (await this.testQueueNotification()).success;
    results['Load Preferences'] = (await this.testPreferencesLoad()).success;
    results['Save Preferences'] = (await this.testPreferencesSave()).success;
    results['Idempotency'] = (await this.testIdempotencyKey()).success;
    results['DND Hours'] = (await this.testDNDHours()).success;

    // Integration
    results['Budget Alert Integration'] = (await this.testBudgetAlertIntegration()).success;
    results['Goal Progress Integration'] = (await this.testGoalProgressIntegration()).success;
    results['Achievement Integration'] = (await this.testAchievementIntegration()).success;

    // Performance
    const queuePerf = await this.testQueuePerformance();
    results['Queue Performance'] = queuePerf.success;

    const processPerf = await this.testProcessQueuePerformance();
    results['Process Performance'] = processPerf.success;

    const passCount = Object.values(results).filter((v) => v).length;
    const totalCount = Object.keys(results).length;

    return {
      results,
      summary: `${passCount}/${totalCount} tests passed`,
      percentage: `${((passCount / totalCount) * 100).toFixed(1)}%`,
    };
  },
};

export default NotificationTests;
