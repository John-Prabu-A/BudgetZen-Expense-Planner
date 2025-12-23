-- ============================================================================
-- BudgetZen Notification System - Supabase Compatible Schema
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLE 1: push_tokens
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios','android','web')),
  device_name TEXT,
  is_valid BOOLEAN DEFAULT true,
  last_verified_at TIMESTAMPTZ,
  invalid_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_tokens"
  ON public.push_tokens FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "service_manage_tokens"
  ON public.push_tokens FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id
  ON public.push_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_push_tokens_token
  ON public.push_tokens(token);

CREATE INDEX IF NOT EXISTS idx_push_tokens_valid
  ON public.push_tokens(is_valid);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_valid
  ON public.push_tokens(user_id, is_valid);

CREATE INDEX IF NOT EXISTS idx_push_tokens_updated
  ON public.push_tokens(updated_at DESC);

-- ============================================================================
-- TABLE 2: notification_queue
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(100) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  last_attempt_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','failed','delivered','bounced','discarded')),
  error_message TEXT,
  idempotency_key VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_manage_queue"
  ON public.notification_queue FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_queue_status_scheduled
  ON public.notification_queue(status, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_queue_user_status
  ON public.notification_queue(user_id, status);

CREATE INDEX IF NOT EXISTS idx_queue_type
  ON public.notification_queue(notification_type);

CREATE INDEX IF NOT EXISTS idx_queue_created
  ON public.notification_queue(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_queue_pending_retry
  ON public.notification_queue(status, attempts, last_attempt_at)
  WHERE status = 'pending' AND attempts < max_attempts;

-- ============================================================================
-- TABLE 3: notification_log
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  queue_id UUID REFERENCES public.notification_queue(id) ON DELETE SET NULL,
  notification_type VARCHAR(100),
  title TEXT,
  body TEXT,
  push_token VARCHAR(255),
  platform VARCHAR(20),
  expo_notification_id VARCHAR(255),
  status VARCHAR(20) NOT NULL
    CHECK (status IN ('sent','failed','delivered','bounced','opened')),
  error_message TEXT,
  error_code VARCHAR(50),
  sent_at TIMESTAMPTZ NOT NULL,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  response_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_logs"
  ON public.notification_log FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "service_manage_logs"
  ON public.notification_log FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_log_user_type
  ON public.notification_log(user_id, notification_type);

CREATE INDEX IF NOT EXISTS idx_log_status
  ON public.notification_log(status);

CREATE INDEX IF NOT EXISTS idx_log_sent
  ON public.notification_log(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_log_opened
  ON public.notification_log(opened_at DESC);

CREATE INDEX IF NOT EXISTS idx_log_user_sent
  ON public.notification_log(user_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_log_delivery_window
  ON public.notification_log(sent_at, delivered_at)
  WHERE status = 'delivered';

-- ============================================================================
-- TABLE 4: notification_throttle
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notification_throttle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(100) NOT NULL,
  last_sent_at TIMESTAMPTZ NOT NULL,
  count_today INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, notification_type)
);

ALTER TABLE public.notification_throttle ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_manage_throttle"
  ON public.notification_throttle FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE INDEX IF NOT EXISTS idx_throttle_user_type
  ON public.notification_throttle(user_id, notification_type);

CREATE INDEX IF NOT EXISTS idx_throttle_last_sent
  ON public.notification_throttle(last_sent_at DESC);

-- ============================================================================
-- HELPER FUNCTION: Queue Notification
-- ============================================================================
CREATE OR REPLACE FUNCTION public.queue_notification(
  p_user_id UUID,
  p_notification_type VARCHAR,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT NULL,
  p_scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  p_idempotency_key VARCHAR DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.notification_queue (
    user_id, notification_type, title, body,
    data, scheduled_for, idempotency_key
  )
  VALUES (
    p_user_id, p_notification_type, p_title, p_body,
    p_data, p_scheduled_for, p_idempotency_key
  )
  ON CONFLICT (idempotency_key)
  DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ============================================================================
-- END
-- ============================================================================
