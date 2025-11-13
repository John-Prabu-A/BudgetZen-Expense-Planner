import { StyleSheet, useColorScheme } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';

export function HelloWave() {
  const colorScheme = useColorScheme();
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(1, {
        duration: 600,
        easing: Easing.poly(1),
      }),
      -1,
      true
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${rotation.value * 25}deg`,
        },
      ],
    };
  });

  return (
    <Animated.Text
      style={[
        styles.text,
        animatedStyle,
        {
          color: colorScheme === 'dark' ? '#0a7ea4' : '#0284c7',
        },
      ]}>
      👋
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 28,
    lineHeight: 32,
  },
});
