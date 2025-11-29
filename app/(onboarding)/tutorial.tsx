import { AnimatedButton } from '@/components/AnimatedButton';
import { useTheme } from '@/context/Theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    key: '1',
    icon: 'folder-multiple-outline',
    title: 'Categories',
    text: 'Create and organize categories to track different types of spending.',
  },
  {
    key: '2',
    icon: 'bank-outline',
    title: 'Accounts',
    text: 'Add your bank accounts and wallets to keep track of your balances.',
  },
  {
    key: '3',
    icon: 'receipt-text-outline',
    title: 'Records',
    text: 'Record your transactions and watch your insights come to life.',
  },
];

const TutorialScreen = () => {
  const { isDark, colors } = useTheme();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Animation values
  const contentOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.9);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: contentScale.value }],
  }));

  const updateAnimations = () => {
    contentOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
    contentScale.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
  };

  const handleScroll = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / width);
    setCurrentIndex(index);
    if (index === 0 || index === slides.length - 1) {
      updateAnimations();
    }
  };

  const handleComplete = async () => {
    try {
      await SecureStore.setItemAsync('onboarding_complete', 'true');
      const saved = await SecureStore.getItemAsync('onboarding_complete');
      
      if (saved) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex - 1,
        animated: true,
      });
    }
  };

  const renderSlide = ({ item }: { item: any }) => (
    <Animated.View
      style={[
        styles.slide,
        { width, backgroundColor: colors.background },
        contentAnimatedStyle,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: colors.accent + '15' },
        ]}
      >
        <MaterialCommunityIcons
          name={item.icon as any}
          size={72}
          color={colors.accent}
        />
      </View>

      <Text
        style={[
          styles.slideTitle,
          { color: colors.text },
        ]}
      >
        {item.title}
      </Text>

      <Text
        style={[
          styles.slideText,
          { color: colors.textSecondary },
        ]}
      >
        {item.text}
      </Text>
    </Animated.View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.stepIndicator,
            { backgroundColor: colors.accent + '20' },
          ]}
        >
          <Text
            style={[
              styles.stepNumber,
              { color: colors.accent },
            ]}
          >
            4/4
          </Text>
        </View>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text },
          ]}
        >
          Getting Started
        </Text>
      </View>

      {/* Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          keyExtractor={(item) => item.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          bounces={false}
        />
      </View>

      {/* Indicators */}
      <View style={styles.indicatorsContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              {
                backgroundColor:
                  index === currentIndex ? colors.accent : colors.border,
                width: index === currentIndex ? 28 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        {currentIndex > 0 && (
          <AnimatedButton
            onPress={handlePrevious}
            style={{ flex: 0.5 }}
          >
            <View
              style={[
                styles.secondaryButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={20}
                color={colors.accent}
              />
            </View>
          </AnimatedButton>
        )}

        <AnimatedButton
          onPress={handleNext}
          style={{ flex: 1 }}
        >
          <View
            style={[
              styles.primaryButton,
              { backgroundColor: colors.accent },
            ]}
          >
            <Text
              style={[
                styles.primaryButtonText,
                { color: colors.textOnAccent },
              ]}
            >
              {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            {currentIndex === slides.length - 1 ? (
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={20}
                color={colors.textOnAccent}
                style={{ marginLeft: 8 }}
              />
            ) : (
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={colors.textOnAccent}
                style={{ marginLeft: 8 }}
              />
            )}
          </View>
        </AnimatedButton>
      </View>

      {/* Features Info */}
      <View
        style={[
          styles.featuresContainer,
          { backgroundColor: colors.surface },
        ]}
      >
        <View
          style={[
            styles.featureBadge,
            { backgroundColor: colors.success + '15' },
          ]}
        >
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={16}
            color={colors.success}
          />
          <Text
            style={[
              styles.featureBadgeText,
              { color: colors.success },
            ]}
          >
            Secure
          </Text>
        </View>
        <View
          style={[
            styles.featureBadge,
            { backgroundColor: colors.info + '15' },
          ]}
        >
          <MaterialCommunityIcons
            name="lightning-bolt"
            size={16}
            color={colors.info}
          />
          <Text
            style={[
              styles.featureBadgeText,
              { color: colors.info },
            ]}
          >
            Fast
          </Text>
        </View>
        <View
          style={[
            styles.featureBadge,
            { backgroundColor: colors.warning + '15' },
          ]}
        >
          <MaterialCommunityIcons
            name="chart-line"
            size={16}
            color={colors.warning}
          />
          <Text
            style={[
              styles.featureBadgeText,
              { color: colors.warning },
            ]}
          >
            Insights
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 8,
  },
  stepIndicator: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  slideText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: width - 60,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  indicator: {
    height: 6,
    borderRadius: 3,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
    alignItems: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  featureBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default TutorialScreen;
