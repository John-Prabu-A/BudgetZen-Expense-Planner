import SidebarDrawer from '@/components/SidebarDrawer';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useState } from 'react';
import { TouchableOpacity } from 'react-native';

const Colors = {
  light: {
    tint: '#0284c7',
    tabIconDefault: '#687076',
    tabIconSelected: '#0284c7',
  },
  dark: {
    tint: '#fff',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
  },
};

export default function TabsLayout() {
  const colorScheme = useAppColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const [drawerVisible, setDrawerVisible] = useState(false);

  return (
    <>
      <SidebarDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.tabIconSelected,
          tabBarInactiveTintColor: colors.tabIconDefault,
          headerShown: true,
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#FFFFFF',
          },
          headerTintColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
          tabBarStyle: {
            backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#FFFFFF',
            borderTopColor: colorScheme === 'dark' ? '#404040' : '#E5E5E5',
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => setDrawerVisible(true)}
              style={{ paddingLeft: 16 }}>
              <MaterialCommunityIcons
                name="menu"
                size={28}
                color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
              />
            </TouchableOpacity>
          ),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Records',
            headerTitle: 'Records',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="receipt" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="analysis"
          options={{
            title: 'Analysis',
            headerTitle: 'Analysis',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="chart-line" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="budgets"
          options={{
            title: 'Budgets',
            headerTitle: 'Budgets',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="wallet" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="accounts"
          options={{
            title: 'Accounts',
            headerTitle: 'Accounts',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="bank" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            title: 'Categories',
            headerTitle: 'Categories',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="tag-multiple" size={24} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
