# 🎨 Design System Visual Reference

## Color Palette Reference

### Light Mode
```
BACKGROUNDS:
├─ Background:  #FFFFFF (Pure white)
├─ Surface:     #F5F5F5 (Off-white)
├─ Accent:      #0284c7 (Sky Blue)
└─ Overlay:     rgba(0,0,0,0.5)

TEXT:
├─ Primary:     #000000 (Black)
├─ Secondary:   #666666 (Medium Gray)
├─ Tertiary:    #999999 (Light Gray)
└─ On Accent:   #FFFFFF (White)

SEMANTIC:
├─ Success:     #10B981 (Green)
├─ Warning:     #F59E0B (Amber)
├─ Danger:      #EF4444 (Red)
└─ Info:        #3B82F6 (Blue)
```

### Dark Mode
```
BACKGROUNDS:
├─ Background:  #0F0F0F (OLED Black)
├─ Surface:     #1A1A1A (Dark Gray)
├─ Accent:      #0284c7 (Sky Blue)
└─ Overlay:     rgba(0,0,0,0.8)

TEXT:
├─ Primary:     #FFFFFF (White)
├─ Secondary:   #999999 (Light Gray)
├─ Tertiary:    #666666 (Medium Gray)
└─ On Accent:   #FFFFFF (White)

SEMANTIC:
├─ Success:     #10B981 (Green)
├─ Warning:     #F59E0B (Amber)
├─ Danger:      #EF4444 (Red)
└─ Info:        #3B82F6 (Blue)
```

---

## Typography Scale

### Hierarchy Levels
```
Level 1 - Page Titles
├─ Font Size: 32px
├─ Font Weight: 800
├─ Letter Spacing: 0.3px
└─ Line Height: 38px
└─ Example: "BudgetZen"

Level 2 - Screen Titles
├─ Font Size: 28px
├─ Font Weight: 800
├─ Letter Spacing: 0.3px
└─ Example: "Select Currency"

Level 3 - Section Headers
├─ Font Size: 18px
├─ Font Weight: 700
├─ Letter Spacing: 0.3px
└─ Example: "Payment Method"

Level 4 - Card Titles
├─ Font Size: 15px
├─ Font Weight: 700
└─ Example: "Daily Reminders"

Level 5 - Body Text
├─ Font Size: 13px
├─ Font Weight: 500
└─ Example: "Get reminders..."

Level 6 - Labels
├─ Font Size: 12px
├─ Font Weight: 700
├─ Letter Spacing: 0.3px
└─ Example: "Email"

Level 7 - Hints/Captions
├─ Font Size: 11px
├─ Font Weight: 500
└─ Example: "Password must be 6+"
```

---

## Spacing System

### Base Units
```
The 16px Grid System:

8px   = xs (half)
12px  = sm
16px  = base
20px  = md
24px  = lg
32px  = xl
40px  = 2xl
```

### Application
```
Page Padding:        16px
├─ Container Padding:  14px
├─ Gap Between Items:  12px
├─ Card Margin:        10px
└─ Item Padding:       8px

Vertical Spacing:
├─ Section Gap:     20-32px
├─ Element Gap:     12-16px
└─ Internal Gap:    8-12px
```

---

## Component Sizes

### Input Fields
```
Standard Input:
├─ Height: 50px
├─ Padding: 14px horizontal
├─ Border Radius: 12px
├─ Icon Size: 20px
└─ Font Size: 15px

Label above:
├─ Font Size: 12px
├─ Font Weight: 700
├─ Margin Bottom: 8px
└─ Color: textSecondary
```

### Buttons
```
Primary Button:
├─ Height: 50-56px
├─ Padding: 14px vertical, 20px horizontal
├─ Border Radius: 12px
├─ Font Size: 16px
├─ Font Weight: 700
└─ Background: colors.accent

Secondary Button:
├─ Height: 50px
├─ Border: 1.5px solid colors.border
├─ Border Radius: 12px
├─ Font Size: 15px
└─ Font Weight: 600
```

### Icons
```
Header Icon:        72px
└─ In 120x120 container

Card Icon:          28px
├─ In 52x52 container
└─ Background: colors.accent + '15'

Action Icon:        20px
├─ In 24x24 touch target
└─ Used in inputs

Small Icon:         16-18px
└─ In inline elements
```

### Cards
```
Standard Card:
├─ Padding: 14-16px
├─ Border: 1px solid colors.border
├─ Border Radius: 14px
├─ Margin Bottom: 10-14px
└─ Background: colors.surface

Large Card:
├─ Padding: 16px
├─ Gap Between Elements: 12px
└─ Min Height: 72px (for touch target)
```

---

## Animation Timing

### Standard Durations
```
Quick:       300ms  (Not used much)
Medium:      500ms  (List items, content)
Standard:    600ms  (Headers)
Slow:        700ms  (Form sections)
```

### Easing Functions
```
Entry:    Easing.out(Easing.cubic)
├─ Used for: First-time animations
├─ Duration: 600-700ms
└─ Effect: Smooth, natural entrance

List:     Easing.out(Easing.cubic)
├─ Used for: Staggered items
├─ Duration: 500ms
└─ Effect: Cascade entrance

Press:    Spring Physics
├─ Tension: 200
├─ Friction: 10
└─ Effect: Bouncy, responsive
```

### Animation Sequences
```
Header Animation:
├─ Opacity: 0 → 1 (600ms)
├─ Scale: 0.9 → 1 (600ms)
├─ Easing: out(cubic)
└─ Starts: On mount

Content Animation:
├─ Delay: 300ms
├─ Opacity: 0 → 1 (500ms)
├─ TranslateY: 20 → 0 (500ms)
├─ Easing: out(cubic)
└─ Result: Content slides up

List Item Animation:
├─ Delay: index * 30ms
├─ Opacity: 0 → 1
├─ Scale: 0.95 → 1
└─ Result: Staggered cascade
```

---

## Layout Grid

### Screen Dimensions
```
iPhone SE:       375w × 667h
iPhone 12/13:    390w × 844h
iPhone 14/15:    390w × 932h
iPhone 14 Pro:   430w × 932h
iPad Mini:       768w × 1024h
iPad Air:        820w × 1180h
```

### Safe Area Padding
```
iPhone 11:       20px top, 34px bottom
iPhone 12:       47px top, 34px bottom
iPhone X:        47px top, 34px bottom
iPhone 14 Pro:   49px top, 34px bottom
```

### Content Area
```
Available Width on 390px iPhone:
├─ Page Padding: 16px × 2 = 32px
├─ Usable Width: 390 - 32 = 358px
├─ For 2-column layout: 358 ÷ 2 - 6px gap = 170px each
└─ Max content width: 358px
```

---

## Component States

### Button States
```
Default:
├─ Scale: 1.0
├─ Opacity: 1.0
└─ Background: colors.accent

Pressed:
├─ Scale: 0.95
├─ Opacity: 0.8
└─ Duration: Immediate (spring)

Disabled:
├─ Opacity: 0.6
├─ Background: colors.textTertiary
└─ Pointer Events: none

Loading:
├─ Opacity: 0.7
├─ Show spinner icon
└─ Disabled: true
```

### Input States
```
Default:
├─ Background: colors.surface
├─ Border Color: colors.border
└─ Border Width: 1px

Focused:
├─ Border Color: colors.accent
├─ Border Width: 2px
└─ Background: unchanged

Disabled:
├─ Background: colors.surface + opacity
├─ Color: colors.textSecondary
└─ Pointer Events: none

Error:
├─ Border Color: colors.danger
├─ Background: colors.danger + '10'
└─ Show error message below
```

### Selection States
```
Unselected:
├─ Background: colors.surface
├─ Border Color: colors.border
├─ Text Color: colors.text
└─ Icon: Hidden

Selected:
├─ Background: colors.accent + '20'
├─ Border Color: colors.accent
├─ Text Color: colors.text
└─ Icon: Visible checkmark

Active:
├─ Background: colors.accent
├─ Border Color: colors.accent
├─ Text Color: colors.textOnAccent
└─ Scale: 1.05 (slightly larger)
```

---

## Shadow & Depth

### Elevation Levels
```
Level 1 (Subtle):
├─ shadowColor: '#000'
├─ shadowOffset: { width: 0, height: 1 }
├─ shadowOpacity: 0.1
├─ shadowRadius: 2
└─ elevation: 1
└─ Use: Borders, minimal depth

Level 2 (Default):
├─ shadowColor: '#000'
├─ shadowOffset: { width: 0, height: 2 }
├─ shadowOpacity: 0.15
├─ shadowRadius: 4
└─ elevation: 3
└─ Use: Cards, buttons

Level 3 (Prominent):
├─ shadowColor: '#000'
├─ shadowOffset: { width: 0, height: 4 }
├─ shadowOpacity: 0.2
├─ shadowRadius: 8
└─ elevation: 5
└─ Use: Modal overlays, floating buttons
```

---

## Responsive Behavior

### Small Screens (< 375px)
```
├─ Page Padding: 12px
├─ Card Padding: 12px
├─ Font Sizes: -1 to -2px
├─ Icon Sizes: Maintain minimum 20px
└─ Touch Targets: Maintain 44px minimum
```

### Standard Screens (375-430px)
```
├─ Page Padding: 16px
├─ Card Padding: 14px
├─ Font Sizes: As designed
├─ Icon Sizes: As designed
└─ Touch Targets: As designed
```

### Large Screens (> 430px)
```
├─ Page Padding: 20px
├─ Card Width: Max 400px (center)
├─ Font Sizes: Maintain
├─ Icon Sizes: Maintain
└─ Max content width: 600px
```

### Tablets
```
├─ Max Content Width: 800px
├─ Page Padding: 32px
├─ Font Sizes: +2 to +4px
├─ Icon Sizes: +10 to +20px
└─ 2-column layouts possible
```

---

## Accessibility Guidelines

### Touch Targets
```
Minimum Size:     44 × 44px
Recommended:      48 × 48px
Padding:          8px minimum between targets
Applied To:
├─ Buttons
├─ Inputs
├─ Icons (as buttons)
├─ Links
└─ Toggle switches
```

### Color Contrast
```
Normal Text:      4.5:1 ratio minimum
Large Text (18+): 3:1 ratio minimum
UI Components:    3:1 ratio minimum

Examples:
├─ Black on White:    21:1 ✓
├─ #333 on White:     12.6:1 ✓
├─ #666 on White:     7:1 ✓
├─ Blue on White:     8.6:1 ✓
└─ Gray on Gray:      Avoid
```

### Text Scaling
```
Default:          100%
User Zoom:        100-200%
System Large:     +50%
Support:          Up to 200% without loss
```

---

## Performance Targets

### Animation Performance
```
Target FPS:       60 fps
Acceptable:       50-60 fps
Minimum:          30 fps (avoid)

Measurement:
├─ React Native Debugger → Profiler
├─ Record animation
├─ Check frame rate graph
└─ Should be consistent line
```

### Load Times
```
Screen Transition:  < 100ms
Animation Start:    < 50ms
Interaction Response: < 100ms
Navigation:         < 200ms
```

### Memory Usage
```
Per Screen:       < 20MB
List Items:       < 1MB per 100 items
Animations:       Reanimated Native (low overhead)
Images:           Lazy load where possible
```

---

## Export Asset Sizes

### Icons
```
20px:  1x, 2x, 3x (20, 40, 60px)
24px:  1x, 2x, 3x (24, 48, 72px)
28px:  1x, 2x, 3x (28, 56, 84px)
72px:  1x, 2x, 3x (72, 144, 216px)
```

### Images
```
Cover:     2x, 3x (390w × 200h minimum)
Logo:      2x, 3x (200x200 minimum)
Icon:      SVG preferred (scalable)
Background: 2x, 3x (1080w minimum)
```

---

## Dark Mode Implementation

### How It Works
```
1. User changes device theme
   Settings > Display > Dark theme (toggle)

2. System broadcasts change
   useColorScheme() hook detects it

3. Theme context updates
   isDark boolean changes

4. All components re-render
   colors.x changes throughout app

5. Instant visual transformation
   Light ↔ Dark switch happens
```

### Testing Dark Mode
```
iOS:
  Settings > Developer > Dark Appearance
  (Must have Xcode or Device connected)

Android:
  Settings > Display > Dark theme
  (Toggle on/off)

Web (React Native Web):
  Browser DevTools > Appearance > Dark
```

---

## Quick Copy-Paste Templates

### Input with Icon and Validation
```tsx
<View style={[
  styles.inputContainer,
  { 
    backgroundColor: colors.surface,
    borderColor: hasError ? colors.danger : colors.border,
  }
]}>
  <MaterialCommunityIcons
    name="email-outline"
    size={20}
    color={colors.textSecondary}
  />
  <TextInput
    style={{ flex: 1, color: colors.text }}
    placeholder="Email"
    value={email}
    onChangeText={setEmail}
  />
</View>
```

### Animated Card List
```tsx
<FlatList
  data={items}
  renderItem={({ item, index }) => (
    <AnimatedCard delay={index * 30}>
      <View style={[
        styles.card,
        { 
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }
      ]}>
        {/* Card content */}
      </View>
    </AnimatedCard>
  )}
/>
```

### Animated Header
```tsx
const opacity = useSharedValue(0);
const scale = useSharedValue(0.9);

useEffect(() => {
  opacity.value = withTiming(1, { 
    duration: 600,
    easing: Easing.out(Easing.cubic) 
  });
  scale.value = withTiming(1, { 
    duration: 600,
    easing: Easing.out(Easing.cubic) 
  });
}, []);

const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
  transform: [{ scale: scale.value }],
}));

<Animated.View style={animatedStyle}>
  {/* Header content */}
</Animated.View>
```

---

**Design System Reference Complete** ✅

