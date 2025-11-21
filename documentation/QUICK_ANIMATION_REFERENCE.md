# 🎬 BudgetZen Animation Quick Reference

## One-Liner Animations

### Fade In
```tsx
const { animatedStyle, startAnimation } = useFadeInAnimation();
useEffect(() => startAnimation(), []);
return <Animated.View style={animatedStyle}>{content}</Animated.View>;
```

### Slide In (Bottom)
```tsx
const { animatedStyle, startAnimation } = useSlideInAnimation();
useEffect(() => startAnimation(), []);
return <Animated.View style={animatedStyle}>{content}</Animated.View>;
```

### Scale Up
```tsx
const { animatedStyle, startAnimation } = useScaleAnimation();
useEffect(() => startAnimation(), []);
return <Animated.View style={animatedStyle}>{content}</Animated.View>;
```

### Bounce
```tsx
const { animatedStyle, bounce } = useBounceAnimation();
return (
  <TouchableOpacity onPress={bounce}>
    <Animated.View style={animatedStyle}>{content}</Animated.View>
  </TouchableOpacity>
);
```

### Animated Button (Press Effect)
```tsx
<AnimatedButton onPress={handlePress}>
  <Text>Press Me</Text>
</AnimatedButton>
```

### Animated Card (List Item)
```tsx
<AnimatedCard delay={index * 50} onPress={handlePress}>
  {itemContent}
</AnimatedCard>
```

### Loading Skeleton
```tsx
<SkeletonCard isDark={isDark} />
```

### Staggered List
```tsx
const animations = useStaggerAnimation(items.length, 50);
{items.map((item, i) => (
  <Animated.View key={i} style={animations[i].animatedStyle}
    onLayout={() => animations[i].startAnimation()}>
    {item}
  </Animated.View>
))}
```

## Animation Speeds

| Config | Duration | Use Case |
|--------|----------|----------|
| `FAST_TIMING_CONFIG` | 300ms | Quick feedback, button presses |
| `TIMING_CONFIG` | 500ms | Standard entrances, transitions |
| `SLOW_TIMING_CONFIG` | 800ms | Emphasis, important changes |
| `SPRING_CONFIG` | Variable | Interactive elements, natural feel |

## Component Cheat Sheet

```
📌 useSlideInAnimation      → Entrance from bottom
📌 useFadeInAnimation       → Smooth fade in
📌 useScaleAnimation        → Grow with fade
📌 useRotateAnimation       → Spin in
📌 useBounceAnimation       → Bouncy press effect
📌 useShakeAnimation        → Shake error state
📌 usePulseAnimation        → Pulsing highlight
📌 useStaggerAnimation      → Multiple items with delay
📌 AnimatedButton           → Press animation button
📌 AnimatedCard             → List item animation
📌 SkeletonLoader           → Shimmer loading state
📌 AnimatedModal            → Slide/Fade modal
```

## Common Patterns

### Button Press
```tsx
<AnimatedButton onPress={action} activeScale={0.95}>
  <Text>Action</Text>
</AnimatedButton>
```

### List Item
```tsx
<AnimatedCard delay={index * 50}>
  <ListItemContent />
</AnimatedCard>
```

### Entrance Animation
```tsx
const { animatedStyle, startAnimation } = useSlideInAnimation();
useEffect(() => startAnimation(), []);
<Animated.View style={animatedStyle}>{content}</Animated.View>
```

### Error Feedback
```tsx
const { animatedStyle, shake } = useShakeAnimation();
<Animated.View style={animatedStyle}>{content}</Animated.View>
shake(); // Call on error
```

### Loading State
```tsx
isLoading ? <SkeletonCard /> : <ActualContent />
```

## Pro Tips

✅ Combine multiple animations for emphasis
✅ Stagger list items for visual rhythm  
✅ Use Spring for interactive elements
✅ Use Timing for entrances
✅ Keep animations under 500ms
✅ Test on real devices (Android/iOS)
✅ Profile with React DevTools

## Full Documentation

See `ANIMATION_GUIDE.md` for complete API documentation and examples.

## Files Created

- `hooks/useAnimations.ts` - All animation hooks
- `components/AnimatedButton.tsx` - Animated button
- `components/AnimatedCard.tsx` - Animated card
- `components/SkeletonLoader.tsx` - Loading skeleton
- `components/AnimatedModal.tsx` - Animated modal
- `components/Header.tsx` - Updated with animations
- `ANIMATION_GUIDE.md` - Full documentation
- `PROFESSIONAL_ANIMATIONS_SUMMARY.md` - Implementation summary

## Ready to Use! 🚀

All animations are production-ready and optimized for 60 FPS.
