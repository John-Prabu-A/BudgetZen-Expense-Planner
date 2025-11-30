# `hasSecurity` Flag - Visual Guide

**Implementation Status**: ✅ Complete  
**Date**: December 1, 2025

---

## What is `hasSecurity`?

```
┌─────────────────────────────────────────────┐
│   Does the app have ANY security enabled?   │
│                                             │
│  hasSecurity = true  → YES (protected)     │
│  hasSecurity = false → NO (unprotected)    │
└─────────────────────────────────────────────┘
```

---

## State Matrix

### All Possible States

| passwordEnabled | passcodeEnabled | authMethod | hasSecurity | Status |
|---|---|---|---|---|
| ❌ | ❌ | `'none'` | ❌ | No protection |
| ✅ | ❌ | `'password'` | ✅ | Password only |
| ❌ | ✅ | `'passcode'` | ✅ | Passcode only |
| ✅ | ✅ | `'both'` | ✅ | Both enabled |

---

## The 5 Sync Points

```
                    Preferences Context
                           │
           ┌───────────────┼───────────────┐
           │               │               │
      ┌────▼────┐     ┌────▼────┐     ┌───▼───┐
      │ Password │     │ Passcode │     │ Method │
      │ Management     │ Management     │ Switch
      └─┬──┬──┬─┘     └─┬──┬──┬─┘     └───┬───┘
        │  │  │         │  │  │           │
    ┌───┘  │  └─┐   ┌───┘  │  └─┐   ┌────┴─┐
    │      │    │   │      │    │   │      │
  Set    Clear  │  Set    Clear  │ Auth   │
  Hash   Hash   │  Hash   Hash   │Method  │
    │      │    │   │      │    │   │     │
    └──────┼────┴───┴──────┼────┴───┘     │
           │               │              │
           └───────────────┼──────────────┘
                           │
                    ╔══════▼══════╗
                    ║  hasSecurity  ║
                    ║   (Master)    ║
                    ╚══════════════╝
```

---

## Sync Point Details

### 1️⃣ setPasswordHash()
```
User Action: Save Password
     │
     ▼
┌──────────────────┐
│ setPasswordHash()│
└──────────┬───────┘
           │
     ┌─────┴──────┐
     │            │
  SET: true    SET: true
  passwordEnabled  hasSecurity
     │            │
     └─────┬──────┘
           │
        SAVE to Storage
           │
    Result: ✅ Protected
```

### 2️⃣ setPasscodeHash()
```
User Action: Save Passcode
     │
     ▼
┌──────────────────┐
│ setPasscodeHash()│
└──────────┬───────┘
           │
     ┌─────┴──────┐
     │            │
  SET: true    SET: true
  passcodeEnabled  hasSecurity
     │            │
     └─────┬──────┘
           │
        SAVE to Storage
           │
    Result: ✅ Protected
```

### 3️⃣ clearPasswordHash()
```
User Action: Disable Password
     │
     ▼
┌───────────────────┐
│ clearPasswordhash()│
└──────────┬────────┘
           │
    SET: false
    passwordEnabled
           │
      ┌────▼────┐
      │ Is      │
      │ passcode│ YES → KEEP hasSecurity = true
      │ enabled?│
      │    ?    │
      └────┼────┘
           │ NO
           ▼
      SET: false
      hasSecurity
           │
        SAVE to Storage
           │
    Result: ❌ Unprotected (if passcode also off)
           ✅ Protected (if passcode still on)
```

### 4️⃣ clearPasscodeHash()
```
User Action: Disable Passcode
     │
     ▼
┌────────────────────┐
│ clearPasscodeHash()│
└──────────┬─────────┘
           │
    SET: false
    passcodeEnabled
           │
      ┌────▼────┐
      │ Is      │
      │password │ YES → KEEP hasSecurity = true
      │ enabled?│
      │    ?    │
      └────┼────┘
           │ NO
           ▼
      SET: false
      hasSecurity
           │
        SAVE to Storage
           │
    Result: ❌ Unprotected (if password also off)
           ✅ Protected (if password still on)
```

### 5️⃣ setAuthMethod()
```
User Action: Change Auth Method
     │
     ▼
┌─────────────────┐
│ setAuthMethod() │
└────────┬────────┘
         │
    ┌────▼─────────────┐
    │ method = ?       │
    └────┬─────────────┘
         │
    ┌────┴──────┬──────┬──────┐
    │           │      │      │
'password'  'passcode' 'both' 'none'
    │           │      │      │
    ▼           ▼      ▼      ▼
  true        true    true   false
    │           │      │      │
    └───────────┴──────┴──────┘
              │
         SET: hasSecurity
              │
           SAVE to Storage
              │
         Result: Synced ✓
```

---

## Example Flow: User Journey

### Step 1: App Starts (No Security)
```
┌─────────────────────────────────┐
│ hasSecurity: false              │
│ passwordEnabled: false          │
│ passcodeEnabled: false          │
│ authMethod: 'none'              │
│                                 │
│ UI Display: "Security: Disabled"│
└─────────────────────────────────┘
```

### Step 2: User Enables Password
```
User taps "Enable Password" → Enters password → Saves

        setPasswordHash(hash)
                  │
            ┌─────┴──────┐
            │            │
         true          true
    passwordEnabled   hasSecurity
            │            │
            └─────┬──────┘
                  │
            SAVE to Storage
                  │
┌─────────────────────────────────┐
│ hasSecurity: true ✓             │
│ passwordEnabled: true           │
│ passcodeEnabled: false          │
│ authMethod: 'password'          │
│                                 │
│ UI Display: "Security: Enabled" │
└─────────────────────────────────┘
```

### Step 3: User Also Enables Passcode
```
User taps "Enable Passcode" → Enters passcode → Saves

        setPasscodeHash(hash)
                  │
            ┌─────┴──────┐
            │            │
         true          true
    passcodeEnabled   hasSecurity
            │            │ (already true)
            └─────┬──────┘
                  │
            SAVE to Storage
                  │
        setAuthMethod('both')
                  │
        hasSecurity = true ✓
                  │
            SAVE to Storage
                  │
┌─────────────────────────────────┐
│ hasSecurity: true ✓             │
│ passwordEnabled: true           │
│ passcodeEnabled: true           │
│ authMethod: 'both'              │
│                                 │
│ UI Display: "Security: Enabled" │
└─────────────────────────────────┘
```

### Step 4: User Disables Password
```
User taps "Disable Password"

     clearPasswordHash()
              │
         ┌────┴────┐
         │         │
      false        │
  passwordEnabled  │
         │         │
         │    Check: passcodeEnabled?
         │         │
         │         YES (remains true)
         │         │
         │   hasSecurity = true
         │   (STAYS ON - passcode still active)
         │         │
         └────┬────┘
              │
         SAVE to Storage
              │
     setAuthMethod('passcode')
              │
         hasSecurity = true ✓
              │
         SAVE to Storage
              │
┌─────────────────────────────────┐
│ hasSecurity: true ✓             │
│ passwordEnabled: false          │
│ passcodeEnabled: true           │
│ authMethod: 'passcode'          │
│                                 │
│ UI Display: "Security: Enabled" │
└─────────────────────────────────┘
```

### Step 5: User Disables Passcode
```
User taps "Disable Passcode"

     clearPasscodeHash()
              │
         ┌────┴────┐
         │         │
      false        │
  passcodeEnabled  │
         │         │
         │    Check: passwordEnabled?
         │         │
         │         NO
         │         │
         │   hasSecurity = false
         │   (AUTO-DISABLED - both now off) ✓
         │         │
         └────┬────┘
              │
         SAVE to Storage
              │
     setAuthMethod('none')
              │
         hasSecurity = false ✓
              │
         SAVE to Storage
              │
┌─────────────────────────────────┐
│ hasSecurity: false ✓            │
│ passwordEnabled: false          │
│ passcodeEnabled: false          │
│ authMethod: 'none'              │
│                                 │
│ UI Display: "Security: Disabled"│
└─────────────────────────────────┘
```

### Step 6: App Restart
```
App Starts → loadPreferences()
              │
         Load from Storage
              │
         ┌────┴─────────────┐
         │                  │
    hasSecurity: false   ✓ Restored
    passwordEnabled...
    passcodeEnabled...
    authMethod...
              │
         UI Renders
              │
┌─────────────────────────────────┐
│ hasSecurity: false ✓            │
│ (All state correctly restored)  │
│                                 │
│ UI Display: "Security: Disabled"│
└─────────────────────────────────┘
```

---

## Decision Logic Charts

### When Clearing a Method

```
clearPasswordHash()
        │
    ┌───▼────┐
    │         │
    N        Is passcodeEnabled?
    │         │
    Y        ┌┴─────────────┐
    │        │               │
    │       YES              NO
    │        │               │
    │   keep true        set false
    │   (passcode       (both off)
    │    still on)       │
    │        │           │
    └────┬──┴───────────┘
         │
    Result: hasSecurity synced ✓
```

```
clearPasscodeHash()
        │
    ┌───▼────┐
    │         │
    N        Is passwordEnabled?
    │         │
    Y        ┌┴─────────────┐
    │        │               │
    │       YES              NO
    │        │               │
    │   keep true        set false
    │   (password       (both off)
    │    still on)       │
    │        │           │
    └────┬──┴───────────┘
         │
    Result: hasSecurity synced ✓
```

### When Setting Methods

```
setAuthMethod(method)
        │
    ┌───┴────────────────────┐
    │                        │
Is method !== 'none'?
    │                        │
   YES                       NO
    │                        │
hasSecurity = true      hasSecurity = false
    │                        │
    └────────┬───────────────┘
             │
    Result: hasSecurity synced ✓
```

---

## UI Integration

### Security Status Display

```
┌─────────────────────────────┐
│ Preferences Screen          │
├─────────────────────────────┤
│                             │
│ Security Settings           │
│ ┌───────────────────────┐   │
│ │ Security             │   │
│ │ Status: [hasSecurity?]   │
│ │ "Enabled" (true)  or │   │
│ │ "Disabled" (false)  │   │
│ └───────────────────────┘   │
│                             │
│ Before: Used passcodeEnabled│
│ After:  Uses hasSecurity ✓  │
│                             │
└─────────────────────────────┘
```

---

## Storage Representation

```
SecureStore
│
├─ 'pref_has_security'     → 'true' or 'false'
├─ 'pref_password_enabled' → 'true' or 'false'
├─ 'pref_passcode_enabled' → 'true' or 'false'
├─ 'pref_auth_method'      → 'password'|'passcode'|'both'|'none'
├─ 'pref_password_hash'    → (hashed password)
├─ 'pref_passcode_hash'    → (hashed passcode)
│
└─ ... other preferences ...
```

---

## Benefits Visualization

```
┌──────────────┐
│ OLD WAY      │
├──────────────┤
│ Must check:  │
│              │
│ if (password │
│   OR passcode)
│              │
│ Verbose      │
│ Error-prone  │
│              │
└──────────────┘

            →→→

┌──────────────┐
│ NEW WAY      │
├──────────────┤
│ Simple:      │
│              │
│ if (hasSecurity)
│              │
│ Clear        │
│ Safe         │
│ Synced       │
│              │
└──────────────┘
```

---

## Debugging Guide

### Checking State Consistency

```
If hasSecurity = true:
  ├─ Should have passwordEnabled = true OR
  │  passcodeEnabled = true
  └─ authMethod should NOT be 'none'

If hasSecurity = false:
  ├─ Should have passwordEnabled = false AND
  │  passcodeEnabled = false
  └─ authMethod should be 'none'

If inconsistent:
  └─ Check storage in SecureStore
     └─ Verify all keys exist
        └─ Force reload from storage
```

---

## Summary

`hasSecurity` is a **unified security indicator** that:

✅ Automatically syncs with auth state  
✅ Only disables when BOTH methods are off  
✅ Fully persists across app restarts  
✅ Simplifies security checks throughout app  
✅ Always stays in sync with individual flags  

It's the **master flag** for checking if the app has any active security protection.
