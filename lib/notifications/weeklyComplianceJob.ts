/**
 * Weekly Budget Compliance Job - Reports budget compliance score
 * Scheduled once per week (default: Sunday 7:15 PM)
 */

import { supabase } from '@/lib/supabase';
import { notificationService } from './NotificationService';
import { NotificationType } from './types';

export interface ComplianceReport {
  totalCategories: number;
  compliantCategories: number;
  compliancePercentage: number;
  nonCompliantCategories: Array<{
    name: string;
    spent: number;
    budget: number;
    exceeded: number;
  }>;
}

export class WeeklyComplianceJob {
  private static instance: WeeklyComplianceJob;

  private constructor() {}

  static getInstance(): WeeklyComplianceJob {
    if (!WeeklyComplianceJob.instance) {
      WeeklyComplianceJob.instance = new WeeklyComplianceJob();
    }
    return WeeklyComplianceJob.instance;
  }

  /**
   * Generate and send compliance report
   * @param userId - User ID
   */
  async generateAndSend(userId: string): Promise<void> {
    try {
      console.log(`📋 [Compliance] Generating compliance report for user ${userId}`);

      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!prefs?.compliance_report_enabled) {
        console.log(`⏭️ [Compliance] Compliance report disabled for user ${userId}`);
        return;
      }

      const report = await this.generateReport(userId);

      if (!report || report.totalCategories === 0) {
        console.log(`📊 [Compliance] No budget data for report`);
        return;
      }

      await this.sendComplianceNotification(userId, report);
    } catch (error) {
      console.error('❌ [Compliance] Error generating report:', error);
    }
  }

  /**
   * Generate compliance report
   */
  private async generateReport(userId: string): Promise<ComplianceReport | null> {
    try {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { data: budgets } = await supabase
        .from('budgets')
        .select('id, amount, category_id')
        .eq('user_id', userId);

      if (!budgets || budgets.length === 0) {
        return null;
      }

      let compliantCategories = 0;
      const nonCompliantCategories = [];

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
          compliantCategories++;
        } else {
          // Get category name
          const { data: category } = await supabase
            .from('categories')
            .select('name')
            .eq('id', budget.category_id)
            .single();

          nonCompliantCategories.push({
            name: category?.name || 'Unknown',
            spent: Math.round(spent),
            budget: Math.round(budget.amount),
            exceeded: Math.round(spent - budget.amount),
          });
        }
      }

      return {
        totalCategories: budgets.length,
        compliantCategories,
        compliancePercentage: Math.round((compliantCategories / budgets.length) * 100),
        nonCompliantCategories: nonCompliantCategories.sort((a, b) => b.exceeded - a.exceeded),
      };
    } catch (error) {
      console.error('Error generating report:', error);
      return null;
    }
  }

  /**
   * Send compliance notification
   */
  private async sendComplianceNotification(userId: string, report: ComplianceReport): Promise<void> {
    try {
      let body = `✅ Budget Compliance Report\n\n`;
      body += `Compliance: ${report.compliancePercentage}%\n`;
      body += `${report.compliantCategories} of ${report.totalCategories} categories within budget\n`;

      if (report.nonCompliantCategories.length > 0) {
        body += `\nOver Budget:\n`;
        for (let i = 0; i < Math.min(report.nonCompliantCategories.length, 3); i++) {
          const cat = report.nonCompliantCategories[i];
          body += `• ${cat.name}: exceeded by ₹${cat.exceeded.toLocaleString('en-IN')}\n`;
        }

        if (report.nonCompliantCategories.length > 3) {
          body += `\n+${report.nonCompliantCategories.length - 3} more over budget`;
        }
      }

      const payload = {
        type: NotificationType.BUDGET_COMPLIANCE,
        title: `📋 Budget compliance: ${report.compliancePercentage}%`,
        body,
        data: {
          screen: 'analysis',
          action: 'view_compliance',
          compliancePercentage: report.compliancePercentage.toString(),
        },
      };

      const result = await notificationService.sendNotification(payload);

      if (result.success) {
        console.log(`✅ [Compliance] Sent to user ${userId}`);
        await this.recordJobExecution(userId, 'compliance_report', result.notificationId);
      } else {
        console.warn(`❌ [Compliance] Failed to send: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ [Compliance] Error sending notification:', error);
    }
  }

  /**
   * Process for all users
   */
  async processAllUsers(): Promise<void> {
    try {
      console.log(`🔄 [Compliance] Processing all users...`);

      const { data: preferences, error } = await supabase
        .from('notification_preferences')
        .select('user_id')
        .eq('compliance_report_enabled', true);

      if (error || !preferences || preferences.length === 0) {
        console.log(`📊 [Compliance] No users with compliance report enabled`);
        return;
      }

      console.log(`📊 [Compliance] Processing ${preferences.length} users`);

      for (const pref of preferences) {
        await this.generateAndSend(pref.user_id);
      }

      console.log(`✅ [Compliance] Processing complete`);
    } catch (error) {
      console.error('❌ [Compliance] Error processing users:', error);
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

export const weeklyComplianceJob = WeeklyComplianceJob.getInstance();
