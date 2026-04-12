-- ============================================================================
-- ENABLE POSTGRES CRON FOR SUPABASE EDGE FUNCTIONS (PUSH NOTIFICATIONS)
-- ============================================================================
-- NOTE: Please execute this manually in the Supabase SQL Editor.
-- This script relies on pg_cron and pg_net.

-- Ensure extensions are created
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. Remove previously configured conflicting cron jobs if they exist
DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule('invoke-process-queue');
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    PERFORM cron.unschedule('invoke-schedule-daily-jobs');
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    PERFORM cron.unschedule('invoke-check-budget-alerts');
  EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- Replace 'YOUR_PROJECT_REF' with actual project reference if using dynamic variables, 
-- or use the full known URL from your env: https://<YOUR_PROJECT_REF>.supabase.co
-- Replace '<YOUR_ANON_OR_SERVICE_KEY>' with your actual Service Role Key from Project Settings -> API.

-- 2. Schedule 'process-queue' to run every 5 minutes
SELECT cron.schedule(
  'invoke-process-queue',
  '*/5 * * * *',
  $$ 
    SELECT net.http_post(
      url:='https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/process-queue',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <YOUR_ANON_OR_SERVICE_KEY>'
      ),
      body:=jsonb_build_object('source', 'pg_cron')
    )
  $$
);

-- 3. Schedule 'schedule-daily-jobs' to run every day at Midnight (00:00)
SELECT cron.schedule(
  'invoke-schedule-daily-jobs',
  '0 0 * * *',
  $$ 
    SELECT net.http_post(
      url:='https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/schedule-daily-jobs',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <YOUR_ANON_OR_SERVICE_KEY>'
      )
    )
  $$
);

-- 4. Schedule 'check-budget-alert' to run every Hour
SELECT cron.schedule(
  'invoke-check-budget-alerts',
  '0 * * * *',
  $$ 
    SELECT net.http_post(
      url:='https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/check-budget-alert',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <YOUR_ANON_OR_SERVICE_KEY>'
      )
    )
  $$
);

-- Verify Scheduled Jobs
SELECT * FROM cron.job;
