-- ============================================================================
-- My Money – Pro
-- Contact Messages Table (Supabase / PostgreSQL)
-- ============================================================================

-- Required extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. Contact Messages Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,

  subject TEXT NOT NULL,
  message TEXT NOT NULL,

  message_type TEXT NOT NULL
    CHECK (message_type IN ('bug_report', 'feature_request', 'general_feedback', 'other')),

  app_version TEXT NOT NULL,

  platform TEXT NOT NULL
    CHECK (platform IN ('ios', 'android', 'web')),

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 2. Indexes (PostgreSQL-correct)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id
  ON public.contact_messages (user_id);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status
  ON public.contact_messages (status);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
  ON public.contact_messages (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_messages_user_created_desc
  ON public.contact_messages (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_messages_pending_only
  ON public.contact_messages (status)
  WHERE status = 'pending';

-- ============================================================================
-- 3. Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages
CREATE POLICY "Users can view their own messages"
  ON public.contact_messages
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own messages
CREATE POLICY "Users can insert their own messages"
  ON public.contact_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
  ON public.contact_messages
  FOR DELETE
  USING (auth.uid() = user_id);

-- (Optional) Prevent users from updating status manually
CREATE POLICY "Users cannot update messages"
  ON public.contact_messages
  FOR UPDATE
  USING (false);

-- ============================================================================
-- 4. updated_at Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 5. Permissions
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.contact_messages TO authenticated;

GRANT ALL ON public.contact_messages TO service_role;

-- ============================================================================
-- Migration Complete
-- ============================================================================
