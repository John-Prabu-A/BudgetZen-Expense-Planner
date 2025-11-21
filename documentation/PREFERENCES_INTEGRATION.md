# Preferences Screen - Quick Integration Guide

## How to Add Preferences Button to Any Screen Header

### Option 1: Using Stack.Screen Options (Recommended)

In any screen file, use the `useLayoutEffect` hook to set header right button:

```tsx
import { useLayoutEffect } from 'react';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

export default function MyScreen() {
  const router = useRouter();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push('/preferences')}
          style={{ marginRight: 16 }}
        >
          <MaterialCommunityIcons name="cog" size={24} color="#0284c7" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Screen content...
}
```

### Option 2: Using Tab Navigator

Update `app/(tabs)/_layout.tsx` to add settings tab:

```tsx
<Tabs.Screen
  name="preferences"
  options={{
    title: 'Settings',
    tabBarIcon: ({ color }) => (
      <MaterialCommunityIcons name="cog" size={24} color={color} />
    ),
  }}
/>
```

## Current Setup Status

✅ **Completed**

- [x] PreferencesContext created with all preference types
- [x] Preferences persisted to secure storage
- [x] Main Preferences screen with modal-based selection
- [x] Passcode setup/management screen
- [x] PreferencesProvider integrated into app layout
- [x] Screen routes registered

✅ **Ready to Use**

```tsx
// Import and use in any component
import { usePreferences } from '@/context/Preferences';
import { useRouter } from 'expo-router';

export default function MyComponent() {
  const router = useRouter();
  const { currencySign, theme } = usePreferences();

  return (
    <>
      <Text>Currency: {currencySign}</Text>
      <TouchableOpacity onPress={() => router.push('/preferences')}>
        <Text>Open Preferences</Text>
      </TouchableOpacity>
    </>
  );
}
```

## Screen Navigation

### From Tabs
Add preferences as a new tab in `app/(tabs)/_layout.tsx`

### From Header Button
Add button to any tab screen header pointing to `/preferences`

### From Settings Menu
Create a settings menu and include preferences link

## Preference Types Reference

```typescript
// Appearance
type Theme = 'light' | 'dark' | 'system';
type UIMode = 'compact' | 'standard' | 'spacious';
type CurrencySign = '₹' | '$' | '€' | '£' | '¥';
type CurrencyPosition = 'before' | 'after';
type DecimalPlaces = 0 | 1 | 2 | 3;

// Security
type PasscodeEnabled = boolean;

// Notifications
type RemindDaily = boolean;

// About
type SendCrashStats = boolean;
```

## Using Preferences in Your Code

### Formatting Currency

```tsx
import { usePreferences } from '@/context/Preferences';

export default function TransactionList() {
  const { currencySign, currencyPosition, decimalPlaces } = usePreferences();

  const formatAmount = (amount: number) => {
    const formatted = amount.toFixed(decimalPlaces);
    return currencyPosition === 'before'
      ? `${currencySign}${formatted}`
      : `${formatted}${currencySign}`;
  };

  return (
    // Use formatAmount(amount) instead of hardcoded ₹
  );
}
```

### Applying UI Spacing

```tsx
import { usePreferences } from '@/context/Preferences';

export default function MyScreen() {
  const { uiMode } = usePreferences();

  const spacing = {
    compact: 8,
    standard: 16,
    spacious: 24,
  };

  return (
    <View style={{ padding: spacing[uiMode] }}>
      {/* Content automatically adjusts spacing */}
    </View>
  );
}
```

### Checking Notification Settings

```tsx
import { usePreferences } from '@/context/Preferences';

export default function NotificationManager() {
  const { remindDaily } = usePreferences();

  if (remindDaily) {
    // Schedule daily reminder notification
  }
}
```

## File Locations

```
context/
├── Auth.tsx
├── Preferences.tsx          ← NEW

app/
├── _layout.tsx              ← UPDATED (added PreferencesProvider)
├── preferences.tsx          ← NEW (Main preferences screen)
├── passcode-setup.tsx       ← NEW (Passcode management)
└── (tabs)/
    ├── _layout.tsx
    ├── index.tsx            ← Records page (where you can add header button)
    ├── analysis.tsx
    ├── accounts.tsx
    ├── budgets.tsx
    └── categories.tsx
```

## Next Steps

1. **Navigate to Preferences**
   ```
   From any screen: router.push('/preferences')
   ```

2. **Add Header Button to Main Screen**
   - Update Records screen to show settings icon
   - Or add Settings tab to tab navigator

3. **Use Preferences in Components**
   - Update Records screen to use currencySign/position
   - Update Analysis to use decimalPlaces
   - Apply UIMode spacing throughout app

4. **Test Passcode**
   - Set passcode in preferences
   - Verify it persists
   - Implement lock screen for app launch

## Security Notes

### Current (Development)
- Passcode stored with Base64 encoding
- ✅ Good for testing
- ❌ Not secure for production

### Production Ready
```bash
npm install bcryptjs
```

Then use bcrypt for hashing instead of Base64.

## Troubleshooting

**Q: Preferences not saving?**
A: Ensure PreferencesProvider wraps your app in `_layout.tsx`

**Q: Modal not appearing?**
A: Check that usePreferences hook is called inside PreferencesProvider

**Q: Passcode not working?**
A: Verify expo-secure-store is installed and working

**Q: Currency symbol not showing?**
A: Make sure you're using the usePreferences hook and calling formatAmount()

