# 🚀 Implementation & Usage Guide

## Getting Started with the New Screens

### Quick Start

1. **The new screens are already implemented** - No additional setup needed!
2. **They automatically integrate with your existing theme system**
3. **Dark/Light mode switches automatically** based on device settings

---

## 🔄 How the Theme System Works

### Step 1: Get the Theme
```tsx
import { useTheme } from '@/context/Theme';

export default function MyScreen() {
  const { isDark, colors } = useTheme();
  // isDark: boolean (true if dark mode)
  // colors: ThemeColors object with 50+ color properties
```

### Step 2: Use Colors
```tsx
<View style={{ backgroundColor: colors.background }}>
  <Text style={{ color: colors.text }}>Hello</Text>
  <TouchableOpacity>
    <View style={{ backgroundColor: colors.accent }}>
      {/* button content */}
    </View>
  </TouchableOpacity>
</View>
```

### Step 3: Responsive to Theme Changes
```
User changes device theme (Settings > Dark Mode)
↓
Theme context detects change
↓
All components using colors.x re-render with new values
↓
Entire app switches to matching theme
```

---

## 📱 Screen Navigation

### Current Flow

```
Splash / Root
    ↓
Is onboarding complete?
    ├─ No → (auth)/login
    │        ↓
    │    Authenticated?
    │        ├─ No (shows login/signup)
    │        └─ Yes → (onboarding)/currency (1/4)
    │                  ↓
    │             (onboarding)/reminders (2/4)
    │                  ↓
    │             (onboarding)/privacy (3/4)
    │                  ↓
    │             (onboarding)/tutorial (4/4)
    │                  ↓
    │             Save: SecureStore.setItemAsync('onboarding_complete', 'true')
    │
    └─ Yes → (tabs)/ (Main app)
```

### How to Test This Flow

```bash
# Reset onboarding to start from login
1. Go to Settings > Apps > YourApp > Storage > Clear Data
   (or use SecureStore.deleteItemAsync('onboarding_complete'))

2. Relaunch app → Should see login screen

3. Sign in/up → Should proceed to currency selection

4. Complete all 4 onboarding steps

5. Should navigate to main app (tabs)
```

---

## 🎨 Using the Color System

### Available Colors in Theme

```tsx
// Core backgrounds
colors.background      // Page background
colors.surface         // Cards, containers
colors.surfaceLight    // Slightly lighter
colors.overlay         // Dark overlay

// Text colors
colors.text            // Primary text
colors.textSecondary   // Secondary text
colors.textTertiary    // Tertiary/hint
colors.textInverse     // Inverse (for dark backgrounds)

// Interactive
colors.accent          // Primary action color
colors.buttonPrimary   // Primary button
colors.buttonSecondary // Secondary button

// States
colors.success         // Green
colors.warning         // Amber
colors.danger          // Red
colors.info            // Blue
colors.income          // Green
colors.expense         // Red
colors.transfer        // Purple

// Borders
colors.border          // Primary border
colors.borderLight     // Light border
colors.borderStrong    // Strong border

// Special
colors.textOnAccent    // White text on colored backgrounds
colors.shadowColor     // Shadow color
```

### Creating Color Variations

```tsx
// Subtle background (10% opacity)
backgroundColor: colors.accent + '10'

// Medium background (20% opacity)
backgroundColor: colors.accent + '20'

// Strong background (40% opacity)
backgroundColor: colors.accent + '40'

// Use: Hover states, highlights, disabled states
```

### Real Examples from the Code

```tsx
// Login screen - Logo background
style={{
  backgroundColor: colors.accent + '15'
}}

// Currency card - Selected state
style={{
  backgroundColor: selectedCurrency === item.code ? colors.accent + '20' : colors.surface,
  borderColor: selectedCurrency === item.code ? colors.accent : colors.border,
}}

// Reminders card - Conditional accent
style={{
  backgroundColor: colors.accent + '08',
  borderColor: colors.accent + '30'
}}

// Privacy security info
style={{
  backgroundColor: colors.accent + '08'
}}
```

---

## ✨ Animation System

### Two Main Animation Libraries

1. **React Native Reanimated 3**
   - Used for: Complex animations, shared values, transitions
   - Performance: 60fps guaranteed
   - Example: Login screen header fade + scale

2. **AnimatedButton Component**
   - Used for: Interactive buttons
   - Automatic handling of press animations
   - Spring physics for smooth feel

### Using Reanimated

```tsx
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  Easing,
  withDelay 
} from 'react-native-reanimated';

// 1. Create shared values
const opacity = useSharedValue(0);
const scale = useSharedValue(0.9);

// 2. Animate on mount
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

// 3. Create animated style
const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
  transform: [{ scale: scale.value }],
}));

// 4. Apply to component
<Animated.View style={[styles.container, animatedStyle]}>
  {/* content */}
</Animated.View>
```

### Animation Timing Conventions

```tsx
// Header animations (fade + scale)
duration: 600  // 600ms
easing: Easing.out(Easing.cubic)

// Content animations (fade + translate)
duration: 500-700  // 500-700ms
easing: Easing.out(Easing.cubic)
delay: 300  // 300ms initial delay

// Stagger list items
itemDelay: 30  // 30ms between each item

// Button press animation
activeScale: 0.95  // Scale down to 95%
activeOpacity: 0.8  // Fade to 80% opacity
```

---

## 🔐 Security Best Practices

### Password Handling
```tsx
const [showPassword, setShowPassword] = useState(false);

// Toggle visibility
<TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
  <MaterialCommunityIcons
    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
    size={20}
    color={colors.textSecondary}
  />
</TouchableOpacity>

// Input
<TextInput
  secureTextEntry={!showPassword}  // Hide when false
  placeholder="••••••••"
  // Never log or display password value
/>
```

### Form Validation
```tsx
// Email validation
if (!email.trim()) {
  Alert.alert('Error', 'Email is required');
  return;
}

// Password validation
if (!password.trim()) {
  Alert.alert('Error', 'Password is required');
  return;
}

if (password.length < 6) {
  Alert.alert('Error', 'Password must be at least 6 characters');
  return;
}

// Only proceed if valid
await signInWithEmail();
```

### Secure Storage
```tsx
import * as SecureStore from 'expo-secure-store';

// Save sensitive data
await SecureStore.setItemAsync('onboarding_complete', 'true');

// Retrieve sensitive data
const value = await SecureStore.getItemAsync('onboarding_complete');

// Delete sensitive data
await SecureStore.deleteItemAsync('onboarding_complete');

// Note: Use SecureStore, NOT AsyncStorage for sensitive data
```

---

## 🧪 Testing the New Screens

### Manual Testing Checklist

- [ ] Light mode looks good
- [ ] Dark mode looks good
- [ ] All buttons respond to touch
- [ ] Animations are smooth
- [ ] No text overlaps
- [ ] All icons visible
- [ ] Forms validate input
- [ ] Error messages appear
- [ ] Navigation works
- [ ] SafeAreaView prevents overlap
- [ ] No console errors
- [ ] Runs at 60fps

### Testing Dark Mode

**iOS:**
```
Settings > Developer > Dark Appearance
(Toggle to switch between light/dark)
```

**Android:**
```
Settings > Display > Dark theme
(Toggle on/off)
```

### Testing Different Screen Sizes

**iOS Simulator:**
```
Hardware > Device > Choose different device
(test on iPhone SE, iPhone 14 Pro Max, iPad, etc.)
```

**Android Emulator:**
```
Create different AVDs with different screen sizes
```

### Testing Performance

```tsx
// React Native Debugger
View → Profiler → Press ◀ ▶ to record
Check FPS (should be consistent 60fps)
Check frame rates
Monitor memory usage
```

---

## 🐛 Troubleshooting

### Issue: Colors not updating with theme
```
Solution:
✅ Make sure useTheme() is called
✅ Check you're using colors.x not hardcoded values
✅ Verify component is not memoized without theme dep
✅ Clear app cache and restart
```

### Issue: Animations are janky
```
Solution:
✅ Use Reanimated useAnimatedStyle, not direct setState
✅ Keep animations simple (fade, scale, translate)
✅ Avoid heavy computations in animated components
✅ Check FPS in React Native Debugger
✅ Profile with Profiler tab
```

### Issue: Layout overlaps with status bar
```
Solution:
✅ Wrap root with SafeAreaView
✅ Add edges={['top', 'bottom']} to SafeAreaView
✅ Check SafeAreaView parent has proper flex/height
✅ Verify backgroundColor is set on SafeAreaView
```

### Issue: Text cut off on small screens
```
Solution:
✅ Add maxWidth constraints
✅ Use flex: 1 for flexible containers
✅ Set appropriate lineHeight
✅ Test on small screen devices
✅ Consider responsive font sizes
```

### Issue: Navigation not working
```
Solution:
✅ Verify router import: import { useRouter } from 'expo-router';
✅ Check router.push() vs router.replace()
✅ Verify route path is correct
✅ Check _layout.tsx has proper Stack configuration
✅ Ensure no navigation logic blocking
```

---

## 📝 Adding New Screens

### Template for New Onboarding Screen

```tsx
import { useTheme } from '@/context/Theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  Easing 
} from 'react-native-reanimated';

export default function NewScreen() {
  const { isDark, colors } = useTheme();
  
  // Animations
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        <Animated.View style={animatedStyle}>
          {/* Your content */}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
});
```

---

## 📚 File Structure

```
app/
├─ (auth)/
│  ├─ _layout.tsx          ← Stack configuration
│  └─ login.tsx            ← LOGIN SCREEN ✨
│
├─ (onboarding)/
│  ├─ _layout.tsx          ← Stack configuration
│  ├─ currency.tsx         ← CURRENCY SCREEN ✨
│  ├─ reminders.tsx        ← REMINDERS SCREEN ✨
│  ├─ privacy.tsx          ← PRIVACY SCREEN ✨
│  └─ tutorial.tsx         ← TUTORIAL SCREEN ✨
│
context/
├─ Theme.tsx              ← THEME PROVIDER (colors!)
├─ Auth.tsx
└─ Preferences.tsx

components/
├─ AnimatedButton.tsx     ← Button animations
├─ AnimatedCard.tsx       ← Card animations
└─ ui/
   ├─ Button.tsx
   └─ Input.tsx
```

---

## 🎯 Best Practices

### Do's ✅
```tsx
✅ Use theme colors for all colors
✅ Wrap screens with SafeAreaView
✅ Use AnimatedButton for interactions
✅ Import from 'react-native-safe-area-context'
✅ Test in both light and dark modes
✅ Use consistent spacing (16px grid)
✅ Validate form inputs
✅ Show loading states
✅ Handle errors gracefully
✅ Use semantic color names (success, danger, etc.)
```

### Don'ts ❌
```tsx
❌ Don't hardcode colors like '#0284c7'
❌ Don't skip SafeAreaView
❌ Don't forget theme background on root
❌ Don't use heavy animations
❌ Don't test only in light mode
❌ Don't use random spacing values
❌ Don't skip validation
❌ Don't hide loading states
❌ Don't ignore errors
❌ Don't mix theme and hardcoded colors
```

---

## 🚀 Performance Tips

1. **Memoization**
   - Use React.memo for pure components
   - Avoid re-renders of animated components

2. **FlatList Optimization**
   - Always use keyExtractor
   - Use getItemLayout for known heights
   - Remove renderItem inline

3. **Animation Performance**
   - Keep animations simple (fade, scale, translate)
   - Use Reanimated for complex animations
   - Avoid JavaScript-driven animations

4. **Theme Performance**
   - Theme context updates all consumers
   - Keep theme deep separate from other contexts
   - Consider splitting if theme gets large

---

## 📞 Quick Reference Commands

```bash
# Test specific screen
expo start

# Clear cache
expo start --clear

# Android build
eas build --platform android

# iOS build
eas build --platform ios

# Check theme in dark mode (iOS)
xcrun simctl ui booted appearance dark

# Check theme in light mode (iOS)
xcrun simctl ui booted appearance light
```

---

## ✅ Launch Checklist

Before going to production:

- [ ] All screens tested in light mode
- [ ] All screens tested in dark mode
- [ ] Animations smooth at 60fps
- [ ] Form validation working
- [ ] Error messages user-friendly
- [ ] Navigation flows correct
- [ ] SafeAreaView on all screens
- [ ] No hardcoded colors
- [ ] No console warnings
- [ ] No memory leaks
- [ ] Performance acceptable
- [ ] Accessibility check
- [ ] Documentation up to date

---

**Ready to Deploy** ✅

