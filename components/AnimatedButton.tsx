import { FAST_TIMING_CONFIG, SPRING_CONFIG } from '@/hooks/useAnimations';
import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';

interface AnimatedButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
  disabled?: boolean;
  activeScale?: number;
}

export const AnimatedButton = ({
  onPress,
  children,
  style,
  disabled = false,
  activeScale = 0.95,
}: AnimatedButtonProps) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(activeScale, SPRING_CONFIG);
    opacity.value = withTiming(0.8, FAST_TIMING_CONFIG);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG);
    opacity.value = withTiming(1, FAST_TIMING_CONFIG);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={1}
        style={styles.button}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    overflow: 'hidden',
  },
});
