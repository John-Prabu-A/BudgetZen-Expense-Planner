import { useAuth } from '@/context/Auth';
import { readCategories, readRecords } from '@/lib/finance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';

export default function AnalysisScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, session } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const colors = {
    background: isDark ? '#1A1A1A' : '#FFFFFF',
    surface: isDark ? '#262626' : '#F5F5F5',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#A0A0A0' : '#666666',
    border: isDark ? '#404040' : '#E5E5E5',
    accent: '#0284c7',
    income: '#10B981',
    expense: '#EF4444',
  };

  useEffect(() => {
    if (user && session) {
      loadData();
    }
  }, [user, session]);

  // Reload data whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user && session) {
        loadData();
      }
    }, [user, session])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [recordsData, categoriesData] = await Promise.all([
        readRecords(),
        readCategories(),
      ]);
      setRecords(recordsData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error loading analysis data:', error);
      Alert.alert('Error', 'Failed to load analysis data');
    } finally {
      setLoading(false);
    }
  };

  // Current month data
  const currentMonthData = useMemo(() => {
    const monthRecords = records.filter((r) => {
      const recordDate = new Date(r.date);
      return (
        recordDate.getMonth() === selectedDate.getMonth() && 
        recordDate.getFullYear() === selectedDate.getFullYear()
      );
    });

    const income = monthRecords
      .filter((r) => r.type === 'INCOME')
      .reduce((sum, r) => sum + r.amount, 0);
    const expense = monthRecords
      .filter((r) => r.type === 'EXPENSE')
      .reduce((sum, r) => sum + r.amount, 0);

    return { income, expense, records: monthRecords };
  }, [records, selectedDate]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, any> = {};
    const categoryMap: Record<string, any> = {};

    categories.forEach((cat: any) => {
      categoryMap[cat.id] = cat;
    });

    currentMonthData.records
      .filter((r: any) => r.type === 'EXPENSE')
      .forEach((record: any) => {
        if (!breakdown[record.category_id]) {
          breakdown[record.category_id] = {
            id: record.category_id,
            name: record.category,
            icon: record.icon,
            color: record.category_color,
            amount: 0,
            count: 0,
          };
        }
        breakdown[record.category_id].amount += record.amount;
        breakdown[record.category_id].count += 1;
      });

    const result = Object.values(breakdown).sort((a: any, b: any) => b.amount - a.amount);
    return result as Array<{
      id: string;
      name: string;
      icon: string;
      color: string;
      amount: number;
      count: number;
    }>;
  }, [currentMonthData, categories]);

  // Calculate percentage for category
  const getCategoryPercentage = (amount: number) => {
    const total = categoryBreakdown.reduce((sum: number, cat: any) => sum + cat.amount, 0);
    return total > 0 ? Math.round((amount / total) * 100) : 0;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Monthly Overview Chart */}
      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Monthly Overview
        </Text>
        
        {currentMonthData.income > 0 || currentMonthData.expense > 0 ? (
          <View
            style={[
              styles.chartContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Income and Expense Bars */}
            <View style={styles.barChartWrapper}>
              {/* Income Bar */}
              <View style={styles.barGroup}>
                <View style={styles.barLabelGroup}>
                  <MaterialCommunityIcons
                    name="trending-up"
                    size={20}
                    color={colors.income}
                  />
                  <Text style={[styles.barLabel, { color: colors.text }]}>Income</Text>
                </View>
                <View
                  style={[
                    styles.barBackground,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.bar,
                      {
                        backgroundColor: colors.income,
                        width: `${currentMonthData.income > 0 ? 100 : 0}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barAmount, { color: colors.text }]}>
                  ₹{currentMonthData.income.toLocaleString()}
                </Text>
              </View>

              {/* Expense Bar */}
              <View style={styles.barGroup}>
                <View style={styles.barLabelGroup}>
                  <MaterialCommunityIcons
                    name="trending-down"
                    size={20}
                    color={colors.expense}
                  />
                  <Text style={[styles.barLabel, { color: colors.text }]}>Expense</Text>
                </View>
                <View
                  style={[
                    styles.barBackground,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.bar,
                      {
                        backgroundColor: colors.expense,
                        width:
                          currentMonthData.income > 0
                            ? `${(currentMonthData.expense / currentMonthData.income) * 100}%`
                            : currentMonthData.expense > 0
                            ? '100%'
                            : '0%',
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barAmount, { color: colors.text }]}>
                  ₹{currentMonthData.expense.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Summary Stats */}
            <View style={styles.summaryStats}>
              <View style={[styles.statBox, { borderColor: colors.border }]}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Net Balance
                </Text>
                <Text
                  style={[
                    styles.statValue,
                    {
                      color:
                        currentMonthData.income - currentMonthData.expense >= 0
                          ? colors.income
                          : colors.expense,
                    },
                  ]}
                >
                  ₹{(currentMonthData.income - currentMonthData.expense).toLocaleString()}
                </Text>
              </View>

              <View style={[styles.statBox, { borderColor: colors.border }]}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Save Rate
                </Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: colors.income },
                  ]}
                >
                  {currentMonthData.income > 0
                    ? Math.round(
                        ((currentMonthData.income - currentMonthData.expense) /
                          currentMonthData.income) *
                          100
                      )
                    : 0}
                  %
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.emptyChart,
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
              No data for this month
            </Text>
          </View>
        )}
      </View>

      {/* Category Breakdown */}
      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Category Breakdown
        </Text>

        {categoryBreakdown.length > 0 ? (
          <View>
            {categoryBreakdown.map((category: any, index: number) => {
              const percentage = getCategoryPercentage(category.amount);
              return (
                <View
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryLeft}>
                      <View
                        style={[
                          styles.categoryIcon,
                          { backgroundColor: category.color || colors.accent },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={category.icon}
                          size={18}
                          color="#FFFFFF"
                        />
                      </View>
                      <View style={styles.categoryInfo}>
                        <Text style={[styles.categoryName, { color: colors.text }]}>
                          {category.name}
                        </Text>
                        <Text
                          style={[styles.categoryMeta, { color: colors.textSecondary }]}
                        >
                          {category.count} transaction{category.count !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.categoryRight}>
                      <Text style={[styles.categoryAmount, { color: colors.text }]}>
                        ₹{category.amount.toLocaleString()}
                      </Text>
                      <Text
                        style={[styles.categoryPercent, { color: colors.textSecondary }]}
                      >
                        {percentage}%
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View
                    style={[
                      styles.progressBar,
                      { backgroundColor: colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: category.color || colors.accent,
                          width: `${percentage}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View
            style={[
              styles.emptyState,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="inbox"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
              No expenses this month
            </Text>
          </View>
        )}
      </View>

      {/* Trends */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Quick Insights
        </Text>

        {/* Average Spending */}
        <View
          style={[
            styles.insightCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.insightIcon}>
            <MaterialCommunityIcons
              name="calculator"
              size={28}
              color={colors.accent}
            />
          </View>
          <View style={styles.insightContent}>
            <Text style={[styles.insightTitle, { color: colors.text }]}>
              Average Transaction
            </Text>
            <Text style={[styles.insightValue, { color: colors.accent }]}>
              ₹
              {categoryBreakdown.length > 0
                ? Math.round(
                    categoryBreakdown.reduce((sum: number, cat: any) => sum + cat.amount, 0) /
                      categoryBreakdown.reduce((sum: number, cat: any) => sum + cat.count, 0)
                  ).toLocaleString()
                : '0'}
            </Text>
          </View>
        </View>

        {/* Top Category */}
        {categoryBreakdown.length > 0 && categoryBreakdown[0] && (
          <View
            style={[
              styles.insightCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.insightIcon,
                { backgroundColor: (categoryBreakdown[0] as any).color },
              ]}
            >
              <MaterialCommunityIcons
                name={(categoryBreakdown[0] as any).icon}
                size={28}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: colors.text }]}>
                Top Expense Category
              </Text>
              <Text style={[styles.insightValue, { color: colors.text }]}>
                {(categoryBreakdown[0] as any).name}
              </Text>
              <Text style={[styles.insightSubtext, { color: colors.textSecondary }]}>
                ₹{(categoryBreakdown[0] as any).amount.toLocaleString()} (
                {getCategoryPercentage((categoryBreakdown[0] as any).amount)}%)
              </Text>
            </View>
          </View>
        )}
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
  
  // Chart Styles
  chartContainer: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  barChartWrapper: {
    gap: 20,
  },
  barGroup: {
    gap: 8,
  },
  barLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  barBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
    minWidth: '5%',
  },
  barAmount: {
    fontSize: 12,
    fontWeight: '700',
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statBox: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Empty States
  emptyChart: {
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyState: {
    paddingVertical: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Category Breakdown Styles
  categoryItem: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    gap: 10,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryMeta: {
    fontSize: 12,
  },
  categoryRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  categoryPercent: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  
  // Insights Styles
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightContent: {
    flex: 1,
    gap: 2,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  insightSubtext: {
    fontSize: 11,
  },
});
