# 💰 BudgetZen - Smart Expense Planner

A sophisticated React Native mobile app for intelligent expense tracking, budget management, and financial analytics.

## 🎯 Overview

**BudgetZen** is a feature-rich budget planning and expense tracking application built with React Native, Expo, and Supabase. It provides real-time transaction detection, intelligent categorization, comprehensive analytics, and smart budget management.

- **Platform**: Android, iOS (React Native + Expo)
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Language**: TypeScript
- **State Management**: Context API + Hooks
- **Storage**: AsyncStorage + SecureStore

## ✨ Key Features

### 📊 Core Functionality
- **Smart Transaction Detection**: Auto-detect bank transactions from SMS/notifications
- **Budget Management**: Set, track, and manage category budgets with real-time progress
- **Financial Analytics**: View spending trends, income/expense charts, category analysis
- **Account Management**: Multi-account support with balance tracking
- **Data Export**: Export records to CSV for external analysis

### 🔐 Security
- **Secure Authentication**: Password + Passcode protection with bcrypt hashing
- **Brute Force Protection**: Rate limiting on failed authentication attempts
- **SecureStore Integration**: Sensitive data encrypted at rest
- **Data Persistence**: Secure local storage with offline capability

### 🎨 User Experience
- **Dark Mode Support**: Full dark/light theme support
- **Customizable Appearance**: Configure currency, decimal places, UI spacing
- **Preferences System**: User-controlled settings for behavior and display
- **Empty State Handling**: Guided experiences for empty screens
- **Push Notifications**: Timely reminders and alerts

### 🚀 Onboarding System
- **Smart Onboarding Flow**: Step-by-step guided setup (Currency → Privacy → Reminders → Tutorial)
- **Database Persistence**: Onboarding progress saved to database (`profiles.onboarding_step`)
- **Seamless User Experience**: Users won't see onboarding again after completing it
- **Session Agnostic**: Onboarding state persists across login sessions
- **Fallback Storage**: Local SecureStore backup if database unavailable

### 🌐 Offline-First Architecture
- **Offline Queue**: Queue transactions when offline
- **Sync Manager**: Automatic sync when connectivity restored
- **Local Database**: AsyncStorage-based offline persistence
- **Conflict Resolution**: Intelligent duplicate detection and prevention

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- npm or yarn
- Android SDK (for Android development) or Xcode (for iOS)
- Expo CLI: `npm install -g expo-cli`

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd budgetzen

# Install dependencies
npm install

# Install Expo CLI if not already installed
npm install -g expo-cli
```

### Development

```bash
# Start Metro bundler
npm run metro

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Lint code
npm lint
```

## 📁 Project Structure

```
budgetzen/
├── app/                          # App screens and navigation
│   ├── (tabs)/                   # Tab navigation screens
│   │   ├── index.tsx             # Records/Dashboard
│   │   ├── budgets.tsx           # Budget management
│   │   ├── analysis.tsx          # Financial analytics
│   │   ├── accounts.tsx          # Account management
│   │   └── categories.tsx        # Category settings
│   ├── (auth)/                   # Authentication screens
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (onboarding)/             # Onboarding flow
│   ├── (modal)/                  # Modal screens
│   ├── preferences/              # Preference/settings pages
│   └── admin/                    # Admin/debug screens
│
├── components/                   # Reusable UI components
│   ├── Header.tsx
│   ├── AnimatedCard.tsx
│   ├── IncomeExpenseCalendar.tsx
│   ├── SidebarDrawer.tsx
│   ├── Toast.tsx
│   └── ui/                       # Base UI components
│
├── context/                      # React Context providers
│   ├── Auth.tsx                  # Authentication state
│   ├── Theme.tsx                 # Theme/colors
│   ├── Preferences.tsx           # User preferences
│   ├── Notifications.tsx         # Notification state
│   ├── Toast.tsx                 # Toast messages
│   ├── Offline.tsx               # Offline status
│   └── TransactionIngestion.tsx  # Transaction detection
│
├── hooks/                        # Custom React hooks
│   ├── useAppSettings.ts         # Settings derivation
│   ├── useUIMode.ts              # Spacing/sizing
│   ├── useNotifications.ts       # Notification logic
│   └── useSmartLoading.ts        # Loading state
│
├── lib/                          # Utility libraries
│   ├── supabase.ts               # Supabase client
│   ├── finance.ts                # Financial calculations
│   ├── currency.ts               # Currency formatting
│   ├── notifications/            # Notification system
│   ├── transactionDetection/     # Smart detection engines
│   │   ├── engines/              # Core detection algorithms
│   │   ├── sources/              # SMS/notification listeners
│   │   └── services/             # Processing services
│   ├── offline/                  # Offline capabilities
│   │   ├── OfflineDatabase.ts
│   │   ├── SyncManager.ts
│   │   └── OfflineTransactionProcessingService.ts
│   ├── security/                 # Security utilities
│   │   └── SecurePasswordManager.ts
│   └── storage/                  # Storage utilities
│       └── secureStorageManager.ts
│
├── database/                     # Database schemas
│   ├── notification_system_schema.sql
│   ├── transaction_ingestion_schema.sql
│   └── contact_messages_schema.sql
│
├── supabase/                     # Supabase edge functions
│   └── functions/
│       ├── send-notification/
│       ├── process-queue/
│       ├── schedule-daily-jobs/
│       └── [other functions]/
│
├── __tests__/                    # Test files
│   ├── AmountExtraction.test.ts
│   ├── IntentClassification.test.ts
│   └── E2E.test.ts
│
├── assets/                       # Static assets
│   ├── images/
│   └── sounds/
│
├── app.json                      # Expo configuration
├── tsconfig.json                 # TypeScript config
├── eslint.config.js              # ESLint configuration
└── package.json                  # Dependencies and scripts
```

## 🏗️ Architecture

### Authentication Flow
```
User → Login Screen → Password Verification → Passcode Setup → Dashboard
       ↓
    Supabase Auth (email/password)
    ↓
    SecureStore (secure passcode storage)
```

### Transaction Detection Pipeline
```
SMS/Notification → Normalization → Amount Extraction → Intent Classification → Record Creation
                  ↓                ↓                    ↓                      ↓
              Unified format   95%+ accuracy         90%+ accuracy         Deduplication
```

### State Management
```
Context Providers:
├── Auth          → User identity, session
├── Theme         → Colors, dark mode
├── Preferences   → User settings, currency
├── Onboarding    → User onboarding progress
├── Notifications → Push notification state
├── Toast         → Toast messages
├── Offline       → Connectivity status
└── TransactionIngestion → Detection settings
```

## 🎓 Onboarding System Architecture

The onboarding system manages the guided setup flow for new users and ensures their progress is persisted across sessions.

### How It Works

1. **Database Persistence**: Onboarding progress is stored in the `profiles.onboarding_step` column
2. **Dual Storage**: Saves to both database (primary) and SecureStore (fallback)
3. **Smart Loading**: Loads state from database first, falls back to SecureStore if unavailable
4. **Session-Aware**: Automatically reloads state when user logs in/out

### Onboarding Steps (Sequential)

| Step | Purpose | Status |
|------|---------|--------|
| `NOT_STARTED` | Initial state for new users | 🟢 Active |
| `CURRENCY` | User selects preferred currency | 🟢 Active |
| `PRIVACY` | User agrees to privacy policy | 🟢 Active |
| `REMINDERS` | User configures reminder preferences | 🟢 Active |
| `TUTORIAL` | User views app tutorial | 🟢 Active |
| `COMPLETED` | Onboarding finished | 🟢 Active |

### Implementation Details

**File**: `context/Onboarding.tsx`

Key functions:
```typescript
// Complete current step and move to next
completeStep(step: OnboardingStep) → Promise<void>

// Skip remaining steps
skipToStep(step: OnboardingStep) → Promise<void>

// Reset onboarding (on logout)
resetOnboarding() → Promise<void>

// Check if onboarding complete
isOnboardingComplete: boolean
```

### Database Schema

The onboarding state is stored in the existing `profiles` table:

```sql
-- Add this column to profiles table if not present
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_step VARCHAR(50) DEFAULT 'NOT_STARTED';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_step
  ON public.profiles(onboarding_step);
```

**Run the migration** from `database/user_profiles_schema.sql` in your Supabase SQL Editor.

### Navigation Integration

The root layout (`app/_layout.tsx`) automatically:
1. Checks if onboarding is complete
2. Shows onboarding screens if incomplete
3. Skips onboarding if already completed
4. Redirects to main app tabs after completion

No manual routing required - just call `completeStep()` and the app navigates automatically!

## 🔧 Configuration

### Environment Variables (.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_URL=your_api_url
```

### App Settings
Configure via **Preferences → Appearance**:
- **Theme**: Light, Dark, Auto
- **UI Mode**: Compact, Normal, Spacious
- **Currency Sign**: $, €, ₹, etc.
- **Currency Position**: Before/After amount
- **Decimal Places**: 0-3 places

## 🛠️ Database Migrations

### Complete Setup (First Time Setup)

**File**: `database/COMPLETE_SETUP.sql`

This script sets up the entire database including:
- ✅ Adds `onboarding_step` column to `profiles` table
- ✅ Creates test user `jprabu@life.com` with completed onboarding
- ✅ Creates dummy accounts (Bank, Savings, Credit Card, Cash)
- ✅ Creates dummy categories (Food, Transport, Shopping, etc.)
- ✅ Creates dummy transactions/records
- ✅ Creates dummy budgets

**Steps to Setup**:

1. **Create auth user first** (via Supabase Dashboard):
   - Go to Supabase Dashboard > Authentication > Add User
   - Email: `jprabu@life.com`
   - Password: `12345678`
   - Click "Create user"

2. **Copy the user ID** that was created (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

3. **Run the SQL migration**:
   - Go to Supabase Dashboard > SQL Editor
   - Create a new query
   - Copy entire contents of `database/COMPLETE_SETUP.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Wait for success message

4. **Verify setup**:
   ```bash
   # In your app, you should see these logs when logging in:
   # [Onboarding] Loaded onboarding step from database: COMPLETED
   # ✅ Preferences loaded
   # 🎓 Onboarding complete → navigate to main app tabs
   ```

### Onboarding State Migration (Minimal Setup)

If you already have a database and just need to add onboarding support:

```sql
-- Add onboarding_step column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_step VARCHAR(50) DEFAULT 'NOT_STARTED';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_step
  ON public.profiles(onboarding_step);

-- Update existing profiles
UPDATE public.profiles
SET onboarding_step = 'NOT_STARTED'
WHERE onboarding_step IS NULL OR onboarding_step = '';

-- Verify the migration
SELECT id, username, onboarding_step FROM public.profiles LIMIT 5;
```

**Migration File**: `database/user_profiles_schema.sql`

**Verification**:
```bash
# Check if migration was applied
npm run inspect-profiles  # Shows current table structure
```

## 📱 Key Screens

| Screen | Path | Purpose |
|--------|------|---------|
| Records | `/(tabs)` | Dashboard with transactions and charts |
| Budgets | `/(tabs)/budgets` | Budget creation and tracking |
| Analysis | `/(tabs)/analysis` | Financial analytics and reports |
| Accounts | `/(tabs)/accounts` | Multi-account management |
| Categories | `/(tabs)/categories` | Category management |
| Preferences | `/preferences` | User settings and configuration |
| Transaction Ingestion | `/preferences/transaction-ingestion` | Auto-detection setup |
| Notifications | `/preferences/notifications` | Notification settings |

## 🧪 Testing

### Unit Tests
- **AmountExtraction.test.ts**: 25 tests for amount parsing
- **IntentClassification.test.ts**: 30 tests for transaction classification
- **E2E.test.ts**: End-to-end workflow testing

### Running Tests
```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm test -- --coverage  # With coverage report
```

### Testing Onboarding (Manual)

**Test User Credentials** (after running COMPLETE_SETUP.sql):
- Email: `jprabu@life.com`
- Password: `12345678`

**Test Scenarios**:

1. **Fresh Login** (onboarding already completed):
   ```
   1. Login with test user credentials
   2. Should bypass onboarding screens
   3. Should go directly to main app dashboard
   4. Check logs: "[Onboarding] Loaded onboarding step from database: COMPLETED"
   ```

2. **Test Database Persistence**:
   ```
   1. Login
   2. Check console: "[Onboarding] Loaded onboarding step from database: COMPLETED"
   3. Logout and login again
   4. Should still skip onboarding (data persisted in database)
   ```

3. **Test Fallback to SecureStore**:
   ```
   1. If database column missing, check logs:
   2. "[Onboarding] Error loading from database: column profiles.onboarding_step does not exist"
   3. "[Onboarding] Loading from SecureStore"
   4. App should still work using SecureStore backup
   ```

4. **Verify Dummy Data**:
   ```
   1. After login, go to Records tab
   2. Should see 10 transactions with various amounts
   3. Go to Budgets tab
   4. Should see 5 budgets set up
   5. Go to Accounts tab
   6. Should see 4 accounts with balances
   ```

## 🐛 Known Issues & Fixes

### P1 Critical (Fixed)
- ✅ Budget calculation (spent: 0 hardcoded)
- ✅ Date range filtering
- ✅ Network error handling
- ✅ Memory leak prevention
- ✅ Onboarding state persistence (saved to database)
- ✅ Password unlock navigation race conditions
- ✅ Fresh account loading spinner

### P2 High Priority (Fixed)
- ✅ Passcode security (bcrypt + brute force protection)
- ✅ Transaction editing
- ✅ Cascade delete implementation
- ✅ Offline sync integration

## 🔧 Troubleshooting

### Onboarding Issues

**Problem**: User sees onboarding screens again after completing them
- **Cause**: Database migration not applied or `onboarding_step` column missing
- **Solution**: 
  1. Run the migration SQL from `database/user_profiles_schema.sql`
  2. Verify column exists: `SELECT onboarding_step FROM profiles LIMIT 1;`
  3. Clear app cache and restart app

**Problem**: Onboarding step not advancing to next screen
- **Cause**: `completeStep()` called but state not updating
- **Solution**:
  1. Check browser console for errors in `[Onboarding]` logs
  2. Verify `syncToDatabase()` is being called
  3. Check Supabase RLS policies allow user to update own profile
  4. Restart app and try again

**Problem**: "Could not find the table 'public.profiles'" error
- **Cause**: Profiles table missing or not exposed by Supabase
- **Solution**:
  1. Go to Supabase Dashboard → SQL Editor
  2. Run: `SELECT * FROM public.profiles LIMIT 1;`
  3. If error persists, profiles table needs to be created
  4. Check `lib/finance.sql` for profiles table creation

**Problem**: Onboarding state lost after logout/login
- **Cause**: 
  - Database column not added (falls back to SecureStore only)
  - RLS policies preventing database access
- **Solution**:
  1. Verify database migration was applied
  2. Check RLS policies: `SELECT * FROM pg_policies WHERE tablename='profiles';`
  3. Ensure authenticated users can SELECT/UPDATE on profiles table
  4. Test with logs: Check `[Onboarding] Loading from database` in console

### Performance Issues

**Problem**: App slow during onboarding
- **Cause**: Excessive database queries or large profile records
- **Solution**:
  1. Reduce frequency of `syncToDatabase()` calls
  2. Use debouncing for rapid step completions
  3. Check network latency to Supabase

**Problem**: Onboarding loading spinner stuck
- **Cause**: Database query timeout or missing `passwordStatusChecked` state
- **Solution**:
  1. Check `[AUTH-DEBUG]` logs for password status
  2. Verify `passwordStatusChecked` is set to `true`
  3. Restart app and check network connectivity

## 📦 Dependencies

### Core
- `react@19.1.0` - UI framework
- `react-native` - Mobile platform
- `expo~54.0.33` - Development platform
- `expo-router~6.0.23` - Navigation

### Backend & Storage
- `@supabase/supabase-js^2.81.1` - Backend client
- `@react-native-async-storage/async-storage^2.2.0` - Local storage
- `expo-secure-store~15.0.8` - Encrypted storage

### Security
- `bcryptjs^3.0.3` - Password hashing
- `crypto-js^4.2.0` - Cryptographic functions

### UI & UX
- `@react-navigation/*` - Navigation
- `@expo/vector-icons^15.0.3` - Icons
- `expo-linear-gradient~15.0.8` - Gradients
- `expo-haptics~15.0.8` - Haptic feedback

### Data Processing
- `papaparse^5.5.3` - CSV parsing

## 🚀 Deployment

### Android Build
```bash
npm run android:bundle
# Creates release APK in android/app/build/outputs/bundle/release/
```

### iOS Build
```bash
expo run:ios --configuration Release
```

## 📚 Documentation

All documentation has been consolidated into this README. For setup instructions, refer to the sections above.

## 🤝 Contributing

Guidelines for contributing:
1. Follow the existing code structure
2. Use TypeScript for type safety
3. Add tests for new features
4. Update this README for significant changes
5. Keep commits focused and descriptive

## 📄 License

[Add your license here]

## 👤 Author

[Your information]

---

**Last Updated**: March 28, 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
