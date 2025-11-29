import { useTheme } from '@/context/Theme';
import { useFadeInAnimation, useSlideInAnimation } from '@/hooks/useAnimations';
import { useUIMode } from '@/hooks/useUIMode';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HeaderProps {
  onMenuPress?: () => void;
}

const Header = ({ onMenuPress }: HeaderProps) => {
  const { lg, md } = useUIMode();
  const { isDark, colors } = useTheme();

  // Animation hooks
  const slideAnimation = useSlideInAnimation();
  const fadeAnimation = useFadeInAnimation();

  useEffect(() => {
    slideAnimation.startAnimation();
    fadeAnimation.startAnimation();
  }, []);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: colors.background }}>
      <Animated.View style={[slideAnimation.animatedStyle]}>
        <View
          style={[
            styles.headerContainer,
            {
              backgroundColor: colors.headerBackground,
              borderBottomColor: colors.headerBorder,
              paddingBottom: md,
              paddingHorizontal: md,
            },
          ]}
        >
          {/* Menu Button */}
          <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
            <MaterialCommunityIcons
              name="menu"
              size={28}
              color={colors.text}
            />
          </TouchableOpacity>

          {/* Title */}
          <Animated.View style={[styles.titleContainer, fadeAnimation.animatedStyle]}>
            <Text style={styles.inlineText}>
              <Text style={[styles.appName, { color: colors.text }]}>
                Budget
              </Text>
              <Text style={[styles.appNameAccent, { color: colors.accent }]}>
                Zen
              </Text>
              {"  "}
              <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
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
