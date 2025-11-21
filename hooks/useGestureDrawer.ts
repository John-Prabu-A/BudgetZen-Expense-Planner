import { useCallback, useRef } from 'react';
import {
    Animated,
    Dimensions,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface UseGestureDrawerOptions {
  drawerWidth: number;
  enabled?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

/**
 * Custom hook for smooth drawer animation
 * Provides spring animation that feels natural and responsive
 */
export const useGestureDrawer = ({
  drawerWidth,
  enabled = true,
  onOpen,
  onClose,
}: UseGestureDrawerOptions) => {
  // Animated value ranges from -drawerWidth (closed) to 0 (open)
  const translateX = useRef(new Animated.Value(-drawerWidth)).current;

  // Track if drawer should be open
  const isOpenRef = useRef(false);

  const openDrawer = useCallback(() => {
    isOpenRef.current = true;
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: false,
      friction: 8, // Smooth spring animation
      tension: 40,
    }).start(onOpen);
  }, [translateX, onOpen]);

  const closeDrawer = useCallback(() => {
    isOpenRef.current = false;
    Animated.spring(translateX, {
      toValue: -drawerWidth,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start(onClose);
  }, [drawerWidth, translateX, onClose]);

  const setDrawerOpen = useCallback((open: boolean) => {
    if (open) {
      openDrawer();
    } else {
      closeDrawer();
    }
  }, [openDrawer, closeDrawer]);

  return {
    translateX,
    openDrawer,
    closeDrawer,
    setDrawerOpen,
    isOpen: isOpenRef.current,
  };
};
