-- ============================================================================
-- Add Onboarding State to Existing profiles Table
-- ============================================================================

-- Add onboarding_step column to existing profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_step VARCHAR(50) DEFAULT 'NOT_STARTED';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_step
  ON public.profiles(onboarding_step);

-- ============================================================================
-- Update Existing Profiles with NOT_STARTED if NULL
-- ============================================================================
UPDATE public.profiles
SET onboarding_step = 'NOT_STARTED'
WHERE onboarding_step IS NULL OR onboarding_step = '';

-- ============================================================================
-- Create Function to Auto-Create Profile on Signup
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, onboarding_step)
  VALUES (NEW.id, 'NOT_STARTED')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if it exists
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;

-- Create trigger to auto-create profile when user signs up
CREATE TRIGGER create_profile_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_user_profile();

-- ============================================================================
-- Create Function to Update updated_at Timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if it exists
DROP TRIGGER IF EXISTS update_profiles_timestamp ON public.profiles;

-- Create trigger to update timestamp
CREATE TRIGGER update_profiles_timestamp
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_profiles_updated_at();

-- ============================================================================
-- RLS Policies for onboarding_step
-- ============================================================================

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- The profiles table now has onboarding_step column to store user progress.
-- When a user signs up, a profile with onboarding_step = 'NOT_STARTED' is automatically created.
-- When a user completes each onboarding step, the onboarding_step value is updated in the database.
-- ============================================================================
