import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mulvugisssqjsgsqvagw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11bHZ1Z2lzc3NxanNnc3F2YWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjczMjcsImV4cCI6MjA3ODYwMzMyN30.GYKST4oFq8zzBmPsKb5VqC3QyWyYa71_HvGl9CX0OnI';

// Note: This uses anon key but we're only reading - for write operations you'd need service role
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupDatabase() {
  console.log('🚀 BudgetZen Database Setup Script\n');
  console.log('========================================\n');

  try {
    // Step 1: Show current state
    console.log('📋 STEP 1: Checking Current Database State\n');
    
    const tables = ['profiles', 'accounts', 'categories', 'records', 'budgets'];
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`   ❌ ${table}: Error - ${error.message}`);
        } else {
          console.log(`   ℹ️  ${table}: ${count} records`);
        }
      } catch (err: any) {
        console.log(`   ❌ ${table}: ${err.message}`);
      }
    }

    // Step 2: Instructions
    console.log('\n📝 STEP 2: Database Setup Instructions\n');
    console.log('Because this script uses the anon key (read-only), you need to run');
    console.log('the SQL migration manually in Supabase dashboard.\n');

    console.log('Follow these steps:\n');
    console.log('1️⃣  BEFORE RUNNING SQL - Create test user in Supabase:');
    console.log('   - Go to Supabase Dashboard > Authentication > Add User');
    console.log('   - Email: jprabu@life.com');
    console.log('   - Password: 12345678');
    console.log('   - Click "Create user"');
    console.log('   - Copy the User ID (you\'ll need it)\n');

    console.log('2️⃣  CLEAR EXISTING DATA (Optional - if you want fresh start):');
    console.log('   - Go to Supabase Dashboard > SQL Editor');
    console.log('   - Create a new query');
    console.log('   - Copy and run the CLEAR_DATA.sql script below:\n');

    console.log('```sql');
    console.log(getClearDataSQL());
    console.log('```\n');

    console.log('3️⃣  APPLY NEW CHANGES:');
    console.log('   - Go to Supabase Dashboard > SQL Editor');
    console.log('   - Create a new query');
    console.log('   - Copy entire contents from: database/COMPLETE_SETUP.sql');
    console.log('   - Paste into SQL Editor');
    console.log('   - Click "Run"');
    console.log('   - Wait for success message\n');

    console.log('4️⃣  VERIFY SETUP:');
    console.log('   After running SQL, you should see verification queries showing:');
    console.log('   ✅ 1 profile with onboarding_step = COMPLETED');
    console.log('   ✅ 4 accounts created');
    console.log('   ✅ 10 categories created');
    console.log('   ✅ 10 records/transactions created');
    console.log('   ✅ 5 budgets created\n');

    console.log('5️⃣  TEST THE APP:');
    console.log('   ```bash');
    console.log('   npm run android    # or ios/web');
    console.log('   ```');
    console.log('   Login with:');
    console.log('   - Email: jprabu@life.com');
    console.log('   - Password: 12345678\n');

    // Step 3: Show what to expect
    console.log('✅ WHAT YOU SHOULD SEE IN CONSOLE\n');
    console.log('After successful setup and login:\n');
    
    const expectedLogs = [
      '[AUTH-DEBUG] Initial session: true',
      '[Onboarding] Loading from database for user: [user-id]',
      '[Onboarding] Loaded onboarding step from database: COMPLETED',
      '✅ Preferences loaded',
      '🎓 Onboarding complete → navigate to main app tabs'
    ];

    expectedLogs.forEach((log, i) => {
      console.log(`   ${i + 1}. ✓ ${log}`);
    });

    console.log('\n✅ WHAT YOU SHOULD SEE IN APP\n');
    console.log('   1. ✅ Login screen appears');
    console.log('   2. ✅ Enter jprabu@life.com / 12345678');
    console.log('   3. ✅ NO PASSWORD/PASSCODE LOCK (first user)');
    console.log('   4. ✅ NO ONBOARDING SCREENS (skipped)');
    console.log('   5. ✅ Goes directly to Dashboard/Records tab');
    console.log('   6. ✅ Shows 10 dummy transactions');
    console.log('   7. ✅ Budgets tab shows 5 budgets');
    console.log('   8. ✅ Accounts tab shows 4 accounts\n');

    // Step 4: Troubleshooting
    console.log('🔧 TROUBLESHOOTING\n');

    const issues = [
      {
        error: '"onboarding_step does not exist"',
        solution: 'Run the COMPLETE_SETUP.sql migration again'
      },
      {
        error: '"User not found"',
        solution: 'Create user first in Supabase Dashboard > Authentication'
      },
      {
        error: 'Still seeing onboarding screens',
        solution: 'Run: UPDATE profiles SET onboarding_step = \'COMPLETED\' WHERE...'
      },
      {
        error: 'Stuck on loading spinner',
        solution: 'Check console for errors, verify passwordStatusChecked is true'
      }
    ];

    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ❌ ${issue.error}`);
      console.log(`      ✅ Solution: ${issue.solution}\n`);
    });

    console.log('========================================\n');
    console.log('📚 Files Created:\n');
    console.log('   - database/COMPLETE_SETUP.sql (Main setup script)');
    console.log('   - database/user_profiles_schema.sql (Just onboarding column)');
    console.log('   - QUICK_START.md (Quick reference guide)\n');

    console.log('========================================\n');
    console.log('✨ Setup ready! Follow the steps above to complete database setup.\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

function getClearDataSQL(): string {
  return `-- ============================================================================
-- CLEAR ALL USER DATA (Use with caution!)
-- ============================================================================
-- This script deletes all data for testing purposes
-- WARNING: This will delete all records, budgets, categories, and accounts
-- ============================================================================

-- Get all non-system users
WITH users_to_clear AS (
  SELECT id FROM auth.users 
  WHERE email NOT IN ('postgres@example.com')  -- Keep system users
)

-- Delete in order of dependencies
DELETE FROM public.budgets 
WHERE user_id IN (SELECT id FROM users_to_clear);

DELETE FROM public.records 
WHERE user_id IN (SELECT id FROM users_to_clear);

DELETE FROM public.accounts 
WHERE user_id IN (SELECT id FROM users_to_clear);

DELETE FROM public.categories 
WHERE user_id IN (SELECT id FROM users_to_clear);

UPDATE public.profiles 
SET onboarding_step = 'NOT_STARTED'
WHERE id IN (SELECT id FROM users_to_clear);

-- Verify deletion
SELECT 'Budgets' as table_name, COUNT(*) as remaining FROM public.budgets
UNION ALL
SELECT 'Records', COUNT(*) FROM public.records
UNION ALL
SELECT 'Accounts', COUNT(*) FROM public.accounts
UNION ALL
SELECT 'Categories', COUNT(*) FROM public.categories;`;
}

setupDatabase();
