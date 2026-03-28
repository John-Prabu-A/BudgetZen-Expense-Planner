import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="notification-tester"
        options={{
          title: '🔔 Notification Tester',
        }}
      />
      <Stack.Screen
        name="notifications-monitor"
        options={{
          title: '📊 Notifications Monitor',
        }}
      />
    </Stack>
  );
}
