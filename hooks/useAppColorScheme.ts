import { usePreferences } from '@/context/Preferences';
import { useColorScheme } from 'react-native';

/**
 * Custom hook that respects the user's theme preference
 * Combines system color scheme with user preference
 * 
 * Returns: 'light' | 'dark'
 */
export const useAppColorScheme = (): 'light' | 'dark' => {
  const systemColorScheme = useColorScheme();
  const { theme } = usePreferences();

  // If user set it to 'system', use the system color scheme
  if (theme === 'system') {
    return systemColorScheme === 'dark' ? 'dark' : 'light';
  }

  // Otherwise, use the user's preference
  return theme as 'light' | 'dark';
};
