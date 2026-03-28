# 🚀 BudgetZen Setup Quick Start Guide

## 1️⃣ Prerequisites
- Supabase Account (free tier works)
- Node.js >= 18
- Expo CLI: `npm install -g expo-cli`

---

## 2️⃣ Create Auth User

**Go to Supabase Dashboard → Authentication → Add User**

```
Email: jprabu@life.com
Password: 12345678
✅ Click "Create user"
```

**Copy the User ID** (you'll need this)
```
Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## 3️⃣ Run Database Migration

**Go to Supabase Dashboard → SQL Editor → New Query**

```sql
-- STEP 1: Copy entire content from:
-- database/COMPLETE_SETUP.sql

-- STEP 2: Paste into SQL Editor

-- STEP 3: Click "Run"

-- STEP 4: Wait for success message
-- You should see verification queries showing:
-- ✅ 1 profile with onboarding_step = COMPLETED
-- ✅ 4 accounts created
-- ✅ 10 categories created
-- ✅ 10 records/transactions created
-- ✅ 5 budgets created
```

---

## 4️⃣ Test the App

```bash
# Install dependencies
npm install

# Start Expo development server
npm run android    # or ios / web

# In app, login with:
# Email: jprabu@life.com
# Password: 12345678
```

---

## ✅ What You Should See

### Logs (in Console)
```
✓ [AUTH-DEBUG] Initial session: true
✓ [Onboarding] Loading from database for user: [user-id]
✓ [Onboarding] Loaded onboarding step from database: COMPLETED
✓ ✅ Preferences loaded
✓ 🎓 Onboarding complete → navigate to main app tabs
✓ ✅ Preferences loaded
```

### App Display
1. ✅ Login screen appears
2. ✅ Enter credentials
3. ✅ **NO PASSWORD/PASSCODE LOCK** (first user, not set up)
4. ✅ **NO ONBOARDING SCREENS** (skipped because completed)
5. ✅ Goes directly to **Dashboard/Records tab**
6. ✅ Shows 10 dummy transactions
7. ✅ Budgets tab shows 5 budgets
8. ✅ Accounts tab shows 4 accounts

---

## 🔧 Troubleshooting

### ❌ Error: "onboarding_step does not exist"
**Solution**: Run the COMPLETE_SETUP.sql migration again

### ❌ Error: "User not found"
**Solution**: Create user first in Supabase Dashboard → Authentication

### ❌ Stuck on loading spinner
**Solution**: 
1. Check browser console for errors
2. Verify `passwordStatusChecked` is true in logs
3. Restart app

### ❌ Still seeing onboarding screens
**Solution**:
1. Check database: `SELECT onboarding_step FROM profiles WHERE email = 'jprabu@life.com';`
2. Should return: `COMPLETED`
3. If not, update: `UPDATE profiles SET onboarding_step = 'COMPLETED' WHERE ...;`

---

## 📊 Database Schema Overview

After migration, you should have:

| Table | Rows | Purpose |
|-------|------|---------|
| `auth.users` | 1 | Test user |
| `profiles` | 1 | User profile with `onboarding_step = COMPLETED` |
| `accounts` | 4 | Bank, Savings, Credit Card, Cash |
| `categories` | 10 | Food, Transport, Shopping, etc. |
| `records` | 10 | Sample transactions |
| `budgets` | 5 | Monthly budgets per category |

---

## 🎓 Next Steps

1. ✅ Login and explore the app
2. ✅ Check all tabs (Records, Budgets, Analysis, Accounts, Categories)
3. ✅ Try creating new transactions
4. ✅ Test preferences and settings
5. ✅ Review console logs for debug info

---

## 📝 Notes

- **Password/Passcode**: Not set for test user (first login doesn't require it)
- **Onboarding**: Skipped because already marked as COMPLETED
- **Data**: All dummy data is for testing only, can be deleted anytime
- **User**: Can be reused for multiple test sessions

---

**Last Updated**: March 28, 2026
**Version**: 1.0.0
