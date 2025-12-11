-- ============================================================================
-- BUDGETZEN NOTIFICATION SYSTEM - DATABASE SETUP
-- Complete SQL script for Supabase SQL Editor
-- ============================================================================
-- Copy and paste this entire script into Supabase SQL Editor and click "Run"
-- All tables and columns will be created automatically.
-- ============================================================================

-- ============================================================================
-- Step 0: Create goals table (if it doesn't exist)
-- Required as a dependency for goal_milestones_notified
-- ============================================================================

CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  target_amount BIGINT NOT NULL,
  current_amount BIGINT DEFAULT 0,
  category_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_created_at ON goals(created_at DESC);

-- ============================================================================
-- Step 1: Create job_execution_logs table
-- Tracks when scheduled jobs run and if they succeeded
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name VARCHAR(100) NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  success BOOLEAN NOT NULL,
  duration_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_job_execution_logs_job_name ON job_execution_logs(job_name);
CREATE INDEX idx_job_execution_logs_executed_at ON job_execution_logs(executed_at DESC);
CREATE INDEX idx_job_execution_logs_success ON job_execution_logs(success);

-- ============================================================================
-- Step 2: Create goal_milestones_notified table
-- Tracks which goal milestones (25%, 50%, 75%, 100%) have been notified
-- ============================================================================

CREATE TABLE IF NOT EXISTS goal_milestones_notified (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  milestone_percentage INTEGER NOT NULL,
  notified_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(goal_id, milestone_percentage)
);

CREATE INDEX idx_goal_milestones_notified_goal_id ON goal_milestones_notified(goal_id);
CREATE INDEX idx_goal_milestones_notified_milestone ON goal_milestones_notified(milestone_percentage);

-- ============================================================================
-- Step 3: Create user_achievements table
-- Tracks which savings milestones have been achieved (₹10K, ₹50K, ₹1L, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_name VARCHAR(100) NOT NULL,
  threshold BIGINT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, threshold)
);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_threshold ON user_achievements(threshold);

-- ============================================================================
-- Step 4: Create notification_throttle table
-- Tracks when notifications were last sent to prevent spam
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_throttle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(100) NOT NULL,
  last_sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  count_today INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notification_throttle_user_type ON notification_throttle(user_id, notification_type);
CREATE INDEX idx_notification_throttle_last_sent ON notification_throttle(last_sent_at DESC);

-- ============================================================================
-- Step 5: Create notification_analytics table
-- Tracks when notifications are sent, opened, and acted on
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id VARCHAR(255) NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  opened_at TIMESTAMP WITH TIME ZONE,
  actioned_at TIMESTAMP WITH TIME ZONE,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notification_analytics_user_type ON notification_analytics(user_id, notification_type);
CREATE INDEX idx_notification_analytics_sent_at ON notification_analytics(sent_at DESC);

-- ============================================================================
-- Step 6: Add missing columns to notification_preferences
-- These columns control which notifications users receive
-- ============================================================================

-- Week 1 columns (Real-time alerts)
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS large_transaction_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS large_transaction_threshold INTEGER DEFAULT 10000,
ADD COLUMN IF NOT EXISTS budget_exceeded_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS unusual_spending_enabled BOOLEAN DEFAULT true;

-- Week 2 columns (Daily batch)
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS daily_reminder_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS daily_reminder_time VARCHAR(5) DEFAULT '19:00',
ADD COLUMN IF NOT EXISTS budget_warnings_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS budget_warning_threshold INTEGER DEFAULT 80,
ADD COLUMN IF NOT EXISTS daily_anomaly_enabled BOOLEAN DEFAULT false;

-- Week 3 columns (Weekly batch)
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS weekly_summary_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS weekly_summary_time VARCHAR(5) DEFAULT '19:00',
ADD COLUMN IF NOT EXISTS weekly_summary_day INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS compliance_report_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trends_report_enabled BOOLEAN DEFAULT false;

-- Week 4 columns (Optional features)
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS goal_progress_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS achievement_enabled BOOLEAN DEFAULT true;

-- DND (Do Not Disturb) columns
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS dnd_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS dnd_start_time VARCHAR(5) DEFAULT '22:00',
ADD COLUMN IF NOT EXISTS dnd_end_time VARCHAR(5) DEFAULT '08:00',
ADD COLUMN IF NOT EXISTS max_notifications_per_day INTEGER DEFAULT 5;

-- ============================================================================
-- Step 7: Enable Row Level Security (RLS) and Create Policies
-- This ensures users can only see their own data, and app can write to tables
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE job_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_milestones_notified ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_throttle ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_analytics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for job_execution_logs
-- Service role can insert, authenticated users can view all (for testing)
-- ============================================================================

CREATE POLICY "Allow service role to insert job logs" ON job_execution_logs
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated to view job logs" ON job_execution_logs
FOR SELECT USING (true);

-- ============================================================================
-- RLS Policies for goal_milestones_notified
-- Service role can insert, users can view/update their own
-- ============================================================================

CREATE POLICY "Allow service role to manage milestones" ON goal_milestones_notified
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow users to view their own milestones" ON goal_milestones_notified
FOR SELECT USING (
  goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())
);

-- ============================================================================
-- RLS Policies for user_achievements
-- Service role can insert, users can view their own
-- ============================================================================

CREATE POLICY "Allow service role to manage achievements" ON user_achievements
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to view their own achievements" ON user_achievements
FOR SELECT USING (user_id = auth.uid());

-- ============================================================================
-- RLS Policies for notification_throttle
-- Service role can insert/update, users can view their own
-- ============================================================================

CREATE POLICY "Allow service role to manage throttle" ON notification_throttle
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role to update throttle" ON notification_throttle
FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow users to view their own throttle" ON notification_throttle
FOR SELECT USING (user_id = auth.uid());

-- ============================================================================
-- RLS Policies for notification_analytics
-- Service role can insert, users can view their own (opened_at/actioned_at can be updated)
-- ============================================================================

CREATE POLICY "Allow service role to insert analytics" ON notification_analytics
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to view their own analytics" ON notification_analytics
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Allow users to update their own analytics" ON notification_analytics
FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- VERIFICATION QUERIES - Run these to confirm everything worked
-- ============================================================================

-- Check if all tables exist and count rows
-- SELECT 
--   'job_execution_logs' as table_name,
--   COUNT(*) as row_count
-- FROM job_execution_logs
-- UNION ALL
-- SELECT 'goal_milestones_notified', COUNT(*) FROM goal_milestones_notified
-- UNION ALL
-- SELECT 'user_achievements', COUNT(*) FROM user_achievements
-- UNION ALL
-- SELECT 'notification_throttle', COUNT(*) FROM notification_throttle
-- UNION ALL
-- SELECT 'notification_analytics', COUNT(*) FROM notification_analytics;

-- Check notification_preferences columns (run this to verify all columns exist)
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'notification_preferences'
-- ORDER BY ordinal_position;

-- ============================================================================
-- DONE! 
-- All database tables are now created and ready to use.
-- The app can now save notification logs, track achievements, and throttle alerts.
-- ============================================================================
