import { AnimatedCard } from '@/components/AnimatedCard';
import { OnboardingStep, useOnboarding } from '@/context/Onboarding';
import { usePreferences } from '@/context/Preferences';
import { useTheme } from '@/context/Theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { currencies } from '../../lib/currencies';

const { width } = Dimensions.get('window');

const getCurrencySymbol = (code: string): string => {
  const symbolMap: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'INR': '₹',
    'AUD': '$',
    'CAD': '$',
    'CHF': 'CHF',
    'CNY': '¥',
    'SEK': 'kr',
    'NZD': '$',
    'MXN': '$',
  };
  return symbolMap[code] || code;
};

const CurrencyScreen = () => {
  const { isDark, colors } = useTheme();
  const { completeStep, skipToStep } = useOnboarding();
  const { setCurrencySign } = usePreferences();
  const [search, setSearch] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
  const router = useRouter();

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerScale = useSharedValue(0.9);

  // Animate header on mount
  useEffect(() => {
    headerOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    headerScale.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ scale: headerScale.value }],
  }));

  const filteredCurrencies = currencies.filter(
    (currency) =>
      currency.name.toLowerCase().includes(search.toLowerCase()) ||
      currency.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleCurrencySelect = async (code: string) => {
    try {
      console.log('[Currency] User selected currency:', code);
      setSelectedCurrency(code);
      
      const symbol = getCurrencySymbol(code);
      console.log('[Currency] Setting currency symbol:', symbol);
      
      // Save to preferences first
      await setCurrencySign(symbol as any);
      console.log('[Currency] Saved to preferences');
      
      // Complete this onboarding step
      console.log('[Currency] Completing onboarding step...');
      await completeStep(OnboardingStep.CURRENCY);
      console.log('[Currency] Onboarding step completed');
      
      // Navigate to next screen explicitly
      console.log('[Currency] Navigating to privacy screen...');
      router.push('/(onboarding)/privacy');
    } catch (error) {
      console.error('[Currency] Error selecting currency:', error);
    }
  };

  const handleSkip = async () => {
    try {
      console.log('[Currency] Skipping onboarding...');
      await skipToStep(OnboardingStep.COMPLETED);
      // _layout should automatically catch this and navigate, but we can be explicit
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('[Currency] Error skipping onboarding:', error);
    }
  };

  const renderCurrencyItem = ({ item, index }: { item: any; index: number }) => (
    <AnimatedCard
      delay={index * 30}
      style={{ marginBottom: 10 }}
      onPress={() => handleCurrencySelect(item.code)}
    >
      <View
        style={[
          styles.currencyCard,
          {
            backgroundColor: selectedCurrency === item.code ? colors.accent + '20' : colors.surface,
            borderColor: selectedCurrency === item.code ? colors.accent : colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.currencyIconContainer,
            {
              backgroundColor: selectedCurrency === item.code ? colors.accent : colors.background,
            },
          ]}
        >
          <Text
            style={[
              styles.currencySymbol,
              {
                color: selectedCurrency === item.code ? colors.textOnAccent : colors.accent,
              },
            ]}
          >
            {getCurrencySymbol(item.code)}
          </Text>
        </View>

        <View style={styles.currencyInfoContainer}>
          <Text
            style={[
              styles.currencyName,
              { color: colors.text },
            ]}
          >
            {item.name}
          </Text>
          <Text
            style={[
              styles.currencyCode,
              { color: colors.textSecondary },
            ]}
          >
            {item.code}
          </Text>
        </View>

        {selectedCurrency === item.code && (
          <MaterialCommunityIcons
            name="check-circle"
            size={24}
            color={colors.accent}
          />
        )}
      </View>
    </AnimatedCard>
  );

  const renderListHeader = () => (
    <Animated.View style={headerAnimatedStyle}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
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
              1/4
            </Text>
          </View>
          <Text
            style={[
              styles.headerTitle,
              { color: colors.text },
            ]}
          >
            Select Currency
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: colors.textSecondary },
            ]}
          >
            Choose your preferred currency for all transactions
          </Text>
        </View>
      </View>

      {/* Search Input */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={colors.textSecondary}
        />
        <TextInput
          style={[
            styles.searchInput,
            { color: colors.text },
          ]}
          placeholder="Search currency..."
          placeholderTextColor={colors.inputPlaceholder}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <MaterialCommunityIcons
            name="close-circle"
            size={20}
            color={colors.textSecondary}
            onPress={() => setSearch('')}
          />
        ) : null}
      </View>

      <TouchableOpacity onPress={handleSkip} style={[styles.skipButton, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Text style={[styles.skipText, { color: colors.accent }]}>Already have an account? Sign In</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderListFooter = () => (
    <View style={{ height: 20 }} />
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <FlatList
        data={filteredCurrencies}
        keyExtractor={(item) => item.code}
        renderItem={renderCurrencyItem}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerContent: {
    gap: 12,
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
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
    marginBottom: 20,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  currencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  currencyIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
  },
  currencyInfoContainer: {
    flex: 1,
  },
  currencyName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  currencyCode: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default CurrencyScreen;
