import { useTheme } from '@/context/Theme';
import { SPRING_CONFIG, TIMING_CONFIG } from '@/hooks/useAnimations';
import React, { useEffect } from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';

interface AnimatedModalProps {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
  style?: any;
  animationType?: 'slide' | 'fade' | 'scale';
  isDark?: boolean;
}

export const AnimatedModal = ({
  visible,
  onRequestClose,
  children,
  style,
  animationType = 'slide',
  isDark: overrideDark = false,
}: AnimatedModalProps) => {
  const { isDark: themeDark, colors } = useTheme();
  const isDark = overrideDark !== undefined ? overrideDark : themeDark;
  const translateY = useSharedValue(Dimensions.get('window').height);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      if (animationType === 'slide') {
        translateY.value = withSpring(0, SPRING_CONFIG);
      } else if (animationType === 'scale') {
        scale.value = withSpring(1, SPRING_CONFIG);
      }
      opacity.value = withTiming(1, TIMING_CONFIG);
      backdropOpacity.value = withTiming(1, TIMING_CONFIG);
    } else {
      if (animationType === 'slide') {
        translateY.value = withTiming(Dimensions.get('window').height, TIMING_CONFIG);
      } else if (animationType === 'scale') {
        scale.value = withTiming(0.95, TIMING_CONFIG);
      }
      opacity.value = withTiming(0, TIMING_CONFIG);
      backdropOpacity.value = withTiming(0, TIMING_CONFIG);
    }
  }, [visible, animationType]);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    if (animationType === 'slide') {
      return {
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
      };
    } else if (animationType === 'scale') {
      return {
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
      };
    }
    return {
      opacity: opacity.value,
    };
  });

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onRequestClose}
    >
      <Animated.View
        style={[
          styles.backdrop,
          {
            backgroundColor: colors.overlay,
          },
          backdropAnimatedStyle,
        ]}
      >
        <View style={styles.centerer} />
      </Animated.View>

      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: colors.surface,
          },
          containerAnimatedStyle,
          style,
        ]}
      >
        {children}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  centerer: {
    flex: 1,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 1,
    maxHeight: '90%',
    shadowColor: 'rgba(0,0,0,0.15)',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
});
