-- ============================================================================
-- BudgetZen Database Setup - Complete Schema Migration
-- Run this in Supabase SQL Editor to set up the entire database
-- ============================================================================

-- ============================================================================
-- 1. ADD ONBOARDING_STEP COLUMN TO PROFILES TABLE
-- ============================================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_step VARCHAR(50) DEFAULT 'NOT_STARTED';

-- Create index
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_step
  ON public.profiles(onboarding_step);

-- ============================================================================
-- 2. VERIFY PROFILES TABLE STRUCTURE
-- ============================================================================

-- This should show all columns in profiles table
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'profiles' ORDER BY ordinal_position;

-- ============================================================================
-- 3. CREATE TEST USER WITH DUMMY DATA
-- ============================================================================

-- Note: Supabase requires users to be created through Auth API
-- This SQL assumes the user jprabu@life.com already exists in auth.users
-- If not, create it first via Supabase Dashboard > Authentication > Add User

-- Update profile for test user (assuming id already exists from auth.users)
UPDATE public.profiles
SET 
  onboarding_step = 'completed',
  username = 'jprabu',
  full_name = 'JP Prabu',
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=jprabu'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'jprabu@life.com')
OR id = '00000000-0000-0000-0000-000000000001'; -- Fallback ID

-- If user doesn't exist, create default profile entry
INSERT INTO public.profiles (id, onboarding_step, username, full_name)
SELECT 
  id, 
  'completed',
  'jprabu',
  'JP Prabu'
FROM auth.users
WHERE email = 'jprabu@life.com'
AND id NOT IN (SELECT id FROM public.profiles);

-- ============================================================================
-- 4. CREATE DUMMY ACCOUNTS
-- ============================================================================

-- Get the user ID for the test user
WITH user_id AS (
  SELECT id FROM auth.users WHERE email = 'jprabu@life.com' LIMIT 1
)
INSERT INTO public.accounts (id, user_id, name, type, initial_balance)
SELECT 
  gen_random_uuid(),
  user_id.id,
  account_names.name,
  account_names.type,
  account_names.balance
FROM user_id
CROSS JOIN (
  VALUES 
    ('Primary Bank', 'Bank Account', 50000.00),
    ('Savings', 'Savings', 100000.00),
    ('Credit Card', 'Credit Card', 25000.00),
    ('Cash Wallet', 'Cash', 5000.00)
) AS account_names(name, type, balance)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. CREATE DUMMY CATEGORIES
-- ============================================================================

WITH user_id AS (
  SELECT id FROM auth.users WHERE email = 'jprabu@life.com' LIMIT 1
)
INSERT INTO public.categories (id, user_id, name, icon)
SELECT 
  gen_random_uuid(),
  user_id.id,
  category_data.name,
  category_data.icon
FROM user_id
CROSS JOIN (
  VALUES 
    ('Food & Dining', '🍔'),
    ('Transport', '🚗'),
    ('Shopping', '🛍️'),
    ('Entertainment', '🎬'),
    ('Utilities', '💡'),
    ('Healthcare', '🏥'),
    ('Salary', '💰'),
    ('Freelance', '💻'),
    ('Investments', '📈'),
    ('Other', '📌')
) AS category_data(name, icon)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. CREATE DUMMY RECORDS (TRANSACTIONS)
-- ============================================================================

WITH user_id AS (
  SELECT id FROM auth.users WHERE email = 'jprabu@life.com' LIMIT 1
),
account_id AS (
  SELECT id FROM public.accounts 
  WHERE user_id = (SELECT id FROM user_id)
  AND name = 'Primary Bank'
  LIMIT 1
),
category_ids AS (
  SELECT id, name FROM public.categories
  WHERE user_id = (SELECT id FROM user_id)
)
INSERT INTO public.records (id, user_id, account_id, category_id, amount, type, notes, transaction_date)
SELECT
  gen_random_uuid(),
  user_id.id,
  account_id.id,
  (SELECT id FROM category_ids WHERE name = rec.category_name LIMIT 1),
  rec.amount,
  rec.type,
  rec.notes,
  rec.transaction_date
FROM user_id
CROSS JOIN account_id
CROSS JOIN (
  VALUES
    ('Food & Dining', 450.00, 'expense', 'Lunch and dinner', NOW() - INTERVAL '5 days'),
    ('Transport', 200.00, 'expense', 'Uber rides', NOW() - INTERVAL '4 days'),
    ('Shopping', 1500.00, 'expense', 'Clothes shopping', NOW() - INTERVAL '3 days'),
    ('Entertainment', 300.00, 'expense', 'Movie tickets and games', NOW() - INTERVAL '2 days'),
    ('Utilities', 800.00, 'expense', 'Electricity bill', NOW() - INTERVAL '1 day'),
    ('Salary', 50000.00, 'income', 'Monthly salary', NOW() - INTERVAL '7 days'),
    ('Freelance', 5000.00, 'income', 'Project payment', NOW() - INTERVAL '3 days'),
    ('Food & Dining', 250.00, 'expense', 'Restaurant dinner', NOW()),
    ('Healthcare', 500.00, 'expense', 'Doctor visit', NOW() - INTERVAL '6 days'),
    ('Shopping', 800.00, 'expense', 'Groceries', NOW() - INTERVAL '2 days')
) AS rec(category_name, amount, type, notes, transaction_date)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. CREATE DUMMY BUDGETS
-- ============================================================================

WITH user_id AS (
  SELECT id FROM auth.users WHERE email = 'jprabu@life.com' LIMIT 1
),
category_ids AS (
  SELECT id, name FROM public.categories
  WHERE user_id = (SELECT id FROM user_id)
)
INSERT INTO public.budgets (id, user_id, category_id, amount, start_date, end_date)
SELECT
  gen_random_uuid(),
  user_id.id,
  (SELECT id FROM category_ids WHERE name = budget_data.category_name LIMIT 1),
  budget_data.amount,
  DATE_TRUNC('month', CURRENT_DATE),
  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'
FROM user_id
CROSS JOIN (
  VALUES
    ('Food & Dining', 5000),
    ('Transport', 3000),
    ('Shopping', 8000),
    ('Entertainment', 2000),
    ('Utilities', 2000)
) AS budget_data(category_name, amount)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. VERIFY SETUP
-- ============================================================================

-- Check if profile has onboarding_step
SELECT id, username, full_name, onboarding_step 
FROM public.profiles 
WHERE id IN (SELECT id FROM auth.users WHERE email = 'jprabu@life.com');

-- Check accounts
SELECT id, name, type, initial_balance 
FROM public.accounts 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'jprabu@life.com');

-- Check categories count
SELECT COUNT(*) as category_count 
FROM public.categories 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'jprabu@life.com');

-- Check records count
SELECT COUNT(*) as record_count, SUM(amount) as total_amount
FROM public.records 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'jprabu@life.com');

-- Check budgets
SELECT COUNT(*) as budget_count 
FROM public.budgets 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'jprabu@life.com');

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- All tables are now populated with test data for jprabu@life.com
-- The user can now log in and use the app without seeing onboarding
-- ============================================================================
