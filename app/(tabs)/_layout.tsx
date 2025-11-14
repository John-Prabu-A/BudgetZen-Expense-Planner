import Header from '@/components/Header';
import SidebarDrawer from '@/components/SidebarDrawer';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { useUIMode } from '@/hooks/useUIMode';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useState } from 'react';

const Colors = {
  light: {
    tint: '#0284c7',
    tabIconDefault: '#687076',
    tabIconSelected: '#0284c7',
    background: '#FFFFFF',
    border: '#E5E5E5',
    text: '#000000',
  },
  dark: {
    tint: '#fff',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
    background: '#1A1A1A',
    border: '#404040',
    text: '#FFFFFF',
  },
};

export default function TabsLayout() {
  const colorScheme = useAppColorScheme();
  const { fontMd, md } = useUIMode();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const [drawerVisible, setDrawerVisible] = useState(false);

  return (
    <>
      <SidebarDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.tabIconSelected,
          tabBarInactiveTintColor: colors.tabIconDefault,
          header: () => <Header onMenuPress={() => setDrawerVisible(true)} />,
          tabBarLabelStyle: { fontSize: fontMd },
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Records',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="receipt" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="analysis"
          options={{
            title: 'Analysis',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="chart-line" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="budgets"
          options={{
            title: 'Budgets',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="wallet" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="accounts"
          options={{
            title: 'Accounts',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="bank" size={24} color={color} />
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
          }}
        />
      </Tabs>
    </>
  );
}
