# Preferences Screen Implementation Guide

## Overview

A complete Preferences screen has been implemented for BudgetZen, allowing users to personalize their experience with configurable options for appearance, security, notifications, and about information.

## Architecture

### Files Created

1. **`context/Preferences.tsx`** - Preferences Context Provider
   - Manages all preference state globally
   - Persists preferences to `expo-secure-store`
   - Provides hooks for accessing and updating preferences

2. **`app/preferences.tsx`** - Main Preferences Screen
   - Displays all configurable options
   - Modal-based selection for appearance options
   - Toggle switches for notifications and statistics

3. **`app/passcode-setup.tsx`** - Passcode Security Screen
   - Set, change, or disable passcode protection
   - 4-digit passcode requirement
   - Secure storage using `expo-secure-store`

4. **`app/_layout.tsx`** - Updated Root Layout
   - Wraps app with `PreferencesProvider`
   - Registers new screen routes

## Preferences Available

### Appearance
- **Theme**: Light, Dark, or System
- **UI Mode**: Compact, Standard, or Spacious
- **Currency Sign**: ₹, $, €, £, ¥
- **Currency Position**: Before or After amount
- **Decimal Places**: 0, 1, 2, or 3

### Security
- **Passcode Protection**: Set, change, or disable 4-digit passcode

### Notifications
- **Daily Reminder**: Toggle to remind user to log expenses

### About
- **Send Crash & Usage Stats**: Toggle to help improve app
- **App Version**: Display current app version
- **Email**: Show user's account email

## Usage Guide

### For Users

#### Accessing Preferences
```tsx
// Navigate to preferences from anywhere
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/preferences');
```

#### Setting Preferences
Users can:
1. Tap on any appearance option to open a modal with choices
2. Select their preference from the modal
3. Use toggle switches for notifications and statistics
4. Navigate to passcode setup to configure security

### For Developers

#### Using Preferences in Components

```tsx
import { usePreferences } from '@/context/Preferences';

export default function MyComponent() {
  const {
    theme,
    currencySign,
    currencyPosition,
    decimalPlaces,
    remindDaily,
  } = usePreferences();

  // Use preference values
  const formatCurrency = (amount: number) => {
    const formatted = amount.toFixed(decimalPlaces);
    return currencyPosition === 'before'
      ? `${currencySign}${formatted}`
      : `${formatted}${currencySign}`;
  };

  return (
    <Text>{formatCurrency(1000)}</Text>
  );
}
```

#### Updating Preferences

```tsx
import { usePreferences } from '@/context/Preferences';

export default function MyComponent() {
  const { setTheme, setRemindDaily } = usePreferences();

  const handleThemeChange = async (newTheme) => {
    await setTheme(newTheme);
    // UI updates automatically
  };

  return (
    <TouchableOpacity onPress={() => handleThemeChange('dark')}>
      <Text>Switch to Dark Theme</Text>
    </TouchableOpacity>
  );
}
```

## Data Persistence

All preferences are stored securely using `expo-secure-store`:

```
pref_theme → 'light' | 'dark' | 'system'
pref_ui_mode → 'compact' | 'standard' | 'spacious'
pref_currency_sign → '₹' | '$' | '€' | '£' | '¥'
pref_currency_position → 'before' | 'after'
pref_decimal_places → '0' | '1' | '2' | '3'
pref_passcode_enabled → 'true' | 'false'
pref_remind_daily → 'true' | 'false'
pref_send_crash_stats → 'true' | 'false'
app_passcode → Base64 encoded passcode hash
```

## Passcode Protection

### How It Works

1. **Set Passcode**
   - User navigates to Preferences → Passcode Protection
   - Taps "Set Passcode"
   - Enters 4+ digit code
   - Confirms code by entering it again
   - Code is stored securely (Base64 encoded - upgrade to bcrypt for production)

2. **Change Passcode**
   - User navigates to Preferences → Passcode Protection
   - Verifies current passcode
   - Taps "Change"
   - Enters new passcode
   - Confirms new passcode

3. **Disable Passcode**
   - User navigates to Preferences → Passcode Protection
   - Verifies current passcode
   - Taps "Disable"
   - Confirms disabling protection

### Security Notes

⚠️ **Current Implementation**: Uses Base64 encoding for demo purposes
- ✅ Suitable for development/testing
- ❌ Not suitable for production

**Production Upgrade**: Replace with bcrypt
```bash
npm install bcryptjs
```

```tsx
import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

// Hashing
const hashedPasscode = await bcrypt.hash(passcode, SALT_ROUNDS);
await SecureStore.setItemAsync(PASSCODE_KEY, hashedPasscode);

// Verifying
const isValid = await bcrypt.compare(inputPasscode, storedHash);
```

## Integration with Other Screens

### Records Screen
Use currency preferences when displaying amounts:

```tsx
import { usePreferences } from '@/context/Preferences';

export default function RecordsScreen() {
  const { currencySign, currencyPosition, decimalPlaces } = usePreferences();

  const formatAmount = (amount: number) => {
    const formatted = amount.toFixed(decimalPlaces);
    return currencyPosition === 'before'
      ? `${currencySign}${formatted}`
      : `${formatted}${currencySign}`;
  };

  return (
    <Text>₹{record.amount.toLocaleString()}</Text>
    // becomes: <Text>{formatAmount(record.amount)}</Text>
  );
}
```

### Analysis Screen
Apply UI mode for spacing:

```tsx
import { usePreferences } from '@/context/Preferences';

export default function AnalysisScreen() {
  const { uiMode } = usePreferences();

  const spacing = {
    compact: 8,
    standard: 16,
    spacious: 24,
  };

  return (
    <View style={{ padding: spacing[uiMode] }}>
      {/* Content */}
    </View>
  );
}
```

## Styling

All preference-related screens use dynamic theme colors:

```tsx
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

## Testing Preferences

### Manual Testing Checklist

- [ ] Navigate to Preferences screen
- [ ] Change theme and verify app updates
- [ ] Change UI mode and verify spacing
- [ ] Change currency options and verify display
- [ ] Set passcode and verify it's saved
- [ ] Close and reopen app, verify passcode prompt appears
- [ ] Change passcode and verify it works
- [ ] Disable passcode and verify prompt is gone
- [ ] Toggle daily reminder notification
- [ ] Toggle crash statistics sending

### Testing Data Persistence

```tsx
// Check stored values
import * as SecureStore from 'expo-secure-store';

const theme = await SecureStore.getItemAsync('pref_theme');
console.log('Stored theme:', theme);

// Clear all preferences (for testing)
await SecureStore.deleteItemAsync('pref_theme');
await SecureStore.deleteItemAsync('pref_ui_mode');
// ... etc
```

## Component Reference

### usePreferences Hook

```typescript
interface PreferencesContextType {
  // Appearance
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: Theme) => Promise<void>;
  
  uiMode: 'compact' | 'standard' | 'spacious';
  setUIMode: (mode: UIMode) => Promise<void>;
  
  currencySign: '₹' | '$' | '€' | '£' | '¥';
  setCurrencySign: (sign: CurrencySign) => Promise<void>;
  
  currencyPosition: 'before' | 'after';
  setCurrencyPosition: (position: CurrencyPosition) => Promise<void>;
  
  decimalPlaces: 0 | 1 | 2 | 3;
  setDecimalPlaces: (places: DecimalPlaces) => Promise<void>;

  // Security
  passcodeEnabled: boolean;
  setPasscodeEnabled: (enabled: boolean) => Promise<void>;

  // Notifications
  remindDaily: boolean;
  setRemindDaily: (remind: boolean) => Promise<void>;

  // About
  sendCrashStats: boolean;
  setSendCrashStats: (send: boolean) => Promise<void>;
  appVersion: string;

  // State
  loading: boolean;
}
```

## Future Enhancements

1. **Biometric Authentication**
   - Add fingerprint/face recognition using `expo-local-authentication`
   - Option to use biometric instead of passcode

2. **Export/Import Preferences**
   - Allow users to backup their preferences
   - Restore preferences on new device

3. **Theme Customization**
   - Let users choose custom accent colors
   - Custom light/dark color schemes

4. **Advanced Notifications**
   - Set custom reminder times
   - Choose reminder frequency (daily/weekly/etc)
   - Different reminders for different categories

5. **Passcode Complexity**
   - Options for 4-digit, 6-digit, or alphanumeric
   - Biometric fallback options

6. **Analytics Integration**
   - Actually send crash statistics when enabled
   - Track feature usage for improvements

## Troubleshooting

### Preferences Not Persisting
- Check that `expo-secure-store` is properly installed
- Verify `PreferencesProvider` is wrapping the app in `_layout.tsx`
- Check console for errors in `loadPreferences()`

### Modal Not Appearing
- Ensure modal state is being set correctly
- Check that `activeModal` state matches modal's visible prop
- Verify `onClose` callback is properly bound

### Passcode Not Working
- Verify `expo-secure-store` is initialized
- Check Base64 encoding/decoding is symmetric
- Ensure passcode input is getting correct value

## Migration Notes

When upgrading from previous versions:
- Existing users will get default preferences
- No data loss for other app data
- Passcode is optional - only enabled if user sets it

