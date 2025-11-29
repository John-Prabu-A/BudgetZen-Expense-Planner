import { useTheme } from '@/context/Theme';
import { Text, TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const { isDark, colors } = useTheme();
  
  const color = isDark
    ? darkColor || colors.text
    : lightColor || colors.text;

  const fontStyles = {
    default: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
    },
    defaultSemiBold: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '600' as const,
    },
    title: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '700' as const,
    },
    subtitle: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '600' as const,
    },
  };

  return (
    <Text
      style={[
        {
          color,
        },
        fontStyles[type],
        style,
      ]}
      {...rest}
    />
  );
}
