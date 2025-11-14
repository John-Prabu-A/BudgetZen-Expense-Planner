import React from 'react';
import { Stack } from 'expo-router';
import Header from '@/components/Header';

export default function PreferencesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ header: () => <Header /> }} />
      <Stack.Screen name="appearance" options={{ header: () => <Header /> }} />
      {/* Add other preference screens here */}
    </Stack>
  );
}
