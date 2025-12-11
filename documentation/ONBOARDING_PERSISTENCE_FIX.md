# Onboarding Persistence After Logout - Implementation Guide

## Problem
Previously, when a user completed onboarding and then logged out, they would be shown the onboarding screens again when logging back in with a different account (or the same account).

## Solution
Modified the logout logic to **preserve onboarding state** across sessions. Once a user completes onboarding on this device, they will never see onboarding screens again - even after logout.

## Changes Made

### File: `context/Auth.tsx`
**Modified the `signOut()` function:**

**Before:**
```typescript
const signOut = async () => {
  try {
    // Clear onboarding step
    await SecureStore.deleteItemAsync('onboarding_step');
    // Sign out from Supabase
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};
```

**After:**
```typescript
const signOut = async () => {
  try {
    // NOTE: Do NOT clear onboarding state on logout
    // Once a user completes onboarding, they should not see it again
    // even if they log out and log back in (possibly with a different account)
    // Sign out from Supabase
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};
```

## How It Works

### Onboarding State Storage
- **Location:** `expo-secure-store` (encrypted local storage)
- **Key:** `'onboarding_step'`
- **Values:** `NOT_STARTED`, `CURRENCY`, `PRIVACY`, `REMINDERS`, `TUTORIAL`, `COMPLETED`

### Navigation Flow After Change

**New User (First App Install):**
```
App Launches
↓
Onboarding Step = NOT_STARTED (loaded from storage, not found → default)
↓
User sees: Currency → Privacy → Reminders → Tutorial
↓
User completes onboarding
↓
Onboarding Step = COMPLETED (saved to secure storage)
```

**Returning User - Same Account:**
```
App Launches
↓
Onboarding Step = COMPLETED (loaded from secure storage)
↓
User logs in
↓
User goes directly to app (no onboarding)
```

**Returning User - Different Account After Logout:**
```
App Launches
↓
Onboarding Step = COMPLETED (still in secure storage from previous session)
↓
User logs in with different account
↓
User goes directly to app (no onboarding - this is intentional!)
```

## Why This Design?

1. **Device-Level Setting**: Onboarding is treated as a device preference, not a user preference
2. **Better UX**: Users don't need to go through setup again after switching accounts
3. **Settings Preserved**: Early onboarding settings (currency, notification preferences, etc.) are preserved across all logins on the device
4. **Consistency**: Once configured, the device stays configured

## Resetting Onboarding (If Needed)

If you ever need to reset onboarding to test the flow, you can:

### Option 1: Use the `resetOnboarding()` hook
```typescript
import { useOnboarding } from '@/context/Onboarding';

const { resetOnboarding } = useOnboarding();

// In an effect or button handler:
await resetOnboarding(); // This resets to NOT_STARTED
```

### Option 2: Clear secure storage directly
```typescript
import * as SecureStore from 'expo-secure-store';

await SecureStore.deleteItemAsync('onboarding_step');
```

### Option 3: Via development/debug panel (if you add one)

## Testing

To verify the fix works:

1. **First Run:**
   - Install/run the app
   - Complete the onboarding flow (currency, privacy, reminders, tutorial)
   - Verify you reach the main app

2. **After Logout:**
   - Open the sidebar drawer
   - Tap "Logout"
   - Log back in
   - **Expected:** You should NOT see onboarding screens, go directly to main app

3. **After Complete App Restart:**
   - Complete onboarding and login
   - Close the app completely (kill process or restart device)
   - Reopen the app
   - Log back in
   - **Expected:** You should NOT see onboarding screens, go directly to main app

## Related Files

- `context/Auth.tsx` - Logout implementation
- `context/Onboarding.tsx` - Onboarding state management
- `app/_layout.tsx` - Navigation routing logic based on onboarding state
- `app/(onboarding)/` - Onboarding screens

## Notes

- Onboarding state is stored **per device**, not per user account
- To fully reset the app state (for testing), you would need to:
  1. Log out
  2. Reset onboarding via SecureStore
  3. Clear any other stored preferences/settings
- The password lock feature is separate and independent of onboarding state
