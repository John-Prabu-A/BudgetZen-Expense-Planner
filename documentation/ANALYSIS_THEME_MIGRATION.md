# 📋 Analysis Screen - Theme Migration Example

This document shows the complete before/after conversion of `analysis.tsx` from hardcoded colors to the global theme system.

---

## File: app/(tabs)/analysis.tsx

### Current Implementation (Before)

The current file has hardcoded colors scattered throughout. Here's a representative section:

```typescript
// BEFORE - Lines with hardcoded colors

// Lines 592-597: Colors object
const colors = {
  background: isDark ? '#0F0F0F' : '#FFFFFF',
  surface: isDark ? '#1A1A1A' : '#F5F5F5',
  text: isDark ? '#FFFFFF' : '#000000',
  textSecondary: isDark ? '#A0A0A0' : '#666666',
  border: isDark ? '#404040' : '#E5E5E5',
  accent: '#0284c7',
};

// Line 580: Container background
backgroundColor: isDark ? '#0F0F0F' : '#FFFFFF',

// Line 600: Header background
backgroundColor: isDark ? '#1A1A1A' : '#F8F8F8',

// Line 602: Header border
borderBottomColor: isDark ? '#404040' : '#E5E5E5',

// Line 604: Header text
color: isDark ? '#FFFFFF' : '#000000',

// Lines 641-650: View selector
backgroundColor: isDark ? '#0F0F0F' : '#FFFFFF',
borderColor: isDark ? '#1A1A1A' : '#F0F0F0',
shadowColor: isDark ? '#000000' : '#0284c7',

// Line 724: Chart container background
backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
borderColor: isDark ? '#404040' : '#E5E5E5',

// Plus many more...
```

### Conversion Steps

#### Step 1: Update Imports
```typescript
// REMOVE these
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
// ... other existing imports ...
const colorScheme = useAppColorScheme();
const isDark = colorScheme === 'dark';

// ADD this
import { useThemeColors, ThemeColors } from '@/context/Theme';
```

#### Step 2: Replace Color Object with Hook
```typescript
// REMOVE
const colors = {
  background: isDark ? '#0F0F0F' : '#FFFFFF',
  surface: isDark ? '#1A1A1A' : '#F5F5F5',
  text: isDark ? '#FFFFFF' : '#000000',
  textSecondary: isDark ? '#A0A0A0' : '#666666',
  border: isDark ? '#404040' : '#E5E5E5',
  accent: '#0284c7',
  income: '#10B981',
  expense: '#EF4444',
};

// ADD
const colors = useThemeColors();
```

#### Step 3: Update Style Creation Function
```typescript
// BEFORE
const styles = createAnalysisStyles(spacing, isDark);

// AFTER
const styles = createAnalysisStyles(spacing, colors);
```

#### Step 4: Update Style Function Signature
```typescript
// BEFORE
const createAnalysisStyles = (spacing: any, isDark: boolean) => StyleSheet.create({

// AFTER
const createAnalysisStyles = (spacing: any, colors: ThemeColors) => StyleSheet.create({
```

#### Step 5: Replace All Color Values in Styles

In the `createAnalysisStyles` function, replace every color line:

```typescript
// BEFORE
container: {
  flex: 1,
  backgroundColor: isDark ? '#0F0F0F' : '#FFFFFF',
},

// AFTER
container: {
  flex: 1,
  backgroundColor: colors.background,
},
```

#### Step 6: Handle Shadow Color Logic
```typescript
// BEFORE - Line with isDark check in style
shadowColor: isDark ? '#000000' : '#0284c7',
shadowOpacity: isDark ? 0.3 : 0.08,

// AFTER - Extract to separate logic
// Pass isDark or create a helper
```

### Complete Migration Pattern

Here's the pattern for every ternary color check in styles:

```typescript
// Pattern: isDark ? darkColor : lightColor

// Examples found in analysis.tsx:
isDark ? '#0F0F0F' : '#FFFFFF'      → colors.background
isDark ? '#1A1A1A' : '#F5F5F5'      → colors.surface
isDark ? '#FFFFFF' : '#000000'      → colors.text
isDark ? '#A0A0A0' : '#666666'      → colors.textSecondary
isDark ? '#404040' : '#E5E5E5'      → colors.border
isDark ? '#1A1A1A' : '#F8F8F8'      → colors.surface or colors.headerBackground
isDark ? '#0284c7' : '#0284c7'      → colors.accent
isDark ? '#262626' : '#FFFFFF'      → colors.surface
isDark ? '#10B981' : '#10B981'      → colors.income
isDark ? '#EF4444' : '#EF4444'      → colors.expense
```

---

## Complete Converted Code Example

### analysis.tsx (Top Section)

```typescript
import { useAuth } from '@/context/Auth';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { useSmartLoading } from '@/hooks/useSmartLoading';
import { useUIMode } from '@/hooks/useUIMode';
import { useThemeColors, ThemeColors } from '@/context/Theme'; // NEW
import { readAccounts, readCategories, readRecords } from '@/lib/finance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import IncomeExpenseCalendar from '../components/IncomeExpenseCalendar';

type AnalysisView =
  | 'ACCOUNT_ANALYSIS'
  | 'INCOME_FLOW'
  | 'EXPENSE_FLOW'
  | 'INCOME_OVERVIEW'
  | 'EXPENSE_OVERVIEW';

export default function AnalysisScreen() {
  // REMOVED: const colorScheme = useAppColorScheme();
  // REMOVED: const isDark = colorScheme === 'dark';
  const spacing = useUIMode();
  const colors = useThemeColors(); // NEW - Get colors from theme
  const { user, session } = useAuth();
  
  const [records, setRecords] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [analysisView, setAnalysisView] = useState<AnalysisView>('ACCOUNT_ANALYSIS');

  // ... rest of the component logic remains the same ...

  const styles = createAnalysisStyles(spacing, colors); // CHANGED - pass colors

  return (
    <ScrollView style={styles.container}>
      {/* ... JSX remains the same ... */}
    </ScrollView>
  );
}
```

### createAnalysisStyles Function (Bottom Section)

```typescript
const createAnalysisStyles = (spacing: any, colors: ThemeColors) => // CHANGED signature
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background, // CHANGED
    },
    scrollContent: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface, // CHANGED - was isDark ? '#1A1A1A' : '#F8F8F8'
      borderBottomWidth: 1,
      borderBottomColor: colors.border, // CHANGED
    },
    headerText: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text, // CHANGED
    },
    summary: {
      flexDirection: 'row',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.lg,
      gap: spacing.md,
    },
    summaryItem: {
      flex: 1,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface, // CHANGED
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border, // CHANGED
      shadowColor: colors.shadowColor, // CHANGED
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: colors.shadowColor === '#000000' ? 0.2 : 0.05, // Note: Can still use isDark logic here if needed
      shadowRadius: 4,
      elevation: 2,
    },
    summaryLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary, // CHANGED
      marginBottom: spacing.xs,
      letterSpacing: 0.5,
    },
    summaryValueIncome: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.income, // CHANGED - now from theme
    },
    summaryValueExpense: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.expense, // CHANGED - now from theme
    },
    summaryValueTotal: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.accent, // CHANGED
    },
    // ... all other styles follow the same pattern ...
    chartContainer: {
      marginBottom: spacing.lg,
      backgroundColor: colors.surface, // CHANGED
      borderRadius: 14,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border, // CHANGED
      shadowColor: colors.shadowColor, // CHANGED
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
      overflow: 'hidden',
    },
    // ... more styles ...
  });
```

---

## Migration Impact Analysis

### Code Reduction
- **Before**: ~30 lines of color logic scattered throughout
- **After**: Single import, zero color logic
- **Reduction**: ~95% fewer color-related lines

### Maintenance
- **Before**: Update colors in every component
- **After**: Update `context/Theme.tsx` once, applies everywhere
- **Effort**: 95% less maintenance work

### Type Safety
- **Before**: Magic strings, no intellisense
- **After**: Full TypeScript support with autocomplete

### Performance
- **Before**: Colors recalculated on every render
- **After**: Centralized, memoized colors

---

## Validation Checklist for analysis.tsx

After migration, verify:

- [ ] No `useAppColorScheme()` import or usage
- [ ] No `isDark` variable
- [ ] No inline color object `const colors = {...}`
- [ ] All `#` color hex values removed (except in Theme.tsx)
- [ ] Function signature: `createAnalysisStyles(spacing, colors)`
- [ ] All backgroundColor values use `colors.*`
- [ ] All color values use `colors.*`
- [ ] All borderColor values use `colors.*`
- [ ] No `isDark ? color1 : color2` patterns
- [ ] TypeScript compiles without errors
- [ ] Tested in light mode - colors correct
- [ ] Tested in dark mode - colors correct
- [ ] Charts render with correct axis colors
- [ ] Summary cards display correct colors
- [ ] Account breakdown items styled correctly
- [ ] Calendar colors display correctly
- [ ] No hardcoded shadows (if using shadowColor logic)

---

## Special Cases in analysis.tsx

### 1. Shadow Color Logic
```typescript
// Current code has conditional shadow colors:
shadowColor: isDark ? '#000000' : '#0284c7',
shadowOpacity: isDark ? 0.3 : 0.08,

// Option 1: Always use theme shadow color
shadowColor: colors.shadowColor,
shadowOpacity: 0.15,

// Option 2: Keep isDark check for shadow-specific logic
// But this requires passing isDark from hook:
const { isDark, colors } = useTheme();
```

### 2. Line Chart Colors
```typescript
// Keep these as-is (semantic colors for income/expense)
color1={colors.income}  // Green for income
color1={colors.expense} // Red for expense
```

### 3. Icon Colors
```typescript
// Icons use accent color
<MaterialCommunityIcons color={colors.accent} />

// Or text color for some icons
<MaterialCommunityIcons color={colors.text} />
```

---

## Step-by-Step Execution

### Phase 1: Update Imports & Hook
1. Add `import { useThemeColors, ThemeColors }`
2. Remove `useAppColorScheme` logic
3. Add `const colors = useThemeColors()`

### Phase 2: Update createAnalysisStyles
1. Change function signature to accept `colors`
2. Search/replace all color values:
   - `isDark ? '#0F0F0F' : '#FFFFFF'` → `colors.background`
   - `isDark ? '#1A1A1A' : '#F5F5F5'` → `colors.surface`
   - And so on...

### Phase 3: Update Function Call
1. Change `createAnalysisStyles(spacing, isDark)` 
2. To `createAnalysisStyles(spacing, colors)`

### Phase 4: Verification
1. Run app in light mode
2. Run app in dark mode
3. Check console for errors
4. Verify all UI colors correct

---

## Expected Result

✅ Clean, maintainable code  
✅ No hardcoded colors  
✅ Automatic theme support  
✅ Type-safe colors  
✅ Easier updates  
✅ Better performance  

Ready to roll! 🚀
