-- ============================================================================
-- BudgetZen Notification System - Complete Database Schema
-- ============================================================================
-- This SQL file creates all necessary tables and columns for the professional
-- notification system implementation (Week 1-4).
--
-- Run this in Supabase SQL Editor to complete the database setup.
-- ============================================================================

-- ============================================================================
-- 1. NEW TABLE: job_execution_logs
-- Purpose: Track execution history of all scheduled jobs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.job_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name VARCHAR(100) NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  success BOOLEAN NOT NULL,
  duration_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for common queries
  INDEX idx_job_name (job_name),
  INDEX idx_executed_at (executed_at),
  INDEX idx_success (success),
  INDEX idx_job_date (job_name, executed_at DESC)
);

-- Enable RLS if needed
ALTER TABLE public.job_execution_logs ENABLE ROW LEVEL SECURITY;

-- Optional: Policy to allow service role to insert logs
-- (uncomment if using RLS)
/*
CREATE POLICY "service_role_insert_logs" ON public.job_execution_logs
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "authenticated_read_own_logs" ON public.job_execution_logs
  FOR SELECT
  USING (TRUE);
*/

-- ============================================================================
-- 2. NEW TABLE: goal_milestones_notified
-- Purpose: Track which goal milestones have been notified to prevent duplicates
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.goal_milestones_notified (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  milestone_percentage INTEGER NOT NULL CHECK (milestone_percentage > 0 AND milestone_percentage <= 100),
  notified_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one notification per milestone per goal
  UNIQUE(goal_id, milestone_percentage),
  
  -- Indexes
  INDEX idx_goal_id (goal_id),
  INDEX idx_milestone_percentage (milestone_percentage),
  INDEX idx_notified_at (notified_at DESC)
);

-- Enable RLS
ALTER TABLE public.goal_milestones_notified ENABLE ROW LEVEL SECURITY;

-- RLS Policies (optional)
/*
CREATE POLICY "authenticated_read_own_milestones" ON public.goal_milestones_notified
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.goals
      WHERE id = goal_milestones_notified.goal_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "service_role_manage_milestones" ON public.goal_milestones_notified
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
*/

-- ============================================================================
-- 3. NEW TABLE: user_achievements
-- Purpose: Track which savings achievements have been unlocked
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_name VARCHAR(100) NOT NULL,
  threshold BIGINT NOT NULL CHECK (threshold > 0),
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one achievement per threshold per user
  UNIQUE(user_id, threshold),
  
  -- Indexes
  INDEX idx_user_id (user_id),
  INDEX idx_threshold (threshold),
  INDEX idx_unlocked_at (unlocked_at DESC),
  INDEX idx_user_date (user_id, unlocked_at DESC)
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies (optional)
/*
CREATE POLICY "authenticated_read_own_achievements" ON public.user_achievements
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "authenticated_read_all_achievements" ON public.user_achievements
  FOR SELECT
  USING (TRUE);

CREATE POLICY "service_role_manage_achievements" ON public.user_achievements
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
*/

-- ============================================================================
-- 4. UPDATE TABLE: notification_preferences
-- Purpose: Add new columns for all notification types and job scheduling
-- ============================================================================

-- Add new columns to notification_preferences table
ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS trends_report_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS goal_progress_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS achievement_enabled BOOLEAN DEFAULT true;

-- Note: Make sure the following columns already exist (from Week 1-3 implementation):
-- - large_transaction_enabled BOOLEAN DEFAULT true
-- - large_transaction_threshold INTEGER DEFAULT 10000
-- - budget_exceeded_enabled BOOLEAN DEFAULT true
-- - unusual_spending_enabled BOOLEAN DEFAULT true
-- - daily_reminder_enabled BOOLEAN DEFAULT true
-- - daily_reminder_time VARCHAR(5) DEFAULT '19:00'
-- - budget_warnings_enabled BOOLEAN DEFAULT false
-- - budget_warning_threshold INTEGER DEFAULT 80
-- - daily_anomaly_enabled BOOLEAN DEFAULT false
-- - weekly_summary_enabled BOOLEAN DEFAULT true
-- - weekly_summary_time VARCHAR(5) DEFAULT '19:00'
-- - weekly_summary_day INTEGER DEFAULT 6
-- - compliance_report_enabled BOOLEAN DEFAULT false
-- - dnd_enabled BOOLEAN DEFAULT false
-- - dnd_start_time VARCHAR(5) DEFAULT '22:00'
-- - dnd_end_time VARCHAR(5) DEFAULT '08:00'
-- - max_notifications_per_day INTEGER DEFAULT 5

-- If notification_preferences table is missing any of these, add them:
ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS large_transaction_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS large_transaction_threshold INTEGER DEFAULT 10000,
ADD COLUMN IF NOT EXISTS budget_exceeded_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS unusual_spending_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS daily_reminder_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS daily_reminder_time VARCHAR(5) DEFAULT '19:00',
ADD COLUMN IF NOT EXISTS budget_warnings_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS budget_warning_threshold INTEGER DEFAULT 80,
ADD COLUMN IF NOT EXISTS daily_anomaly_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS weekly_summary_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS weekly_summary_time VARCHAR(5) DEFAULT '19:00',
ADD COLUMN IF NOT EXISTS weekly_summary_day INTEGER DEFAULT 6,
ADD COLUMN IF NOT EXISTS compliance_report_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS dnd_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS dnd_start_time VARCHAR(5) DEFAULT '22:00',
ADD COLUMN IF NOT EXISTS dnd_end_time VARCHAR(5) DEFAULT '08:00',
ADD COLUMN IF NOT EXISTS max_notifications_per_day INTEGER DEFAULT 5;

-- ============================================================================
-- 5. NEW TABLE: notification_throttle (for tracking throttling)
-- Purpose: Prevent sending the same notification type too frequently
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notification_throttle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(100) NOT NULL,
  last_sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  count_today INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for efficient lookups
  INDEX idx_user_type (user_id, notification_type),
  INDEX idx_last_sent_at (last_sent_at DESC),
  INDEX idx_user_created (user_id, created_at DESC)
);

-- Enable RLS
ALTER TABLE public.notification_throttle ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. UPDATE TABLE: notification_analytics (if it exists)
-- Purpose: Track metrics about sent notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notification_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id VARCHAR(255) NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  opened_at TIMESTAMP WITH TIME ZONE,
  actioned_at TIMESTAMP WITH TIME ZONE,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_user_type (user_id, notification_type),
  INDEX idx_opened_at (opened_at),
  INDEX idx_sent_at (sent_at DESC),
  INDEX idx_user_sent (user_id, sent_at DESC)
);

-- Enable RLS
ALTER TABLE public.notification_analytics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - Allow authenticated users and service role to manage data
-- ============================================================================

-- Policies for job_execution_logs
CREATE POLICY "allow_service_role_insert_logs" ON public.job_execution_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_authenticated_view_logs" ON public.job_execution_logs
  FOR SELECT USING (true);

-- Policies for goal_milestones_notified
CREATE POLICY "allow_service_role_manage_milestones" ON public.goal_milestones_notified
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "allow_users_view_own_milestones" ON public.goal_milestones_notified
  FOR SELECT USING (
    goal_id IN (SELECT id FROM public.goals WHERE user_id = auth.uid())
  );

-- Policies for user_achievements
CREATE POLICY "allow_service_role_insert_achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_users_view_own_achievements" ON public.user_achievements
  FOR SELECT USING (user_id = auth.uid());

-- Policies for notification_throttle
CREATE POLICY "allow_service_role_insert_throttle" ON public.notification_throttle
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_service_role_update_throttle" ON public.notification_throttle
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "allow_users_view_own_throttle" ON public.notification_throttle
  FOR SELECT USING (user_id = auth.uid());

-- Policies for notification_analytics
CREATE POLICY "allow_service_role_insert_analytics" ON public.notification_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_users_view_own_analytics" ON public.notification_analytics
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "allow_users_update_own_analytics" ON public.notification_analytics
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- The following tables should already exist:
-- - goals (with id, user_id, name, target_amount, created_at)
-- - budgets (with id, user_id, category_id, amount)
-- - categories (with id, user_id, name)
-- - records (with id, user_id, category_id, amount, type, transaction_date)
-- - notification_preferences (with user_id, various preference columns)
-- - users (auth.users - Supabase default)

-- ============================================================================
-- 8. VIEWS FOR DEBUGGING (Optional but Helpful)
-- ============================================================================

-- View to check recent job executions
CREATE OR REPLACE VIEW public.recent_job_executions AS
SELECT 
  job_name,
  COUNT(*) as total_runs,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_runs,
  SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed_runs,
  AVG(duration_ms) as avg_duration_ms,
  MAX(executed_at) as last_executed,
  MIN(executed_at) as first_executed
FROM public.job_execution_logs
WHERE executed_at > NOW() - INTERVAL '7 days'
GROUP BY job_name
ORDER BY last_executed DESC;

-- View to check user achievements
CREATE OR REPLACE VIEW public.user_achievements_summary AS
SELECT 
  user_id,
  COUNT(*) as total_achievements,
  MAX(threshold) as highest_achievement,
  MAX(unlocked_at) as latest_achievement_date,
  STRING_AGG(achievement_name, ', ' ORDER BY threshold) as achievements_list
FROM public.user_achievements
GROUP BY user_id;

-- View to check goal milestone progress
CREATE OR REPLACE VIEW public.goal_progress_summary AS
SELECT 
  g.id as goal_id,
  g.user_id,
  g.name,
  g.target_amount,
  COUNT(DISTINCT m.milestone_percentage) as milestones_notified,
  MAX(m.milestone_percentage) as highest_milestone_notified,
  MAX(m.notified_at) as last_milestone_date
FROM public.goals g
LEFT JOIN public.goal_milestones_notified m ON g.id = m.goal_id
GROUP BY g.id, g.user_id, g.name, g.target_amount;

-- ============================================================================
-- 9. SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Uncomment to insert sample job execution log entries for testing
/*
INSERT INTO public.job_execution_logs (job_name, executed_at, success, duration_ms)
VALUES
  ('daily_reminder', NOW() - INTERVAL '1 day', true, 250),
  ('daily_budget_warnings', NOW() - INTERVAL '1 day', true, 340),
  ('daily_anomaly_detection', NOW() - INTERVAL '1 day', true, 420),
  ('weekly_summary', NOW() - INTERVAL '7 days', true, 520),
  ('weekly_compliance', NOW() - INTERVAL '7 days', true, 380),
  ('weekly_trends', NOW() - INTERVAL '6 days', true, 290)
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- 10. SUMMARY OF CHANGES
-- ============================================================================

/*
TABLES CREATED:
  1. job_execution_logs - Tracks all scheduled job executions
  2. goal_milestones_notified - Tracks goal milestone notifications
  3. user_achievements - Tracks savings achievements unlocked
  4. notification_throttle - Tracks notification throttling
  5. notification_analytics - Tracks notification metrics (optional)

TABLES UPDATED:
  1. notification_preferences - Added 3 new columns:
     - trends_report_enabled
     - goal_progress_enabled
     - achievement_enabled

VIEWS CREATED (for debugging):
  1. recent_job_executions - Shows job execution statistics
  2. user_achievements_summary - Shows user achievement summary
  3. goal_progress_summary - Shows goal milestone progress

NOTES:
  - All tables have RLS enabled for security
  - Indexes created for optimal query performance
  - Foreign keys set up with ON DELETE CASCADE where appropriate
  - All timestamps use "TIMESTAMP WITH TIME ZONE" for consistency
  - Sample data commented out - uncomment if needed for testing

NEXT STEPS AFTER RUNNING THIS SQL:
  1. Verify all tables created successfully
  2. Check that indexes were created
  3. Grant appropriate permissions to authenticated users
  4. Run app and verify job scheduler starts
  5. Test real-time alerts
  6. Test daily/weekly batch jobs
  7. Monitor job_execution_logs table for job runs
*/

-- ============================================================================
-- END OF NOTIFICATION SYSTEM SCHEMA
-- ============================================================================
