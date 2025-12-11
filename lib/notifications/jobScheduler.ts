/**
 * Job Scheduler - Orchestrates all notification jobs
 * Manages scheduling, execution timing, and job coordination
 * Runs background jobs for daily/weekly notifications
 */

import { supabase } from '@/lib/supabase';
import { dailyReminderJob } from './dailyReminderJob';
import { dailyBudgetWarningsJob } from './dailyBudgetWarningsJob';
import { dailyAnomalyJob } from './dailyAnomalyJob';
import { weeklySummaryJob } from './weeklySummaryJob';
import { weeklyComplianceJob } from './weeklyComplianceJob';
import { weeklyTrendsJob } from './weeklyTrendsJob';
import { goalProgressJob } from './goalProgressJob';
import { achievementJob } from './achievementJob';

export interface ScheduledJob {
  name: string;
  type: 'daily' | 'weekly' | 'monthly';
  scheduledTime: string; // HH:MM format
  daysOfWeek?: number[]; // 0-6 for weekly jobs
  lastRun?: Date;
  nextRun?: Date;
  enabled: boolean;
  execute: () => Promise<void>;
}

export class JobScheduler {
  private static instance: JobScheduler;
  private jobs: Map<string, ScheduledJob> = new Map();
  private timers: Map<string, NodeJS.Timeout | number> = new Map();
  private isRunning: boolean = false;

  private constructor() {
    this.initializeJobs();
  }

  static getInstance(): JobScheduler {
    if (!JobScheduler.instance) {
      JobScheduler.instance = new JobScheduler();
    }
    return JobScheduler.instance;
  }

  /**
   * Initialize all scheduled jobs
   */
  private initializeJobs(): void {
    console.log(`⚙️ [Scheduler] Initializing jobs...`);

    // Daily jobs
    this.registerJob({
      name: 'daily_reminder',
      type: 'daily',
      scheduledTime: '19:00',
      enabled: true,
      execute: () => dailyReminderJob.processAllUsers(),
    });

    this.registerJob({
      name: 'daily_budget_warnings',
      type: 'daily',
      scheduledTime: '07:00',
      enabled: true,
      execute: () => dailyBudgetWarningsJob.processAllUsers(),
    });

    this.registerJob({
      name: 'daily_anomaly_detection',
      type: 'daily',
      scheduledTime: '08:00',
      enabled: true,
      execute: () => dailyAnomalyJob.processAllUsers(),
    });

    // Weekly jobs
    this.registerJob({
      name: 'weekly_summary',
      type: 'weekly',
      scheduledTime: '19:00',
      daysOfWeek: [0], // Sunday
      enabled: true,
      execute: () => weeklySummaryJob.processAllUsers(),
    });

    this.registerJob({
      name: 'weekly_compliance',
      type: 'weekly',
      scheduledTime: '19:15',
      daysOfWeek: [0], // Sunday
      enabled: true,
      execute: () => weeklyComplianceJob.processAllUsers(),
    });

    this.registerJob({
      name: 'weekly_trends',
      type: 'weekly',
      scheduledTime: '08:00',
      daysOfWeek: [1], // Monday
      enabled: true,
      execute: () => weeklyTrendsJob.processAllUsers(),
    });

    // Event-based jobs (run on-demand when triggered)
    this.registerJob({
      name: 'goal_progress_check',
      type: 'daily',
      scheduledTime: '20:00',
      enabled: true,
      execute: () => goalProgressJob.processAllUsers(),
    });

    this.registerJob({
      name: 'achievement_check',
      type: 'weekly',
      scheduledTime: '20:00',
      daysOfWeek: [0], // Sunday
      enabled: true,
      execute: () => achievementJob.processAllUsers(),
    });

    console.log(`✅ [Scheduler] Registered ${this.jobs.size} jobs`);
  }

  /**
   * Register a new job
   */
  private registerJob(job: ScheduledJob): void {
    this.jobs.set(job.name, job);
    console.log(`📋 [Scheduler] Registered job: ${job.name} (${job.type})`);
  }

  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log(`⚠️ [Scheduler] Already running`);
      return;
    }

    this.isRunning = true;
    console.log(`🚀 [Scheduler] Starting job scheduler...`);

    // Schedule each job
    for (const [jobName, job] of this.jobs) {
      if (job.enabled) {
        this.scheduleJob(jobName, job);
      }
    }

    // Log status
    console.log(`✅ [Scheduler] Started with ${this.timers.size} scheduled job(s)`);
  }

  /**
   * Stop the scheduler
   */
  async stop(): Promise<void> {
    console.log(`⏹️ [Scheduler] Stopping job scheduler...`);

    // Clear all timers
    for (const [jobName, timer] of this.timers) {
      clearInterval(timer);
      clearTimeout(timer);
    }

    this.timers.clear();
    this.isRunning = false;

    console.log(`✅ [Scheduler] Stopped`);
  }

  /**
   * Schedule a job for repeated execution
   */
  private scheduleJob(jobName: string, job: ScheduledJob): void {
    try {
      const timer = setInterval(async () => {
        if (this.shouldRunJob(job)) {
          await this.executeJob(jobName, job);
        }
      }, 60000); // Check every minute if job should run

      this.timers.set(jobName, timer);

      console.log(`⏰ [Scheduler] Scheduled job: ${jobName} at ${job.scheduledTime}`);

      // Also run immediately if within execution window
      if (this.shouldRunJob(job)) {
        console.log(`⚡ [Scheduler] Running job immediately: ${jobName}`);
        this.executeJob(jobName, job).catch(error => {
          console.error(`Error executing ${jobName}:`, error);
        });
      }
    } catch (error) {
      console.error(`Error scheduling job ${jobName}:`, error);
    }
  }

  /**
   * Check if a job should run now
   */
  private shouldRunJob(job: ScheduledJob): boolean {
    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, '0');
    const currentMinute = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHour}:${currentMinute}`;

    // Check if time matches
    const [schedHour, schedMinute] = job.scheduledTime.split(':');
    const withinWindow =
      currentHour === schedHour && (parseInt(currentMinute) === parseInt(schedMinute) || parseInt(currentMinute) === parseInt(schedMinute) + 1);

    if (!withinWindow) return false;

    // Check day of week for weekly jobs
    if (job.type === 'weekly' && job.daysOfWeek) {
      return job.daysOfWeek.includes(now.getDay());
    }

    // Check if already ran recently
    if (job.lastRun) {
      const timeSinceLastRun = now.getTime() - job.lastRun.getTime();
      if (timeSinceLastRun < 60000) {
        // Don't run more than once per minute
        return false;
      }
    }

    return true;
  }

  /**
   * Execute a job
   */
  private async executeJob(jobName: string, job: ScheduledJob): Promise<void> {
    try {
      console.log(`⚡ [Scheduler] Executing job: ${jobName}`);

      const startTime = Date.now();

      // Execute the job
      await job.execute();

      const duration = Date.now() - startTime;
      job.lastRun = new Date();

      console.log(`✅ [Scheduler] Job complete: ${jobName} (${duration}ms)`);

      // Record job execution
      await this.recordJobExecution(jobName, true, duration);
    } catch (error) {
      console.error(`❌ [Scheduler] Error executing ${jobName}:`, error);
      await this.recordJobExecution(jobName, false, 0, String(error));
    }
  }

  /**
   * Manually trigger a job
   */
  async triggerJob(jobName: string): Promise<void> {
    const job = this.jobs.get(jobName);

    if (!job) {
      console.warn(`❌ [Scheduler] Job not found: ${jobName}`);
      return;
    }

    console.log(`🔔 [Scheduler] Manually triggering job: ${jobName}`);
    await this.executeJob(jobName, job);
  }

  /**
   * Get job status
   */
  getJobStatus(): Array<{
    name: string;
    type: string;
    enabled: boolean;
    scheduledTime: string;
    lastRun?: Date;
    daysOfWeek?: number[];
  }> {
    return Array.from(this.jobs.values()).map(job => ({
      name: job.name,
      type: job.type,
      enabled: job.enabled,
      scheduledTime: job.scheduledTime,
      lastRun: job.lastRun,
      daysOfWeek: job.daysOfWeek,
    }));
  }

  /**
   * Enable/disable a job
   */
  async setJobEnabled(jobName: string, enabled: boolean): Promise<void> {
    const job = this.jobs.get(jobName);

    if (!job) {
      console.warn(`❌ [Scheduler] Job not found: ${jobName}`);
      return;
    }

    job.enabled = enabled;

    if (enabled && !this.timers.has(jobName)) {
      this.scheduleJob(jobName, job);
    } else if (!enabled && this.timers.has(jobName)) {
      const timer = this.timers.get(jobName);
      if (timer) {
        clearInterval(timer);
        clearTimeout(timer);
      }
      this.timers.delete(jobName);
    }

    console.log(`${enabled ? '✅' : '⏹️'} [Scheduler] Job ${enabled ? 'enabled' : 'disabled'}: ${jobName}`);
  }

  /**
   * Record job execution in database
   */
  private async recordJobExecution(
    jobName: string,
    success: boolean,
    duration: number,
    error?: string
  ): Promise<void> {
    try {
      await supabase.from('job_execution_logs').insert({
        job_name: jobName,
        executed_at: new Date().toISOString(),
        success,
        duration_ms: duration,
        error_message: error,
      });
    } catch (error) {
      console.warn('Error recording job execution:', error);
    }
  }
}

export const jobScheduler = JobScheduler.getInstance();
