import { useAuth } from '@/context/Auth';
import { useTheme } from '@/context/Theme';
import { useSmartLoading } from '@/hooks/useSmartLoading';
import { useUIMode } from '@/hooks/useUIMode';
import { readAccounts, readCategories, readRecords } from '@/lib/finance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import IncomeExpenseCalendar from '../components/IncomeExpenseCalendar';

type AnalysisView =
  | 'ACCOUNT_ANALYSIS'
  | 'INCOME_FLOW'
  | 'EXPENSE_FLOW'
  | 'INCOME_OVERVIEW'
  | 'EXPENSE_OVERVIEW';

export default function AnalysisScreen() {
  const { isDark, colors } = useTheme();
  const spacing = useUIMode();
  const { user, session } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [analysisView, setAnalysisView] = useState<AnalysisView>('ACCOUNT_ANALYSIS');

  const { loading, handleLoad } = useSmartLoading(
    async () => {
      const [recordsData, categoriesData, accountsData] = await Promise.all([
        readRecords(),
        readCategories(),
        readAccounts(),
      ]);

      const transformedRecords = (recordsData || []).map((record: any) => ({
        id: record.id,
        type: record.type.toUpperCase(),
        amount: record.amount,
        category: record.categories?.name || 'Unknown',
        category_id: record.category_id,
        account: record.accounts?.name || 'Unknown Account',
        account_id: record.account_id,
        date: new Date(record.transaction_date),
      }));

      setRecords(transformedRecords);
      setCategories(categoriesData || []);
      setAccounts(accountsData || []);
    },
    [user, session]
  );

  useEffect(() => {
    if (user && session) {
      handleLoad();
    }
  }, [user, session]);

  useFocusEffect(
    useCallback(() => {
      if (user && session) {
        handleLoad();
      }
    }, [user, session])
  );
  
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


  const calendarData = useMemo(() => {
    const data: { [day: number]: { income?: number; expense?: number } } = {};
    currentMonthData.records.forEach(record => {
      const day = record.date.getDate();
      if (!data[day]) {
        data[day] = {};
      }
      if (record.type === 'INCOME') {
        data[day].income = (data[day].income || 0) + record.amount;
      } else {
        data[day].expense = (data[day].expense || 0) + record.amount;
      }
    });
    return data;
  }, [currentMonthData.records]);

  const accountAnalysisData = useMemo(() => {
    const data = accounts.map(account => {
      const accountRecords = currentMonthData.records.filter(r => r.account_id === account.id);
      const income = accountRecords.filter(r => r.type === 'INCOME').reduce((sum, r) => sum + r.amount, 0);
      const expense = accountRecords.filter(r => r.type === 'EXPENSE').reduce((sum, r) => sum + r.amount, 0);
      return {
        value: income - expense,
        label: account.name,
        frontColor: income > expense ? colors.income : colors.expense,
        income,
        expense,
        id: account.id
      };
    });
    return data;
  }, [accounts, currentMonthData.records, colors]);

  const incomeExpenseFlowData = useMemo(() => {
    const incomeData: any[] = [];
    const expenseData: any[] = [];
    const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();


    for (let i = 1; i <= daysInMonth; i++) {
        incomeData.push({value: 0, label: i.toString()});
        expenseData.push({value: 0, label: i.toString()});
    }

    currentMonthData.records.forEach(record => {
        const day = record.date.getDate();
        if (record.type === 'INCOME') {
            incomeData[day - 1].value += record.amount;
        } else {
            expenseData[day - 1].value += record.amount;
        }
    });

    return {incomeData, expenseData};
  }, [currentMonthData.records, selectedDate]);
  
  const incomeExpenseOverviewData = useMemo(() => {
    const chartColors = [colors.chartColor1, colors.chartColor2, colors.chartColor3, colors.chartColor4, colors.chartColor5, colors.chartColor6];
    const incomeByCategory = categories.filter(c => c.type === 'income').map((category, i) => {
        const categoryRecords = currentMonthData.records.filter(r => r.category_id === category.id && r.type === 'INCOME');
        const total = categoryRecords.reduce((sum, r) => sum + r.amount, 0);
        return {
            value: total,
            text: category.name,
            color: chartColors[i % 6]

        }
    }).filter(d => d.value > 0);

    const expenseByCategory = categories.filter(c => c.type === 'expense').map((category, i) => {
        const categoryRecords = currentMonthData.records.filter(r => r.category_id === category.id && r.type === 'EXPENSE');
        const total = categoryRecords.reduce((sum, r) => sum + r.amount, 0);
        return {
            value: total,
            text: category.name,
            color: chartColors[i % 6]
        }
    }).filter(d => d.value > 0);

    return {incomeByCategory, expenseByCategory};
  }, [categories, currentMonthData.records, colors]);


  const handleDateChange = (direction: 'prev' | 'next') => {
    setSelectedDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
      return newDate;
    });
  };

  // Responsive chart width
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 40;

  const renderAnalysisView = () => {
    switch (analysisView) {
      case 'ACCOUNT_ANALYSIS':
        return (
          <View style={styles.viewContent}>
            <View style={styles.chartContainer}>
              {(() => {
                try {
                  // eslint-disable-next-line @typescript-eslint/no-var-requires
                  const { BarChart } = require('react-native-gifted-charts');
                  const itemCount = Math.max(1, accountAnalysisData.length);
                  let barWidth = Math.floor(chartWidth / itemCount) - 12;
                  if (barWidth < 20) barWidth = 20;
                  if (barWidth > 100) barWidth = 100;

                  return (
                    <View style={{ width: '100%', alignItems: 'center' }}>
                      <BarChart
                        data={accountAnalysisData}
                        barWidth={barWidth}
                        noOfSections={4}
                        barBorderRadius={6}
                        barMarginBottom={40}
                        xAxisLabelTextStyle={{ color: colors.text, fontSize: 12 }}
                        yAxisTextStyle={{ color: colors.textSecondary, fontSize: 11 }}
                        yAxisThickness={1}
                        yAxisColor={colors.border}
                        xAxisThickness={1}
                        xAxisColor={colors.border}
                        showGradient={false}
                        isRTL={false}
                        height={280}
                      />
                    </View>
                  );
                } catch (err) {
                  console.warn('BarChart not available:', err);
                  return (
                    <View style={styles.errorContainer}>
                      <MaterialCommunityIcons name="chart-bar" size={48} color={colors.textSecondary} />
                      <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                        Charts unavailable
                      </Text>
                    </View>
                  );
                }
              })()}
            </View>

            <View style={styles.accountsList}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Breakdown</Text>
              {accountAnalysisData.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No account data for this month
                  </Text>
                </View>
              ) : (
                accountAnalysisData.map(account => (
                  <View key={account.id} style={[styles.accountItem, { backgroundColor: colors.surfaceLight, borderBottomColor: colors.border }]}>
                    <View style={styles.accountInfo}>
                      <Text style={[styles.accountName, { color: colors.text }]}>{account.label}</Text>
                      <View style={styles.accountMini}>
                        <Text style={[styles.miniAmount, { color: colors.income }]}>+₹{account.income.toFixed(2)}</Text>
                        <Text style={[styles.miniAmount, { color: colors.expense }]}>-₹{account.expense.toFixed(2)}</Text>
                      </View>
                    </View>
                    <View style={[styles.accountBalance, { backgroundColor: account.value >= 0 ? colors.income : colors.expense }]}>
                      <Text style={styles.balanceText}>₹{account.value.toFixed(2)}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        );

      case 'INCOME_FLOW':
        return (
          <View style={styles.viewContent}>
            <View style={styles.chartContainer}>
              {(() => {
                try {
                  // eslint-disable-next-line @typescript-eslint/no-var-requires
                  const { LineChart } = require('react-native-gifted-charts');
                  return (
                    <View style={{ width: '30%', alignItems: 'center' }}>
                      <LineChart
                        data={incomeExpenseFlowData.incomeData}
                        color1={colors.income}
                        color2={colors.income}
                        startFillColor={colors.income + '20'}
                        startOpacity={1}
                        endOpacity={0.3}
                        initialSpacing={6}
                        spacing={14}
                        xAxisLabelTextStyle={{ color: colors.text, fontSize: 10 }}
                        yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                        yAxisThickness={1}
                        yAxisColor={colors.border}
                        xAxisThickness={1}
                        xAxisColor={colors.border}
                        yAxisAtTop={false}
                        curved={true}
                        hideDataPoints={false}
                        dataPointsHeight={6}
                        dataPointsWidth={6}
                        dataPointsColor={colors.income}
                        height={150}
                        width={chartWidth}
                      />
                    </View>
                  );
                } catch (err) {
                  console.warn('LineChart not available:', err);
                  return (
                    <View style={styles.errorContainer}>
                      <MaterialCommunityIcons name="chart-line" size={48} color={colors.textSecondary} />
                      <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                        Charts unavailable
                      </Text>
                    </View>
                  );
                }
              })()}
            </View>

            <View style={styles.dailyBreakdown}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Income Summary</Text>
              <IncomeExpenseCalendar
                year={selectedDate.getFullYear()}
                month={selectedDate.getMonth()}
                data={calendarData}
                isDark={isDark}
                type="income"
              />
            </View>
          </View>
        );

      case 'EXPENSE_FLOW':
        return (
          <View style={styles.viewContent}>
            <View style={styles.chartContainer}>
              {(() => {
                try {
                  // eslint-disable-next-line @typescript-eslint/no-var-requires
                  const { LineChart } = require('react-native-gifted-charts');
                  return (
                    <View style={{ width: '100%', alignItems: 'center' }}>
                      <LineChart
                        data={incomeExpenseFlowData.expenseData}
                        color1={colors.expense}
                        color2={colors.expense}
                        startFillColor={colors.expense + '20'}
                        startOpacity={1}
                        endOpacity={0.3}
                        initialSpacing={6}
                        spacing={14}
                        xAxisLabelTextStyle={{ color: colors.text, fontSize: 10 }}
                        yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                        yAxisThickness={1}
                        yAxisColor={colors.border}
                        xAxisThickness={1}
                        xAxisColor={colors.border}
                        yAxisAtTop={false}
                        curved={true}
                        hideDataPoints={false}
                        dataPointsHeight={6}
                        dataPointsWidth={6}
                        dataPointsColor={colors.expense}
                        height={150}
                        width={chartWidth}
                      />
                    </View>
                  );
                } catch (err) {
                  console.warn('LineChart not available:', err);
                  return (
                    <View style={styles.errorContainer}>
                      <MaterialCommunityIcons name="chart-line" size={48} color={colors.textSecondary} />
                      <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                        Charts unavailable
                      </Text>
                    </View>
                  );
                }
              })()}
            </View>

            <View style={styles.dailyBreakdown}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Expense Summary</Text>
              <IncomeExpenseCalendar
                year={selectedDate.getFullYear()}
                month={selectedDate.getMonth()}
                data={calendarData}
                isDark={isDark}
                type="expense"
              />
            </View>
          </View>
        );

      case 'INCOME_OVERVIEW':
        return (
          <View style={styles.viewContent}>
            <View style={styles.chartContainer}>
              {(() => {
                try {
                  // eslint-disable-next-line @typescript-eslint/no-var-requires
                  const { PieChart } = require('react-native-gifted-charts');
                  return (
                    <View style={{ width: '100%', alignItems: 'center', paddingVertical: spacing.lg }}>
                      <PieChart
                        data={incomeExpenseOverviewData.incomeByCategory}
                        radius={120}
                        textSize={12}
                        textColor={colors.text}
                        showValuesAsPercentage={true}
                      />
                    </View>
                  );
                } catch (err) {
                  console.warn('PieChart not available:', err);
                  return (
                    <View style={styles.errorContainer}>
                      <MaterialCommunityIcons name="chart-pie" size={48} color={colors.textSecondary} />
                      <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                        Charts unavailable
                      </Text>
                    </View>
                  );
                }
              })()}
            </View>

            <View style={styles.categoryList}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Income by Category</Text>
              {incomeExpenseOverviewData.incomeByCategory.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No income data for this month
                  </Text>
                </View>
              ) : (
                incomeExpenseOverviewData.incomeByCategory.map((d, idx) => (
                  <View key={d.text} style={[styles.categoryItem, { backgroundColor: colors.surfaceLight, borderBottomColor: colors.border }]}>
                    <View style={[styles.colorDot, { backgroundColor: d.color }]} />
                    <View style={styles.categoryInfo}>
                      <Text style={[styles.categoryName, { color: colors.text }]}>{d.text}</Text>
                      <Text style={[styles.categoryPercent, { color: colors.textSecondary }]}>
                        {((d.value / incomeExpenseOverviewData.incomeByCategory.reduce((s, c) => s + c.value, 0)) * 100).toFixed(1)}%
                      </Text>
                    </View>
                    <Text style={[styles.categoryAmount, { color: colors.income }]}>+₹{d.value.toFixed(2)}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        );

      case 'EXPENSE_OVERVIEW':
        return (
          <View style={styles.viewContent}>
            <View style={styles.chartContainer}>
              {(() => {
                try {
                  // eslint-disable-next-line @typescript-eslint/no-var-requires
                  const { PieChart } = require('react-native-gifted-charts');
                  return (
                    <View style={{ width: '100%', alignItems: 'center', paddingVertical: spacing.lg }}>
                      <PieChart
                        data={incomeExpenseOverviewData.expenseByCategory}
                        radius={120}
                        textSize={12}
                        textColor={colors.text}
                        showValuesAsPercentage={true}
                      />
                    </View>
                  );
                } catch (err) {
                  console.warn('PieChart not available:', err);
                  return (
                    <View style={styles.errorContainer}>
                      <MaterialCommunityIcons name="chart-pie" size={48} color={colors.textSecondary} />
                      <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                        Charts unavailable
                      </Text>
                    </View>
                  );
                }
              })()}
            </View>

            <View style={styles.categoryList}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Expense by Category</Text>
              {incomeExpenseOverviewData.expenseByCategory.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No expense data for this month
                  </Text>
                </View>
              ) : (
                incomeExpenseOverviewData.expenseByCategory.map((d, idx) => (
                  <View key={d.text} style={[styles.categoryItem, { backgroundColor: colors.surfaceLight, borderBottomColor: colors.border }]}>
                    <View style={[styles.colorDot, { backgroundColor: d.color }]} />
                    <View style={styles.categoryInfo}>
                      <Text style={[styles.categoryName, { color: colors.text }]}>{d.text}</Text>
                      <Text style={[styles.categoryPercent, { color: colors.textSecondary }]}>
                        {((d.value / incomeExpenseOverviewData.expenseByCategory.reduce((s, c) => s + c.value, 0)) * 100).toFixed(1)}%
                      </Text>
                    </View>
                    <Text style={[styles.categoryAmount, { color: colors.expense }]}>-₹{d.value.toFixed(2)}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const styles = createAnalysisStyles(spacing, isDark, colors);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.headerBorder }]}>
        <TouchableOpacity onPress={() => handleDateChange('prev')}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerText, { color: colors.text }]}>{selectedDate.toLocaleString('default', { month: 'long' })}, {selectedDate.getFullYear()}</Text>
        <TouchableOpacity onPress={() => handleDateChange('next')}>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.summary}>
        <View style={[styles.summaryItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>EXPENSE</Text>
            <Text style={[styles.summaryValueExpense, { color: colors.expense }]}>₹{currentMonthData.expense.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>INCOME</Text>
            <Text style={[styles.summaryValueIncome, { color: colors.income }]}>₹{currentMonthData.income.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>TOTAL</Text>
            <Text style={[styles.summaryValueTotal, { color: colors.accent }]}>₹{(currentMonthData.income - currentMonthData.expense).toFixed(2)}</Text>
        </View>
      </View>
      
      <View style={styles.viewSelector}>
        <View style={styles.selectorHeader}>
          <View style={styles.selectorLabel}>
            <View style={[styles.iconBackdrop, { backgroundColor: colors.surfaceLight, borderColor: colors.borderLight }]}>
              <MaterialCommunityIcons name="chart-box-multiple-outline" size={18} color={colors.accent} />
            </View>
            <View>
              <Text style={[styles.selectorLabelSmall, { color: colors.accent }]}>Analysis Dashboard</Text>
              <Text style={[styles.selectorLabelText, { color: colors.text }]}>Select your view</Text>
            </View>
          </View>
        </View>
        <View style={[styles.pickerContainer, { 
          backgroundColor: colors.surface,
          borderColor: colors.borderLight,
          shadowColor: colors.accent,
        }]}>
          <Picker
            selectedValue={analysisView}
            onValueChange={(itemValue) => setAnalysisView(itemValue)}
            style={[styles.picker, { color: colors.text }]}
            dropdownIconColor={colors.accent}
            mode="dropdown"
          >
            <Picker.Item label="📊 Account Analysis" value="ACCOUNT_ANALYSIS" color={colors.text} />
            <Picker.Item label="📈 Income Flow" value="INCOME_FLOW" color={colors.text} />
            <Picker.Item label="📉 Expense Flow" value="EXPENSE_FLOW" color={colors.text} />
            <Picker.Item label="💰 Income Overview" value="INCOME_OVERVIEW" color={colors.text} />
            <Picker.Item label="💸 Expense Overview" value="EXPENSE_OVERVIEW" color={colors.text} />
          </Picker>
        </View>
      </View>
      
      {renderAnalysisView()}
    </ScrollView>
  );
}

const createAnalysisStyles = (spacing: any, isDark: boolean, colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.headerBackground,
        borderBottomWidth: 1,
        borderBottomColor: colors.headerBorder,
    },
    headerText: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
    },
    summary: {
        flexDirection: 'row',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.lg,
        gap: spacing.md,
    },
    summaryItem: {
        flex: 1,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.2 : 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    summaryLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        letterSpacing: 0.5,
    },
    summaryValueIncome: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.income,
    },
    summaryValueExpense: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.expense,
    },
    summaryValueTotal: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.accent,
    },
    viewSelector: {
        flexDirection: 'column',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        gap: spacing.sm,
        backgroundColor: colors.background,
        borderRadius: 16,
        marginHorizontal: spacing.md,
        marginVertical: spacing.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.borderLight,
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.3 : 0.08,
        shadowRadius: 12,
        elevation: 5,
    },
    selectorHeader: {
        marginBottom: spacing.sm,
    },
    selectorLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    iconBackdrop: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    selectorLabelSmall: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.accent,
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    selectorLabelText: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    pickerContainer: {
        borderWidth: 1.5,
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: spacing.sm,
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },
    picker: {
        height: 56,
        justifyContent: 'center',
        paddingHorizontal: spacing.md,
    },
    viewButton: {
        flex: 1,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        borderRadius: 8,
        backgroundColor: colors.surfaceLight,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewButtonActive: {
        backgroundColor: colors.accent,
        borderColor: colors.accent,
    },
    viewButtonText: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        color: colors.text,
        marginBottom: 0,
    },
    viewContent: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        paddingBottom: spacing.xl,
    },
    chartContainer: {
        marginBottom: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.08,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
    },
    accountsList: {
        marginTop: spacing.lg,
    },
    accountItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        marginVertical: spacing.xs,
        borderRadius: 10,
        borderBottomWidth: 1,
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.2 : 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    accountInfo: {
        flex: 1,
    },
    accountName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: spacing.xs,
        color: colors.text,
    },
    accountMini: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    miniAmount: {
        fontSize: 12,
        fontWeight: '600',
    },
    accountBalance: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 80,
    },
    balanceText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textOnAccent,
        textAlign: 'center',
    },
    categoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        marginVertical: spacing.xs,
        borderRadius: 10,
        borderBottomWidth: 1,
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.2 : 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    colorDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: spacing.md,
    },
    categoryInfo: {
        flex: 1,
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: spacing.xs,
        color: colors.text,
    },
    categoryPercent: {
        fontSize: 12,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    categoryAmount: {
        fontSize: 14,
        fontWeight: '700',
        marginLeft: spacing.md,
        minWidth: 80,
        textAlign: 'right',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: spacing.lg,
        letterSpacing: 0.3,
        color: colors.text,
    },
    emptyState: {
        paddingVertical: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
        color: colors.textSecondary,
    },
    errorContainer: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.md,
        justifyContent: 'center',
    },
    errorText: {
        marginTop: spacing.lg,
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    dailyBreakdown: {
        marginTop: spacing.lg,
    },
    categoryList: {
        marginTop: spacing.lg,
    },
});
