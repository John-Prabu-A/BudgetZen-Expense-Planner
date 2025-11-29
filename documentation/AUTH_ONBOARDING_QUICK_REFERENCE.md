# Auth & Onboarding Quick Reference

## 🎨 What Changed

All authentication and onboarding screens have been completely redesigned with:
- **Professional modern UI** following your app's design language
- **Full theme system integration** (light/dark modes)
- **Smooth animations** with Reanimated 3
- **SafeAreaView** for proper device spacing
- **Proper form validation** and error handling

---

## 📱 Screens Overview

### Login Screen (`app/(auth)/login.tsx`)
- Beautiful branded header with wallet icon
- Email & password inputs with icons
- Password visibility toggle
- Sign in/Sign up mode toggle
- Form validation
- Security badge
- Smooth entry animations

**Key Colors Used:**
- `colors.accent` - Primary actions
- `colors.background` - Page background
- `colors.surface` - Input backgrounds
- `colors.textSecondary` - Hints and labels

---

### Currency Selection (`app/(onboarding)/currency.tsx`)
- "1/4" step indicator
- Real-time currency search
- Beautiful currency cards with symbols
- Selection state with checkmark
- Animated list items (30ms stagger)

**Features:**
```
✨ Staggered animations
🔍 Live search with clear button
💳 Symbol in colored circle
✓ Visual selection feedback
```

---

### Reminders Setup (`app/(onboarding)/reminders.tsx`)
- "2/4" step indicator
- Toggle for daily reminders
- Time selector card (appears when enabled)
- Benefits list (3 items)
- Conditional UI rendering

**Benefits Section Shows:**
```
🎯 Target - Stay focused on budget goals
📊 Chart - Track spending habits
💡 Lightbulb - Build better habits
```

---

### Privacy & Safety (`app/(onboarding)/privacy.tsx`)
- "3/4" step indicator
- Stats toggle for crash reports
- Security encryption info card
- Terms agreement checkbox
- Policy links (3 links with icons)
- Continue button (disabled until agreed)

**Links Section:**
```
📄 Terms of Service
🔐 Privacy Policy
ℹ️ Data Security
```

---

### Tutorial/Getting Started (`app/(onboarding)/tutorial.tsx`)
- "4/4" step indicator (final!)
- Horizontal carousel (3 slides)
- Animated slide indicators
- Navigation controls (back/next)
- Feature badges at bottom

**Carousel Slides:**
```
1️⃣ Categories - Create and organize
2️⃣ Accounts - Add your accounts
3️⃣ Records - Record transactions
```

**Feature Badges:**
```
🔐 Secure
⚡ Fast
📊 Insights
```

---

## 🎨 Design System Reference

### Colors from Theme Context
```tsx
const { isDark, colors } = useTheme();

// Primary colors
colors.accent          // Blue #0284c7 (actions)
colors.background      // White or #0F0F0F
colors.surface         // #F5F5F5 or #1A1A1A

// Text colors
colors.text            // Black or White
colors.textSecondary   // Gray
colors.textTertiary    // Lighter gray
colors.textOnAccent    // White (for dark backgrounds)

// Semantic colors
colors.success         // Green (#10B981)
colors.warning         // Amber (#F59E0B)
colors.danger          // Red (#EF4444)
colors.info            // Blue (#3B82F6)

// Borders
colors.border          // Light gray
colors.borderLight     // Lighter
colors.divider         // Very light
```

### Sizing Standards
```
Typography:
- Titles: 28-32px, weight 800
- Labels: 12-15px, weight 700
- Body: 13-15px, weight 500
- Buttons: 15-16px, weight 700

Spacing:
- Page padding: 16px
- Card padding: 14-16px
- Gap between items: 12px
- Margin between sections: 20-32px

Components:
- Input height: 50px
- Icon container: 52-72px
- Button height: 50-56px
- Border radius: 12-14px
```

---

## 🔄 Using the Theme System

### Basic Template
```tsx
import { useTheme } from '@/context/Theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Screen() {
  const { isDark, colors } = useTheme();

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        Title
      </Text>
      
      <View style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border
        }
      ]}>
        {/* content */}
      </View>
    </SafeAreaView>
  );
}
```

### Common Color Applications
```tsx
// Accents and CTAs
backgroundColor: colors.accent

// Subtle backgrounds
backgroundColor: colors.accent + '15'  // 15% opacity

// Cards and containers
backgroundColor: colors.surface

// Disabled/secondary states
backgroundColor: colors.textTertiary

// Text on colored backgrounds
color: colors.textOnAccent

// Borders
borderColor: colors.border
```

---

## ✨ Animation Patterns

### Entry Animation (Fade + Scale)
```tsx
const opacity = useSharedValue(0);
const scale = useSharedValue(0.9);

useEffect(() => {
  opacity.value = withTiming(1, {
    duration: 600,
    easing: Easing.out(Easing.cubic),
  });
  scale.value = withTiming(1, {
    duration: 600,
    easing: Easing.out(Easing.cubic),
  });
}, []);

const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
  transform: [{ scale: scale.value }],
}));
```

### Staggered List Items
```tsx
// In FlatList renderItem:
<AnimatedCard delay={index * 30}>
  {/* Each item animates 30ms after previous */}
</AnimatedCard>
```

### Button Press Effects
```tsx
// Use AnimatedButton component - handles automatically:
<AnimatedButton onPress={() => {}}>
  <View style={styles.button}>
    <Text>Press Me</Text>
  </View>
</AnimatedButton>

// Automatically provides:
// - Scale: 1 → 0.95 on press
// - Opacity: 1 → 0.8 on press
// - Spring physics for smoothness
```

---

## 🔐 Security Features

### Password Input
```tsx
const [showPassword, setShowPassword] = useState(false);

<TextInput
  secureTextEntry={!showPassword}
  placeholder="••••••••"
/>

// Toggle button shows/hides password
```

### Form Validation
```tsx
// Email validation
if (!email.trim() || !password.trim()) {
  Alert.alert('Error', 'Please fill in all fields');
  return;
}

// Password length
if (password.length < 6) {
  Alert.alert('Error', 'Password must be at least 6 characters');
  return;
}
```

### Secure Storage
```tsx
import * as SecureStore from 'expo-secure-store';

// Save
await SecureStore.setItemAsync('onboarding_complete', 'true');

// Verify before navigation
const saved = await SecureStore.getItemAsync('onboarding_complete');
if (saved) {
  router.replace('/(tabs)');
}
```

---

## 📋 File Checklist

When adding new auth/onboarding screens:

- [ ] Import theme hook: `const { isDark, colors } = useTheme();`
- [ ] Import SafeAreaView: `import { SafeAreaView } from 'react-native-safe-area-context';`
- [ ] Wrap root with SafeAreaView + theme background color
- [ ] Import animations: `from 'react-native-reanimated'`
- [ ] Use AnimatedButton for interactive elements
- [ ] Apply color variables to all interactive elements
- [ ] Test in both light and dark modes
- [ ] Test on different screen sizes
- [ ] Verify animations are smooth (60fps)
- [ ] Check error messages are user-friendly

---

## 🚀 How to Add More Screens

### Step 1: Create File
```
app/(auth)/signup.tsx  // or
app/(onboarding)/newscreen.tsx
```

### Step 2: Use This Template
```tsx
import { useTheme } from '@/context/Theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export default function YourScreen() {
  const { isDark, colors } = useTheme();
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <Animated.View style={animatedStyle}>
        {/* Your content */}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
```

### Step 3: Add Navigation (if needed)
```tsx
// In _layout.tsx
<Stack.Screen name="yourscreen" />

// In router
router.push('./yourscreen')
```

---

## 🧪 Testing Checklist

### Visual Testing
- [ ] Light mode looks good
- [ ] Dark mode looks good
- [ ] Colors have proper contrast
- [ ] Text is readable
- [ ] Icons are visible

### Interaction Testing
- [ ] Buttons respond to press
- [ ] Animations are smooth
- [ ] Form validation works
- [ ] Navigation flows correctly
- [ ] Error messages appear

### Device Testing
- [ ] Works on phone
- [ ] Works on tablet
- [ ] SafeAreaView properly spaces content
- [ ] No text cutoff
- [ ] No overlapping elements

### Edge Cases
- [ ] Very long text doesn't break layout
- [ ] Empty states handled
- [ ] Loading states visible
- [ ] Error states clear
- [ ] Navigation back works

---

## 💡 Pro Tips

1. **Use Semantic Colors**: Instead of hardcoding colors, use theme colors
   ```tsx
   // ❌ Don't
   backgroundColor: '#0284c7'
   
   // ✅ Do
   backgroundColor: colors.accent
   ```

2. **Opacity for Subtle Shades**: Create color variations with opacity
   ```tsx
   // Subtle background
   backgroundColor: colors.accent + '15'  // 15% opacity
   
   // Hover state
   backgroundColor: colors.accent + '40'  // 40% opacity
   ```

3. **Consistent Spacing**: Use the spacing system
   ```tsx
   // ✅ Standard margins
   marginBottom: 16,  // page padding
   marginTop: 20,     // between sections
   gap: 12,           // between items
   ```

4. **Animation Timing**: Keep animations snappy
   ```tsx
   // Header animations: 600ms
   // Content animations: 500-700ms with delays
   // Stagger: 30-50ms between items
   ```

5. **Test Dark Mode**: Always test theme switching
   ```tsx
   // In iOS: Settings > Developer > Toggle Dark Mode
   // In Android: Settings > Display > Dark Theme
   ```

---

## 📞 Quick Help

### "My colors aren't changing in dark mode"
- Make sure you're using `colors.x` from theme, not hardcoded values
- Verify `useTheme()` hook is called
- Check SafeAreaView has backgroundColor from theme

### "Animations are janky"
- Use Reanimated 3 timing configurations
- Check you're not doing heavy computations in animated components
- Verify FlatList has keyExtractor
- Check frame rate with React Native Debugger

### "Layout overlaps with status bar"
- Add SafeAreaView with edges={['top', 'bottom']}
- Check edges prop is correct
- Verify parent has proper flex: 1

### "Text is cut off on small screens"
- Use maxWidth constraints
- Use flex: 1 for text containers
- Check lineHeight is appropriate
- Consider responsive sizing

---

**Need More Help?** Check the full documentation in `AUTH_ONBOARDING_REDESIGN.md`
