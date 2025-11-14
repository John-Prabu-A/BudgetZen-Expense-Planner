import { useAuth } from '@/context/Auth';
import { readCategories, readRecords } from '@/lib/finance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

type ViewMode = 'DAILY' | 'WEEKLY' | 'MONTHLY' | '3MONTHS' | '6MONTHS' | 'YEARLY';

export default function AnalysisScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, session } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [displayModalVisible, setDisplayModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('MONTHLY');
  const [showCharts, setShowCharts] = useState(true);
  const [showInsights, setShowInsights] = useState(true);

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
      
      // Transform records data to match UI expectations
      const transformedRecords = (recordsData || []).map((record: any) => ({
        id: record.id,
        type: record.type.toUpperCase(), // Convert 'expense' to 'EXPENSE', 'income' to 'INCOME'
        amount: record.amount,
        category: record.categories?.name || 'Unknown',
        category_id: record.category_id,
        category_color: record.categories?.color || '#888888',
        icon: record.categories?.icon || 'cash',
        account: record.accounts?.name || 'Unknown Account',
        account_id: record.account_id,
        date: new Date(record.transaction_date), // Parse ISO date string
        notes: record.notes || '',
      }));
      
      // Transform categories data
      const transformedCategories = (categoriesData || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        type: cat.type,
        color: cat.color,
        user_id: cat.user_id,
      }));
      
      setRecords(transformedRecords);
      setCategories(transformedCategories);
    } catch (error) {
      console.error('Error loading analysis data:', error);
      Alert.alert('Error', 'Failed to load analysis data');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get start and end dates based on view mode
  const getDateRange = (mode: ViewMode, referenceDate: Date) => {
    const date = new Date(referenceDate);
    let start, end;

    switch (mode) {
      case 'DAILY':
        start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        break;
      case 'WEEKLY':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        start = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
        end = new Date(start);
        end.setDate(start.getDate() + 7);
        break;
      case 'MONTHLY':
        start = new Date(date.getFullYear(), date.getMonth(), 1);
        end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
        break;
      case '3MONTHS':
        start = new Date(date.getFullYear(), date.getMonth() - 2, 1);
        end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
        break;
      case '6MONTHS':
        start = new Date(date.getFullYear(), date.getMonth() - 5, 1);
        end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
        break;
      case 'YEARLY':
        start = new Date(date.getFullYear(), 0, 1);
        end = new Date(date.getFullYear() + 1, 0, 1);
        break;
      default:
        start = new Date(date.getFullYear(), date.getMonth(), 1);
        end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    }

    return { start, end };
  };

  // Current data based on selected view mode
  const currentViewData = useMemo(() => {
    const { start, end } = getDateRange(viewMode, selectedDate);
    
    const filteredRecords = records.filter((r) => {
      const recordDate = new Date(r.date);
      return recordDate >= start && recordDate < end;
    });

    const income = filteredRecords
      .filter((r) => r.type === 'INCOME')
      .reduce((sum, r) => sum + r.amount, 0);
    const expense = filteredRecords
      .filter((r) => r.type === 'EXPENSE')
      .reduce((sum, r) => sum + r.amount, 0);

    return { income, expense, records: filteredRecords };
  }, [records, selectedDate, viewMode]);

  // Keep monthly data for backwards compatibility
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

  // Category breakdown based on current view data
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, any> = {};

    currentViewData.records
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
  }, [currentViewData]);

  // Calculate percentage for category
  const getCategoryPercentage = (amount: number) => {
    const total = categoryBreakdown.reduce((sum: number, cat: any) => sum + cat.amount, 0);
    return total > 0 ? Math.round((amount / total) * 100) : 0;
  };

  // Display Options Modal Component
  const DisplayOptionsModal = () => (
    <Modal
      visible={displayModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setDisplayModalVisible(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        {/* Modal Header */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setDisplayModalVisible(false)}>
            <MaterialCommunityIcons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Display Options</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* View Mode Section */}
          <View style={styles.modalSection}>
            <Text style={[styles.modalSectionTitle, { color: colors.text }]}>View Mode</Text>
            <Text style={[styles.modalSectionDescription, { color: colors.textSecondary }]}>
              Choose how you want to view your analysis
            </Text>

            <View style={styles.viewModeGrid}>
              {(['DAILY', 'WEEKLY', 'MONTHLY', '3MONTHS', '6MONTHS', 'YEARLY'] as ViewMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.viewModeButton,
                    {
                      backgroundColor: viewMode === mode ? colors.accent : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setViewMode(mode)}
                >
                  <Text
                    style={[
                      styles.viewModeText,
                      { color: viewMode === mode ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {mode === '3MONTHS' ? '3M' : mode === '6MONTHS' ? '6M' : mode.charAt(0) + mode.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />

          {/* Show Charts Toggle */}
          <View style={styles.modalSection}>
            <View style={styles.toggleHeader}>
              <View>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>Show Charts</Text>
                <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                  Display overview charts
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleSwitch,
                  { backgroundColor: showCharts ? colors.income : colors.textSecondary },
                ]}
                onPress={() => setShowCharts(!showCharts)}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    {
                      transform: [{ translateX: showCharts ? 20 : 0 }],
                    },
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />

          {/* Show Insights Toggle */}
          <View style={styles.modalSection}>
            <View style={styles.toggleHeader}>
              <View>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>Show Insights</Text>
                <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                  Display quick insights
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleSwitch,
                  { backgroundColor: showInsights ? colors.income : colors.textSecondary },
                ]}
                onPress={() => setShowInsights(!showInsights)}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    {
                      transform: [{ translateX: showInsights ? 20 : 0 }],
                    },
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Additional Info */}
          <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="information" size={20} color={colors.accent} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Customize which analysis sections to display
            </Text>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.footerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setDisplayModalVisible(false)}
          >
            <Text style={[styles.footerButtonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.footerButton, { backgroundColor: colors.accent }]}
            onPress={() => setDisplayModalVisible(false)}
          >
            <Text style={[styles.footerButtonText, { color: '#FFFFFF' }]}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      {/* Header with Filter Button */}
      <View style={[styles.headerContainer, { justifyContent: 'space-between' }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Analysis</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Financial insights & breakdown
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setDisplayModalVisible(true)}
        >
          <MaterialCommunityIcons name="filter-outline" size={24} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Monthly Overview Chart */}
      {showCharts && (
      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {viewMode === 'DAILY' ? 'Daily Overview' : 
           viewMode === 'WEEKLY' ? 'Weekly Overview' :
           viewMode === 'MONTHLY' ? 'Monthly Overview' :
           viewMode === '3MONTHS' ? '3-Month Overview' :
           viewMode === '6MONTHS' ? '6-Month Overview' :
           'Yearly Overview'}
        </Text>
        
        {currentViewData.income > 0 || currentViewData.expense > 0 ? (
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
                        width: `${currentViewData.income > 0 ? 100 : 0}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barAmount, { color: colors.text }]}>
                  ₹{currentViewData.income.toLocaleString()}
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
                          currentViewData.income > 0
                            ? `${(currentViewData.expense / currentViewData.income) * 100}%`
                            : currentViewData.expense > 0
                            ? '100%'
                            : '0%',
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barAmount, { color: colors.text }]}>
                  ₹{currentViewData.expense.toLocaleString()}
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
                        currentViewData.income - currentViewData.expense >= 0
                          ? colors.income
                          : colors.expense,
                    },
                  ]}
                >
                  ₹{(currentViewData.income - currentViewData.expense).toLocaleString()}
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
                  {currentViewData.income > 0
                    ? Math.round(
                        ((currentViewData.income - currentViewData.expense) /
                          currentViewData.income) *
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
              No data for this period
            </Text>
          </View>
        )}
      </View>
      )}

      {/* Category Breakdown */}
      {showCharts && (
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
              No expenses in this period
            </Text>
          </View>
        )}
      </View>
      )}

      {/* Trends */}
      {showInsights && (
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
      )}
      </ScrollView>

      {/* Display Options Modal */}
      <DisplayOptionsModal />
    </>
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
  // Header Styles
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 4,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    paddingTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalSectionDescription: {
    fontSize: 13,
    marginBottom: 12,
  },
  viewModeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  viewModeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '30%',
  },
  viewModeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalDivider: {
    height: 1,
    marginVertical: 16,
  },
  toggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 12,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 20,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
