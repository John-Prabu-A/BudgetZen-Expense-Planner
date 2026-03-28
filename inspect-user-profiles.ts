import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mulvugisssqjsgsqvagw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11bHZ1Z2lzc3NxanNnc3F2YWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjczMjcsImV4cCI6MjA3ODYwMzMyN30.GYKST4oFq8zzBmPsKb5VqC3QyWyYa71_HvGl9CX0OnI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectProfilesTable() {
  try {
    console.log('🔍 Detailed profiles table inspection...\n');

    // Get a sample record
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }

    console.log('✅ profiles table exists\n');
    console.log(`📊 Found ${profiles?.length || 0} records\n`);

    if (profiles && profiles.length > 0) {
      console.log('Available columns in profiles table:');
      Object.keys(profiles[0]).forEach((col) => {
        console.log(`  ✓ ${col}`);
      });

      console.log('\n� Sample record:');
      console.log(JSON.stringify(profiles[0], null, 2));

      // Check if onboarding_step exists
      if ('onboarding_step' in profiles[0]) {
        console.log('\n✅ onboarding_step column EXISTS in profiles table');
      } else {
        console.log('\n⚠️ onboarding_step column DOES NOT exist in profiles table');
        console.log('   We need to add this column or modify our code to use a different table');
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

inspectProfilesTable();
