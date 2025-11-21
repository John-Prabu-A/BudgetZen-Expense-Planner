import { useState } from 'react';
import {
    Easing,
    Extrapolate,
    interpolate,
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming
} from 'react-native-reanimated';

/**
 * Premium spring animation configuration
 */
export const SPRING_CONFIG = {
  damping: 10,
  mass: 1,
  stiffness: 100,
  overshootClamping: false,
  restSpeedThreshold: 2,
  restDisplacementThreshold: 2,
};

/**
 * Premium timing animation configuration
 */
export const TIMING_CONFIG = {
  duration: 500,
  easing: Easing.out(Easing.cubic),
};

/**
 * Fast timing animation configuration
 */
export const FAST_TIMING_CONFIG = {
  duration: 300,
  easing: Easing.out(Easing.quad),
};

/**
 * Slow timing animation configuration
 */
export const SLOW_TIMING_CONFIG = {
  duration: 800,
  easing: Easing.out(Easing.cubic),
};

/**
 * Fade in animation
 */
export const useFadeInAnimation = (shouldAnimate = true) => {
  const opacity = useSharedValue(shouldAnimate ? 0 : 1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const startAnimation = () => {
    opacity.value = withTiming(1, TIMING_CONFIG);
  };

  return { animatedStyle, startAnimation, opacity };
};

/**
 * Slide in animation from bottom
 */
export const useSlideInAnimation = (shouldAnimate = true) => {
  const translateY = useSharedValue(shouldAnimate ? 50 : 0);
  const opacity = useSharedValue(shouldAnimate ? 0 : 1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const startAnimation = () => {
    opacity.value = withTiming(1, TIMING_CONFIG);
    translateY.value = withTiming(0, TIMING_CONFIG);
  };

  return { animatedStyle, startAnimation, translateY, opacity };
};

/**
 * Scale animation
 */
export const useScaleAnimation = (shouldAnimate = true) => {
  const scale = useSharedValue(shouldAnimate ? 0.9 : 1);
  const opacity = useSharedValue(shouldAnimate ? 0 : 1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const startAnimation = () => {
    opacity.value = withTiming(1, TIMING_CONFIG);
    scale.value = withSpring(1, SPRING_CONFIG);
  };

  return { animatedStyle, startAnimation, scale, opacity };
};

/**
 * Bounce animation
 */
export const useBounceAnimation = () => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bounce = () => {
    scale.value = withSpring(1.1, SPRING_CONFIG);
    scale.value = withDelay(100, withSpring(1, SPRING_CONFIG));
  };

  return { animatedStyle, bounce, scale };
};

/**
 * Rotate animation
 */
export const useRotateAnimation = (shouldAnimate = true) => {
  const rotation = useSharedValue(shouldAnimate ? -20 : 0);
  const opacity = useSharedValue(shouldAnimate ? 0 : 1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
    opacity: opacity.value,
  }));

  const startAnimation = () => {
    opacity.value = withTiming(1, TIMING_CONFIG);
    rotation.value = withSpring(0, SPRING_CONFIG);
  };

  return { animatedStyle, startAnimation, rotation, opacity };
};

/**
 * Pulse animation - for emphasis
 */
export const usePulseAnimation = (isActive = true) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const startPulse = () => {
    if (!isActive) return;
    scale.value = withTiming(1.05, { duration: 500, easing: Easing.inOut(Easing.ease) });
    scale.value = withDelay(500, withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }));
  };

  return { animatedStyle, startPulse, scale };
};

/**
 * Shake animation - for errors
 */
export const useShakeAnimation = () => {
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const shake = () => {
    const shakeSequence = [
      withTiming(-10, { duration: 50, easing: Easing.linear }),
      withTiming(10, { duration: 50, easing: Easing.linear }),
      withTiming(-10, { duration: 50, easing: Easing.linear }),
      withTiming(10, { duration: 50, easing: Easing.linear }),
      withTiming(0, { duration: 50, easing: Easing.linear }),
    ];

    translateX.value = shakeSequence[0];
    for (let i = 1; i < shakeSequence.length; i++) {
      translateX.value = withDelay(i * 50, shakeSequence[i]);
    }
  };

  return { animatedStyle, shake, translateX };
};

/**
 * Flip animation
 */
export const useFlipAnimation = (shouldAnimate = true) => {
  const rotateY = useSharedValue(shouldAnimate ? 90 : 0);
  const opacity = useSharedValue(shouldAnimate ? 0 : 1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${rotateY.value}deg` }],
    opacity: opacity.value,
  }));

  const startAnimation = () => {
    opacity.value = withTiming(1, TIMING_CONFIG);
    rotateY.value = withSpring(0, SPRING_CONFIG);
  };

  return { animatedStyle, startAnimation, rotateY, opacity };
};

/**
 * Expand/Collapse animation
 */
export const useExpandAnimation = (isExpanded = false) => {
  const height = useSharedValue(isExpanded ? 1 : 0);
  const opacity = useSharedValue(isExpanded ? 1 : 0);

  const animatedStyle = useAnimatedStyle(() => ({
    height: interpolate(height.value, [0, 1], [0, 300], Extrapolate.CLAMP),
    opacity: opacity.value,
  }));

  const toggle = () => {
    height.value = withTiming(height.value === 0 ? 1 : 0, FAST_TIMING_CONFIG);
    opacity.value = withTiming(height.value === 0 ? 1 : 0, FAST_TIMING_CONFIG);
  };

  return { animatedStyle, toggle, height, opacity };
};

/**
 * Slide animation from left
 */
export const useSlideFromLeftAnimation = (shouldAnimate = true) => {
  const translateX = useSharedValue(shouldAnimate ? -100 : 0);
  const opacity = useSharedValue(shouldAnimate ? 0 : 1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const startAnimation = () => {
    opacity.value = withTiming(1, TIMING_CONFIG);
    translateX.value = withTiming(0, TIMING_CONFIG);
  };

  return { animatedStyle, startAnimation, translateX, opacity };
};

/**
 * Staggered animation for multiple items
 */
export const useStaggerAnimation = (itemCount: number, delay = 50) => {
  const animations = Array.from({ length: itemCount }).map((_, index) => {
    const translateY = useSharedValue(20);
    const opacity = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    }));

    const startAnimation = () => {
      translateY.value = withDelay(
        index * delay,
        withTiming(0, TIMING_CONFIG)
      );
      opacity.value = withDelay(
        index * delay,
        withTiming(1, TIMING_CONFIG)
      );
    };

    return { animatedStyle, startAnimation, translateY, opacity };
  });

  return animations;
};

/**
 * Custom hook for animated list item
 */
export const useAnimatedListItem = (delay = 0) => {
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const startAnimation = () => {
    translateY.value = withDelay(delay, withTiming(0, FAST_TIMING_CONFIG));
    opacity.value = withDelay(delay, withTiming(1, FAST_TIMING_CONFIG));
    scale.value = withDelay(delay, withSpring(1, SPRING_CONFIG));
  };

  return { animatedStyle, startAnimation, translateY, opacity, scale };
};

/**
 * Custom hook for animated number/value change
 */
export const useAnimatedCounter = (value: number) => {
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  useAnimatedReaction(
    () => value,
    (newValue) => {
      animatedValue.value = withTiming(newValue, {
        duration: 1000,
        easing: Easing.out(Easing.quad),
      });
    },
    [value]
  );

  return { animatedValue, displayValue };
};
