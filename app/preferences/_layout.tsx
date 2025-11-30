import Header from '@/components/Header';
import SidebarDrawer from '@/components/SidebarDrawer';
import { Stack } from 'expo-router';
import React, { useState } from 'react';

export default function PreferencesLayout() {
  const [drawerVisible, setDrawerVisible] = useState(false);

  return (
    <>
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ 
            header: () => <Header onMenuPress={() => setDrawerVisible(true)} /> 
          }} 
        />
        <Stack.Screen 
          name="appearance" 
          options={{ 
            header: () => <Header onMenuPress={() => setDrawerVisible(true)} /> 
          }} 
        />
        {/* Add other preference screens here */}
      </Stack>
      <SidebarDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </>
  );
}
