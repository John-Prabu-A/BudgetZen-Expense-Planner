import { EmptyStateView } from '@/components/EmptyStateView';
import { useAuth } from '@/context/Auth';
import { useTheme } from '@/context/Theme';
import { useSmartLoading } from '@/hooks/useSmartLoading';
import { useUIMode } from '@/hooks/useUIMode';
import { readAccounts, readCategories, readRecords } from '@/lib/finance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, useRouter } from 'expo-router';
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
  const router = useRouter();
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
      const initialBalance = account?.initial_balance || 0;
      let balance = initialBalance;
      let income = 0;
      let expense = 0;
      
      // Process all records to calculate balance for this account
      records.forEach(r => {
        const recordType = r.type?.toUpperCase() || '';
        
        if (recordType === 'INCOME' && r.account_id === account.id) {
          // Income adds to account
          income += r.amount;
          balance += r.amount;
        } else if (recordType === 'EXPENSE' && r.account_id === account.id) {
          // Expense deducts from account
          expense += r.amount;
          balance -= r.amount;
        } else if (recordType === 'TRANSFER') {
          // For transfers, check both directions
          if (r.account_id === account.id && r.to_account_id) {
            // This account is SOURCE - money goes OUT (negative)
            balance -= r.amount;
          } else if (r.to_account_id === account.id && r.account_id !== account.id) {
            // This account is DESTINATION - money comes IN (positive)
            balance += r.amount;
          }
        }
      });
      
      return {
        value: balance,
        label: account.name,
        frontColor: balance >= 0 ? colors.income : colors.expense,
        income,
        expense,
        id: account.id
      };
    });
    return data;
  }, [accounts, records, colors]);

  const incomeExpenseFlowData = useMemo(() => {
    const incomeData: any[] = [];
    const expenseData: any[] = [];
    const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();


    for (let i = 1; i <= daysInMonth; i++) {
      incomeData.push({ value: 0, label: i.toString() });
      expenseData.push({ value: 0, label: i.toString() });
    }

    currentMonthData.records.forEach(record => {
      const day = record.date.getDate();
      if (record.type === 'INCOME') {
        incomeData[day - 1].value += record.amount;
      } else {
        expenseData[day - 1].value += record.amount;
      }
    });

    return { incomeData, expenseData };
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

    return { incomeByCategory, expenseByCategory };
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
    // Empty state check - no records at all
    if (!records || records.length === 0) {
      return (
        <EmptyStateView
          icon="chart-box-outline"
          title="No Financial Data"
          subtitle="Start by recording your first income or expense to see your analysis."
          actionText="Create Record"
          onAction={() => router.push('/(modal)/add-record-modal')}
        />
      );
    }

    switch (analysisView) {
      case 'ACCOUNT_ANALYSIS':
        return (
          <View style={styles.viewContent}>
            {/* ==== Total Wealth Card ==== */}
            <View
              style={[
                styles.wealthCard,
                {
                  backgroundColor: colors.accent,
                  borderColor: colors.accent,
                },
              ]}
            >
              <View style={{ gap: 8 }}>
                <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 13, fontWeight: '600', letterSpacing: 0.3 }}>
                  TOTAL WEALTH
                </Text>
                <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '800', letterSpacing: 0.5 }}>
                  ₹{accountAnalysisData.reduce((sum, a) => sum + a.value, 0).toFixed(2)}
                </Text>
              </View>
              <View style={{ gap: 12 }}>
                <View style={{ gap: 4 }}>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 11, fontWeight: '600' }}>Accounts</Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>{accounts.length}</Text>
                </View>
              </View>
            </View>

            {/* ==== Summary Statistics ==== */}
            <View style={{ marginTop: 24, gap: 12 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Summary Metrics
              </Text>
              
              {/* Monthly Activity */}
              <View style={[styles.metricsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.metricIcon, { backgroundColor: colors.income + '15', borderColor: colors.income }]}>
                    <MaterialCommunityIcons name="trending-up" size={20} color={colors.income} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                      Monthly Income
                    </Text>
                    <Text style={[styles.metricValue, { color: colors.income }]}>
                      ₹{currentMonthData.income.toFixed(2)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.metricDelta, { color: colors.income }]}>
                      {accountAnalysisData.length > 0 ? `${(currentMonthData.income / accountAnalysisData.length).toFixed(0)}/acc` : '-'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.metricsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.metricIcon, { backgroundColor: colors.expense + '15', borderColor: colors.expense }]}>
                    <MaterialCommunityIcons name="trending-down" size={20} color={colors.expense} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                      Monthly Expense
                    </Text>
                    <Text style={[styles.metricValue, { color: colors.expense }]}>
                      ₹{currentMonthData.expense.toFixed(2)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.metricDelta, { color: colors.expense }]}>
                      {accountAnalysisData.length > 0 ? `${(currentMonthData.expense / accountAnalysisData.length).toFixed(0)}/acc` : '-'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.metricsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.metricIcon, { backgroundColor: colors.accent + '15', borderColor: colors.accent }]}>
                    <MaterialCommunityIcons name="wallet" size={20} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                      Net This Month
                    </Text>
                    <Text style={[styles.metricValue, { color: colors.accent }]}>
                      ₹{(currentMonthData.income - currentMonthData.expense).toFixed(2)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.metricDelta, { color: (currentMonthData.income - currentMonthData.expense) >= 0 ? colors.income : colors.expense }]}>
                      {((currentMonthData.income - currentMonthData.expense) / Math.max(currentMonthData.income, currentMonthData.expense) * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ==== Detailed Account Breakdown ==== */}
            <View style={{ marginTop: 24 }}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
                Account Details
              </Text>

              {accountAnalysisData.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No account data available
                  </Text>
                </View>
              ) : (
                accountAnalysisData.map(account => {
                  const totalTransactions = account.income + account.expense;
                  const activityPercent = totalTransactions > 0 
                    ? (account.income / totalTransactions) * 100 
                    : 0;

                  return (
                    <View
                      key={account.id}
                      style={[
                        styles.detailedAccountCard,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                      ]}
                    >
                      {/* Header with Icon and Title */}
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                        <View style={[styles.accountIconLarge, { backgroundColor: colors.accent + '15', borderColor: colors.accent }]}>
                          <MaterialCommunityIcons name="wallet" size={26} color={colors.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.accountTitleLarge, { color: colors.text }]}>
                            {account.label}
                          </Text>
                        </View>
                      </View>

                      {/* Current Balance */}
                      <View style={{ gap: 12, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                        <View>
                          <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                            Current Balance
                          </Text>
                          <Text style={[styles.breakdownValue, { color: account.value >= 0 ? colors.income : colors.expense, fontSize: 18, fontWeight: '800' }]}>
                            ₹{account.value.toFixed(2)}
                          </Text>
                        </View>
                      </View>

                      {/* Income/Expense Breakdown */}
                      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                            Income
                          </Text>
                          <Text style={[styles.breakdownValue, { color: colors.income }]}>
                            +₹{account.income.toFixed(2)}
                          </Text>
                          <Text style={[styles.breakdownLabel, { color: colors.textSecondary, marginTop: 4, fontSize: 11 }]}>
                            {totalTransactions > 0 ? `${(account.income / totalTransactions * 100).toFixed(0)}% of activity` : 'N/A'}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                            Expense
                          </Text>
                          <Text style={[styles.breakdownValue, { color: colors.expense }]}>
                            -₹{account.expense.toFixed(2)}
                          </Text>
                          <Text style={[styles.breakdownLabel, { color: colors.textSecondary, marginTop: 4, fontSize: 11 }]}>
                            {totalTransactions > 0 ? `${(account.expense / totalTransactions * 100).toFixed(0)}% of activity` : 'N/A'}
                          </Text>
                        </View>
                      </View>

                      {/* Activity Progress Bar */}
                      <View style={{ marginTop: 8 }}>
                        <View style={{ flexDirection: 'row', height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden', gap: 1 }}>
                          <View
                            style={{
                              flex: activityPercent / 100,
                              backgroundColor: colors.income,
                              borderRadius: 3,
                            }}
                          />
                          <View
                            style={{
                              flex: (100 - activityPercent) / 100,
                              backgroundColor: colors.expense,
                              borderRadius: 3,
                            }}
                          />
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                          <Text style={[styles.breakdownLabel, { fontSize: 10, color: colors.income }]}>
                            Income {(account.income / totalTransactions * 100).toFixed(0)}%
                          </Text>
                          <Text style={[styles.breakdownLabel, { fontSize: 10, color: colors.expense }]}>
                            Expense {(account.expense / totalTransactions * 100).toFixed(0)}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        );


      case 'INCOME_FLOW':
        return (
          <View style={styles.viewContent}>
            {/* Income Flow Summary Metrics */}
            <View style={{ gap: 12, marginBottom: 20 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Income Analytics</Text>
              
              {/* Total Income Card */}
              <View style={[styles.metricsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.metricIcon, { backgroundColor: colors.income + '15', borderColor: colors.income }]}>
                    <MaterialCommunityIcons name="cash-multiple" size={20} color={colors.income} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Income</Text>
                    <Text style={[styles.metricValue, { color: colors.income }]}>
                      ₹{currentMonthData.income.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>

              {(() => {
                const incomeRecords = currentMonthData.records.filter(r => r.type === 'INCOME');
                if (incomeRecords.length > 0) {
                  const avgIncome = currentMonthData.income / incomeRecords.length;
                  const maxIncomeRecord = incomeRecords.reduce((max, r) => r.amount > max.amount ? r : max);
                  
                  return (
                    <>
                      {/* Average Income */}
                      <View style={[styles.metricsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={[styles.metricIcon, { backgroundColor: colors.income + '15', borderColor: colors.income }]}>
                            <MaterialCommunityIcons name="chart-box" size={20} color={colors.income} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Avg per Transaction</Text>
                            <Text style={[styles.metricValue, { color: colors.income }]}>
                              ₹{avgIncome.toFixed(2)}
                            </Text>
                          </View>
                          <Text style={[styles.metricDelta, { color: colors.income }]}>{incomeRecords.length}</Text>
                        </View>
                      </View>

                      {/* Highest Income */}
                      <View style={[styles.metricsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={[styles.metricIcon, { backgroundColor: colors.income + '15', borderColor: colors.income }]}>
                            <MaterialCommunityIcons name="trending-up" size={20} color={colors.income} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Highest Transaction</Text>
                            <Text style={[styles.metricValue, { color: colors.income }]}>
                              ₹{maxIncomeRecord.amount.toFixed(2)}
                            </Text>
                          </View>
                          <Text style={[styles.metricDelta, { color: colors.textSecondary, fontSize: 11 }]}>
                            {new Date(maxIncomeRecord.date).getDate()} {new Date(maxIncomeRecord.date).toLocaleString('default', { month: 'short' })}
                          </Text>
                        </View>
                      </View>
                    </>
                  );
                }
                return null;
              })()}
            </View>

            {/* Income by Account */}
            {(() => {
              const incomeByAccount = accounts.map(account => {
                const accountIncomeRecords = currentMonthData.records.filter(
                  r => r.account_id === account.id && r.type === 'INCOME'
                );
                const totalIncome = accountIncomeRecords.reduce((sum, r) => sum + r.amount, 0);
                return {
                  account: account.name,
                  income: totalIncome,
                  transactions: accountIncomeRecords.length,
                  percentage: currentMonthData.income > 0 ? (totalIncome / currentMonthData.income) * 100 : 0,
                };
              }).filter(a => a.income > 0).sort((a, b) => b.income - a.income);

              if (incomeByAccount.length > 0) {
                return (
                  <View style={{ marginBottom: 20 }}>
                    <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
                      Income by Account
                    </Text>
                    {incomeByAccount.map((data, index) => (
                      <View
                        key={index}
                        style={[
                          styles.categoryItem,
                          { backgroundColor: colors.surface, borderBottomColor: colors.border },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.categoryName, { color: colors.text }]}>{data.account}</Text>
                          <Text style={[styles.categoryPercent, { color: colors.textSecondary, fontSize: 11 }]}>
                            {data.transactions} transaction{data.transactions !== 1 ? 's' : ''}
                          </Text>
                        </View>
                        <View style={{ flex: 0.4, alignItems: 'flex-end' }}>
                          <Text style={[styles.categoryAmount, { color: colors.income }]}>
                            ₹{data.income.toFixed(0)}
                          </Text>
                          <View
                            style={{
                              width: '100%',
                              height: 4,
                              backgroundColor: colors.border,
                              borderRadius: 2,
                              marginTop: 6,
                              overflow: 'hidden',
                            }}
                          >
                            <View
                              style={{
                                width: `${data.percentage}%`,
                                height: '100%',
                                backgroundColor: colors.income,
                              }}
                            />
                          </View>
                          <Text style={[styles.breakdownLabel, { color: colors.textSecondary, marginTop: 4 }]}>
                            {data.percentage.toFixed(0)}%
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                );
              }
              return null;
            })()}

            {/* Daily Income Trend Chart */}
            <View style={styles.chartContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>Daily Income Flow</Text>
              {(() => {
                try {
                  // eslint-disable-next-line @typescript-eslint/no-var-requires
                  const { LineChart } = require('react-native-gifted-charts');
                  return (
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
                      curved={false}
                      hideDataPoints={false}
                      dataPointsHeight={6}
                      dataPointsWidth={6}
                      dataPointsColor={colors.income}
                      height={200}
                      width={chartWidth}
                    />
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

            {/* Monthly Income Calendar */}
            <View style={styles.dailyBreakdown}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Monthly Income Calendar</Text>
              <IncomeExpenseCalendar
                year={selectedDate.getFullYear()}
                month={selectedDate.getMonth()}
                data={calendarData}
                isDark={isDark}
                type="income"
              />
            </View>

            {/* Income Frequency Analysis */}
            {(() => {
              const incomeRecords = currentMonthData.records.filter(r => r.type === 'INCOME');
              if (incomeRecords.length === 0) return null;

              const daysWithIncome = Object.keys(calendarData).filter(day => calendarData[parseInt(day)]?.income).length;
              const avgIncomePerDay = currentMonthData.income / Math.max(daysWithIncome, 1);

              return (
                <View style={{ marginTop: 20 }}>
                  <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
                    Income Frequency
                  </Text>
                  <View style={[styles.metricsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={[styles.metricIcon, { backgroundColor: colors.income + '15', borderColor: colors.income }]}>
                        <MaterialCommunityIcons name="calendar-check" size={20} color={colors.income} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Days with Income</Text>
                        <Text style={[styles.metricValue, { color: colors.income }]}>
                          {daysWithIncome} days
                        </Text>
                      </View>
                      <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                        ₹{avgIncomePerDay.toFixed(0)}/day
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })()}
          </View>
        );

      case 'EXPENSE_FLOW':
        return (
          <View style={styles.viewContent}>
            {/* Expense Flow Summary Metrics */}
            <View style={{ gap: 12, marginBottom: 20 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Expense Analytics</Text>
              
              {/* Total Expense Card */}
              <View style={[styles.metricsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.metricIcon, { backgroundColor: colors.expense + '15', borderColor: colors.expense }]}>
                    <MaterialCommunityIcons name="cash-remove" size={20} color={colors.expense} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Expense</Text>
                    <Text style={[styles.metricValue, { color: colors.expense }]}>
                      ₹{currentMonthData.expense.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>

              {(() => {
                const expenseRecords = currentMonthData.records.filter(r => r.type === 'EXPENSE');
                if (expenseRecords.length > 0) {
                  const avgExpense = currentMonthData.expense / expenseRecords.length;
                  const maxExpenseRecord = expenseRecords.reduce((max, r) => r.amount > max.amount ? r : max);
                  
                  return (
                    <>
                      {/* Average Expense */}
                      <View style={[styles.metricsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={[styles.metricIcon, { backgroundColor: colors.expense + '15', borderColor: colors.expense }]}>
                            <MaterialCommunityIcons name="chart-box" size={20} color={colors.expense} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Avg per Transaction</Text>
                            <Text style={[styles.metricValue, { color: colors.expense }]}>
                              ₹{avgExpense.toFixed(2)}
                            </Text>
                          </View>
                          <Text style={[styles.metricDelta, { color: colors.expense }]}>{expenseRecords.length}</Text>
                        </View>
                      </View>

                      {/* Highest Expense */}
                      <View style={[styles.metricsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={[styles.metricIcon, { backgroundColor: colors.expense + '15', borderColor: colors.expense }]}>
                            <MaterialCommunityIcons name="trending-down" size={20} color={colors.expense} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Highest Transaction</Text>
                            <Text style={[styles.metricValue, { color: colors.expense }]}>
                              ₹{maxExpenseRecord.amount.toFixed(2)}
                            </Text>
                          </View>
                          <Text style={[styles.metricDelta, { color: colors.textSecondary, fontSize: 11 }]}>
                            {new Date(maxExpenseRecord.date).getDate()} {new Date(maxExpenseRecord.date).toLocaleString('default', { month: 'short' })}
                          </Text>
                        </View>
                      </View>
                    </>
                  );
                }
                return null;
              })()}
            </View>

            {/* Expense by Account */}
            {(() => {
              const expenseByAccount = accounts.map(account => {
                const accountExpenseRecords = currentMonthData.records.filter(
                  r => r.account_id === account.id && r.type === 'EXPENSE'
                );
                const totalExpense = accountExpenseRecords.reduce((sum, r) => sum + r.amount, 0);
                return {
                  account: account.name,
                  expense: totalExpense,
                  transactions: accountExpenseRecords.length,
                  percentage: currentMonthData.expense > 0 ? (totalExpense / currentMonthData.expense) * 100 : 0,
                };
              }).filter(a => a.expense > 0).sort((a, b) => b.expense - a.expense);

              if (expenseByAccount.length > 0) {
                return (
                  <View style={{ marginBottom: 20 }}>
                    <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
                      Expense by Account
                    </Text>
                    {expenseByAccount.map((data, index) => (
                      <View
                        key={index}
                        style={[
                          styles.categoryItem,
                          { backgroundColor: colors.surface, borderBottomColor: colors.border },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.categoryName, { color: colors.text }]}>{data.account}</Text>
                          <Text style={[styles.categoryPercent, { color: colors.textSecondary, fontSize: 11 }]}>
                            {data.transactions} transaction{data.transactions !== 1 ? 's' : ''}
                          </Text>
                        </View>
                        <View style={{ flex: 0.4, alignItems: 'flex-end' }}>
                          <Text style={[styles.categoryAmount, { color: colors.expense }]}>
                            ₹{data.expense.toFixed(0)}
                          </Text>
                          <View
                            style={{
                              width: '100%',
                              height: 4,
                              backgroundColor: colors.border,
                              borderRadius: 2,
                              marginTop: 6,
                              overflow: 'hidden',
                            }}
                          >
                            <View
                              style={{
                                width: `${data.percentage}%`,
                                height: '100%',
                                backgroundColor: colors.expense,
                              }}
                            />
                          </View>
                          <Text style={[styles.breakdownLabel, { color: colors.textSecondary, marginTop: 4 }]}>
                            {data.percentage.toFixed(0)}%
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                );
              }
              return null;
            })()}

            {/* Daily Expense Trend Chart */}
            <View style={styles.chartContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>Daily Expense Flow</Text>
              {(() => {
                try {
                  // eslint-disable-next-line @typescript-eslint/no-var-requires
                  const { LineChart } = require('react-native-gifted-charts');
                  return (
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
                      curved={false}
                      hideDataPoints={false}
                      dataPointsHeight={6}
                      dataPointsWidth={6}
                      dataPointsColor={colors.expense}
                      height={200}
                      width={chartWidth}
                    />
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

            {/* Monthly Expense Calendar */}
            <View style={styles.dailyBreakdown}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Monthly Expense Calendar</Text>
              <IncomeExpenseCalendar
                year={selectedDate.getFullYear()}
                month={selectedDate.getMonth()}
                data={calendarData}
                isDark={isDark}
                type="expense"
              />
            </View>

            {/* Expense Frequency Analysis */}
            {(() => {
              const expenseRecords = currentMonthData.records.filter(r => r.type === 'EXPENSE');
              if (expenseRecords.length === 0) return null;

              const daysWithExpense = Object.keys(calendarData).filter(day => calendarData[parseInt(day)]?.expense).length;
              const avgExpensePerDay = currentMonthData.expense / Math.max(daysWithExpense, 1);

              return (
                <View style={{ marginTop: 20 }}>
                  <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
                    Expense Frequency
                  </Text>
                  <View style={[styles.metricsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={[styles.metricIcon, { backgroundColor: colors.expense + '15', borderColor: colors.expense }]}>
                        <MaterialCommunityIcons name="calendar-check" size={20} color={colors.expense} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Days with Expense</Text>
                        <Text style={[styles.metricValue, { color: colors.expense }]}>
                          {daysWithExpense} days
                        </Text>
                      </View>
                      <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                        ₹{avgExpensePerDay.toFixed(0)}/day
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })()}
          </View>
        );

      case 'INCOME_OVERVIEW':
        return (
          <View style={styles.viewContent}>
            {/* Income Overview Summary Metrics */}
            <View style={{ gap: 12, marginBottom: 20 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Income Overview</Text>
              
              {/* Total Income Card */}
              <View style={[styles.metricsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.metricIcon, { backgroundColor: colors.income + '15', borderColor: colors.income }]}>
                    <MaterialCommunityIcons name="cash-multiple" size={20} color={colors.income} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Income</Text>
                    <Text style={[styles.metricValue, { color: colors.income }]}>
                      ₹{currentMonthData.income.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>

              {incomeExpenseOverviewData.incomeByCategory.length > 0 && (
                <>
                  {/* Top Income Category */}
                  <View style={[styles.metricsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={[styles.colorDot, { backgroundColor: incomeExpenseOverviewData.incomeByCategory[0].color, width: 16, height: 16, borderRadius: 8 }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Top Category</Text>
                        <Text style={[styles.metricValue, { color: colors.income }]}>
                          {incomeExpenseOverviewData.incomeByCategory[0].text}
                        </Text>
                      </View>
                      <Text style={[styles.metricDelta, { color: colors.income }]}>
                        ₹{incomeExpenseOverviewData.incomeByCategory[0].value.toFixed(0)}
                      </Text>
                    </View>
                  </View>

                  {/* Categories Count */}
                  <View style={[styles.metricsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={[styles.metricIcon, { backgroundColor: colors.income + '15', borderColor: colors.income }]}>
                        <MaterialCommunityIcons name="tag-multiple" size={20} color={colors.income} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Categories</Text>
                        <Text style={[styles.metricValue, { color: colors.income }]}>
                          {incomeExpenseOverviewData.incomeByCategory.length} categories
                        </Text>
                      </View>
                      <Text style={[styles.metricDelta, { color: colors.textSecondary }]}>
                        {(currentMonthData.income / incomeExpenseOverviewData.incomeByCategory.length).toFixed(0)}/cat
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Income Distribution Chart */}
            {incomeExpenseOverviewData.incomeByCategory.length > 0 && (
              <View style={styles.chartContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>Distribution by Category</Text>
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
            )}

            {/* Income by Category List */}
            <View style={styles.categoryList}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Income Breakdown by Category</Text>
              {incomeExpenseOverviewData.incomeByCategory.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No income data for this month
                  </Text>
                </View>
              ) : (
                incomeExpenseOverviewData.incomeByCategory.map((d, idx) => {
                  const totalIncome = incomeExpenseOverviewData.incomeByCategory.reduce((s, c) => s + c.value, 0);
                  const percentage = totalIncome > 0 ? (d.value / totalIncome) * 100 : 0;
                  return (
                    <View key={d.text} style={[styles.categoryItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                      <View style={[styles.colorDot, { backgroundColor: d.color }]} />
                      <View style={styles.categoryInfo}>
                        <Text style={[styles.categoryName, { color: colors.text }]}>{d.text}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <View
                            style={{
                              flex: 1,
                              height: 4,
                              backgroundColor: colors.border,
                              borderRadius: 2,
                              overflow: 'hidden',
                            }}
                          >
                            <View
                              style={{
                                width: `${percentage}%`,
                                height: '100%',
                                backgroundColor: d.color,
                              }}
                            />
                          </View>
                          <Text style={[styles.breakdownLabel, { color: colors.textSecondary, minWidth: 40 }]}>
                            {percentage.toFixed(1)}%
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.categoryAmount, { color: colors.income }]}>+₹{d.value.toFixed(2)}</Text>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        );

      case 'EXPENSE_OVERVIEW':
        return (
          <View style={styles.viewContent}>
            {/* Expense Overview Summary Metrics */}
            <View style={{ gap: 12, marginBottom: 20 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Expense Overview</Text>
              
              {/* Total Expense Card */}
              <View style={[styles.metricsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.metricIcon, { backgroundColor: colors.expense + '15', borderColor: colors.expense }]}>
                    <MaterialCommunityIcons name="cash-remove" size={20} color={colors.expense} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Expense</Text>
                    <Text style={[styles.metricValue, { color: colors.expense }]}>
                      ₹{currentMonthData.expense.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>

              {incomeExpenseOverviewData.expenseByCategory.length > 0 && (
                <>
                  {/* Top Expense Category */}
                  <View style={[styles.metricsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={[styles.colorDot, { backgroundColor: incomeExpenseOverviewData.expenseByCategory[0].color, width: 16, height: 16, borderRadius: 8 }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Top Category</Text>
                        <Text style={[styles.metricValue, { color: colors.expense }]}>
                          {incomeExpenseOverviewData.expenseByCategory[0].text}
                        </Text>
                      </View>
                      <Text style={[styles.metricDelta, { color: colors.expense }]}>
                        ₹{incomeExpenseOverviewData.expenseByCategory[0].value.toFixed(0)}
                      </Text>
                    </View>
                  </View>

                  {/* Categories Count */}
                  <View style={[styles.metricsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={[styles.metricIcon, { backgroundColor: colors.expense + '15', borderColor: colors.expense }]}>
                        <MaterialCommunityIcons name="tag-multiple" size={20} color={colors.expense} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Categories</Text>
                        <Text style={[styles.metricValue, { color: colors.expense }]}>
                          {incomeExpenseOverviewData.expenseByCategory.length} categories
                        </Text>
                      </View>
                      <Text style={[styles.metricDelta, { color: colors.textSecondary }]}>
                        {(currentMonthData.expense / incomeExpenseOverviewData.expenseByCategory.length).toFixed(0)}/cat
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Expense Distribution Chart */}
            {incomeExpenseOverviewData.expenseByCategory.length > 0 && (
              <View style={styles.chartContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>Distribution by Category</Text>
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
            )}

            {/* Expense by Category List */}
            <View style={styles.categoryList}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Expense Breakdown by Category</Text>
              {incomeExpenseOverviewData.expenseByCategory.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No expense data for this month
                  </Text>
                </View>
              ) : (
                incomeExpenseOverviewData.expenseByCategory.map((d, idx) => {
                  const totalExpense = incomeExpenseOverviewData.expenseByCategory.reduce((s, c) => s + c.value, 0);
                  const percentage = totalExpense > 0 ? (d.value / totalExpense) * 100 : 0;
                  return (
                    <View key={d.text} style={[styles.categoryItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                      <View style={[styles.colorDot, { backgroundColor: d.color }]} />
                      <View style={styles.categoryInfo}>
                        <Text style={[styles.categoryName, { color: colors.text }]}>{d.text}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <View
                            style={{
                              flex: 1,
                              height: 4,
                              backgroundColor: colors.border,
                              borderRadius: 2,
                              overflow: 'hidden',
                            }}
                          >
                            <View
                              style={{
                                width: `${percentage}%`,
                                height: '100%',
                                backgroundColor: d.color,
                              }}
                            />
                          </View>
                          <Text style={[styles.breakdownLabel, { color: colors.textSecondary, minWidth: 40 }]}>
                            {percentage.toFixed(1)}%
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.categoryAmount, { color: colors.expense }]}>-₹{d.value.toFixed(2)}</Text>
                    </View>
                  );
                })
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
            style={[styles.picker, { color: colors.text, backgroundColor: colors.surface }]}
            dropdownIconColor={colors.accent}
            mode="dropdown"
          >
            <Picker.Item label="📊 Account Analysis" value="ACCOUNT_ANALYSIS" color={colors.text} style={{ backgroundColor: colors.surface }} />
            <Picker.Item label="📈 Income Flow" value="INCOME_FLOW" color={colors.text} style={{ backgroundColor: colors.surface }} />
            <Picker.Item label="📉 Expense Flow" value="EXPENSE_FLOW" color={colors.text} style={{ backgroundColor: colors.surface }} />
            <Picker.Item label="💰 Income Overview" value="INCOME_OVERVIEW" color={colors.text} style={{ backgroundColor: colors.surface }} />
            <Picker.Item label="💸 Expense Overview" value="EXPENSE_OVERVIEW" color={colors.text} style={{ backgroundColor: colors.surface }} />
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
  wealthCard: {
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  metricsCard: {
    borderRadius: 14,
    padding: spacing.lg,
    borderWidth: 1,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  metricDelta: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  detailedAccountCard: {
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  accountIconLarge: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.accent + '15',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  accountTitleLarge: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  breakdownLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
  },
});
