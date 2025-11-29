import { useTheme } from '@/context/Theme';
import { ReactNode } from 'react';
import {
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View
} from 'react-native';

interface ParallaxScrollViewProps extends ScrollViewProps {
  headerBackgroundColor?: {
    light: string;
    dark: string;
  };
  headerImage?: ReactNode;
  children?: ReactNode;
}

const HEADER_HEIGHT = 250;

export default function ParallaxScrollView({
  headerBackgroundColor,
  headerImage,
  children,
  ...scrollViewProps
}: ParallaxScrollViewProps) {
  const { isDark, colors } = useTheme();
  
  const headerBackground = headerBackgroundColor
    ? (isDark ? headerBackgroundColor.dark : headerBackgroundColor.light)
    : colors.headerBackground;

  return (
    <ScrollView
      scrollEventThrottle={16}
      {...scrollViewProps}
      contentContainerStyle={{
        flexGrow: 1,
      }}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: headerBackground,
            minHeight: HEADER_HEIGHT,
          },
        ]}
      >
        <View style={styles.headerImageContainer}>
          {headerImage}
        </View>
      </View>
      <View style={styles.content}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 20,
  },
  headerImageContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 16,
  },
});
