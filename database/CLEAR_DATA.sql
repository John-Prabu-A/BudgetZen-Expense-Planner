-- ============================================================================
-- CLEAR ALL USER DATA (Use with caution!)
-- ============================================================================
-- This script deletes all data for testing purposes
-- WARNING: This will delete all records, budgets, categories, and accounts
-- But keeps the profiles table structure and onboarding_step column
-- ============================================================================

-- Delete in order of dependencies (reverse order of foreign keys)
-- This deletes all data for all users (except system users)

DELETE FROM public.budgets 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email NOT IN ('postgres@example.com')
);

DELETE FROM public.records 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email NOT IN ('postgres@example.com')
);

DELETE FROM public.accounts 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email NOT IN ('postgres@example.com')
);

DELETE FROM public.categories 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email NOT IN ('postgres@example.com')
);

-- Reset onboarding state for all users
UPDATE public.profiles 
SET onboarding_step = 'not_started'
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email NOT IN ('postgres@example.com')
);

-- ============================================================================
-- VERIFY DELETION
-- ============================================================================
-- These queries show how many records remain (should all be 0 after deletion)

SELECT 'Budgets' as table_name, COUNT(*) as remaining FROM public.budgets
UNION ALL
SELECT 'Records', COUNT(*) FROM public.records
UNION ALL
SELECT 'Accounts', COUNT(*) FROM public.accounts
UNION ALL
SELECT 'Categories', COUNT(*) FROM public.categories;

-- ============================================================================
-- CLEANUP COMPLETE
-- ============================================================================
-- All user data has been cleared
-- Profiles with onboarding_step = 'NOT_STARTED' remain
-- Auth users remain intact (can be deleted separately if needed)
-- ============================================================================
