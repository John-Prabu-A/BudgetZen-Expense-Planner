import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mulvugisssqjsgsqvagw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11bHZ1Z2lzc3NxanNnc3F2YWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjczMjcsImV4cCI6MjA3ODYwMzMyN30.GYKST4oFq8zzBmPsKb5VqC3QyWyYa71_HvGl9CX0OnI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyMigration() {
  try {
    console.log('🚀 Applying onboarding migration to profiles table...\n');

    // Step 1: Check current state
    console.log('📋 Step 1: Checking current profiles table structure...');
    const { data: sampleProfile } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (sampleProfile && sampleProfile.length > 0) {
      const hasOnboarding = 'onboarding_step' in sampleProfile[0];
      console.log(`   Current columns: ${Object.keys(sampleProfile[0]).join(', ')}`);
      console.log(`   onboarding_step column exists: ${hasOnboarding ? '✅' : '❌'}\n`);
    }

    // Step 2: Test adding the column (this is a DML operation, may need service role)
    console.log('🔧 Step 2: Attempting to add onboarding_step column...');
    console.log('   ⚠️  Note: This requires admin access. You may need to run the SQL manually in Supabase console.\n');

    console.log('📝 SQL to run in Supabase SQL Editor:\n');
    console.log(`
-- Add onboarding_step column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_step VARCHAR(50) DEFAULT 'NOT_STARTED';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_step
  ON public.profiles(onboarding_step);

-- Update existing profiles with NOT_STARTED if NULL
UPDATE public.profiles
SET onboarding_step = 'NOT_STARTED'
WHERE onboarding_step IS NULL OR onboarding_step = '';
    `);

    console.log('\n✅ To complete the migration:');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Create a new query');
    console.log('   3. Copy and paste the SQL above');
    console.log('   4. Click Run');
    console.log('   5. The onboarding_step column will be added to profiles table\n');

    // Step 3: Verify after manual execution
    console.log('📊 After running the SQL, verify with this query:');
    console.log(`
SELECT id, onboarding_step FROM public.profiles LIMIT 5;
    `);

    console.log('\n🎉 Migration instructions complete!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

applyMigration();
