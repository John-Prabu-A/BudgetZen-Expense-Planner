# 🧪 Animation Testing Guide

## 1. Quick Visual Test

### Test the Header Animation
1. Start the app
2. Observe: Header should slide up from bottom + title fades in
3. Expected: Smooth 500ms entrance animation

### Test Smart Loading (Tab Switch)
1. Go to Records tab
2. Wait for data to load (see loading indicator first time)
3. Switch to Analysis tab
4. Switch back to Records tab
5. Expected: NO loading indicator on second view (data already loaded)

---

## 2. Performance Testing

### Using React DevTools

```tsx
// In your app setup:
import { enableReactNativeComponentTrace } from 'react-native-reanimated';

if (__DEV__) {
  enableReactNativeComponentTrace();
}
```

### Measure Frame Rate
1. Enable "Show Perf Monitor" in React Native
2. Start animations
3. Check FPS (should stay at 60 FPS)
4. Memory should be stable

### Chrome DevTools
1. Remote debug app
2. Open Performance tab
3. Start recording
4. Trigger animation
5. Check for smooth curve in FPS graph

---

## 3. Unit Testing Animations

```tsx
import { renderHook, act } from '@testing-library/react-native';
import { useFadeInAnimation } from '@/hooks/useAnimations';

describe('Animation Hooks', () => {
  it('should start fade animation', () => {
    const { result } = renderHook(() => useFadeInAnimation());
    
    act(() => {
      result.current.startAnimation();
    });

    expect(result.current.opacity.value).toBe(1);
  });

  it('should handle scale animation', () => {
    const { result } = renderHook(() => useScaleAnimation());
    
    act(() => {
      result.current.startAnimation();
    });

    expect(result.current.scale.value).toBe(1);
  });
});
```

---

## 4. Accessibility Testing

### Respect Reduced Motion
```tsx
import { useWindowDimensions } from 'react-native';
import { AccessibilityInfo } from 'react-native';

const useShouldReduceMotion = () => {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.boldTextEnabled().then(enabled => {
      // Optionally reduce motion if accessibility is enabled
    });
  }, []);

  return reduceMotion;
};
```

### Test with Screen Reader
1. Enable VoiceOver (iOS) or TalkBack (Android)
2. Navigate through app
3. Verify animations don't interfere with a11y

---

## 5. Device Testing Checklist

### iOS Devices
- [ ] iPhone 14+ (Modern)
- [ ] iPhone XS (Mid-range)
- [ ] iPad (Larger screen)

### Android Devices
- [ ] Samsung Galaxy S23 (Flagship)
- [ ] Pixel 7a (Mid-range)
- [ ] Budget device (Low-end)

### For Each Device, Test:
- [ ] Header animation plays smoothly
- [ ] List animations stagger correctly
- [ ] Button presses feel responsive
- [ ] Modals slide smoothly
- [ ] Loading skeletons shimmer
- [ ] No frame drops during animations
- [ ] No memory leaks (check RAM)

---

## 6. Orientation Testing

```tsx
// Test animations with device rotation
import { useWindowDimensions } from 'react-native';

export default function App() {
  const { width, height } = useWindowDimensions();

  // Animations should adapt to orientation changes
  return <Content key={`${width}-${height}`} />;
}
```

**Test Steps:**
1. Start animation
2. Rotate device
3. Verify animation completes properly
4. No crashes or visual glitches

---

## 7. Animation Timing Tests

### Measure Animation Duration

```tsx
const testAnimationDuration = () => {
  const start = Date.now();
  const { animatedStyle, startAnimation } = useSlideInAnimation();
  
  startAnimation();
  
  // Should complete in ~500ms (TIMING_CONFIG)
  setTimeout(() => {
    const duration = Date.now() - start;
    console.log(`Animation took ${duration}ms`);
    expect(duration).toBeCloseTo(500, 50); // Allow 50ms variance
  }, 600);
};
```

---

## 8. Stress Testing

### Test Multiple Simultaneous Animations

```tsx
// Create list with 100 items
const stressTestList = () => {
  const items = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
  }));

  return (
    <ScrollView>
      {items.map((item, index) => (
        <AnimatedCard key={item.id} delay={index * 10}>
          {item.name}
        </AnimatedCard>
      ))}
    </ScrollView>
  );
};

// Check:
// - Frame rate stays at 60 FPS
// - Memory usage is stable
// - No lag during scroll
// - All animations complete
```

---

## 9. Visual Regression Testing

### Screenshot Comparison
1. Capture screenshot at animation start
2. Capture at animation midpoint
3. Capture at animation end
4. Compare with baseline
5. Detect visual regressions

```tsx
import RNSharedElement from 'react-native-shared-element';

// Take snapshots at key animation frames
const takeSnapshot = async (name: string) => {
  const uri = await captureScreen({ format: 'png' });
  saveSnapshot(`animation-${name}`, uri);
};
```

---

## 10. Network Conditions Test

### Slow Network Simulation

```tsx
// Test animations during slow loading
const simulateSlowNetwork = async () => {
  // Start animation
  slideAnimation.startAnimation();
  
  // Simulate slow API call
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Animation should complete regardless of network
  // Verify no memory leaks
};
```

---

## 11. Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Janky animation | Heavy JS work | Use `runOnJS` |
| Animation doesn't start | Wrong dependencies | Check useEffect deps |
| Memory leak | Shared values not cleaned | Use cleanup function |
| Frame drops | Too many simultaneous | Stagger or reduce count |
| Black screen on exit | Animation still running | Cancel animation on unmount |

---

## 12. Debugging Tips

### Enable Logging
```tsx
const { animatedStyle, startAnimation, scale } = useScaleAnimation();

useEffect(() => {
  console.log('Starting animation');
  startAnimation();
  
  // Monitor the value
  const check = setInterval(() => {
    console.log('Current scale:', scale.value);
  }, 100);
  
  return () => clearInterval(check);
}, []);
```

### Use React Native Debugger
1. Open React Native Debugger
2. Open Redux DevTools
3. Monitor shared value changes
4. Check animation state

### Android Profiler
1. Open Android Studio Profiler
2. Check CPU, Memory, GPU
3. Verify smooth animations
4. Identify bottlenecks

---

## 13. Performance Benchmarks

### Target Metrics

```
Animation Duration: 300-800ms
Frame Rate: 60 FPS (16.67ms per frame)
Memory per animation: < 1MB
CPU Usage: < 5% during animation
GPU: Native thread (0% JS impact)
```

### Benchmark Test

```tsx
const runBenchmark = async () => {
  const results = {
    animationDuration: 0,
    fps: 0,
    memoryUsed: 0,
    cpuUsage: 0,
  };

  // Measure animation time
  const start = performance.now();
  const { startAnimation } = useSlideInAnimation();
  startAnimation();
  results.animationDuration = performance.now() - start;

  console.log('Benchmark Results:', results);
};
```

---

## 14. Production Checklist

- [ ] All animations run at 60 FPS on target devices
- [ ] No memory leaks detected
- [ ] No console errors or warnings
- [ ] Animations respect user preferences
- [ ] Performance acceptable on low-end devices
- [ ] Loading states smooth and professional
- [ ] No jank during tab transitions
- [ ] All modals animate smoothly
- [ ] Button feedback responsive
- [ ] Charts appear animated
- [ ] Accessibility maintained
- [ ] Battery usage acceptable

---

## 15. Rollout Plan

### Phase 1: Internal Testing
- [ ] Test on all device types
- [ ] Run performance benchmarks
- [ ] Gather team feedback

### Phase 2: Beta Users
- [ ] Release to test group
- [ ] Monitor crash reports
- [ ] Collect performance metrics

### Phase 3: Full Release
- [ ] Deploy to production
- [ ] Monitor user feedback
- [ ] Track animation-related issues

---

## Quick Test Command

```bash
# Run performance profiler
npm run profile

# Run animation tests
npm run test:animations

# Check accessibility
npm run test:a11y

# Full test suite
npm run test
```

---

## Resources

- [React Native Reanimated Testing](https://docs.swmansion.com/react-native-reanimated/docs/guides/testing)
- [Performance Monitoring](https://reactnative.dev/docs/performance)
- [Accessibility Testing](https://reactnative.dev/docs/accessibility)

---

**Status**: Ready for Testing ✅
**Estimated Test Time**: 2-3 hours
**Coverage**: All animations + Performance + Accessibility
