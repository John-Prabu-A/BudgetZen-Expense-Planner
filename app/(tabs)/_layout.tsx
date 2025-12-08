import Header from '@/components/Header';
import SidebarDrawer from '@/components/SidebarDrawer';
import { useTheme } from '@/context/Theme';
import { useUIMode } from '@/hooks/useUIMode';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const { isDark, colors } = useTheme();
  const { fontMd, md } = useUIMode();
  const insets = useSafeAreaInsets();
  const [drawerVisible, setDrawerVisible] = useState(false);

  return (
    <>
      <SidebarDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.tabIconActive,
          tabBarInactiveTintColor: colors.tabIconInactive,
          header: () => <Header onMenuPress={() => setDrawerVisible(true)} />,
          tabBarLabelStyle: { fontSize: fontMd * 0.75, marginBottom: 8 },
          tabBarStyle: {
            backgroundColor: colors.tabBarBackground,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 12),
            paddingHorizontal: 0,
            paddingTop: 8,
            height: 70 + Math.max(insets.bottom, 0),
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Records',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="receipt" size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="analysis"
          options={{
            title: 'Analysis',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="chart-line" size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="budgets"
          options={{
            title: 'Budgets',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="wallet" size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="accounts"
          options={{
            title: 'Accounts',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="bank" size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            title: 'Categories',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="tag-multiple" size={24} color={color} />
            ),
            href: null, // Hide from tab bar completely
          }}
        />
      </Tabs>
    </>
  );
}
