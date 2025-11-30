

import { Stack } from 'expo-router';

const OnboardingLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="currency" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="reminders" />
      <Stack.Screen name="tutorial" />
    </Stack>
  );
};

export default OnboardingLayout;

