import { useAuth } from '@/context/Auth';
import { useTheme } from '@/context/Theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    InteractionManager,
    Modal,
    PanResponder,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  { id: 'export', label: 'Export Records', icon: 'file-export', route: '/(modal)/export-records-modal', section: 'management' },
  { id: 'backup', label: 'Backup & Restore', icon: 'cloud-upload-outline', route: '/(modal)/backup-restore-modal', section: 'management' },
  { id: 'delete', label: 'Delete & Reset', icon: 'delete-outline', route: '/(modal)/delete-reset-modal', section: 'management' },
  { id: 'preferences', label: 'Preferences', icon: 'cog', route: 'preferences', section: 'settings' },
  { id: 'security', label: 'Security & Privacy', icon: 'lock-outline', route: '/(modal)/security-modal', section: 'settings' },
  { id: 'notifications', label: 'Notifications', icon: 'bell-outline', route: '/(modal)/notifications-modal', section: 'settings' },
  { id: 'advanced', label: 'Advanced Settings', icon: 'tools', route: '/(modal)/advanced-modal', section: 'advanced' },
  { id: 'data-management', label: 'Data Management', icon: 'database-outline', route: '/(modal)/data-management-modal', section: 'advanced' },
  { id: 'about', label: 'About App', icon: 'information-outline', route: '/(modal)/about-modal', section: 'app' },
  { id: 'help', label: 'Help & Support', icon: 'help-circle-outline', route: '/(modal)/help-modal', section: 'app' },
  { id: 'feedback', label: 'Send Feedback', icon: 'email-outline', route: '/(modal)/feedback-modal', section: 'app' },
];

const SectionTitles = {
  management: 'Management',
  settings: 'Settings & Customization',
  advanced: 'Advanced Features',
  app: 'Application',
};

const SectionColors = {
  management: '#EF4444',
  settings: '#F59E0B',
  advanced: '#8B5CF6',
  app: '#3B82F6',
};

export default function SidebarDrawer({ visible, onClose }: SidebarDrawerProps) {
  const { isDark, colors } = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();
  
  // Safe Area Hook
  const insets = useSafeAreaInsets();
  
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  // Optimized Close Action
  const animateClose = useCallback(() => {
    Animated.timing(translateX, {
      toValue: -DRAWER_WIDTH,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onClose();
      }
    });
  }, [onClose, translateX]);

  // Optimized Open Action
  const animateOpen = useCallback(() => {
    translateX.setValue(-DRAWER_WIDTH);
    Animated.spring(translateX, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [translateX]);

  useEffect(() => {
    if (visible) {
      animateOpen();
    } else {
      translateX.setValue(-DRAWER_WIDTH); 
    }
  }, [visible, animateOpen, translateX]);

  const handleNavigation = useCallback((route: string) => {
    animateClose();
    InteractionManager.runAfterInteractions(() => {
      router.push(route as any);
    });
  }, [animateClose, router]);

  const handleLogout = useCallback(() => {
    animateClose();
    InteractionManager.runAfterInteractions(() => {
      signOut();
    });
  }, [animateClose, signOut]);

  // PanResponder with Logic to prevent ScrollView conflict
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        // Only take over if:
        // 1. Moving Left (closing)
        // 2. Moved > 10px
        // 3. Horizontal movement > Vertical movement
        return dx < 0 && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy);
      },
      onPanResponderMove: (_, gestureState) => {
        const newValue = Math.min(0, Math.max(-DRAWER_WIDTH, gestureState.dx));
        translateX.setValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;
        if (dx < -DRAWER_WIDTH * 0.3 || (vx < -0.5 && dx < 0)) {
          animateClose();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  const renderSection = useMemo(() => function renderSectionImpl(section: 'management' | 'settings' | 'advanced' | 'app') {
    const items = MENU_ITEMS.filter((item) => item.section === section);
    const sectionColor = SectionColors[section];
    const sectionTitle = SectionTitles[section];

    return (
      <View key={section} style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionColorBar, { backgroundColor: sectionColor }]} />
          <Text style={[styles.sectionTitle, { color: sectionColor }]}>
            {sectionTitle}
          </Text>
        </View>

        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => handleNavigation(item.route)}
          >
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
  }, [colors, handleNavigation]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={animateClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.drawer,
            {
              backgroundColor: colors.background,
              width: DRAWER_WIDTH,
              transform: [{ translateX }],
            },
          ]}
        >
          {/* Header with Top Safe Area */}
          <View style={[
            styles.drawerHeader, 
            { 
              borderBottomColor: colors.border,
              // Apply safe area padding, with a minimum fall back
              paddingTop: Math.max(insets.top, 20) 
            }
          ]}>
            <TouchableOpacity 
              onPress={animateClose} 
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
                <MaterialCommunityIcons name="account-circle" size={40} color={colors.accent} />
              </View>
              <View style={styles.headerText}>
                <Text style={[styles.appName, { color: colors.text }]}>BudgetZen</Text>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                  {user?.email || 'User'}
                </Text>
              </View>
            </View>
          </View>

          {/* Menu Items */}
          <ScrollView
            style={styles.menuScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.menuContent}
            bounces={false}
          >
            {renderSection('management')}
            {renderSection('settings')}
            {renderSection('advanced')}
            {renderSection('app')}
          </ScrollView>

          {/* Footer with Bottom Safe Area */}
          <View style={[
            styles.drawerFooter, 
            { 
              borderTopColor: colors.border,
              // Apply safe area padding, plus standard spacing
              paddingBottom: Math.max(insets.bottom, 20)
            }
          ]}>
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: colors.danger + '20' }]}
              onPress={handleLogout}
            >
              <MaterialCommunityIcons name="logout" size={20} color={colors.danger} style={styles.logoutIcon} />
              <Text style={[styles.logoutText, { color: colors.danger }]}>Logout</Text>
            </TouchableOpacity>
            <Text style={[styles.versionText, { color: colors.textSecondary }]}>
              BudgetZen v1.0.0
            </Text>
          </View>
        </Animated.View>

        {/* Overlay */}
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={animateClose}
        >
          <Animated.View 
            style={[
              styles.overlayBackground, 
              { 
                backgroundColor: colors.overlay,
                opacity: translateX.interpolate({
                  inputRange: [-DRAWER_WIDTH, 0],
                  outputRange: [0, 1],
                  extrapolate: 'clamp'
                })
              }
            ]} 
          />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    flex: 1,
  },
  overlayBackground: {
    flex: 1,
  },
  drawer: {
    flexDirection: 'column',
    height: '100%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    zIndex: 1000,
  },
  drawerHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
  },
  closeButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginLeft: -8,
    marginBottom: 10,
  },
  menuScroll: {
    flex: 1,
  },
  menuContent: {
    paddingVertical: 8,
    paddingBottom: 20,
  },
  sectionContainer: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  sectionColorBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 8,
  },
  menuIcon: {
    marginRight: 16,
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
    opacity: 0.5,
  },
  drawerFooter: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
  },
  versionText: {
    fontSize: 11,
    textAlign: 'center',
    opacity: 0.6,
  },
});