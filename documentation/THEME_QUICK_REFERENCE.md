# 🎨 Global Theme System - Quick Reference Card

## One-Page Guide for Developers

---

## Installation & Setup

### ✅ Already Done
- Theme context created: `context/Theme.tsx`
- ThemeProvider integrated: `app/_layout.tsx`
- Full documentation provided
- Ready to use immediately!

---

## Basic Usage (3 Lines)

```typescript
import { useThemeColors } from '@/context/Theme';

export function MyComponent() {
  const colors = useThemeColors();
  return <View style={{ backgroundColor: colors.background }} />;
}
```

---

## All Available Colors

### Backgrounds
```
colors.background        // Main app background
colors.surface           // Cards & containers
colors.surfaceLight      // Lighter surfaces
```

### Text
```
colors.text              // Primary text
colors.textSecondary     // Secondary text
colors.textTertiary      // Tertiary/hint text
colors.textInverse       // Inverse (for dark bg)
```

### Borders & Dividers
```
colors.border            // Primary border
colors.borderLight       // Light border
colors.borderStrong      // Strong border
colors.divider           // Divider line
```

### Semantic (Both Themes)
```
colors.accent            // #0284c7 (primary blue)
colors.income            // #10B981 (green)
colors.expense           // #EF4444 (red)
colors.transfer          // #8B5CF6 (purple)
colors.success           // #10B981 (green)
colors.warning           // #F59E0B (amber)
colors.danger            // #EF4444 (red)
colors.info              // #3B82F6 (blue)
```

### Interactive
```
colors.buttonPrimary     // Primary button
colors.buttonSecondary   // Secondary button
colors.inputBackground   // Input field
colors.inputBorder       // Input border
colors.inputPlaceholder  // Input placeholder
```

### Special
```
colors.shadowColor       // Shadow color (theme-aware)
colors.chartAxis         // Chart axis labels
colors.chartGrid         // Chart grid lines
colors.tabBarBackground  // Tab bar
colors.tabIconActive     // Active tab icon
colors.headerBackground  // Header background
```

---

## Common Patterns

### Pattern 1: Simple View
```typescript
const colors = useThemeColors();
<View style={{ backgroundColor: colors.surface }}>
  <Text style={{ color: colors.text }}>Hello</Text>
</View>
```

### Pattern 2: With Styles Function
```typescript
const colors = useThemeColors();
const styles = createStyles(colors);
<View style={styles.card} />

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    }
  });
```

### Pattern 3: Semantic Colors
```typescript
const colors = useThemeColors();
<Text style={{ color: type === 'income' ? colors.income : colors.expense }}>
  {amount}
</Text>
```

### Pattern 4: With isDark Logic
```typescript
const { isDark, colors } = useTheme();
const styles = createStyles(colors, isDark);

const createStyles = (colors, isDark) =>
  StyleSheet.create({
    container: {
      shadowOpacity: isDark ? 0.3 : 0.08,
    }
  });
```

---

## Color Hex Reference

### Light Mode
```
#FFFFFF  (background)
#F5F5F5  (surface)
#FAFAFA  (surfaceLight)
#000000  (text)
#666666  (textSecondary)
#999999  (textTertiary)
#E5E5E5  (border)
```

### Dark Mode
```
#0F0F0F  (background)
#1A1A1A  (surface)
#262626  (surfaceLight)
#FFFFFF  (text)
#A0A0A0  (textSecondary)
#808080  (textTertiary)
#404040  (border)
```

### Semantic (Both)
```
#0284c7  (accent/primary)
#10B981  (income/success)
#EF4444  (expense/danger)
#8B5CF6  (transfer)
#F59E0B  (warning)
#3B82F6  (info)
```

---

## Migration Checklist

For each file being migrated:

### Setup
- [ ] Import `useThemeColors` and `ThemeColors`
- [ ] Remove `useAppColorScheme` logic
- [ ] Remove manual color object
- [ ] Add `const colors = useThemeColors()`

### Colors
- [ ] Replace all ternary color checks
- [ ] Use `colors.*` for all styling
- [ ] Remove hardcoded hex values
- [ ] Use semantic colors appropriately

### Testing
- [ ] Compile without TypeScript errors
- [ ] Test in light mode
- [ ] Test in dark mode
- [ ] Verify theme switching works
- [ ] Check accessibility contrast

---

## Ternary-to-Theme Mapping

| Old Pattern | New |
|------------|-----|
| `isDark ? '#0F0F0F' : '#FFFFFF'` | `colors.background` |
| `isDark ? '#1A1A1A' : '#F5F5F5'` | `colors.surface` |
| `isDark ? '#262626' : '#FAFAFA'` | `colors.surfaceLight` |
| `isDark ? '#FFFFFF' : '#000000'` | `colors.text` |
| `isDark ? '#A0A0A0' : '#666666'` | `colors.textSecondary` |
| `isDark ? '#808080' : '#999999'` | `colors.textTertiary` |
| `isDark ? '#404040' : '#E5E5E5'` | `colors.border` |
| `isDark ? '#2A2A2A' : '#F0F0F0'` | `colors.borderLight` |
| `isDark ? '#555555' : '#D0D0D0'` | `colors.borderStrong` |
| `isDark ? '#333333' : '#EEEEEE'` | `colors.divider` |
| `'#0284c7'` | `colors.accent` |
| `'#10B981'` | `colors.income` |
| `'#EF4444'` | `colors.expense` |

---

## Common Mistakes ❌ → ✅

### Mistake 1: Forgetting Hook
```typescript
// ❌ DON'T
backgroundColor: '#1A1A1A'

// ✅ DO
const colors = useThemeColors();
backgroundColor: colors.surface
```

### Mistake 2: Not Passing Colors to Styles
```typescript
// ❌ DON'T
const styles = createStyles(spacing);

// ✅ DO
const colors = useThemeColors();
const styles = createStyles(spacing, colors);
```

### Mistake 3: Manual isDark Checks
```typescript
// ❌ DON'T
const isDark = colorScheme === 'dark';
color: isDark ? '#FFFFFF' : '#000000'

// ✅ DO
const colors = useThemeColors();
color: colors.text
```

### Mistake 4: Mixing Approaches
```typescript
// ❌ DON'T
const colors = useThemeColors();
backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5'

// ✅ DO
const colors = useThemeColors();
backgroundColor: colors.surface
```

---

## File Organization

### Files You'll Modify
- `app/(tabs)/analysis.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/accounts.tsx`
- `app/(tabs)/budgets.tsx`
- All modal files (`app/*-modal.tsx`)
- Component files (`components/*.tsx`)

### Files You DON'T Touch
- `context/Theme.tsx` ← Already done!
- `app/_layout.tsx` ← Already done!
- Hooks files
- Other utilities

---

## Performance Tips

✅ **Memoize colors in styles**
```typescript
const colors = useThemeColors();
const styles = useMemo(() => createStyles(colors), [colors]);
```

✅ **Share styles between components**
```typescript
// One file with all shared styles
export const commonStyles = (colors) => StyleSheet.create({...});

// Use in multiple components
import { commonStyles } from '@/styles/common';
const styles = commonStyles(colors);
```

✅ **Group theme-dependent logic**
```typescript
// Good: All theme logic in one place
const styles = createStyles(colors, isDark);

// Avoid: Scattering theme checks throughout render
{isDark ? <DarkVersion /> : <LightVersion />}
```

---

## Helpful Links

📚 **Full Guides**
- `GLOBAL_THEME_PROVIDER_GUIDE.md` - Complete system docs
- `THEME_MIGRATION_GUIDE.md` - Step-by-step examples
- `ANALYSIS_THEME_MIGRATION.md` - Complex example

🔍 **Find Colors**
- `context/Theme.tsx` - All color definitions
- `ThemeColors` interface - All available properties

---

## Questions? Reference These

| Question | Answer |
|----------|--------|
| What colors exist? | See "All Available Colors" above |
| How do I use it? | See "Basic Usage" - 3 lines of code |
| What's the hex value? | See "Color Hex Reference" |
| How to migrate? | See "Migration Checklist" |
| Common mistakes? | See "Common Mistakes" |
| Performance tips? | See "Performance Tips" |

---

## Examples by Component Type

### Simple Text
```typescript
<Text style={{ color: colors.text }}>Hello</Text>
```

### Button
```typescript
<TouchableOpacity style={{
  backgroundColor: colors.buttonPrimary,
  borderRadius: 10,
}}>
  <Text style={{ color: colors.textInverse }}>Click me</Text>
</TouchableOpacity>
```

### Input Field
```typescript
<TextInput
  style={{
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    color: colors.text,
  }}
  placeholderTextColor={colors.inputPlaceholder}
/>
```

### Card
```typescript
<View style={{
  backgroundColor: colors.surface,
  borderColor: colors.border,
  borderWidth: 1,
  borderRadius: 12,
  padding: 16,
}}>
  {/* Content */}
</View>
```

### Income/Expense
```typescript
<Text style={{
  color: amount > 0 ? colors.income : colors.expense,
}}>
  {amount}
</Text>
```

---

## Status: Ready to Use! ✅

- ✅ Theme context created
- ✅ Provider integrated
- ✅ Full documentation
- ✅ Examples provided
- ✅ Zero errors
- ✅ Production-ready

**Start migrating files using patterns above!**

---

## Need Help?

1. **For color names**: See "All Available Colors"
2. **For usage patterns**: See "Common Patterns"
3. **For migration**: See "Migration Checklist"
4. **For examples**: See "Examples by Component Type"
5. **For full docs**: See `GLOBAL_THEME_PROVIDER_GUIDE.md`

You've got this! 🚀
