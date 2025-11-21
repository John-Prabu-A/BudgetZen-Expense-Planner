import React from 'react';
import {
    StyleSheet,
    TouchableOpacity
} from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming
} from 'react-native-reanimated';

interface AnimatedCardProps {
  onPress?: () => void;
  isExpanded?: boolean;
  children: React.ReactNode;
  style?: any;
  delay?: number;
}

export const AnimatedCard = ({
  onPress,
  isExpanded = false,
  children,
  style,
  delay = 0,
}: AnimatedCardProps) => {
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    // Stagger animation with delay
    scale.value = withDelay(delay, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
  }, [delay, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.container}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});
