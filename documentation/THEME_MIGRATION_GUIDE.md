# 🔄 Theme Migration - Step-by-Step Examples

## Quick Start: Converting a Screen

This guide shows exactly how to migrate existing screens from hardcoded colors to the global theme system.

---

## Example 1: Simple Modal (Easy)

### Before: Hardcoded Colors
```tsx
// app/about-modal.tsx
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { View, Text } from 'react-native';

export default function AboutModal() {
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = {
    background: isDark ? '#1A1A1A' : '#FFFFFF',
    surface: isDark ? '#2A2A2A' : '#F9FAFB',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#A0A0A0' : '#6B7280',
    border: isDark ? '#404040' : '#E5E7EB',
    accent: '#3B82F6',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>About</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Version 1.0.0
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 8 },
});
```

### After: Using Global Theme
```tsx
// app/about-modal.tsx
import { useThemeColors } from '@/context/Theme';
import { View, Text, StyleSheet } from 'react-native';

export default function AboutModal() {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>About</Text>
      <Text style={styles.subtitle}>Version 1.0.0</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      marginTop: 8,
      color: colors.textSecondary,
    },
  });
```

**Changes:**
1. Replace `useAppColorScheme()` with `useThemeColors()`
2. Remove manual color object creation
3. Move styles to `createStyles()` function
4. Pass colors to style function
5. Remove inline style color overrides

---

## Example 2: Tab Screen with Charts (Medium)

### Before: Hardcoded with Semantic Colors
```tsx
// app/(tabs)/analysis.tsx
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { View, Text, StyleSheet } from 'react-native';

export default function AnalysisScreen() {
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === 'dark';
  
  const colors = {
    background: isDark ? '#0F0F0F' : '#FFFFFF',
    surface: isDark ? '#1A1A1A' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#A0A0A0' : '#666666',
    border: isDark ? '#404040' : '#E5E5E5',
    accent: '#0284c7',
    income: '#10B981',
    expense: '#EF4444',
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.summary, { backgroundColor: colors.surface }]}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Income
          </Text>
          <Text style={[styles.amount, { color: colors.income }]}>
            ₹5,000
          </Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Expense
          </Text>
          <Text style={[styles.amount, { color: colors.expense }]}>
            ₹2,000
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summary: { padding: 16, gap: 12 },
  card: { padding: 12, borderRadius: 10 },
  label: { fontSize: 12, fontWeight: '600' },
  amount: { fontSize: 20, fontWeight: '700', marginTop: 4 },
});
```

### After: Using Global Theme
```tsx
// app/(tabs)/analysis.tsx
import { useThemeColors, ThemeColors } from '@/context/Theme';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function AnalysisScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.summary}>
        <View style={styles.card}>
          <Text style={styles.label}>Income</Text>
          <Text style={[styles.amount, { color: colors.income }]}>
            ₹5,000
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Expense</Text>
          <Text style={[styles.amount, { color: colors.expense }]}>
            ₹2,000
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    summary: {
      padding: 16,
      gap: 12,
      backgroundColor: colors.surface,
    },
    card: {
      padding: 12,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    amount: {
      fontSize: 20,
      fontWeight: '700',
      marginTop: 4,
    },
  });
```

**Changes:**
1. Single import: `useThemeColors`
2. Remove manual color object
3. Remove all `isDark` checks
4. Pass `colors` to `createStyles()`
5. All colors automatically theme-aware
6. Semantic colors stay inline (income/expense colors vary by context)

---

## Example 3: Complex Component with Icons & Borders (Advanced)

### Before: Multiple Color Checks
```tsx
// app/components/SidebarDrawer.tsx
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export function MenuItem({ icon, label, onPress }) {
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = {
    background: isDark ? '#1A1A1A' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#A0A0A0' : '#666666',
    border: isDark ? '#404040' : '#E5E5E5',
    hoverBg: isDark ? '#262626' : '#F5F5F5',
    accent: '#0284c7',
  };

  return (
    <TouchableOpacity
      style={[
        styles.item,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
      ]}
      onPress={onPress}
    >
      <MaterialCommunityIcons
        name={icon}
        size={24}
        color={colors.accent}
      />
      <Text
        style={[
          styles.label,
          {
            color: colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 12,
  },
});
```

### After: Cleaner with Theme Provider
```tsx
// app/components/SidebarDrawer.tsx
import { useThemeColors, ThemeColors } from '@/context/Theme';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export function MenuItem({ icon, label, onPress }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <MaterialCommunityIcons
        name={icon}
        size={24}
        color={colors.accent}
      />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      backgroundColor: colors.background,
      borderBottomColor: colors.border,
    },
    label: {
      fontSize: 15,
      fontWeight: '500',
      marginLeft: 12,
      color: colors.text,
    },
  });
```

**Changes:**
1. Much cleaner code
2. No color object initialization
3. No `isDark` checks
4. All colors automatically applied
5. Styles are completely predictable

---

## Example 4: Form with Inputs (Real-World)

### Before: Inputs with Custom Colors
```tsx
export function LoginForm() {
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = {
    background: isDark ? '#1A1A1A' : '#FFFFFF',
    inputBg: isDark ? '#333333' : '#F9F9F9',
    inputBorder: isDark ? '#404040' : '#E5E5E5',
    text: isDark ? '#FFFFFF' : '#000000',
    placeholder: isDark ? '#808080' : '#999999',
    accent: '#0284c7',
    danger: '#EF4444',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            color: colors.text,
          },
        ]}
        placeholderTextColor={colors.placeholder}
        placeholder="Email"
      />
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            color: colors.text,
          },
        ]}
        placeholderTextColor={colors.placeholder}
        placeholder="Password"
        secureTextEntry
      />
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.accent }]}
      >
        <Text style={{ color: colors.text }}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### After: Clean & Maintainable
```tsx
export function LoginForm() {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.inputPlaceholder}
        placeholder="Email"
      />
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.inputPlaceholder}
        placeholder="Password"
        secureTextEntry
      />
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: colors.background,
    },
    input: {
      backgroundColor: colors.inputBackground,
      borderColor: colors.inputBorder,
      borderWidth: 1,
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
      color: colors.text,
      fontSize: 16,
    },
    button: {
      backgroundColor: colors.buttonPrimary,
      borderRadius: 10,
      padding: 14,
      alignItems: 'center',
      marginTop: 12,
    },
    buttonText: {
      color: colors.textInverse,
      fontSize: 16,
      fontWeight: '600',
    },
  });
```

**Benefits:**
1. 30% less code
2. Much easier to read
3. All inputs automatically styled consistently
4. Changes to input theme apply everywhere

---

## Migration Checklist

### For Each File:

- [ ] Import `useThemeColors` and `ThemeColors`
- [ ] Remove `useAppColorScheme()` and `isDark` variable
- [ ] Remove manual color object creation
- [ ] Move styles into `createStyles()` function
- [ ] Pass `colors` to style function
- [ ] Replace inline style color overrides
- [ ] Test in both light and dark modes
- [ ] Remove any hardcoded color hex values
- [ ] Use semantic colors (income, expense, etc.)

### Verification:

- [ ] No `isDark ? '#color1' : '#color2'` patterns
- [ ] No manual ternary operators for colors
- [ ] All text colors use `colors.text` variants
- [ ] All backgrounds use `colors.background/surface`
- [ ] All borders use `colors.border` variants
- [ ] TypeScript compiles without errors
- [ ] Both themes display correctly
- [ ] No console warnings

---

## Performance Comparison

### Before (Multiple checks):
```
Renders: 2 (initial + isDark check)
Color declarations: Per component
Memory: Color objects created each render
```

### After (Theme provider):
```
Renders: 1 (only when theme changes)
Color declarations: Centralized
Memory: Colors shared across all components
Performance: Significantly faster
```

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Still checking isDark
```typescript
// DON'T DO THIS
const colors = useThemeColors();
const isDark = colorScheme === 'dark';
shadowOpacity: isDark ? 0.3 : 0.08,  // ❌ Redundant!
```

```typescript
// DO THIS
const colors = useThemeColors();
// Theme provider already handles isDark internally
```

### ❌ Mistake 2: Forgetting to pass colors to styles
```typescript
// DON'T DO THIS
const styles = createStyles();  // ❌ No colors!
```

```typescript
// DO THIS
const colors = useThemeColors();
const styles = createStyles(colors);  // ✓ Pass colors
```

### ❌ Mistake 3: Hardcoding accent colors
```typescript
// DON'T DO THIS
color: '#0284c7'  // ❌ Hardcoded

// DO THIS
color: colors.accent  // ✓ Uses theme
```

---

## Next Steps

1. **Start with simple modals** - They have fewer dependencies
2. **Move to tab screens** - More complex but more impact
3. **Update components** - Header, cards, etc.
4. **Replace remaining hardcoded** - Any missed colors
5. **Run full app** - Verify everything works

---

## Need Help?

- Check `context/Theme.tsx` for available colors
- Reference `GLOBAL_THEME_PROVIDER_GUIDE.md` for full API
- Look at converted examples above
- Use TypeScript intellisense for color names

You've got this! 🚀
