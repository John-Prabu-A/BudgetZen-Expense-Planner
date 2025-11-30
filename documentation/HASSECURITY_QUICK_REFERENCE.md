# `hasSecurity` Flag - Quick Reference

**Implemented**: December 1, 2025  
**Status**: ✅ Complete and Verified

---

## What is `hasSecurity`?

A **master boolean flag** that indicates whether the app has **any active security protection**.

```
hasSecurity = true  → Password OR Passcode (or both) is enabled
hasSecurity = false → Neither password nor passcode is enabled
```

---

## The 5 Synchronization Points

### 1️⃣ When Password is Saved
```typescript
setPasswordHash(hash)
```
- **Result**: `hasSecurity` auto-set to `true`
- **Persistence**: Both state and storage updated

### 2️⃣ When Passcode is Saved
```typescript
setPasscodeHash(hash)
```
- **Result**: `hasSecurity` auto-set to `true`
- **Persistence**: Both state and storage updated

### 3️⃣ When Password is Cleared
```typescript
clearPasswordHash()
```
- **Result**: `hasSecurity = false` **ONLY** if `passcodeEnabled = false`
- **Behavior**: If passcode is still active, `hasSecurity` stays `true`

### 4️⃣ When Passcode is Cleared
```typescript
clearPasscodeHash()
```
- **Result**: `hasSecurity = false` **ONLY** if `passwordEnabled = false`
- **Behavior**: If password is still active, `hasSecurity` stays `true`

### 5️⃣ When Auth Method Changes
```typescript
setAuthMethod(method: 'password' | 'passcode' | 'both' | 'none')
```
- **Logic**: `hasSecurity = (method !== 'none')`
- **Effect**:
  - `'password'` → `hasSecurity = true`
  - `'passcode'` → `hasSecurity = true`
  - `'both'` → `hasSecurity = true`
  - `'none'` → `hasSecurity = false`

---

## Usage Examples

### Checking for Any Security
```typescript
const { hasSecurity } = usePreferences();

if (hasSecurity) {
  // User has at least one security method enabled
  showLockScreen();
} else {
  // No security enabled
  allowDirectAppAccess();
}
```

### Displaying Security Status
```typescript
<Text>
  Security: {hasSecurity ? 'Enabled' : 'Disabled'}
</Text>
```

### Conditional Security Setup
```typescript
if (!hasSecurity) {
  promptUserToSetupSecurity();
}
```

---

## State Transition Matrix

| Event | Before | After | hasSecurity |
|-------|--------|-------|------------|
| Enable password only | `password=F, passcode=F` | `password=T, passcode=F` | `true` ✓ |
| Enable passcode only | `password=F, passcode=F` | `password=F, passcode=T` | `true` ✓ |
| Enable both | `password=T, passcode=F` | `password=T, passcode=T` | `true` ✓ |
| Disable password (keep passcode) | `password=T, passcode=T` | `password=F, passcode=T` | `true` ✓ |
| Disable passcode (keep password) | `password=T, passcode=T` | `password=T, passcode=F` | `true` ✓ |
| Disable both | `password=T, passcode=T` | `password=F, passcode=F` | `false` ✓ |
| Disable password (passcode off) | `password=T, passcode=F` | `password=F, passcode=F` | `false` ✓ |

---

## Files Updated

✅ **context/Preferences.tsx**
- Added `hasSecurity` to type interface
- Added storage key and default value
- Added state declaration
- Added loading logic
- Updated 5 functions to manage the flag
- Exported in context value

✅ **app/preferences/index.tsx**
- Changed from `passcodeEnabled` to `hasSecurity`
- Security status now correctly shows combined state

---

## Key Benefits

✅ **Single Source of Truth** - One flag to check for any security  
✅ **Auto-Synchronized** - Never gets out of sync with auth state  
✅ **Intuitive Logic** - True means "protected", false means "unprotected"  
✅ **Fully Persistent** - Saved to secure storage and restored on app restart  
✅ **Backward Compatible** - Individual flags still available for specific checks  
✅ **Zero Breaking Changes** - Existing code continues to work  

---

## Typical Flow Example

```
App Starts
  → Load preferences from storage
  → hasSecurity is restored correctly

User Opens Settings
  → Sees "Security: Enabled" if hasSecurity = true
  → Sees "Security: Disabled" if hasSecurity = false

User Enables Password
  → setPasswordHash() called
  → hasSecurity auto-set to true ✓
  → "Security: Enabled" now displays

User Enables Passcode Too
  → setPasscodeHash() called
  → hasSecurity remains true ✓

User Disables Password
  → clearPasswordHash() called
  → Checks: passcodeEnabled = true
  → hasSecurity remains true ✓ (passcode still active)

User Disables Passcode
  → clearPasscodeHash() called
  → Checks: passwordEnabled = false
  → hasSecurity auto-set to false ✓
  → "Security: Disabled" now displays

App Closed and Reopened
  → All flags restored from storage
  → State is exactly as left it ✓
```

---

## Accessing in Components

```typescript
import { usePreferences } from '@/context/Preferences';

export function MyComponent() {
  const { hasSecurity, passcodeEnabled, passwordEnabled } = usePreferences();
  
  return (
    <>
      <Text>Any Security: {hasSecurity ? 'Yes' : 'No'}</Text>
      <Text>Password: {passwordEnabled ? 'On' : 'Off'}</Text>
      <Text>Passcode: {passcodeEnabled ? 'On' : 'Off'}</Text>
    </>
  );
}
```

---

## Storage

The `hasSecurity` flag is persisted with key:
```
Storage Key: 'pref_has_security'
Values: 'true' | 'false'
```

Persisted whenever:
- Password hash is set/cleared
- Passcode hash is set/cleared
- Auth method is changed

---

## Debugging

If `hasSecurity` seems incorrect:

1. **Check Individual Flags**:
   ```
   If hasSecurity = true:
     → Should have passwordEnabled = true OR passcodeEnabled = true
   
   If hasSecurity = false:
     → Should have passwordEnabled = false AND passcodeEnabled = false
   ```

2. **Check Auth Method**:
   ```
   If authMethod = 'none':
     → hasSecurity should be false
   
   If authMethod = 'password' | 'passcode' | 'both':
     → hasSecurity should be true
   ```

3. **Check Storage**:
   ```
   Restart app and verify flag persists correctly
   ```

---

## Summary

`hasSecurity` provides a **unified, always-synced indicator** of whether the app has any active security protection. It's automatically managed through five strategic synchronization points and is fully persistent across app sessions.

**Use it for**: General security checks  
**Use individual flags for**: Specific auth method handling
