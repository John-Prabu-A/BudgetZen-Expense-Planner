import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import React, { createContext, useContext } from 'react';

/**
 * Comprehensive color theme palette
 * Covers all UI needs across the app
 */
export interface ThemeColors {
  // Core backgrounds
  background: string;          // Main app background
  surface: string;             // Cards, containers, surfaces
  surfaceLight: string;        // Slightly lighter surface
  overlay: string;             // Dark overlay for modals

  // Text colors
  text: string;                // Primary text
  textSecondary: string;       // Secondary/muted text
  textTertiary: string;        // Tertiary/hint text
  textInverse: string;         // Inverse text for dark backgrounds

  // Borders & dividers
  border: string;              // Primary border
  borderLight: string;         // Light border
  borderStrong: string;        // Strong border
  divider: string;             // Divider line

  // Semantic colors
  accent: string;              // Primary action/accent
  income: string;              // Positive/Income
  expense: string;             // Negative/Expense
  transfer: string;            // Transfer/Neutral
  warning: string;             // Warning state
  success: string;             // Success state
  danger: string;              // Danger state
  info: string;                // Info state

  // Interactive elements
  buttonPrimary: string;       // Primary button background
  buttonSecondary: string;     // Secondary button background
  inputBackground: string;     // Input field background
  inputBorder: string;         // Input field border
  inputPlaceholder: string;    // Input placeholder text

  // Gradients (shadow, depth effects)
  shadowColor: string;         // Shadow color
  shadowColorAlt: string;      // Alternative shadow color for special effects

  // Chart specific
  chartAxis: string;           // Chart axis labels
  chartGrid: string;           // Chart grid lines
  chartBackground: string;     // Chart background

  // Component specific
  tabBarBackground: string;    // Bottom tab bar
  tabIconActive: string;       // Active tab icon
  tabIconInactive: string;     // Inactive tab icon
  headerBackground: string;    // Header background
  headerBorder: string;        // Header border

  // Chart category colors palette (for pie charts, etc.)
  chartColor1: string;         // #FF6384
  chartColor2: string;         // #36A2EB
  chartColor3: string;         // #FFCE56
  chartColor4: string;         // #4BC0C0
  chartColor5: string;         // #9966FF
  chartColor6: string;         // #FF9F40

  // Text colors for light backgrounds
  textOnAccent: string;        // White text on colored backgrounds
}

export interface Theme {
  isDark: boolean;
  colors: ThemeColors;
}

const ThemeContext = createContext<Theme | undefined>(undefined);

/**
 * Light theme colors
 */
const lightTheme: ThemeColors = {
  // Core backgrounds
  background: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceLight: '#FAFAFA',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Text colors
  text: '#000000',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textInverse: '#FFFFFF',

  // Borders & dividers
  border: '#E5E5E5',
  borderLight: '#F0F0F0',
  borderStrong: '#D0D0D0',
  divider: '#EEEEEE',

  // Semantic colors
  accent: '#0284c7',           // Primary blue
  income: '#10B981',           // Emerald green
  expense: '#EF4444',          // Vibrant red
  transfer: '#8B5CF6',         // Purple
  warning: '#F59E0B',          // Amber
  success: '#10B981',          // Green
  danger: '#EF4444',           // Red
  info: '#3B82F6',             // Blue

  // Interactive elements
  buttonPrimary: '#0284c7',
  buttonSecondary: '#FFFFFF',
  inputBackground: '#F9F9F9',
  inputBorder: '#E5E5E5',
  inputPlaceholder: '#999999',

  // Gradients
  shadowColor: '#0284c7',
  shadowColorAlt: '#000000',

  // Chart specific
  chartAxis: '#666666',
  chartGrid: '#E5E5E5',
  chartBackground: '#F5F5F5',

  // Component specific
  tabBarBackground: '#FFFFFF',
  tabIconActive: '#0284c7',
  tabIconInactive: '#687076',
  headerBackground: '#F8F8F8',
  headerBorder: '#E5E5E5',

  // Chart category colors palette
  chartColor1: '#FF6384',
  chartColor2: '#36A2EB',
  chartColor3: '#FFCE56',
  chartColor4: '#4BC0C0',
  chartColor5: '#9966FF',
  chartColor6: '#FF9F40',

  // Text colors for light backgrounds
  textOnAccent: '#FFFFFF',
};

/**
 * Dark theme colors
 * OLED-friendly with #0F0F0F as base
 */
const darkTheme: ThemeColors = {
  // Core backgrounds
  background: '#0F0F0F',
  surface: '#1A1A1A',
  surfaceLight: '#262626',
  overlay: 'rgba(0, 0, 0, 0.8)',

  // Text colors
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textTertiary: '#808080',
  textInverse: '#000000',

  // Borders & dividers
  border: '#404040',
  borderLight: '#2A2A2A',
  borderStrong: '#555555',
  divider: '#333333',

  // Semantic colors
  accent: '#0284c7',           // Primary blue (same across themes)
  income: '#10B981',           // Emerald green (same across themes)
  expense: '#EF4444',          // Vibrant red (same across themes)
  transfer: '#8B5CF6',         // Purple (same across themes)
  warning: '#F59E0B',          // Amber (same across themes)
  success: '#10B981',          // Green (same across themes)
  danger: '#EF4444',           // Red (same across themes)
  info: '#3B82F6',             // Blue (same across themes)

  // Interactive elements
  buttonPrimary: '#0284c7',
  buttonSecondary: '#262626',
  inputBackground: '#333333',
  inputBorder: '#404040',
  inputPlaceholder: '#808080',

  // Gradients
  shadowColor: '#000000',
  shadowColorAlt: '#0284c7',

  // Chart specific
  chartAxis: '#A0A0A0',
  chartGrid: '#404040',
  chartBackground: '#1A1A1A',

  // Component specific
  tabBarBackground: '#1A1A1A',
  tabIconActive: '#FFFFFF',
  tabIconInactive: '#9BA1A6',
  headerBackground: '#1A1A1A',
  headerBorder: '#404040',

  // Chart category colors palette (same across themes)
  chartColor1: '#FF6384',
  chartColor2: '#36A2EB',
  chartColor3: '#FFCE56',
  chartColor4: '#4BC0C0',
  chartColor5: '#9966FF',
  chartColor6: '#FF9F40',

  // Text colors for light backgrounds
  textOnAccent: '#FFFFFF',
};

/**
 * Theme Provider Component
 */
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkTheme : lightTheme;

  const theme: Theme = {
    isDark,
    colors,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to use the theme context
 * @returns {Theme} Current theme object with isDark flag and colors
 */
export const useTheme = (): Theme => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Hook to use only theme colors
 * @returns {ThemeColors} Current theme colors
 */
export const useThemeColors = (): ThemeColors => {
  const { colors } = useTheme();
  return colors;
};
