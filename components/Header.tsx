import { useFadeInAnimation, useSlideInAnimation } from '@/hooks/useAnimations';
import { useUIMode } from '@/hooks/useUIMode';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HeaderProps {
  onMenuPress?: () => void;
}

const Header = ({ onMenuPress }: HeaderProps) => {
  const { lg, md } = useUIMode();
  const colorScheme = useColorScheme();

  // Animation hooks
  const slideAnimation = useSlideInAnimation();
  const fadeAnimation = useFadeInAnimation();

  useEffect(() => {
    slideAnimation.startAnimation();
    fadeAnimation.startAnimation();
  }, []);

  const colors = {
    light: {
      background: '#FFFFFF',
      text: '#111111',
      subText: '#6B7280',
    },
    dark: {
      background: '#1A1A1A',
      text: '#FFFFFF',
      subText: '#9CA3AF',
    },
  };

  const selectedColors = colors[colorScheme || 'light'];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: colors[colorScheme || 'light'].background }}>
      <Animated.View style={[slideAnimation.animatedStyle]}>
        <View
          style={[
            styles.headerContainer,
            {
              backgroundColor: selectedColors.background,
              paddingVertical: lg + 4,
              paddingHorizontal: md,
            },
          ]}
        >
          {/* Menu Button */}
          <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
            <MaterialCommunityIcons
              name="menu"
              size={28}
              color={selectedColors.text}
            />
          </TouchableOpacity>

          {/* Title */}
          <Animated.View style={[styles.titleContainer, fadeAnimation.animatedStyle]}>
            <Text style={styles.inlineText}>
              <Text style={[styles.appName, { color: selectedColors.text }]}>
                Budget
              </Text>
              <Text style={[styles.appNameAccent, { color: selectedColors.text }]}>
                Zen
              </Text>
              {"  "}
              <Text style={[styles.subTitle, { color: selectedColors.subText }]}>
                Expense Planner
              </Text>
            </Text>
          </Animated.View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#303030',
  },
  menuButton: {
    padding: 8,
    marginLeft: 0,
    marginTop: 4,
  },
  titleContainer: {
    flex: 1,
    paddingTop: 8,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  // Makes inline text work
  inlineText: {
    flexDirection: 'row',
  },

  // App title
  appName: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.3,
  },
  appNameAccent: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: '#6366F1', // Elegant Indigo Accent
    letterSpacing: 0.3,
  },

  // Subtitle
  subTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    opacity: 0.65,
    marginLeft: 4,
  },
});

export default Header;
