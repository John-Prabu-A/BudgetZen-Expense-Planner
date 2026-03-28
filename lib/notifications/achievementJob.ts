/**
 * Achievement Job - Tracks savings milestones and achievements
 * Sends notifications when users hit savings goals (₹10K, ₹50K, ₹1L, etc.)
 */

import { formatCurrencyWithPreferences } from '@/lib/currency';
import { supabase } from '@/lib/supabase';
import { notificationService } from './NotificationService';
import { NotificationType } from './types';

export interface Achievement {
  threshold: number;
  label: string;
  icon: string;
  color: string;
}

export const SAVINGS_ACHIEVEMENTS: Achievement[] = [
  { threshold: 10000, label: 'Beginner Saver', icon: '🌱', color: '#4CAF50' },
  { threshold: 50000, label: 'Consistent Saver', icon: '📈', color: '#2196F3' },
  { threshold: 100000, label: 'Lakh Milestone', icon: '💯', color: '#FF9800' },
  { threshold: 500000, label: 'Five Lakh Goal', icon: '🚀', color: '#9C27B0' },
  { threshold: 1000000, label: 'Million Achievement', icon: '🏆', color: '#FFD700' },
];

export class AchievementJob {
  private static instance: AchievementJob;

  private constructor() {}

  static getInstance(): AchievementJob {
    if (!AchievementJob.instance) {
      AchievementJob.instance = new AchievementJob();
    }
    return AchievementJob.instance;
  }

  /**
   * Check and send achievement notifications for user
   * @param userId - User ID
   */
  async checkAndNotify(userId: string): Promise<void> {
    try {
      console.log(`🏆 [Achievements] Checking achievements for user ${userId}`);

      // Get user preferences
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('achievement_enabled')
        .eq('user_id', userId)
        .single();

      if (!prefs?.achievement_enabled) {
        console.log(`⏭️ [Achievements] Achievements disabled for user ${userId}`);
        return;
      }

      // Get currency preferences
      const { data: currencyPrefs } = await supabase
        .from('user_preferences')
        .select('currency_sign,currency_position,decimal_places')
        .eq('user_id', userId)
        .single();

      const currencySign = currencyPrefs?.currency_sign || '₹';
      const currencyPosition = currencyPrefs?.currency_position || 'before';
      const decimalPlaces = currencyPrefs?.decimal_places || 2;

      // Calculate total savings
      const totalSavings = await this.calculateTotalSavings(userId);

      if (totalSavings === null) {
        console.log(`📊 [Achievements] Unable to calculate savings for ${userId}`);
        return;
      }

      console.log(`💰 [Achievements] User ${userId} has ${formatCurrencyWithPreferences(totalSavings, currencySign, currencyPosition, decimalPlaces)} saved`);

      // Check all achievements
      for (const achievement of SAVINGS_ACHIEVEMENTS) {
        await this.checkAchievementUnlock(userId, achievement, totalSavings, currencySign, currencyPosition, decimalPlaces);
      }
    } catch (error) {
      console.error('❌ [Achievements] Error checking achievements:', error);
    }
  }

  /**
   * Calculate total savings for user
   */
  private async calculateTotalSavings(userId: string): Promise<number | null> {
    try {
      // Method 1: Look for 'Savings' category
      const { data: savingsCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', userId)
        .eq('name', 'Savings')
        .single();

      if (savingsCategory) {
        const { data: records } = await supabase
          .from('records')
          .select('amount')
          .eq('category_id', savingsCategory.id)
          .eq('user_id', userId)
          .eq('type', 'income');

        if (records && records.length > 0) {
          return records.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
        }
      }

      // Method 2: Calculate from budget compliance (total income - total expenses)
      const now = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1);

      const { data: incomeRecords } = await supabase
        .from('records')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'income')
        .gte('transaction_date', yearStart.toISOString());

      const totalIncome = (incomeRecords || []).reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

      const { data: expenseRecords } = await supabase
        .from('records')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('transaction_date', yearStart.toISOString());

      const totalExpenses = (expenseRecords || []).reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

      return Math.max(0, totalIncome - totalExpenses);
    } catch (error) {
      console.error('Error calculating savings:', error);
      return null;
    }
  }

  /**
   * Check if achievement should be unlocked and notify
   */
  private async checkAchievementUnlock(
    userId: string,
    achievement: Achievement,
    currentSavings: number,
    currencySign: string,
    currencyPosition: 'before' | 'after',
    decimalPlaces: number
  ): Promise<void> {
    try {
      // Check if user has already been notified of this achievement
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('threshold', achievement.threshold)
        .single();

      if (existing) {
        console.log(`✅ [Achievements] Already unlocked: ${achievement.label}`);
        return; // Already notified
      }

      // Check if user meets threshold
      if (currentSavings >= achievement.threshold) {
        await this.sendAchievementNotification(userId, achievement, currentSavings, currencySign, currencyPosition, decimalPlaces);
        await this.recordAchievementUnlocked(userId, achievement);
      }
    } catch (error) {
      console.warn(`Error checking achievement ${achievement.label}:`, error);
    }
  }

  /**
   * Send achievement unlock notification
   */
  private async sendAchievementNotification(
    userId: string,
    achievement: Achievement,
    currentSavings: number,
    currencySign: string,
    currencyPosition: 'before' | 'after',
    decimalPlaces: number
  ): Promise<void> {
    try {
      let body = `🎉 Congratulations!\n`;
      body += `You've reached the "${achievement.label}" milestone!\n`;
      body += `Total savings: ${formatCurrencyWithPreferences(currentSavings, currencySign, currencyPosition, decimalPlaces)}`;

      // Add motivational message based on achievement
      const motivations: Record<number, string> = {
        10000: `\n\n💪 You're building great financial habits!`,
        50000: `\n\n🌟 Amazing progress! Keep it up!`,
        100000: `\n\n🚀 Wow! You've hit 1 lakh! Major milestone!`,
        500000: `\n\n🏆 Incredible! 5 lakhs saved! You're crushing it!`,
        1000000: `\n\n👑 You've reached 1 Million! Legend status!`,
      };

      body += motivations[achievement.threshold] || '';

      const payload = {
        type: NotificationType.ACHIEVEMENT,
        title: `${achievement.icon} ${achievement.label}`,
        body,
        data: {
          screen: 'profile',
          action: 'view_achievements',
          achievement: achievement.label,
          threshold: achievement.threshold.toString(),
        },
      };

      const result = await notificationService.sendNotification(payload);

      if (result.success) {
        console.log(`✅ [Achievements] Sent achievement notification: ${achievement.label}`);
      } else {
        console.warn(`❌ [Achievements] Failed to send: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ [Achievements] Error sending notification:', error);
    }
  }

  /**
   * Record achievement as unlocked
   */
  private async recordAchievementUnlocked(userId: string, achievement: Achievement): Promise<void> {
    try {
      const { error } = await supabase.from('user_achievements').insert({
        user_id: userId,
        achievement_name: achievement.label,
        threshold: achievement.threshold,
        unlocked_at: new Date().toISOString(),
      });

      if (error) {
        console.warn('Error recording achievement:', error);
      }
    } catch (error) {
      console.warn('Error recording achievement:', error);
    }
  }

  /**
   * Process for all users
   */
  async processAllUsers(): Promise<void> {
    try {
      console.log(`🔄 [Achievements] Processing all users...`);

      const { data: preferences, error } = await supabase
        .from('notification_preferences')
        .select('user_id')
        .eq('achievement_enabled', true);

      if (error || !preferences || preferences.length === 0) {
        console.log(`📊 [Achievements] No users with achievements enabled`);
        return;
      }

      console.log(`📊 [Achievements] Processing ${preferences.length} users`);

      for (const pref of preferences) {
        await this.checkAndNotify(pref.user_id);
      }

      console.log(`✅ [Achievements] Processing complete`);
    } catch (error) {
      console.error('❌ [Achievements] Error processing users:', error);
    }
  }
}

export const achievementJob = AchievementJob.getInstance();
