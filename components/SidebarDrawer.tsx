import { useAuth } from '@/context/Auth';
import { useTheme } from '@/context/Theme';
import { useGestureDrawer } from '@/hooks/useGestureDrawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
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
    View
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(screenWidth * 0.75, 300);

interface SidebarDrawerProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  section: 'management' | 'settings' | 'advanced' | 'app';
}

const MENU_ITEMS: MenuItem[] = [
  // Management Section
  {
    id: 'export',
    label: 'Export Records',
    icon: 'file-export',
    route: 'export-records-modal',
    section: 'management',
  },
  {
    id: 'backup',
    label: 'Backup & Restore',
    icon: 'cloud-upload-outline',
    route: 'backup-restore-modal',
    section: 'management',
  },
  {
    id: 'delete',
    label: 'Delete & Reset',
    icon: 'delete-outline',
    route: 'delete-reset-modal',
    section: 'management',
  },

  // Settings Section
  {
    id: 'preferences',
    label: 'Preferences',
    icon: 'cog',
    route: 'preferences',
    section: 'settings',
  },
  {
    id: 'security',
    label: 'Security & Privacy',
    icon: 'lock-outline',
    route: 'security-modal',
    section: 'settings',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: 'bell-outline',
    route: 'notifications-modal',
    section: 'settings',
  },

  // Advanced Section
  {
    id: 'advanced',
    label: 'Advanced Settings',
    icon: 'tools',
    route: 'advanced-modal',
    section: 'advanced',
  },
  {
    id: 'data-management',
    label: 'Data Management',
    icon: 'database-outline',
    route: 'data-management-modal',
    section: 'advanced',
  },

  // App Section
  {
    id: 'about',
    label: 'About App',
    icon: 'information-outline',
    route: 'about-modal',
    section: 'app',
  },
  {
    id: 'help',
    label: 'Help & Support',
    icon: 'help-circle-outline',
    route: 'help-modal',
    section: 'app',
  },
  {
    id: 'feedback',
    label: 'Send Feedback',
    icon: 'email-outline',
    route: 'feedback-modal',
    section: 'app',
  },
];

const SectionTitles = {
  management: 'Management',
  settings: 'Settings & Customization',
  advanced: 'Advanced Features',
  app: 'Application',
};

const SectionColors = {
  management: '#EF4444', // Red
  settings: '#F59E0B', // Amber
  advanced: '#8B5CF6', // Purple
  app: '#3B82F6', // Blue
};

export default function SidebarDrawer({ visible, onClose }: SidebarDrawerProps) {
  const { isDark, colors } = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();

  // Use gesture drawer hook for smooth animation
  const { translateX, closeDrawer } = useGestureDrawer({
    drawerWidth: DRAWER_WIDTH,
    onClose,
  });

  // Pan responder for swiping drawer closed
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        // Respond to left swipe (closing)
        return Math.abs(gestureState.dx) > 10 && gestureState.dx < 0;
      },
      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        // Allow drawer to follow finger while dragging
        // Limit movement between -drawerWidth and 0
        const newValue = Math.min(0, Math.max(-DRAWER_WIDTH, -DRAWER_WIDTH + gestureState.dx));
        translateX.setValue(newValue);
      },
      onPanResponderRelease: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        // Determine if we should close based on velocity and position
        const threshold = DRAWER_WIDTH * 0.3; // 30% threshold
        const velocity = gestureState.vx; // Positive = moving right, negative = moving left
        const currentPosition = (translateX as any)._value;

        // Close if swiped left significantly or dragged left past threshold
        if (gestureState.dx < -threshold || (velocity < -0.3 && gestureState.dx < -DRAWER_WIDTH * 0.1)) {
          closeDrawer();
        } else {
          // Re-open if didn't swipe far enough
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
            friction: 8,
            tension: 40,
          }).start();
        }
      },
    })
  ).current;

  // Update animation when visible prop changes
  useEffect(() => {
    if (visible) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: false,
        friction: 8,    // Smooth deceleration
        tension: 40,    // Quick initial response
      }).start();
    } else {
      Animated.spring(translateX, {
        toValue: -DRAWER_WIDTH,
        useNativeDriver: false,
        friction: 8,
        tension: 40,
      }).start();
    }
  }, [visible, translateX]);

  const handleNavigation = (route: string) => {
    onClose();
    // Use setTimeout to ensure modal closes before navigation
    setTimeout(() => {
      router.push(route as any);
    }, 200);
  };

  const handleLogout = () => {
    onClose();
    setTimeout(() => {
      signOut();
    }, 200);
  };

  const renderSection = (section: 'management' | 'settings' | 'advanced' | 'app') => {
    const items = MENU_ITEMS.filter((item) => item.section === section);
    const sectionColor = SectionColors[section];
    const sectionTitle = SectionTitles[section];

    return (
      <View key={section}>
        <View style={styles.sectionHeader}>
          <View
            style={[styles.sectionColorBar, { backgroundColor: sectionColor }]}
          />
          <Text style={[styles.sectionTitle, { color: sectionColor }]}>
            {sectionTitle}
          </Text>
        </View>

        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem,
              { borderBottomColor: colors.border },
            ]}
            onPress={() => handleNavigation(item.route)}>
            <MaterialCommunityIcons
              name={item.icon as any}
              size={22}
              color={sectionColor}
              style={styles.menuIcon}
            />
            <Text style={[styles.menuLabel, { color: colors.text }]}>
              {item.label}
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
              style={styles.menuArrow}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        {/* Drawer on LEFT - slides from left */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.drawer,
            {
              backgroundColor: colors.background,
              width: DRAWER_WIDTH,
              transform: [{ translateX: translateX }],
            },
          ]}>
          {/* Header */}
        <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View
              style={[
                styles.avatarPlaceholder,
                { backgroundColor: colors.surface },
              ]}>
              <MaterialCommunityIcons
                name="account-circle"
                size={40}
                color={colors.accent}
              />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.appName, { color: colors.text }]}>
                BudgetZen
              </Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                {user?.email || 'User'}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <ScrollView
          style={styles.menuScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.menuContent}>
          {renderSection('management')}
          {renderSection('settings')}
          {renderSection('advanced')}
          {renderSection('app')}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.drawerFooter, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.logoutButton,
              { backgroundColor: colors.danger + '20' },
            ]}
            onPress={handleLogout}>
            <MaterialCommunityIcons
              name="logout"
              size={20}
              color={colors.danger}
              style={styles.logoutIcon}
            />
            <Text style={[styles.logoutText, { color: colors.danger }]}>Logout</Text>
          </TouchableOpacity>

          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            BudgetZen v1.0.0
          </Text>
        </View>
        </Animated.View>

        {/* Overlay on RIGHT - fills remaining space */}
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
    flexDirection: 'column',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1000,
  },
  drawerHeader: {
    padding: 16,
    borderBottomWidth: 1,
    paddingTop: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
    paddingBottom: 12,
  },
  menuScroll: {
    flex: 1,
  },
  menuContent: {
    paddingVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
    gap: 10,
  },
  sectionColorBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    marginHorizontal: 8,
  },
  menuIcon: {
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  menuArrow: {
    marginLeft: 8,
  },
  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
  },
  versionText: {
    fontSize: 11,
    textAlign: 'center',
  },
});
