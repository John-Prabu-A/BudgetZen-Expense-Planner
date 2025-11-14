import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

export function HelloWave() {
  const colorScheme = useAppColorScheme();
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
