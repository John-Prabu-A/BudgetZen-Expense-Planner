import { useAuth } from '@/context/Auth';
import { useTheme } from '@/context/Theme';
import { useGestureDrawer } from '@/hooks/useGestureDrawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  GestureResponderEvent,
  Modal,
  PanResponder,
  PanResponderGestureState,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(screenWidth * 0.75, 280);

// Animation Config
const ANIMATION_CONFIG = { friction: 7, tension: 40 };
const QUICK_ANIMATION_CONFIG = { friction: 8, tension: 50 };

// Spacing
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// Sizes
const SIZES = {
  avatar: 56,
  iconLarge: 24,
  iconMedium: 20,
  borderRadiusSmall: 8,
};

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  color?: string;
}

interface MenuSection {
  id: string;
  title: string;
  items: MenuItem[];
}

interface SidebarDrawerProps {
  visible: boolean;
  onClose: () => void;
}

const MENU_SECTIONS: MenuSection[] = [
  {
    id: 'settings',
    title: 'Settings',
    items: [
      { id: 'preferences', label: 'Preferences', icon: 'cog-outline', route: 'preferences', color: '#8B5CF6' },
      { id: 'security', label: 'Security', icon: 'shield-lock-outline', route: 'security-modal', color: '#EC4899' },
    ],
  },
  {
    id: 'data',
    title: 'Data & Backup',
    items: [
      { id: 'export', label: 'Export Data', icon: 'file-export-outline', route: 'export-records-modal', color: '#3B82F6' },
      { id: 'backup', label: 'Backup & Restore', icon: 'cloud-sync-outline', route: 'backup-restore-modal', color: '#10B981' },
      { id: 'delete', label: 'Reset Data', icon: 'alert-circle-outline', route: 'delete-reset-modal', color: '#EF4444' },
    ],
  },
  {
    id: 'support',
    title: 'Support',
    items: [
      { id: 'help', label: 'Help & FAQ', icon: 'help-circle-outline', route: 'help-modal', color: '#F59E0B' },
      { id: 'feedback', label: 'Send Feedback', icon: 'message-square-outline', route: 'feedback-modal', color: '#06B6D4' },
      { id: 'about', label: 'About', icon: 'information-outline', route: 'about-modal', color: '#6366F1' },
    ],
  },
];

// Modern Menu Item Component
const ModernMenuItem = React.memo(
  ({
    item,
    colors,
    onPress,
  }: {
    item: MenuItem;
    colors: any;
    onPress: (route: string) => void;
  }) => {
    const [pressed, setPressed] = useState(false);

    return (
      <TouchableOpacity
        style={[
          styles.menuItem,
          pressed && { backgroundColor: colors.accent + '12' },
        ]}
        onPress={() => onPress(item.route)}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        activeOpacity={0.7}>
        <View style={[styles.colorBar, { backgroundColor: item.color }]} />
        <MaterialCommunityIcons
          name={item.icon as any}
          size={SIZES.iconMedium}
          color={colors.text}
          style={styles.menuIcon}
        />
        <Text style={[styles.menuLabel, { color: colors.text }]} numberOfLines={1}>
          {item.label}
        </Text>
        <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textSecondary} style={styles.chevron} />
      </TouchableOpacity>
    );
  }
);

ModernMenuItem.displayName = 'ModernMenuItem';

// Menu Section Component
const MenuSectionComponent = React.memo(
  ({
    section,
    colors,
    onNavigate,
  }: {
    section: MenuSection;
    colors: any;
    onNavigate: (route: string) => void;
  }) => (
    <View>
      <View style={[styles.sectionHeader, { borderTopColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {section.title.toUpperCase()}
        </Text>
      </View>
      <View style={styles.sectionItems}>
        {section.items.map((item) => (
          <ModernMenuItem key={item.id} item={item} colors={colors} onPress={onNavigate} />
        ))}
      </View>
    </View>
  )
);

MenuSectionComponent.displayName = 'MenuSection';

export default function SidebarDrawer({ visible, onClose }: SidebarDrawerProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { translateX, closeDrawer } = useGestureDrawer({
    drawerWidth: DRAWER_WIDTH,
    onClose,
  });

  const isNavigatingRef = useRef(false);

  const handleNavigation = useCallback(
    (route: string) => {
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;

      closeDrawer();
      setTimeout(() => {
        router.push(route as any);
        isNavigatingRef.current = false;
      }, 300);
    },
    [closeDrawer, router]
  );

  const handleLogout = useCallback(() => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    closeDrawer();
    setTimeout(() => {
      signOut();
      isNavigatingRef.current = false;
    }, 300);
  }, [closeDrawer, signOut]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        return Math.abs(gestureState.dx) > SPACING.lg && gestureState.dx < 0;
      },
      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const newValue = Math.min(0, Math.max(-DRAWER_WIDTH, -DRAWER_WIDTH + gestureState.dx));
        translateX.setValue(newValue);
      },
      onPanResponderRelease: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const shouldClose = gestureState.dx < -DRAWER_WIDTH * 0.3 || (gestureState.vx < -0.3 && gestureState.dx < -DRAWER_WIDTH * 0.1);
        if (shouldClose) {
          closeDrawer();
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: false, ...ANIMATION_CONFIG }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    const targetValue = visible ? 0 : -DRAWER_WIDTH;
    Animated.spring(translateX, {
      toValue: targetValue,
      useNativeDriver: false,
      ...QUICK_ANIMATION_CONFIG,
    }).start();
  }, [visible, translateX]);

  const getInitials = (email: string) => email.split('@')[0].split(/[._-]/).slice(0, 2).map((n) => n[0].toUpperCase()).join('');
  const initials = user?.email ? getInitials(user.email) : 'BZ';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.drawer,
            {
              backgroundColor: colors.background,
              transform: [{ translateX }],
            },
          ]}>
          {/* Header Section */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <MaterialCommunityIcons name="close" size={SIZES.iconLarge} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.profileSection}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.accent }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.appTitle, { color: colors.text }]} numberOfLines={1}>
                  BudgetZen
                </Text>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                  {user?.email || 'Guest'}
                </Text>
              </View>
            </View>
          </View>

          {/* Menu Sections */}
          <ScrollView
            style={styles.menuScroll}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            contentContainerStyle={styles.menuContent}>
            {MENU_SECTIONS.map((section) => (
              <MenuSectionComponent key={section.id} section={section} colors={colors} onNavigate={handleNavigation} />
            ))}
          </ScrollView>

          {/* Footer Section */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.logoutBtn, { backgroundColor: colors.danger + '15' }]}
              onPress={handleLogout}
              activeOpacity={0.7}>
              <MaterialCommunityIcons name="logout" size={SIZES.iconMedium} color={colors.danger} />
              <Text style={[styles.logoutText, { color: colors.danger }]}>Logout</Text>
            </TouchableOpacity>
            <Text style={[styles.versionText, { color: colors.textSecondary }]}>v1.0.0</Text>
          </View>
        </Animated.View>

        <TouchableOpacity
          style={[styles.overlay, { backgroundColor: colors.overlay }]}
          activeOpacity={1}
          onPress={onClose}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  overlay: {
    flex: 1,
  },
  drawer: {
    width: DRAWER_WIDTH,
    flexDirection: 'column',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    gap: SPACING.md,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: SPACING.sm,
    borderRadius: SIZES.borderRadiusSmall,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatarCircle: {
    width: SIZES.avatar,
    height: SIZES.avatar,
    borderRadius: SIZES.avatar / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  userEmail: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  menuScroll: {
    flex: 1,
  },
  menuContent: {
    paddingVertical: SPACING.lg,
  },
  sectionHeader: {
    borderTopWidth: 1,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sectionItems: {
    marginHorizontal: SPACING.sm,
    gap: SPACING.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: SIZES.borderRadiusSmall,
    gap: SPACING.md,
  },
  colorBar: {
    width: 3,
    height: 24,
    borderRadius: 1.5,
  },
  menuIcon: {
    marginRight: SPACING.xs,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  chevron: {
    marginLeft: SPACING.xs,
  },
  footer: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderTopWidth: 1,
    gap: SPACING.md,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: SIZES.borderRadiusSmall,
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  versionText: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});
