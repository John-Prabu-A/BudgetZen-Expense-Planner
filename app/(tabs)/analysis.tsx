
import { useAuth } from '@/context/Auth';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { useSmartLoading } from '@/hooks/useSmartLoading';
import { useUIMode } from '@/hooks/useUIMode';
import { readCategories, readRecords, readAccounts } from '@/lib/finance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { VictoryBar, VictoryChart, VictoryTheme, VictoryPie, VictoryLine } from 'victory-native';
import IncomeExpenseCalendar from '@/app/components/IncomeExpenseCalendar';

type AnalysisView =
  | 'ACCOUNT_ANALYSIS'
  | 'INCOME_FLOW'
  | 'EXPENSE_FLOW'
  | 'INCOME_OVERVIEW'
  | 'EXPENSE_OVERVIEW';

export default function AnalysisScreen() {
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === 'dark';
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
        id: account.id,
        name: account.name,
        income,
        expense,
      };
    });
    return data;
  }, [accounts, currentMonthData.records]);

  const incomeExpenseFlowData = useMemo(() => {
    const incomeData: {x: number, y: number}[] = [];
    const expenseData: {x: number, y: number}[] = [];
    for (let i = 1; i <= 31; i++) {
        incomeData.push({x: i, y: 0});
        expenseData.push({x: i, y: 0});
    }

    currentMonthData.records.forEach(record => {
        const day = record.date.getDate();
        if (record.type === 'INCOME') {
            incomeData[day - 1].y += record.amount;
        } else {
            expenseData[day - 1].y += record.amount;
        }
    });

    return {incomeData, expenseData};
  }, [currentMonthData.records]);
  
  const incomeExpenseOverviewData = useMemo(() => {
    const incomeByCategory = categories.filter(c => c.type === 'income').map(category => {
        const categoryRecords = currentMonthData.records.filter(r => r.category_id === category.id && r.type === 'INCOME');
        const total = categoryRecords.reduce((sum, r) => sum + r.amount, 0);
        return {
            x: category.name,
            y: total
        }
    }).filter(d => d.y > 0);

    const expenseByCategory = categories.filter(c => c.type === 'expense').map(category => {
        const categoryRecords = currentMonthData.records.filter(r => r.category_id === category.id && r.type === 'EXPENSE');
        const total = categoryRecords.reduce((sum, r) => sum + r.amount, 0);
        return {
            x: category.name,
            y: total
        }
    }).filter(d => d.y > 0);

    return {incomeByCategory, expenseByCategory};
  }, [categories, currentMonthData.records]);


  const handleDateChange = (direction: 'prev' | 'next') => {
    setSelectedDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
      return newDate;
    });
  };

  const renderAnalysisView = () => {
    switch (analysisView) {
      case 'ACCOUNT_ANALYSIS':
        return (
            <View>
                <VictoryChart theme={VictoryTheme.material}>
                    <VictoryBar
                        data={accountAnalysisData}
                        x="name"
                        y={(d) => d.income - d.expense}
                        style={{ data: { fill: "#4CAF50" } }}
                    />
                </VictoryChart>
                 {accountAnalysisData.map(account => (
                    <View key={account.id} style={styles.accountItem}>
                        <Text style={styles.accountName}>{account.name}</Text>
                        <Text style={styles.accountIncome}>+{account.income.toFixed(2)}</Text>
                        <Text style={styles.accountExpense}>-{account.expense.toFixed(2)}</Text>
                    </View>
                ))}
            </View>
        );
      case 'INCOME_FLOW':
        return (
          <View>
            <VictoryChart theme={VictoryTheme.material}>
              <VictoryLine data={incomeExpenseFlowData.incomeData} />
            </VictoryChart>
            <IncomeExpenseCalendar year={selectedDate.getFullYear()} month={selectedDate.getMonth()} data={calendarData} />
          </View>
        );
      case 'EXPENSE_FLOW':
        return (
          <View>
            <VictoryChart theme={VictoryTheme.material}>
              <VictoryLine data={incomeExpenseFlowData.expenseData} style={{data: {stroke: '#EF4444'}}}/>
            </VictoryChart>
            <IncomeExpenseCalendar year={selectedDate.getFullYear()} month={selectedDate.getMonth()} data={calendarData} />
          </View>
        );
      case 'INCOME_OVERVIEW':
        return (
          <View>
             <VictoryPie data={incomeExpenseOverviewData.incomeByCategory} />
             {incomeExpenseOverviewData.incomeByCategory.map(d => (
                 <View key={d.x} style={styles.categoryItem}>
                    <Text>{d.x}</Text>
                    <Text>+{d.y.toFixed(2)}</Text>
                 </View>
             ))}
          </View>
        );
      case 'EXPENSE_OVERVIEW':
        return (
            <View>
                <VictoryPie data={incomeExpenseOverviewData.expenseByCategory} />
                {incomeExpenseOverviewData.expenseByCategory.map(d => (
                    <View key={d.x} style={styles.categoryItem}>
                        <Text>{d.x}</Text>
                        <Text>-{d.y.toFixed(2)}</Text>
                    </View>
                ))}
            </View>
        );
      default:
        return null;
    }
  };

  const styles = createAnalysisStyles(spacing, isDark);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => handleDateChange('prev')}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={isDark ? 'white' : 'black'} />
        </TouchableOpacity>
        <Text style={styles.headerText}>{selectedDate.toLocaleString('default', { month: 'long' })}, {selectedDate.getFullYear()}</Text>
        <TouchableOpacity onPress={() => handleDateChange('next')}>
          <MaterialCommunityIcons name="chevron-right" size={24} color={isDark ? 'white' : 'black'} />
        </TouchableOpacity>
      </View>
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>EXPENSE</Text>
            <Text style={styles.summaryValueExpense}>₹{currentMonthData.expense.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>INCOME</Text>
            <Text style={styles.summaryValueIncome}>₹{currentMonthData.income.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>TOTAL</Text>
            <Text style={styles.summaryValueTotal}>₹{(currentMonthData.income - currentMonthData.expense).toFixed(2)}</Text>
        </View>
      </View>
      
      <View style={styles.viewSelector}>
        <TouchableOpacity onPress={() => setAnalysisView('ACCOUNT_ANALYSIS')} style={[styles.viewButton, analysisView === 'ACCOUNT_ANALYSIS' && styles.viewButtonActive]}>
          <Text style={styles.viewButtonText}>ACCOUNT ANALYSIS</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setAnalysisView('INCOME_FLOW')} style={[styles.viewButton, analysisView === 'INCOME_FLOW' && styles.viewButtonActive]}>
          <Text style={styles.viewButtonText}>INCOME FLOW</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setAnalysisView('EXPENSE_FLOW')} style={[styles.viewButton, analysisView === 'EXPENSE_FLOW' && styles.viewButtonActive]}>
          <Text style={styles.viewButtonText}>EXPENSE FLOW</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setAnalysisView('INCOME_OVERVIEW')} style={[styles.viewButton, analysisView === 'INCOME_OVERVIEW' && styles.viewButtonActive]}>
          <Text style={styles.viewButtonText}>INCOME OVERVIEW</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setAnalysisView('EXPENSE_OVERVIEW')} style={[styles.viewButton, analysisView === 'EXPENSE_OVERVIEW' && styles.viewButtonActive]}>
          <Text style={styles.viewButtonText}>EXPENSE OVERVIEW</Text>
        </TouchableOpacity>
      </View>
      
      {renderAnalysisView()}
    </ScrollView>
  );
}

const createAnalysisStyles = (spacing: any, isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: isDark ? '#121212' : '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: isDark ? 'white' : 'black',
    },
    summary: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: spacing.lg,
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 12,
        color: isDark ? '#A0A0A0' : '#666666',
    },
    summaryValueExpense: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#EF4444',
    },
    summaryValueIncome: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10B981',
    },
    summaryValueTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: isDark ? 'white' : 'black',
    },
    viewSelector: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: spacing.md,
        backgroundColor: isDark ? '#1E1E1E' : '#EEEEEE',
    },
    viewButton: {
        padding: spacing.md,
    },
    viewButtonActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#0284c7',
    },
    viewButtonText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: isDark ? 'white' : 'black',
    },
    accountItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: spacing.md,
        backgroundColor: isDark ? '#1E1E1E' : 'white',
        borderBottomWidth: 1,
        borderBottomColor: isDark ? '#404040' : '#E5E5E5',
    },
    accountName: {
        color: isDark ? 'white' : 'black',
    },
    accountIncome: {
        color: '#10B981',
    },
    accountExpense: {
        color: '#EF4444',
    },
    categoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: spacing.md,
        backgroundColor: isDark ? '#1E1E1E' : 'white',
        borderBottomWidth: 1,
        borderBottomColor: isDark ? '#404040' : '#E5E5E5',
    }
});
