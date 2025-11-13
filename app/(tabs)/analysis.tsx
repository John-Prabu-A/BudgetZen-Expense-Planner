import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';

export default function AnalysisScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = {
    background: isDark ? '#1A1A1A' : '#FFFFFF',
    surface: isDark ? '#262626' : '#F5F5F5',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#A0A0A0' : '#666666',
    border: isDark ? '#404040' : '#E5E5E5',
    accent: '#0284c7',
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Monthly Overview
        </Text>
        <View
          style={[
            styles.chartPlaceholder,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="chart-pie"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
            Chart coming soon
          </Text>
        </View>
      </View>

      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Category Breakdown
        </Text>
        <View
          style={[
            styles.listItem,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons name="home" size={24} color={colors.accent} />
          <View style={styles.itemContent}>
            <Text style={[styles.itemTitle, { color: colors.text }]}>Housing</Text>
            <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
              30% of budget
            </Text>
          </View>
          <Text style={[styles.itemAmount, { color: colors.accent }]}>₹15,000</Text>
        </View>

        <View
          style={[
            styles.listItem,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons name="food" size={24} color={colors.accent} />
          <View style={styles.itemContent}>
            <Text style={[styles.itemTitle, { color: colors.text }]}>Food</Text>
            <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
              15% of budget
            </Text>
          </View>
          <Text style={[styles.itemAmount, { color: colors.accent }]}>₹7,500</Text>
        </View>

        <View
          style={[
            styles.listItem,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="shopping"
            size={24}
            color={colors.accent}
          />
          <View style={styles.itemContent}>
            <Text style={[styles.itemTitle, { color: colors.text }]}>
              Shopping
            </Text>
            <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
              10% of budget
            </Text>
          </View>
          <Text style={[styles.itemAmount, { color: colors.accent }]}>₹5,000</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Trends
        </Text>
        <View
          style={[
            styles.trendCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="trending-up"
            size={32}
            color="#10B981"
          />
          <View style={styles.trendContent}>
            <Text style={[styles.trendTitle, { color: colors.text }]}>
              Income Trend
            </Text>
            <Text style={[styles.trendValue, { color: '#10B981' }]}>
              ↑ 12% this month
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.trendCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="trending-down"
            size={32}
            color="#EF4444"
          />
          <View style={styles.trendContent}>
            <Text style={[styles.trendTitle, { color: colors.text }]}>
              Expense Trend
            </Text>
            <Text style={[styles.trendValue, { color: '#EF4444' }]}>
              ↑ 5% this month
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  chartPlaceholder: {
    height: 240,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 12,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  trendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  trendContent: {
    flex: 1,
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  trendValue: {
    fontSize: 12,
    fontWeight: '600',
  },
});
