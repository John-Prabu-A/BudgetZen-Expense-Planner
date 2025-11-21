# 🎯 Preferences Screen - Quick Reference Card

## 📦 What's New

| Component | File | Purpose |
|-----------|------|---------|
| PreferencesContext | `context/Preferences.tsx` | Global state for all preferences |
| Preferences Screen | `app/preferences.tsx` | Main preferences UI |
| Passcode Setup | `app/passcode-setup.tsx` | Manage app passcode |
| Hook | `usePreferences()` | Access preferences anywhere |

## 🎨 Screen Sections

```
┌─────────────────────────────────┐
│  Preferences                    │
│  Personalize your experience    │
└─────────────────────────────────┘

┌─── APPEARANCE ──────────────────┐
│ 🎨 Theme         → System       │
│ 📋 UI Mode       → Standard     │
│ 💱 Currency Sign → ₹            │
│ ↔️ Currency Pos  → Before       │
│ 🔢 Decimal Places→ 2            │
└─────────────────────────────────┘

┌─── SECURITY ────────────────────┐
│ 🔒 Passcode Protection → Setup  │
└─────────────────────────────────┘

┌─── NOTIFICATIONS ───────────────┐
│ 🔔 Daily Reminder ←→ (toggle)   │
└─────────────────────────────────┘

┌─── ABOUT ──────────────────────┐
│ 🐛 Send Crash Stats ←→ (toggle)│
│ ℹ️  App Version  → 1.0.0        │
└─────────────────────────────────┘

┌─── ACCOUNT ────────────────────┐
│ 📧 Email → user@example.com    │
└─────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Import and Use
```tsx
import { usePreferences } from '@/context/Preferences';

export default function MyComponent() {
  const { currencySign, theme } = usePreferences();
  // Use preferences...
}
```

### 2. Navigate to Preferences
```tsx
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/preferences');
```

### 3. Update Preference
```tsx
import { usePreferences } from '@/context/Preferences';

export default function MyComponent() {
  const { setTheme } = usePreferences();
  
  const handleChangeTheme = async (newTheme) => {
    await setTheme(newTheme);
    // Component automatically updates
  };
}
```

## 📝 All Available Preferences

### Appearance
```
theme: 'light' | 'dark' | 'system'
uiMode: 'compact' | 'standard' | 'spacious'
currencySign: '₹' | '$' | '€' | '£' | '¥'
currencyPosition: 'before' | 'after'
decimalPlaces: 0 | 1 | 2 | 3
```

### Security
```
passcodeEnabled: boolean
```

### Notifications
```
remindDaily: boolean
```

### About
```
sendCrashStats: boolean
appVersion: string (read-only)
```

## 🔄 Common Use Cases

### Format Currency with User Preferences
```tsx
const { currencySign, currencyPosition, decimalPlaces } = usePreferences();

const formatAmount = (amount: number) => {
  const formatted = amount.toFixed(decimalPlaces);
  return currencyPosition === 'before'
    ? `${currencySign}${formatted}`
    : `${formatted}${currencySign}`;
};

// Usage: formatAmount(1000) → "₹1000.00"
```

### Apply UI Spacing
```tsx
const { uiMode } = usePreferences();
const spacing = { compact: 8, standard: 16, spacious: 24 }[uiMode];

<View style={{ padding: spacing }}>Content</View>
```

### Check Feature Flags
```tsx
const { remindDaily, sendCrashStats } = usePreferences();

if (remindDaily) {
  scheduleNotification();
}

if (sendCrashStats) {
  logAnalytics();
}
```

### Get Current Theme
```tsx
const { theme } = usePreferences();

const isDark = theme === 'dark' || 
  (theme === 'system' && colorScheme === 'dark');

const colors = isDark ? darkTheme : lightTheme;
```

## 🛠️ Update Preferences

All setters are async and accept a single value:

```tsx
const {
  setTheme,
  setUIMode,
  setCurrencySign,
  setCurrencyPosition,
  setDecimalPlaces,
  setPasscodeEnabled,
  setRemindDaily,
  setSendCrashStats,
} = usePreferences();

// Usage
await setTheme('dark');
await setCurrencySign('$');
await setRemindDaily(false);
```

## 📍 Screen Navigation

### From Any Screen
```tsx
router.push('/preferences');
```

### To Passcode Setup
```tsx
router.push('/passcode-setup');
// Or automatically by tapping Passcode Protection in preferences
```

## 🎨 Theme Colors Used

```typescript
const colors = {
  background: isDark ? '#1A1A1A' : '#FFFFFF',
  surface: isDark ? '#262626' : '#F5F5F5',
  text: isDark ? '#FFFFFF' : '#000000',
  textSecondary: isDark ? '#A0A0A0' : '#666666',
  border: isDark ? '#404040' : '#E5E5E5',
  accent: '#0284c7',
  success: '#10B981',
  danger: '#EF4444',
};
```

## 🔐 Passcode Flow

### Setting Passcode
```
Options Screen
    ↓
[Set Passcode Button]
    ↓
Enter Passcode (4+ digits)
    ↓
Confirm Passcode
    ↓
Save & Enable
    ↓
Success! Passcode enabled
```

### Changing Passcode
```
Preferences → Passcode Protection
    ↓
Verify Current Passcode
    ↓
[Change Button]
    ↓
Enter New Passcode
    ↓
Confirm New Passcode
    ↓
Success! Passcode updated
```

### Disabling Passcode
```
Preferences → Passcode Protection
    ↓
Verify Current Passcode
    ↓
[Disable Button]
    ↓
Confirm Disable
    ↓
Success! Passcode removed
```

## 💾 Storage Details

All data stored in `expo-secure-store`:
- **Encrypted** at rest
- **Survives** app reinstall (no, it's cleared)
- **Survives** app updates (yes)
- **Device-specific** (doesn't sync to other devices)

## 🧪 Testing Preferences

### Manual Testing
```tsx
// In any component
const { currencySign } = usePreferences();
console.log('Current currency:', currencySign);

// Change and verify
await setCurrencySign('$');
// App re-renders automatically
```

### Debug Storage
```tsx
import * as SecureStore from 'expo-secure-store';

// Check stored value
const theme = await SecureStore.getItemAsync('pref_theme');
console.log('Stored theme:', theme);

// Clear for testing
await SecureStore.deleteItemAsync('pref_theme');
```

## ⚡ Performance Notes

- Preferences loaded once on app start
- No re-loads from storage on each access
- Updates are instant locally
- Changes persist in background
- Minimal re-renders (only affected components)

## 🐛 Debugging

### Enable Console Logging
Edit `context/Preferences.tsx`:
```tsx
const loadPreferences = async () => {
  console.log('Loading preferences...');
  try {
    // ...
    console.log('Preferences loaded:', {
      theme,
      uiMode,
      // ... etc
    });
  } catch (error) {
    console.error('Error loading preferences:', error);
  }
};
```

### Check Provider Wrapping
Ensure `_layout.tsx` has:
```tsx
<AuthProvider>
  <PreferencesProvider>
    <InitialLayout />
  </PreferencesProvider>
</AuthProvider>
```

## 📚 Documentation Files

1. **PREFERENCES_IMPLEMENTATION.md** - Full feature overview
2. **PREFERENCES_GUIDE.md** - Detailed technical guide
3. **PREFERENCES_INTEGRATION.md** - Quick integration patterns
4. **QUICK_REFERENCE.md** - This file!

## 🎁 Bonus Features

- ✅ Full TypeScript support
- ✅ Dark/Light mode support
- ✅ Persistent storage
- ✅ Type-safe preferences
- ✅ Async operations
- ✅ Error handling
- ✅ Loading states
- ✅ Beautiful UI

## 🚀 Status: PRODUCTION READY ✅

All files compiled without errors and ready to use!

