import { useTheme } from '@/context/Theme';
import { View, ViewProps } from 'react-native';

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
  const { isDark, colors } = useTheme();
  
  const backgroundColor = isDark
    ? darkColor || (variant === 'background' ? colors.background : colors.surface)
    : lightColor || (variant === 'background' ? colors.background : colors.surface);

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
