# `hasSecurity` Flag Implementation

**Status**: ✅ **COMPLETED**  
**Date**: December 1, 2025  
**Purpose**: Unified security indicator that represents whether any form of security (password or passcode) is enabled

---

## Overview

The `hasSecurity` flag is a **master boolean** in the Preferences context that indicates whether the app has **any active security protection** (either password, passcode, or both).

### Key Principle
- **`hasSecurity = true`** → At least one security method is enabled (password OR passcode OR both)
- **`hasSecurity = false`** → No security methods are enabled (neither password nor passcode)

---

## Architecture

### Context Type Interface (Preferences.tsx, Line 22)
```typescript
interface PreferencesContextType {
  // ...existing fields...
  
  // Security
  hasSecurity: boolean;              // ← NEW: Master security flag
  passcodeEnabled: boolean;          // Still tracked individually
  passwordEnabled: boolean;          // Still tracked individually
  authMethod: 'password' | 'passcode' | 'both' | 'none';  // Master selector
  
  // ...rest of fields...
}
```

### Storage Key (Preferences.tsx, Line 53)
```typescript
const STORAGE_KEYS = {
  // ...
  HAS_SECURITY: 'pref_has_security',
  // ...
};
```

### Default Value (Preferences.tsx, Line 72)
```typescript
const DEFAULT_VALUES = {
  // ...
  hasSecurity: false,
  // ...
};
```

### State Declaration (Preferences.tsx, Line 98)
```typescript
const [hasSecurity, setHasSecurityState] = useState<boolean>(DEFAULT_VALUES.hasSecurity);
```

---

## Synchronization Logic

### 1. **When Password Hash is Saved** (setPasswordHash, Lines 216-225)
```typescript
const setPasswordHash = async (hash: string) => {
  try {
    setPasswordHashState(hash);
    setPasswordEnabledState(true);
    setHasSecurityState(true);  // ← AUTO-SET: Enable hasSecurity
    await SecureStore.setItemAsync(STORAGE_KEYS.PASSWORD_HASH, hash);
    await SecureStore.setItemAsync(STORAGE_KEYS.PASSWORD_ENABLED, 'true');
    await SecureStore.setItemAsync(STORAGE_KEYS.HAS_SECURITY, 'true');  // ← PERSIST
  } catch (error) {
    console.error('Error setting password hash:', error);
  }
};
```

**Behavior**:
- When user saves a password → `passwordEnabled = true` AND `hasSecurity = true`
- Updates both state and storage immediately
- Ensures password is always accompanied by security flag

---

### 2. **When Passcode Hash is Saved** (setPasscodeHash, Lines 249-258)
```typescript
const setPasscodeHash = async (hash: string) => {
  try {
    setPasscodeHashState(hash);
    setPasscodeEnabledState(true);
    setHasSecurityState(true);  // ← AUTO-SET: Enable hasSecurity
    await SecureStore.setItemAsync(STORAGE_KEYS.PASSCODE_HASH, hash);
    await SecureStore.setItemAsync(STORAGE_KEYS.PASSCODE_ENABLED, 'true');
    await SecureStore.setItemAsync(STORAGE_KEYS.HAS_SECURITY, 'true');  // ← PERSIST
  } catch (error) {
    console.error('Error setting passcode hash:', error);
  }
};
```

**Behavior**:
- When user saves a passcode → `passcodeEnabled = true` AND `hasSecurity = true`
- Updates both state and storage immediately
- Ensures passcode is always accompanied by security flag

---

### 3. **When Password is Cleared** (clearPasswordHash, Lines 232-242)
```typescript
const clearPasswordHash = async () => {
  try {
    setPasswordHashState(null);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.PASSWORD_HASH);
    setPasswordEnabledState(false);
    await SecureStore.setItemAsync(STORAGE_KEYS.PASSWORD_ENABLED, 'false');
    
    // Update hasSecurity: false only if passcode is also disabled
    if (!passcodeEnabled) {
      setHasSecurityState(false);  // ← CONDITIONAL: Only if passcode also off
      await SecureStore.setItemAsync(STORAGE_KEYS.HAS_SECURITY, 'false');
    }
  } catch (error) {
    console.error('Error clearing password hash:', error);
  }
};
```

**Behavior**:
- When user removes password:
  - `passwordEnabled = false` (always)
  - `hasSecurity = false` (only if `passcodeEnabled` is also `false`)
  - If passcode is still enabled, `hasSecurity` remains `true`

**Example Scenarios**:
| Before | Action | After hasSecurity |
|--------|--------|-------------------|
| password=true, passcode=false | Clear password | `hasSecurity = false` ✓ |
| password=true, passcode=true | Clear password | `hasSecurity = true` ✓ (passcode still enabled) |

---

### 4. **When Passcode is Cleared** (clearPasscodeHash, Lines 260-271)
```typescript
const clearPasscodeHash = async () => {
  try {
    setPasscodeHashState(null);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.PASSCODE_HASH);
    setPasscodeEnabledState(false);
    await SecureStore.setItemAsync(STORAGE_KEYS.PASSCODE_ENABLED, 'false');
    
    // Update hasSecurity: false only if password is also disabled
    if (!passwordEnabled) {
      setHasSecurityState(false);  // ← CONDITIONAL: Only if password also off
      await SecureStore.setItemAsync(STORAGE_KEYS.HAS_SECURITY, 'false');
    }
  } catch (error) {
    console.error('Error clearing passcode hash:', error);
  }
};
```

**Behavior**:
- When user removes passcode:
  - `passcodeEnabled = false` (always)
  - `hasSecurity = false` (only if `passwordEnabled` is also `false`)
  - If password is still enabled, `hasSecurity` remains `true`

**Example Scenarios**:
| Before | Action | After hasSecurity |
|--------|--------|-------------------|
| password=false, passcode=true | Clear passcode | `hasSecurity = false` ✓ |
| password=true, passcode=true | Clear passcode | `hasSecurity = true` ✓ (password still enabled) |

---

### 5. **When Auth Method Changes** (setAuthMethod, Lines 281-312)
```typescript
const setAuthMethod = async (method: 'password' | 'passcode' | 'both' | 'none') => {
  try {
    setAuthMethodState(method);
    await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_METHOD, method);

    // Sync individual flags based on authMethod
    const isPasscodeActive = method === 'passcode' || method === 'both';
    const isPasswordActive = method === 'password' || method === 'both';

    if (isPasscodeActive !== passcodeEnabled) {
      setPasscodeEnabledState(isPasscodeActive);
      await SecureStore.setItemAsync(STORAGE_KEYS.PASSCODE_ENABLED, isPasscodeActive.toString());
    }

    if (isPasswordActive !== passwordEnabled) {
      setPasswordEnabledState(isPasswordActive);
      await SecureStore.setItemAsync(STORAGE_KEYS.PASSWORD_ENABLED, isPasswordActive.toString());
    }

    // Sync hasSecurity: true if any method is active, false if none
    const shouldHaveSecurity = method !== 'none';  // ← KEY LOGIC
    if (shouldHaveSecurity !== hasSecurity) {
      setHasSecurityState(shouldHaveSecurity);
      await SecureStore.setItemAsync(STORAGE_KEYS.HAS_SECURITY, shouldHaveSecurity.toString());
    }
  } catch (error) {
    console.error('Error setting auth method:', error);
  }
};
```

**Behavior**:
- Changes to `authMethod` automatically sync `hasSecurity`:

| authMethod | hasSecurity | Why |
|-----------|-----------|-----|
| `'password'` | `true` | Password enabled → has security |
| `'passcode'` | `true` | Passcode enabled → has security |
| `'both'` | `true` | Both enabled → has security |
| `'none'` | `false` | No methods enabled → no security |

---

## State Transition Examples

### Scenario 1: Enable Password from Nothing
```
Initial State:
  authMethod: 'none', passwordEnabled: false, passcodeEnabled: false, hasSecurity: false

User Action: Save password in security-modal.tsx
  1. setPasswordHash() called
     → passwordEnabled = true
     → hasSecurity = true  ← Auto-enabled
     → persisted to storage

Final State:
  authMethod: 'password', passwordEnabled: true, passcodeEnabled: false, hasSecurity: true ✓
```

### Scenario 2: Enable Passcode While Password Active
```
Initial State:
  authMethod: 'password', passwordEnabled: true, passcodeEnabled: false, hasSecurity: true

User Action: Save passcode in security-modal.tsx
  1. setPasscodeHash() called
     → passcodeEnabled = true
     → hasSecurity = true  ← Already true, remains true
  2. setAuthMethod('both') called
     → Updates both individual flags
     → hasSecurity = true  ← Already true, remains true

Final State:
  authMethod: 'both', passwordEnabled: true, passcodeEnabled: true, hasSecurity: true ✓
```

### Scenario 3: Disable Password While Passcode Active
```
Initial State:
  authMethod: 'both', passwordEnabled: true, passcodeEnabled: true, hasSecurity: true

User Action: Disable password in security-modal.tsx
  1. clearPasswordHash() called
     → passwordEnabled = false
     → Check: passcodeEnabled is true
     → hasSecurity = true  ← Remains true (passcode still active)
  2. setAuthMethod('passcode') called
     → Syncs flags with method
     → hasSecurity = true  ← Updated to false? No! Still passcode.

Final State:
  authMethod: 'passcode', passwordEnabled: false, passcodeEnabled: true, hasSecurity: true ✓
```

### Scenario 4: Disable Both Password and Passcode
```
Initial State:
  authMethod: 'both', passwordEnabled: true, passcodeEnabled: true, hasSecurity: true

User Action: Disable password AND passcode in security-modal.tsx
  1. clearPasswordHash() called
     → passwordEnabled = false
     → Check: passcodeEnabled is true
     → hasSecurity = true  ← Remains true (passcode still active)
  
  2. clearPasscodeHash() called
     → passcodeEnabled = false
     → Check: passwordEnabled is false
     → hasSecurity = false  ← AUTO-SET to false ✓
  
  3. setAuthMethod('none') called
     → hasSecurity = false  ← Confirmed false

Final State:
  authMethod: 'none', passwordEnabled: false, passcodeEnabled: false, hasSecurity: false ✓
```

---

## Usage in Components

### In Preferences Page (app/preferences/index.tsx)
```typescript
const { hasSecurity, remindDaily, ... } = usePreferences();

// Display security status
<PreferenceRow
  icon="lock"
  label="Security Settings"
  value={hasSecurity ? 'Enabled' : 'Disabled'}  // ← Uses hasSecurity
  onPress={() => router.push('/(modal)/security-modal')}
  isLast
/>
```

**Change**: 
- **Before**: Used `passcodeEnabled` (only passcode status)
- **After**: Uses `hasSecurity` (any security method status)
- **Benefit**: Correct display when only password is enabled

---

## Updated Files

### 1. **context/Preferences.tsx** ✅ UPDATED
- Added `hasSecurity: boolean` to `PreferencesContextType` interface
- Added `HAS_SECURITY: 'pref_has_security'` to `STORAGE_KEYS`
- Added `hasSecurity: false` to `DEFAULT_VALUES`
- Added state: `const [hasSecurity, setHasSecurityState] = useState()`
- Updated `loadPreferences()` to load `hasSecurity` from storage
- Updated `setPasswordHash()` to auto-enable `hasSecurity`
- Updated `clearPasswordHash()` to conditionally disable `hasSecurity`
- Updated `setPasscodeHash()` to auto-enable `hasSecurity`
- Updated `clearPasscodeHash()` to conditionally disable `hasSecurity`
- Updated `setAuthMethod()` to sync `hasSecurity` based on method
- Added `hasSecurity` to context value export

### 2. **app/preferences/index.tsx** ✅ UPDATED
- Changed import from `passcodeEnabled` to `hasSecurity`
- Updated security status display to use `hasSecurity` instead of `passcodeEnabled`
- Now correctly shows "Enabled" when only password is set

---

## Security Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Action in Security Modal             │
└────────────┬────────────────────────────────────────────────┘
             │
             ├─→ Enable Password
             │   └─→ setPasswordHash()
             │       ├─ passwordEnabled = true
             │       ├─ hasSecurity = true ✓
             │       └─ setAuthMethod('password')
             │
             ├─→ Enable Passcode
             │   └─→ setPasscodeHash()
             │       ├─ passcodeEnabled = true
             │       ├─ hasSecurity = true ✓
             │       └─ setAuthMethod('passcode')
             │
             ├─→ Enable Both
             │   └─→ After both set
             │       ├─ passwordEnabled = true
             │       ├─ passcodeEnabled = true
             │       ├─ hasSecurity = true ✓
             │       └─ setAuthMethod('both')
             │
             ├─→ Disable Password (Passcode Active)
             │   └─→ clearPasswordHash()
             │       ├─ passwordEnabled = false
             │       ├─ Check: passcodeEnabled = true
             │       ├─ hasSecurity = true (remains, passcode active) ✓
             │       └─ setAuthMethod('passcode')
             │
             └─→ Disable Both
                 ├─→ clearPasswordHash()
                 │   ├─ passwordEnabled = false
                 │   └─ hasSecurity = true (passcode still active)
                 │
                 └─→ clearPasscodeHash()
                     ├─ passcodeEnabled = false
                     ├─ Check: passwordEnabled = false
                     ├─ hasSecurity = false ✓ (AUTO-DISABLED)
                     └─ setAuthMethod('none')
```

---

## Testing Checklist

### ✅ Test Cases

**1. Enable Password**
- [ ] Save password in security modal
- [ ] Verify: `passwordEnabled = true`
- [ ] Verify: `hasSecurity = true`
- [ ] Verify: Security status shows "Enabled" in preferences
- [ ] Restart app and verify persistence

**2. Enable Passcode**
- [ ] Save passcode in security modal
- [ ] Verify: `passcodeEnabled = true`
- [ ] Verify: `hasSecurity = true`
- [ ] Verify: Security status shows "Enabled" in preferences
- [ ] Restart app and verify persistence

**3. Enable Both**
- [ ] Enable password first
- [ ] Then enable passcode
- [ ] Verify: Both flags = `true`
- [ ] Verify: `hasSecurity = true`
- [ ] Verify: Security status shows "Enabled"

**4. Disable Password (Keep Passcode)**
- [ ] Start with both enabled
- [ ] Disable password
- [ ] Verify: `passwordEnabled = false`, `passcodeEnabled = true`
- [ ] Verify: `hasSecurity = true` (not disabled)
- [ ] Verify: Security status still shows "Enabled"

**5. Disable Passcode (Keep Password)**
- [ ] Start with both enabled
- [ ] Disable passcode
- [ ] Verify: `passcodeEnabled = false`, `passwordEnabled = true`
- [ ] Verify: `hasSecurity = true` (not disabled)
- [ ] Verify: Security status still shows "Enabled"

**6. Disable Both**
- [ ] Start with both enabled
- [ ] Disable password first
- [ ] Verify: `hasSecurity = true` (passcode still active)
- [ ] Then disable passcode
- [ ] Verify: `hasSecurity = false` (auto-disabled)
- [ ] Verify: Security status shows "Disabled"
- [ ] Restart app and verify persistence

**7. App State Persistence**
- [ ] Set security (password or passcode)
- [ ] Close and reopen app
- [ ] Verify: All flags persist correctly
- [ ] Verify: `hasSecurity` value is correct

---

## Summary

The `hasSecurity` flag provides a **single source of truth** for whether the app has any active security protection. It automatically synchronizes with password and passcode state through five key functions:

1. **`setPasswordHash()`** → Auto-enables when password is saved
2. **`setPasscodeHash()`** → Auto-enables when passcode is saved
3. **`clearPasswordHash()`** → Auto-disables only if passcode also disabled
4. **`clearPasscodeHash()`** → Auto-disables only if password also disabled
5. **`setAuthMethod()`** → Syncs based on method value

**Result**: 
- ✅ No orphaned state possible
- ✅ UI always reflects accurate security status
- ✅ Single flag to check for any security protection
- ✅ Backward compatible with existing individual flags
- ✅ Fully persistent across app restarts
