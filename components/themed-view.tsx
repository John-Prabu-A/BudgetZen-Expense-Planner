import { View, ViewProps, useColorScheme } from 'react-native';

const Colors = {
  light: {
    background: '#FFFFFF',
    surface: '#F5F5F5',
    border: '#E5E5E5',
    text: '#000000',
    textSecondary: '#666666',
  },
  dark: {
    background: '#1A1A1A',
    surface: '#262626',
    border: '#404040',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
  },
};

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'background' | 'surface';
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  variant = 'background',
  ...otherProps
}: ThemedViewProps) {
  const colorScheme = useColorScheme();
  const backgroundColor =
    colorScheme === 'dark'
      ? darkColor || Colors.dark[variant]
      : lightColor || Colors.light[variant];

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
