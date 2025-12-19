-- ============================================================================
-- My Money – Pro
-- Transaction Ingestion System
-- COMPLETE SUPABASE SQL MIGRATION (Single File)
-- ============================================================================

-- ============================================================================
-- 0. Extensions
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. Transaction Ingestion Logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.transaction_ingestion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  record_id UUID NOT NULL REFERENCES public.records(id) ON DELETE CASCADE,

  source_type VARCHAR(50) NOT NULL,
  platform VARCHAR(20) NOT NULL,

  raw_message TEXT NOT NULL,
  extracted_data JSONB NOT NULL,

  confidence_score DECIMAL(3,2) NOT NULL,
  ingestion_timestamp TIMESTAMPTZ DEFAULT now(),

  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ingestion_logs_record_id
  ON public.transaction_ingestion_logs (record_id);

CREATE INDEX IF NOT EXISTS idx_ingestion_logs_source_type
  ON public.transaction_ingestion_logs (source_type);

CREATE INDEX IF NOT EXISTS idx_ingestion_logs_platform
  ON public.transaction_ingestion_logs (platform);

CREATE INDEX IF NOT EXISTS idx_ingestion_logs_ingestion_ts_desc
  ON public.transaction_ingestion_logs (ingestion_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_ingestion_logs_confidence_desc
  ON public.transaction_ingestion_logs (confidence_score DESC);

-- RLS
ALTER TABLE public.transaction_ingestion_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ingestion logs"
ON public.transaction_ingestion_logs
FOR SELECT
USING (
  record_id IN (
    SELECT id FROM public.records WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- 2. Transaction Deduplication Hashes
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.transaction_dedup_hashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  record_id UUID NOT NULL REFERENCES public.records(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  dedup_hash VARCHAR(64) NOT NULL,

  hash_version INTEGER DEFAULT 1,
  hash_algorithm VARCHAR(20) DEFAULT 'sha256',
  hash_input JSONB,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (user_id, dedup_hash)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dedup_hashes_user_id
  ON public.transaction_dedup_hashes (user_id);

CREATE INDEX IF NOT EXISTS idx_dedup_hashes_hash
  ON public.transaction_dedup_hashes (dedup_hash);

CREATE INDEX IF NOT EXISTS idx_dedup_hashes_record_id
  ON public.transaction_dedup_hashes (record_id);

-- RLS
ALTER TABLE public.transaction_dedup_hashes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dedup hashes"
ON public.transaction_dedup_hashes
FOR SELECT
USING (user_id = auth.uid());

-- ============================================================================
-- 3. Ingestion Settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ingestion_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  auto_detection_enabled BOOLEAN DEFAULT true,
  confidence_threshold DECIMAL(3,2) DEFAULT 0.6,

  android_sms_enabled BOOLEAN DEFAULT true,
  notifications_enabled BOOLEAN DEFAULT true,
  email_parsing_enabled BOOLEAN DEFAULT false,
  manual_scan_enabled BOOLEAN DEFAULT true,

  auto_category_enabled BOOLEAN DEFAULT true,
  debug_mode BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_ingestion_settings_user_id
  ON public.ingestion_settings (user_id);

-- RLS
ALTER TABLE public.ingestion_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own ingestion settings"
ON public.ingestion_settings
FOR ALL
USING (user_id = auth.uid());

-- ============================================================================
-- 4. Bank Configurations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bank_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  bank_id VARCHAR(100) NOT NULL UNIQUE,
  bank_name VARCHAR(255) NOT NULL,

  sender_identifiers JSONB DEFAULT '[]'::jsonb,
  patterns JSONB DEFAULT '[]'::jsonb,

  currency VARCHAR(3) DEFAULT 'INR',
  active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bank_configurations_bank_id
  ON public.bank_configurations (bank_id);

CREATE INDEX IF NOT EXISTS idx_bank_configurations_active
  ON public.bank_configurations (active);

-- ============================================================================
-- 5. Category Mappings
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.category_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  category_id VARCHAR(100) NOT NULL,
  category_name VARCHAR(255) NOT NULL,

  keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence DECIMAL(3,2) DEFAULT 0.8,

  active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_category_mappings_user_id
  ON public.category_mappings (user_id);

CREATE INDEX IF NOT EXISTS idx_category_mappings_category_id
  ON public.category_mappings (category_id);

CREATE INDEX IF NOT EXISTS idx_category_mappings_active
  ON public.category_mappings (active);

-- RLS
ALTER TABLE public.category_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own and system category mappings"
ON public.category_mappings
FOR SELECT
USING (user_id IS NULL OR user_id = auth.uid());

-- ============================================================================
-- 6. Ingestion Queue
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ingestion_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL,

  raw_text TEXT NOT NULL,
  source_type VARCHAR(50) NOT NULL,
  sender_identifier VARCHAR(255),

  processed BOOLEAN DEFAULT false,
  processing_result JSONB,

  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ingestion_queue_user_id
  ON public.ingestion_queue (user_id);

CREATE INDEX IF NOT EXISTS idx_ingestion_queue_processed
  ON public.ingestion_queue (processed);

CREATE INDEX IF NOT EXISTS idx_ingestion_queue_created_desc
  ON public.ingestion_queue (created_at DESC);

-- RLS
ALTER TABLE public.ingestion_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ingestion queue"
ON public.ingestion_queue
FOR SELECT
USING (user_id = auth.uid());

-- ============================================================================
-- 7. Grants
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.transaction_ingestion_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.transaction_dedup_hashes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ingestion_settings TO authenticated;
GRANT SELECT ON public.bank_configurations TO authenticated;
GRANT SELECT ON public.category_mappings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ingestion_queue TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- ============================================================================
-- 8. Default Bank Data (India)
-- ============================================================================

INSERT INTO public.bank_configurations (bank_id, bank_name, sender_identifiers, currency, active)
VALUES
  ('hdfc_bank', 'HDFC Bank', '["1860","9066","hdfc"]'::jsonb, 'INR', true),
  ('icici_bank', 'ICICI Bank', '["9267","9241","icici"]'::jsonb, 'INR', true),
  ('axis_bank', 'Axis Bank', '["9876","axis"]'::jsonb, 'INR', true),
  ('sbi_bank', 'State Bank of India', '["9223","sbi"]'::jsonb, 'INR', true),
  ('kotak_bank', 'Kotak Mahindra Bank', '["9876","kotak"]'::jsonb, 'INR', true)
ON CONFLICT (bank_id) DO NOTHING;

-- ============================================================================
-- Migration Complete
-- ============================================================================
