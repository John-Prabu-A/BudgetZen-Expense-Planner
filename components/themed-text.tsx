import { Text, TextProps, useColorScheme } from 'react-native';

const Colors = {
  light: {
    text: '#000000',
    textSecondary: '#666666',
    accent: '#0284c7',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    accent: '#0a7ea4',
  },
};

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
  const colorScheme = useColorScheme();
  const color =
    colorScheme === 'dark'
      ? darkColor || Colors.dark.text
      : lightColor || Colors.light.text;

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
