# 🎨 Edit Category Modal - Visual Design Guide

## Component Anatomy (After Refactor)

```
┌─────────────────────────────────────────────┐
│                                             │
│  [✕]  Edit Category            [Padding: 0] │  ← Header (12px top/bottom)
│─────────────────────────────────────────────│  ← Border (0.5px)
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  [●] Category Name   [14px padding] │   │  ← Preview Card
│  │       Preview                       │   │
│  └─────────────────────────────────────┘   │
│                                             │  ← 14px gap
│  Name                                       │  ← Section Label
│  [Input............................................]  ← Input (10px padding)
│                                             │  ← 14px gap
│  Color                                      │  ← Section Label
│  [●] [●] [●] [●]                          │
│  [●] [●] [●] [●]   [22.5% width, 10px gap]│
│  [●] [●] [●] [●]                          │
│                                             │  ← 14px gap
│  Icon                                       │  ← Section Label
│  [■] [■] [■] [■]                          │
│  [■] [■] [■] [■]   [22.5% width, 10px gap]│
│  [■] [■] [■] [■]                          │
│                                             │  ← 14px gap
│  [Cancel]          [✓ Save Changes]        │  ← Button Container (10px gap)
│                                             │  ← Padding Bottom: 24px
└─────────────────────────────────────────────┘
```

---

## Color Picker Detail

### State: Unselected
```
[●] 
 ↑
Background: Surface color (#F5F5F5 light / #262626 dark)
Border: 1px, border color (#E5E5E5 light / #404040 dark)
Size: 22.5% of width
Aspect ratio: 1:1 (square)
Border radius: 10px
```

### State: Selected
```
[✓●]  ← Scales up to 1.08x
 ↑
Background: Original color (e.g., #FF6B6B)
Border: 2.5px (0.5px thicker when selected)
Border color: Text color (opposite of unselected)
Scale: 108% (slight "pop" effect)
Checkmark: White, 18px
Shadow: Text shadow on checkmark
```

### Interaction
```
User taps color
     ↓
Scale animates from 100% → 108%
     ↓
Border color changes
     ↓
Preview updates instantly
     ↓
Visual feedback complete
```

---

## Icon Picker Detail

### State: Unselected
```
[■]
 ↑
Background: Surface color (#F5F5F5 light / #262626 dark)
Border: 1px, border color (#E5E5E5 light / #404040 dark)
Icon color: Text color
Size: 22.5% of width
Icon size: 22px
Border radius: 10px
```

### State: Selected
```
[■]  ← No border when selected
 ↑
Background: Accent color (#0284c7)
Border: 0px (removed)
Icon color: White (#FFFFFF)
Size: 22.5% of width
Icon size: 22px
Border radius: 10px
```

### Interaction
```
User taps icon
     ↓
Background changes to accent
     ↓
Border disappears
     ↓
Icon color becomes white
     ↓
Preview updates instantly
     ↓
Visual feedback complete
```

---

## Button States

### Cancel Button

**Idle State:**
```
┌──────────────┐
│   Cancel     │
└──────────────┘
Background: Surface color
Border: 1px, border color
Text: Body text color
Padding: 11px vertical
Border radius: 10px
```

**Disabled State:**
```
┌──────────────┐
│   Cancel     │ (opacity: 0.6)
└──────────────┘
Opacity: 60%
Border: Same
Interaction: None
```

### Save Button

**Idle State:**
```
┌──────────────────────┐
│ [✓] Save Changes    │
└──────────────────────┘
Background: Accent color (#0284c7)
Text: White
Icon: Checkmark (18px)
Padding: 11px vertical
Border radius: 10px
Flex: 1.2 (slightly wider)
```

**Loading State:**
```
┌──────────────────────┐
│ [⟳] Saving         │
└──────────────────────┘
Background: Accent color
Text: White
Icon: Loading spinner
Opacity: 60%
Interaction: Disabled
```

**Disabled State:**
```
┌──────────────────────┐
│ [✓] Save Changes    │ (opacity: 0.6)
└──────────────────────┘
Opacity: 60%
Interaction: None
```

---

## Input Field Detail

### Style
```
┌─────────────────────────────────┐
│ Enter category name         · · ·│
└─────────────────────────────────┘
 ↑
Border: 1px
Border color: (#E5E5E5 light / #404040 dark)
Border radius: 10px
Padding: 10px horizontal, 10px vertical
Background: Surface color
Text color: Body text color
Placeholder color: Secondary text color
Font size: 14px
Font weight: 500
Max length: 20 characters
```

### Interaction
```
User focuses
     ↓
Keyboard appears
     ↓
User types
     ↓
Preview updates live
     ↓
Scroll action
     ↓
Keyboard auto-hides
     ↓
Text persists
```

---

## Preview Card Detail

### Layout
```
┌─────────────────────────────────┐
│ [●] Category Name               │
│     Preview                     │
└─────────────────────────────────┘
```

### Icon
```
[●] 
52x52 pixels
Border radius: 26px (perfect circle)
Background: Selected color (e.g., #FF6B6B)
Icon: 28px, white color
Centered inside
```

### Text
```
Category Name
└─ Font size: 15px
└─ Font weight: 700
└─ Color: Body text color
└─ Margin bottom: 2px

Preview
└─ Font size: 12px
└─ Font weight: 500
└─ Color: Secondary text color
```

### Card Style
```
Padding: 14px
Border radius: 12px
Border: 1px, border color
Background: Surface color
Gap between icon & text: 12px
```

---

## Spacing System

### Vertical Spacing
```
Header: 12px padding (top/bottom)
Between header & preview: 16px margin
Preview & input: 14px gap
Input & color label: 14px gap
Color grid items: 10px gap
Color & icon label: 14px gap
Icon grid items: 10px gap
Icon & buttons: 14px gap
Buttons bottom padding: 24px
```

### Horizontal Spacing
```
Container: 16px padding (left/right)
Grid items: 22.5% width each
Grid gap: 10px (justified spread)
Button gap: 10px
Preview icon gap: 12px
```

---

## Typography Hierarchy

### Level 1: Header
```
Font size: 18px
Font weight: 700
Letter spacing: 0.3px
Usage: Modal title "Edit Category"
```

### Level 2: Section Labels
```
Font size: 13px
Font weight: 700
Letter spacing: 0.5px
Text transform: UPPERCASE
Usage: "Name", "Color", "Icon"
```

### Level 3: Input/Body
```
Font size: 14-15px
Font weight: 500-600
Usage: Input field, button text
```

### Level 4: Secondary
```
Font size: 12px
Font weight: 500
Color: Secondary text
Usage: "Preview" label
```

---

## Color System (Both Modes)

### Light Mode
```
Background:    #FFFFFF  (white)
Surface:       #F5F5F5  (light gray)
Border:        #E5E5E5  (light border)
Text:          #000000  (black)
Text Secondary:#666666  (gray)
Accent:        #0284c7  (blue)
```

### Dark Mode
```
Background:    #1A1A1A  (near black)
Surface:       #262626  (dark gray)
Border:        #404040  (dark border)
Text:          #FFFFFF  (white)
Text Secondary:#A0A0A0  (light gray)
Accent:        #0284c7  (same blue)
```

---

## Border Radius System

```
Container/Cards: 12px     (Large curves)
Inputs/Options:  10px     (Medium curves)
Icons:           26px     (Circles)
```

---

## Shadows & Effects

### Preview Card
```
Shadow: None (clean design)
Border: 1px only
```

### Color/Icon Options
```
Shadow: None (tap feedback via scale)
Scale on select: 1.08x
```

### Input Field
```
Shadow: None
Border: 1px on focus
```

### Buttons
```
Shadow: None
Opacity change: Active state
```

---

## Responsive Behavior

### Width Variations
```
Small screen (320px):
- Padding: 16px (maintained)
- Grid: 4 columns (22.5% each)
- All elements scale proportionally

Large screen (600px):
- Padding: 16px (same)
- Grid: 4 columns (same)
- Proportional scaling

XL screen (1000px+):
- Modal: Still 4 columns
- Readable without excessive width
```

### Height Behavior
```
Content height: ~600px (fits in viewport)
Scrollable: Yes (if needed)
Scroll behavior: Smooth
Keyboard behavior: Auto-dismisses on scroll
```

---

## Interaction Patterns

### Tap Feedback
```
All touchable: activeOpacity (0.7-0.8)
Color selector: Scale + border change
Icon selector: Background + color change
Button: Opacity change
```

### Visual Transitions
```
Color scale: Instant (same frame)
Border: Instant (same frame)
Background: Instant (same frame)
Preview: Instant (same frame)
```

### Keyboard
```
On focus: Show keyboard
On scroll: Hide keyboard
On button: Hide keyboard
Input: Editable field with cursor
```

---

## Dark Mode Screenshots (Text)

### Light Mode
```
╔════════════════════════════════╗
║ ✕  Edit Category              ║ (Black text on white bg)
╠════════════════════════════════╣
║ ┌──────────────────────────┐   ║ (Light gray surface)
║ │ [FF6B6B] New Category    │   ║ (Red icon)
║ │         Preview          │   ║
║ └──────────────────────────┘   ║
║                                ║
║ NAME                           ║ (Uppercase, small)
║ [New Category_______________]  ║ (Dark text)
║                                ║
║ COLOR                          ║
║ [●][●][●][●]  (Selected Red)   ║ (Scaled checkmark)
║ [●][●][●][●]                  ║
║ [●][●][●][●]                  ║
║                                ║
║ [Cancel]  [✓ Save Changes]     ║ (Blue accent button)
╚════════════════════════════════╝
```

### Dark Mode
```
╔════════════════════════════════╗
║ ✕  Edit Category              ║ (White text on dark bg)
╠════════════════════════════════╣
║ ┌──────────────────────────┐   ║ (Dark gray surface)
║ │ [FF6B6B] New Category    │   ║ (Red icon, same)
║ │         Preview          │   ║
║ └──────────────────────────┘   ║
║                                ║
║ NAME                           ║ (Uppercase, small)
║ [New Category_______________]  ║ (Light text)
║                                ║
║ COLOR                          ║
║ [●][●][●][●]  (Selected Red)   ║ (Scaled checkmark)
║ [●][●][●][●]                  ║
║ [●][●][●][●]                  ║
║                                ║
║ [Cancel]  [✓ Save Changes]     ║ (Blue accent button, same)
╚════════════════════════════════╝
```

---

## Animation Specifications

### Color Selection
```
Trigger: User tap
Duration: Instant (0ms - same frame)
Type: Scale + Border
Start: scale(1), borderWidth: 1px
End: scale(1.08), borderWidth: 2.5px
Easing: Linear (instant)
```

### Icon Selection
```
Trigger: User tap
Duration: Instant (0ms - same frame)
Type: Background color + border toggle
Start: Surface bg, 1px border
End: Accent bg, 0px border
Easing: Linear (instant)
```

### Button Press
```
Trigger: User tap
Duration: While pressed
Type: Opacity
Active opacity: 0.7-0.8
```

---

## Accessibility Considerations

✅ Color + icon feedback (not color-only)
✅ Large tap targets (22.5% width minimum)
✅ High contrast text
✅ Clear labels
✅ Keyboard navigation
✅ Focus indicators (implicit from tap feedback)
✅ Semantic structure
✅ Proper text sizing

---

**Design System Complete!** 🎨

All visual specifications documented for consistency and quality assurance.
