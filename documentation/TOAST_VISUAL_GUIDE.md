# 🎨 Toast System Visual Guide

**Visual reference and diagrams for the professional toast notification system**

---

## 📱 Toast Display Appearance

### Success Toast (Green)
```
┌────────────────────────────────────────────┐
│ ✓ Record saved successfully!               │
└────────────────────────────────────────────┘
Light Mode: Green bg (#ecfdf5), Dark text (#065f46)
Dark Mode:  Semi-transparent green, Light green text (#86efac)
Icon:       Check Circle (Material Community Icons)
Duration:   3 seconds (configurable)
```

### Error Toast (Red)
```
┌────────────────────────────────────────────┐
│ ! Failed to save record                    │
└────────────────────────────────────────────┘
Light Mode: Red bg (#fef2f2), Dark text (#7f1d1d)
Dark Mode:  Semi-transparent red, Light red text (#fca5a5)
Icon:       Alert Circle (Material Community Icons)
Duration:   3 seconds (configurable, longer recommended)
```

### Warning Toast (Amber)
```
┌────────────────────────────────────────────┐
│ ⚠ Budget limit approaching                │
└────────────────────────────────────────────┘
Light Mode: Amber bg (#fffbeb), Dark text (#78350f)
Dark Mode:  Semi-transparent amber, Light yellow text (#fcd34d)
Icon:       Alert (Material Community Icons)
Duration:   3 seconds (configurable)
```

### Info Toast (Blue)
```
┌────────────────────────────────────────────┐
│ ℹ Processing your request...               │
└────────────────────────────────────────────┘
Light Mode: Blue bg (#eff6ff), Dark text (#1e3a8a)
Dark Mode:  Semi-transparent blue, Light blue text (#93c5fd)
Icon:       Information (Material Community Icons)
Duration:   3 seconds (configurable)
```

---

## 🎬 Animation Timeline

### Toast Lifecycle

```
Timeline (ms):  0      300    3000   3300   3600
                |      |      |      |      |
State:         Hidden  Show   Active Fade   Gone
                |      |      |      |      |
                v      v      v      v      v
Position:     ↓↓↓    ↑→0   Stay   ↓↓↓   Hidden
              (off)  (in)        (out)
                
Opacity:       0      1      1      0      0
               |      |      |      |      |
               0%     100%   100%   0%     0%
               
Animation:  [300ms slide-up + fade-in]
            [2700ms idle time]
            [300ms slide-down + fade-out]
```

### Detailed Animation

```
ENTRANCE (0-300ms)
  translateY: 300px → 0px    (slide up from bottom)
  opacity:    0% → 100%      (fade in)

IDLE (300-3000ms)
  Position: fixed at bottom
  Opacity:  100%

EXIT (3000-3300ms)
  translateY: 0px → 300px    (slide down to bottom)
  opacity:    100% → 0%      (fade out)
```

---

## 🎨 Color Palette

### Light Mode Colors
```
┌──────────┬─────────────────┬──────────────┬─────────────────┐
│ Type     │ Background      │ Text         │ Border          │
├──────────┼─────────────────┼──────────────┼─────────────────┤
│ Success  │ #ecfdf5 (light) │ #065f46 (dk) │ #d1fae5 (light) │
│ Error    │ #fef2f2 (light) │ #7f1d1d (dk) │ #fee2e2 (light) │
│ Warning  │ #fffbeb (light) │ #78350f (dk) │ #fef3c7 (light) │
│ Info     │ #eff6ff (light) │ #1e3a8a (dk) │ #dbeafe (light) │
└──────────┴─────────────────┴──────────────┴─────────────────┘
```

### Dark Mode Colors
```
┌──────────┬──────────────────────────┬──────────────────────┐
│ Type     │ Background               │ Text                 │
├──────────┼──────────────────────────┼──────────────────────┤
│ Success  │ rgba(16, 185, 129, 0.15) │ #86efac (light)      │
│ Error    │ rgba(239, 68, 68, 0.15)  │ #fca5a5 (light)      │
│ Warning  │ rgba(245, 158, 11, 0.15) │ #fcd34d (light)      │
│ Info     │ rgba(59, 130, 246, 0.15) │ #93c5fd (light)      │
└──────────┴──────────────────────────┴──────────────────────┘
```

### Color Reference Grid

```
SUCCESS (Green)
┌─────────────────────────────────────┐
│ Light:  ████ green (soft)           │
│ Dark:   ████ green (subtle)         │
│ Text:   ████ green (dark/light)     │
└─────────────────────────────────────┘

ERROR (Red)
┌─────────────────────────────────────┐
│ Light:  ████ red (soft)             │
│ Dark:   ████ red (subtle)           │
│ Text:   ████ red (dark/light)       │
└─────────────────────────────────────┘

WARNING (Amber)
┌─────────────────────────────────────┐
│ Light:  ████ amber (soft)           │
│ Dark:   ████ amber (subtle)         │
│ Text:   ████ amber (dark/light)     │
└─────────────────────────────────────┘

INFO (Blue)
┌─────────────────────────────────────┐
│ Light:  ████ blue (soft)            │
│ Dark:   ████ blue (subtle)          │
│ Text:   ████ blue (dark/light)      │
└─────────────────────────────────────┘
```

---

## 📐 Layout & Spacing

### Toast Dimensions

```
SCREEN
┌─────────────────────────────────────────────┐
│                                             │  24px padding
│                                             │  (safe area)
│  Safe Area Respected                        │
│                                             │
│  ┌───────────────────────────────────────┐  │ 90% width
│  │ [icon] message text [16px to border]  │  │ (max: screen - 32px)
│  │                                       │  │ 12px padding
│  └───────────────────────────────────────┘  │ border-radius: 10px
│                                             │
│              24px bottom padding            │
└─────────────────────────────────────────────┘
```

### Toast Internal Layout

```
┌─────────────────────────────────────────┐
│  [Icon]  Message text goes here       │ ← 2 lines max
│  (20px)  Flex content                  │
└─────────────────────────────────────────┘
 ↑        ↑
 |        +-- 12px margin
 +-- 16px padding

Border: 1px (color-matched)
Shadow: elevation 8 (Android)
        shadowOpacity 0.15 (iOS)
```

### Position on Screen

```
                   SCREEN
        ┌──────────────────────┐
        │                      │
        │   App Content Area   │
        │                      │
        │   (user can interact)│
        │                      │
        ├──────────────────────┤ ← Z-Index: 9999
        │ ┌──────────────────┐ │   (always visible)
        │ │ ✓ Success Toast! │ │
        │ └──────────────────┘ │
        │      ↑               │
        │   24px from bottom   │
        │      (safe area)     │
        └──────────────────────┘
```

---

## 🔄 State Machine

### Toast Lifecycle States

```
                    CREATED
                       │
                       ↓
          ┌────────────────────────┐
          │   MOUNTING             │
          │  (Generating ID)       │
          └────────────────────────┘
                       │
                       ↓
          ┌────────────────────────┐
          │   ENTERING             │
          │  (300ms animation)     │
          │  • translateY: 0       │
          │  • opacity: 1          │
          └────────────────────────┘
                       │
                       ↓
          ┌────────────────────────┐
          │   VISIBLE              │
          │  (Idle state)          │
          │  Duration: 3000ms      │
          │  (configurable)        │
          └────────────────────────┘
                       │
                       ↓
          ┌────────────────────────┐
          │   EXITING              │
          │  (300ms animation)     │
          │  • translateY: 300     │
          │  • opacity: 0          │
          └────────────────────────┘
                       │
                       ↓
                   REMOVED
```

---

## 📊 Usage Pattern Comparison

### Before (Alert.alert)
```
User Action
    ↓
try/catch/validation
    ↓
Alert.alert('Type', 'Message')
    ↓
[Native Modal Dialog Appears]
    (blocks interaction)
    ↓
User taps OK
    ↓
Dialog closes
    ↓
Continue
```

### After (Toast)
```
User Action
    ↓
try/catch/validation
    ↓
toast.success/error/warning/info('Message')
    ↓
[Toast slides up from bottom]
    (non-blocking)
    ↓
[Auto-dismisses after 3s]
    ↓
[Toast slides out smoothly]
    ↓
Continue (no user action needed)
```

---

## 🎯 Feature Matrix

### Toast Types Comparison

```
┌────────┬─────────────┬───────────────┬──────────────┬─────────────┐
│ Type   │ Icon        │ Color Theme   │ Use Case     │ Recommended │
│        │             │               │              │ Duration    │
├────────┼─────────────┼───────────────┼──────────────┼─────────────┤
│Success │ ✓ Check     │ Green         │ Operation    │ 2000ms      │
│        │ Circle      │ (#10b981)     │ completed    │             │
├────────┼─────────────┼───────────────┼──────────────┼─────────────┤
│Error   │ ! Alert     │ Red           │ Operation    │ 4000ms      │
│        │ Circle      │ (#ef4444)     │ failed       │ (more time) │
├────────┼─────────────┼───────────────┼──────────────┼─────────────┤
│Warning │ ⚠ Alert    │ Amber         │ Important    │ 3000ms      │
│        │             │ (#f59e0b)     │ notice       │             │
├────────┼─────────────┼───────────────┼──────────────┼─────────────┤
│Info    │ ℹ Inform    │ Blue          │ Status/info  │ 2000ms      │
│        │ ation       │ (#3b82f6)     │ messages     │             │
└────────┴─────────────┴───────────────┴──────────────┴─────────────┘
```

---

## 🔀 Theme Switching

### Light Mode → Dark Mode Transition

```
LIGHT MODE
┌──────────────────────────────────────┐
│ ✓ Success Toast                      │
│ Green background, dark text          │
│ Light green border                   │
│ Icon: #10b981 (green)                │
└──────────────────────────────────────┘
         ↓ (User toggles theme)
         ↓
         ↓ (Toast.tsx updates colors)
         ↓
DARK MODE
┌──────────────────────────────────────┐
│ ✓ Success Toast                      │
│ Semi-transparent green, light text   │
│ Semi-transparent green border        │
│ Icon: #10b981 (green)                │
└──────────────────────────────────────┘
```

---

## 📱 Responsive Design

### Screen Size Adaptations

```
SMALL SCREEN (280px width)
┌────────────────────────┐
│ ┌──────────────────┐   │ ← 90% width
│ │ ✓ Record saved   │   │ (width - 32px)
│ └──────────────────┘   │
└────────────────────────┘

MEDIUM SCREEN (375px width)
┌──────────────────────────────┐
│ ┌──────────────────────────┐ │
│ │ ✓ Record saved success!  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘

LARGE SCREEN (430px width)
┌─────────────────────────────────────┐
│ ┌───────────────────────────────┐   │
│ │ ✓ Record saved successfully!  │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘

TABLET (780px width)
┌────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────┐   │
│ │ ✓ Record saved successfully to database! │   │ ← Max width
│ └──────────────────────────────────────────┘   │ applied
└────────────────────────────────────────────────┘
```

---

## 🏗️ Component Hierarchy

### Context & Provider Tree

```
App Root (_layout.tsx)
│
├─ AuthProvider
│  │
│  ├─ PreferencesProvider
│  │  │
│  │  ├─ OnboardingProvider
│  │  │  │
│  │  │  ├─ ThemeProvider
│  │  │  │  │
│  │  │  │  └─ ToastProvider ← Toast System Here
│  │  │  │     │
│  │  │  │     ├─ InitialLayout
│  │  │  │     │
│  │  │  │     └─ Toast Components (Rendered at bottom)
│  │  │  │        (z-index: 9999)
│  │  │  │        ├─ Toast 1
│  │  │  │        ├─ Toast 2 (if multiple)
│  │  │  │        └─ Toast N
```

### Component Usage in Files

```
Any Component (useToast hook available)
│
├─ import { useToast } from '@/context/Toast'
│
├─ const toast = useToast()  (inside component)
│
└─ toast.success/error/warning/info('message')
   │
   └─ Calls ToastContext.showToast()
      │
      └─ Adds toast to state array
         │
         └─ Toast component renders at bottom
            │
            └─ Animation starts
               │
               └─ Auto-dismiss after duration
```

---

## 🎛️ Configuration Points

### Customizable Parameters

```
┌─────────────────────────────────────┐
│  Toast Configuration                │
├─────────────────────────────────────┤
│ • Message text (string)             │
│ • Type (success/error/warning/info) │
│ • Duration (number, milliseconds)   │
│ • Auto-dismiss (automatic)          │
│ • Manual dismiss (optional via ID)  │
│ • Theme (automatic from context)    │
│ • Icons (fixed per type)            │
│ • Colors (fixed per type)           │
│ • Animations (fixed timing)         │
└─────────────────────────────────────┘
```

### Extension Points

```
┌─────────────────────────────────────┐
│  Optional Customizations            │
├─────────────────────────────────────┤
│ • Add new toast types               │
│  (modify getToastConfig in Toast)   │
│                                     │
│ • Change animation timing           │
│  (modify duration values)           │
│                                     │
│ • Adjust color scheme               │
│  (modify color values in config)    │
│                                     │
│ • Change position                   │
│  (modify bottom/padding in styles)  │
│                                     │
│ • Add sound/haptic feedback         │
│  (extend Toast component)           │
└─────────────────────────────────────┘
```

---

## 🎬 Animation Curve

### Visual Timeline

```
ANIMATION CURVE (Linear timing)

Opacity:
100% ┤        ╱╲
     │       ╱  ╲
 75% ┤      ╱    ╲
     │     ╱      ╲
 50% ┤    ╱        ╲
     │   ╱          ╲
 25% ┤  ╱            ╲
     │ ╱              ╲
  0% ├─────────────────────
     0  300ms  3000ms 3300ms
            (duration)

Position (translateY):
300px┤    ╲
     │     ╲
200px┤      ╲
     │       ╲
100px┤        ╲
     │         ╲
  0px├──────────╲────────╱
     │           ╲      ╱
-100 ┤            ╲    ╱
     │             ╲  ╱
-300 ├──────────────╱
     0  300ms  3000ms 3300ms
```

---

## 📋 Migration Visual Guide

### File Update Pattern

```
BEFORE                              AFTER
────────────────────────────────────────────────

import { Alert }                import { useToast }
                                from '@/context/Toast'

const handleSave = async () => {  const toast = useToast()
  try {
    await save()                  const handleSave = async () => {
    Alert.alert(                    try {
      'Success',                      await save()
      'Data saved'       ──→          toast.success(
    )                               'Data saved successfully!'
  } catch (error) {              )
    Alert.alert(                } catch (error) {
      'Error',                    toast.error(
      'Failed to save'  ──→        'Failed to save'
    )                           )
  }                             }
}                               }
```

---

## ✅ QA Verification Checklist

### Visual Verification

```
☐ Success toast shows green color (light/dark)
☐ Error toast shows red color (light/dark)
☐ Warning toast shows amber color (light/dark)
☐ Info toast shows blue color (light/dark)
☐ Icons display correctly for each type
☐ Text renders legibly in both themes
☐ Border color matches type
☐ Shadow/elevation appears on screen
☐ Border radius is visible and correct
☐ Toast fits within screen boundaries
☐ Safe area padding respected
```

### Animation Verification

```
☐ Entrance animation: smooth slide-up + fade-in
☐ Entrance duration: 300ms
☐ Idle state: holds position for ~3000ms
☐ Exit animation: smooth slide-down + fade-out
☐ Exit duration: 300ms
☐ Animation uses native driver
☐ No jank or stuttering observed
☐ Multiple toasts don't conflict
```

### Functional Verification

```
☐ toast.success() shows green toast
☐ toast.error() shows red toast
☐ toast.warning() shows amber toast
☐ toast.info() shows blue toast
☐ Custom duration works: 2000, 4000, 5000ms
☐ Manual dismiss via ID works
☐ Auto-dismiss cleans up timers
☐ No memory leaks on repeated shows
☐ No console errors or warnings
```

---

## 🎉 Visual Summary

### The Toast System at a Glance

```
                    BudgetZen App
           ┌─────────────────────────┐
           │                         │
           │   Your Content Area     │
           │   (User can interact)   │
           │                         │
           ├─────────────────────────┤ ← Z-Index: 9999
           │  ┌────────────────────┐ │
           │  │ ✓ Saved!           │ │  Success (Green)
           │  │ [300ms slide up]   │ │  [3000ms idle]
           │  │ [300ms slide down] │ │  [300ms fade out]
           │  └────────────────────┘ │
           │      ↑ 24px padding     │
           │                         │
           └─────────────────────────┘
                   Mobile Screen
```

---

**Created**: December 2024  
**Status**: ✅ Production Ready  
**For Implementation**: See TOAST_IMPLEMENTATION_GUIDE.md  
**For Quick Help**: See TOAST_QUICK_REFERENCE.md
