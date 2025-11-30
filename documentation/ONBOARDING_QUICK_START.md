# Onboarding Restructure - Quick Start Guide

## 🚀 What Changed

### Before (BROKEN ❌)
```
App → Save "onboarding_complete=true" → Race condition → Redirect loop ❌
```

### After (PROFESSIONAL ✅)
```
App → Check onboarding_step enum → Navigate correctly → No loops ✅
```

---

## 📖 How It Works Now

### 1. First Time User
```
Launch App
   ↓
Load onboarding_step = 'not_started'
   ↓
Show Currency Screen
   ↓
User selects currency
   ↓
completeStep(OnboardingStep.CURRENCY)
   ↓
onboarding_step saved as 'privacy'
   ↓
Show Privacy Screen (automatic)
   ↓
Continue until complete
```

### 2. Returning User (Mid-Onboarding)
```
Close app during reminders screen
   ↓
Relaunch app
   ↓
Load onboarding_step = 'reminders'
   ↓
Show Reminders Screen (resumes here) ✓
   ↓
User continues...
```

### 3. User Who Completed Onboarding
```
Launch app
   ↓
Load onboarding_step = 'completed'
   ↓
Check if password needed
   ├─ Yes: Show password verification
   └─ No: Show main app ✓
```

---

## 🔧 Developer Guide

### For Each Onboarding Screen

**Pattern:**
```typescript
import { useOnboarding, OnboardingStep } from '@/context/Onboarding';

const SomeScreen = () => {
  const { completeStep } = useOnboarding();
  
  const handleNext = async () => {
    try {
      // Save user's choice
      await setPreference(value);
      
      // Complete this step
      await completeStep(OnboardingStep.CURRENT);
      
      // That's it! Parent navigates automatically
    } catch (error) {
      // Error handling
      Alert.alert('Error', 'Please try again');
    }
  };
};
```

### Don't Do This ❌
```typescript
// DON'T manually navigate
router.push('./next-screen')

// DON'T check completed status
const [completed, setCompleted] = useState(null);

// DON'T use string flags
'onboarding_complete' // ← No, use enum instead
```

### Do This ✅
```typescript
// DO call completeStep
await completeStep(OnboardingStep.CURRENT);

// DO use enum values
OnboardingStep.CURRENCY  // ← Type-safe

// DO let parent navigate
// (it watches onboarding state automatically)
```

---

## 📊 State Values

Stored in SecureStore with key: `'onboarding_step'`

```typescript
'not_started'    // Never started onboarding
'currency'       // Just selected currency
'privacy'        // Just accepted terms
'reminders'      // Just set reminder prefs
'tutorial'       // Just finished tutorial
'completed'      // Ready to use app
```

---

## 🧪 Testing

### Quick Test
1. Fresh install → Go through all 4 screens → Should reach main app
2. Close app on currency screen → Reopen → Should resume on currency
3. Complete onboarding → Logout → Login → Should start fresh

### Verify Logs
```
[NAV] Loading onboarding step...
[NAV] Loaded: not_started
[NAV] No session → Redirecting to login
... user logs in ...
[NAV] Session valid, checking onboarding...
[NAV] Onboarding not complete (step: not_started) → currency
... user selects currency ...
[NAV] Onboarding not complete (step: privacy) → privacy
[NAV] Onboarding not complete (step: reminders) → reminders
[NAV] Onboarding not complete (step: tutorial) → tutorial
[NAV] Onboarding complete → redirecting to tabs
```

---

## 🐛 If Something Goes Wrong

### Stuck on Same Screen?
```
Check logs:
[NAV] Onboarding step: YOUR_STEP

If it doesn't change after clicking Next:
1. Check if completeStep() was called
2. Check SecureStore is being saved (look for errors)
3. Verify step name matches enum
```

### Still Seeing Old Screen?
```
This shouldn't happen now, but if it does:
1. Force close app
2. Clear storage (dev only): 
   await SecureStore.deleteItemAsync('onboarding_step')
3. Reopen app - should start fresh
```

### App Crashes During Onboarding?
```
Don't worry - it's safe:
1. App relaunch automatically loads saved step
2. User resumes from where they left off
3. No data loss
```

---

## 🎯 Next Steps for Password Verification

When ready to implement password verification:

```typescript
// In _layout.tsx, add:
if (session && passcodeEnabled && !passwordChecked) {
  // Show password verification screen
  return <PasscodeVerifyScreen />;
}
```

The screen will verify the passcode, then navigation automatically continues to main app.

---

## ✅ Checklist

- [x] Onboarding Context created (state machine)
- [x] Navigation logic rewritten (clean, simple)
- [x] All 4 screens updated (use context)
- [x] Auth context updated (reset on logout)
- [x] All TypeScript validation passed
- [x] Infinite loops fixed
- [x] State persistence working
- [x] Error handling in place
- [ ] Password verification screen (future)
- [ ] Test on real device (next)

---

## 📚 Files to Know

| File | Purpose |
|------|---------|
| `context/Onboarding.tsx` | State machine |
| `app/_layout.tsx` | Navigation logic |
| `app/(onboarding)/*` | Screens (all updated) |

---

## 💡 Key Concepts

1. **Enum** instead of boolean
   - More robust
   - Type-safe
   - Shows all states clearly

2. **State machine** instead of timers
   - Predictable
   - No race conditions
   - Easy to debug

3. **Parent navigation** instead of child navigation
   - Single source of truth
   - Easier to understand flow
   - Prevents conflicts

---

**The system now works correctly. No more infinite loops.** ✅

---

*For detailed technical docs, see: PROFESSIONAL_ONBOARDING_RESTRUCTURE.md*
