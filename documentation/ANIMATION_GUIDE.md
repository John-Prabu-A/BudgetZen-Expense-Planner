# Professional Animation System - BudgetZen

## Overview
BudgetZen now features a comprehensive, professional animation system using `react-native-reanimated` v4. This document explains how to use the new animation hooks and components throughout the app.

## Animation Hooks

### 1. **useFadeInAnimation**
Smooth fade-in effect for elements.

```tsx
const { animatedStyle, startAnimation, opacity } = useFadeInAnimation();

useEffect(() => {
  startAnimation();
}, []);

return <Animated.View style={animatedStyle}>{content}</Animated.View>;
```

### 2. **useSlideInAnimation**
Slide in from bottom with fade effect.

```tsx
const { animatedStyle, startAnimation } = useSlideInAnimation();

useEffect(() => {
  startAnimation();
}, []);

return <Animated.View style={animatedStyle}>{content}</Animated.View>;
```

### 3. **useScaleAnimation**
Scale up animation with fade-in.

```tsx
const { animatedStyle, startAnimation } = useScaleAnimation();

useEffect(() => {
  startAnimation();
}, []);

return <Animated.View style={animatedStyle}>{content}</Animated.View>;
```

### 4. **useBounceAnimation**
Bouncy effect for emphasis.

```tsx
const { animatedStyle, bounce } = useBounceAnimation();

return (
  <TouchableOpacity onPress={bounce}>
    <Animated.View style={animatedStyle}>{content}</Animated.View>
  </TouchableOpacity>
);
```

### 5. **useRotateAnimation**
Rotate in animation.

```tsx
const { animatedStyle, startAnimation } = useRotateAnimation();

useEffect(() => {
  startAnimation();
}, []);

return <Animated.View style={animatedStyle}>{content}</Animated.View>;
```

### 6. **usePulseAnimation**
Pulse effect for active/highlight states.

```tsx
const { animatedStyle, startPulse } = usePulseAnimation(isActive);

useEffect(() => {
  const interval = setInterval(startPulse, 2000);
  return () => clearInterval(interval);
}, [isActive]);

return <Animated.View style={animatedStyle}>{content}</Animated.View>;
```

### 7. **useShakeAnimation**
Shake effect for errors or alerts.

```tsx
const { animatedStyle, shake } = useShakeAnimation();

const handleError = () => {
  shake();
};

return <Animated.View style={animatedStyle}>{content}</Animated.View>;
```

### 8. **useFlipAnimation**
3D flip effect.

```tsx
const { animatedStyle, startAnimation } = useFlipAnimation();

useEffect(() => {
  startAnimation();
}, []);

return <Animated.View style={animatedStyle}>{content}</Animated.View>;
```

### 9. **useStaggerAnimation**
Staggered animations for multiple items.

```tsx
const animations = useStaggerAnimation(itemCount, 50); // 50ms delay between items

return (
  <View>
    {items.map((item, index) => (
      <Animated.View
        key={item.id}
        style={[animations[index].animatedStyle]}
        onLayout={() => animations[index].startAnimation()}
      >
        {/* Item content */}
      </Animated.View>
    ))}
  </View>
);
```

### 10. **useAnimatedListItem**
Pre-configured animation for list items.

```tsx
const { animatedStyle, startAnimation } = useAnimatedListItem(delay);

useEffect(() => {
  startAnimation();
}, []);

return <Animated.View style={animatedStyle}>{item}</Animated.View>;
```

## Animated Components

### 1. **AnimatedButton**
Button with press animations.

```tsx
import { AnimatedButton } from '@/components/AnimatedButton';

<AnimatedButton 
  onPress={handlePress}
  activeScale={0.95}
>
  <Text>Press Me</Text>
</AnimatedButton>
```

### 2. **AnimatedCard**
Card with entrance animation.

```tsx
import { AnimatedCard } from '@/components/AnimatedCard';

<AnimatedCard 
  onPress={handlePress}
  delay={index * 50}
>
  {/* Card content */}
</AnimatedCard>
```

### 3. **SkeletonLoader**
Shimmer skeleton for loading states.

```tsx
import { SkeletonLoader, SkeletonLines, SkeletonCard } from '@/components/SkeletonLoader';

// Single skeleton
<SkeletonLoader width={100} height={20} />

// Multiple lines
<SkeletonLines count={5} />

// Card skeleton
<SkeletonCard />
```

## Configuration Constants

```tsx
// Premium spring animation (smooth, natural)
SPRING_CONFIG = {
  damping: 10,
  mass: 1,
  stiffness: 100,
  overshootClamping: false,
  restSpeedThreshold: 2,
  restDisplacementThreshold: 2,
}

// Standard timing (500ms)
TIMING_CONFIG = {
  duration: 500,
  easing: Easing.out(Easing.cubic),
}

// Fast timing (300ms)
FAST_TIMING_CONFIG = {
  duration: 300,
  easing: Easing.out(Easing.quad),
}

// Slow timing (800ms)
SLOW_TIMING_CONFIG = {
  duration: 800,
  easing: Easing.out(Easing.cubic),
}
```

## Best Practices

1. **Use Spring for Interactive Elements**
   - Buttons
   - Cards on press
   - Expandable items

2. **Use Timing for Entrance Animations**
   - Page transitions
   - List item entrances
   - Modal appearances

3. **Combine Multiple Animations**
   - Fade + Scale for emphasis
   - Slide + Fade for entrances
   - Rotate + Scale for attention

4. **Stagger List Animations**
   - Use `useStaggerAnimation` hook
   - Adds visual rhythm
   - Reduces perceived load time

5. **Performance Optimization**
   - Use `runOnJS` for side effects
   - Avoid re-creating animations unnecessarily
   - Use `useCallback` for animation functions

## Example: Animated Records List

```tsx
import { useStaggerAnimation } from '@/hooks/useAnimations';
import { AnimatedCard } from '@/components/AnimatedCard';

export const RecordsList = ({ records }) => {
  const animations = useStaggerAnimation(records.length, 50);

  return (
    <View>
      {records.map((record, index) => (
        <AnimatedCard
          key={record.id}
          delay={index * 50}
          onLayout={() => animations[index].startAnimation()}
        >
          <RecordItem record={record} />
        </AnimatedCard>
      ))}
    </View>
  );
};
```

## Color and Motion Design

All animations follow Material Design principles:
- **Easing**: Consistent use of cubic easing for natural motion
- **Duration**: Appropriate for context (300-800ms)
- **Spring**: Natural physics-based movements
- **Stagger**: Visual hierarchy and rhythm

## Customization

To create custom animations:

```tsx
const useCustomAnimation = () => {
  const value = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ 
      translateX: interpolate(
        value.value, 
        [0, 1], 
        [0, 100], 
        Extrapolate.CLAMP
      ) 
    }],
  }));

  const start = () => {
    value.value = withTiming(1, TIMING_CONFIG);
  };

  return { animatedStyle, start, value };
};
```

## Performance Tips

1. **Memoize Animated Components**
   ```tsx
   const AnimatedItem = React.memo(({ item, delay }) => {
     const { animatedStyle, startAnimation } = useAnimatedListItem(delay);
     // ...
   });
   ```

2. **Use `runOnJS` for State Updates**
   ```tsx
   const handleAnimationEnd = useCallback(() => {
     runOnJS(setCompleted)(true);
   }, []);
   ```

3. **Profile with React DevTools**
   - Monitor animation frame rate
   - Check for unnecessary re-renders
   - Optimize shared value usage

## References
- [React Native Reanimated Docs](https://docs.swmansion.com/react-native-reanimated/)
- [Material Design Motion](https://material.io/design/motion)
