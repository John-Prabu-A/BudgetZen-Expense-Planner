import React, { useEffect } from 'react';
import {
    StyleSheet,
    View,
} from 'react-native';
import Animated, {
    Easing,
    Extrapolate,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
  isDark?: boolean;
}

export const SkeletonLoader = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  isDark = false,
}: SkeletonLoaderProps) => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      shimmer.value,
      [0, 1],
      [0.5, 1],
      Extrapolate.CLAMP
    );

    return {
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

interface SkeletonLineProps {
  count?: number;
  spacing?: number;
  isDark?: boolean;
  style?: any;
}

export const SkeletonLines = ({
  count = 3,
  spacing = 12,
  isDark = false,
  style,
}: SkeletonLineProps) => {
  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={{ marginBottom: spacing }}>
          <SkeletonLoader height={16} borderRadius={6} isDark={isDark} />
        </View>
      ))}
    </View>
  );
};

interface SkeletonCardProps {
  isDark?: boolean;
  style?: any;
}

export const SkeletonCard = ({ isDark = false, style }: SkeletonCardProps) => {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#262626' : '#f5f5f5',
        },
        style,
      ]}
    >
      {/* Avatar */}
      <SkeletonLoader
        width={44}
        height={44}
        borderRadius={8}
        isDark={isDark}
        style={{ marginBottom: 12 }}
      />

      {/* Title */}
      <SkeletonLoader height={18} borderRadius={6} isDark={isDark} style={{ marginBottom: 8 }} />

      {/* Subtitle */}
      <SkeletonLoader height={14} borderRadius={6} isDark={isDark} style={{ width: '70%' }} />
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  container: {
    width: '100%',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
});
