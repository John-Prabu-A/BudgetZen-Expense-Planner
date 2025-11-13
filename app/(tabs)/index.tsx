import { useAuth } from '@/context/Auth';
import { deleteRecord, readRecords } from '@/lib/finance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';

export default function RecordsScreen() {
  const router = useRouter();
  const { user, session } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);
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
    transfer: '#8B5CF6',
  };

  useEffect(() => {
    if (user && session) {
      loadRecords();
    }
  }, [user, session]);

  // Reload records whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user && session) {
        loadRecords();
      }
    }, [user, session])
  );

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await readRecords();
      console.log("Loaded records:", data);
      setRecords(data || []);
    } catch (error) {
      console.error('Error loading records:', error);
      Alert.alert('Error', 'Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = (recordId: string, recordAmount: number) => {
    Alert.alert(
      'Delete Record',
      `Are you sure you want to delete this ₹${recordAmount} record?`,
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteRecord(recordId);
              setRecords(records.filter((r) => r.id !== recordId));
              Alert.alert('Success', 'Record deleted successfully!');
            } catch (error) {
              console.error('Error deleting record:', error);
              Alert.alert('Error', 'Failed to delete record');
            }
          },
          style: 'destructive',
        },
      ],
    );
  };
  //   {
  //     id: '1',
  //     type: 'EXPENSE',
  //     amount: 1200,
  //     category: 'Housing',
  //     icon: 'home',
  //     account: 'Savings Account',
  //     date: new Date(2025, 10, 14),
  //     notes: 'Rent payment',
  //   },
  //   {
  //     id: '2',
  //     type: 'EXPENSE',
  //     amount: 450,
  //     category: 'Food',
  //     icon: 'food',
  //     account: 'Credit Card',
  //     date: new Date(2025, 10, 13),
  //     notes: 'Groceries',
  //   },
  //   {
  //     id: '3',
  //     type: 'INCOME',
  //     amount: 50000,
  //     category: 'Salary',
  //     icon: 'briefcase',
  //     account: 'Savings Account',
  //     date: new Date(2025, 10, 1),
  //     notes: 'Monthly salary',
  //   },
  //   {
  //     id: '4',
  //     type: 'EXPENSE',
  //     amount: 200,
  //     category: 'Shopping',
  //     icon: 'shopping',
  //     account: 'Cash',
  //     date: new Date(2025, 10, 12),
  //     notes: 'Clothes shopping',
  //   },
  //   {
  //     id: '5',
  //     type: 'TRANSFER',
  //     amount: 5000,
  //     category: 'Transfer',
  //     icon: 'swap-horizontal',
  //     account: 'Savings Account',
  //     date: new Date(2025, 10, 10),
  //     notes: 'Transfer to investment',
  //   },
  // ];

  const getCurrentMonthYear = () => {
    return selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const goToPreviousMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return (
      selectedDate.getMonth() === now.getMonth() && 
      selectedDate.getFullYear() === now.getFullYear()
    );
  };

  const isFutureMonth = () => {
    const now = new Date();
    return (
      selectedDate.getFullYear() > now.getFullYear() ||
      (selectedDate.getFullYear() === now.getFullYear() && selectedDate.getMonth() > now.getMonth())
    );
  };

  const monthRecords = useMemo(() => {
    return records.filter((r) => {
      const recordDate = new Date(r.date);
      return (
        recordDate.getMonth() === selectedDate.getMonth() && 
        recordDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  }, [records, selectedDate]);

  const totals = useMemo(() => {
    const expense = monthRecords
      .filter((r) => r.type === 'EXPENSE')
      .reduce((sum, r) => sum + r.amount, 0);
    const income = monthRecords
      .filter((r) => r.type === 'INCOME')
      .reduce((sum, r) => sum + r.amount, 0);
    const total = income - expense;

    return { expense, income, total };
  }, [monthRecords]);

  // Month Navigator Component
  const MonthNavigator = () => (
    <View style={[styles.monthNavigator, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity
        style={[styles.navButton, { opacity: selectedDate.getFullYear() === 2020 && selectedDate.getMonth() === 0 ? 0.5 : 1 }]}
        onPress={goToPreviousMonth}
        disabled={selectedDate.getFullYear() === 2020 && selectedDate.getMonth() === 0}
      >
        <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.monthDisplay}>
        <Text style={[styles.monthText, { color: colors.text }]}>
          {getCurrentMonthYear()}
        </Text>
        {!isCurrentMonth() && (
          <TouchableOpacity
            style={[styles.todayButton, { backgroundColor: colors.accent }]}
            onPress={goToToday}
          >
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.navButton, { opacity: isFutureMonth() ? 0.5 : 1 }]}
        onPress={goToNextMonth}
        disabled={isFutureMonth()}
      >
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} />
      </TouchableOpacity>
    </View>
  );

  // Monthly chart visualization
  const MonthlyChart = () => {
    const maxAmount = Math.max(totals.income, totals.expense, 1);
    const incomeHeight = (totals.income / maxAmount) * 100;
    const expenseHeight = (totals.expense / maxAmount) * 100;

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Income vs Expense</Text>
        
        <View style={styles.barChartWrapper}>
          {/* Income Bar */}
          <View style={styles.barGroup}>
            <View style={styles.barLabelGroup}>
              <Text style={[styles.barLabel, { color: colors.textSecondary }]}>Income</Text>
              <Text style={[styles.barAmount, { color: colors.income }]}>
                ₹{totals.income.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.barBackground, { backgroundColor: colors.surface }]}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${incomeHeight || 5}%`,
                    backgroundColor: colors.income,
                  },
                ]}
              />
            </View>
          </View>

          {/* Expense Bar */}
          <View style={styles.barGroup}>
            <View style={styles.barLabelGroup}>
              <Text style={[styles.barLabel, { color: colors.textSecondary }]}>Expense</Text>
              <Text style={[styles.barAmount, { color: colors.expense }]}>
                ₹{totals.expense.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.barBackground, { backgroundColor: colors.surface }]}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${expenseHeight || 5}%`,
                    backgroundColor: colors.expense,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Summary Stats */}
        <View style={styles.chartSummary}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Net Balance</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: totals.total >= 0 ? colors.income : colors.expense },
              ]}
            >
              ₹{totals.total.toLocaleString()}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Save Rate</Text>
            <Text style={[styles.summaryValue, { color: colors.income }]}>
              {totals.income > 0
                ? ((totals.total / totals.income) * 100).toFixed(1)
                : 0}
              %
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const StatCard = ({ label, amount, color, icon }: any) => (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: color,
          borderColor: color,
        },
      ]}
    >
      <View style={styles.statCardContent}>
        <MaterialCommunityIcons name={icon} size={24} color="#FFFFFF" />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statAmount}>₹{amount.toLocaleString()}</Text>
    </View>
  );

  const RecordItem = ({ record }: any) => {
    const isIncome = record.type === 'INCOME';
    const isTransfer = record.type === 'TRANSFER';
    const isExpanded = expandedRecordId === record.id;

    const handleEdit = () => {
      Alert.alert(
        'Edit Record',
        'Edit functionality coming soon!',
        [{ text: 'OK', onPress: () => setExpandedRecordId(null) }]
      );
    };

    const handleDelete = () => {
      Alert.alert(
        'Delete Record',
        'Are you sure you want to delete this transaction?',
        [
          { text: 'Cancel', onPress: () => setExpandedRecordId(null), style: 'cancel' },
          {
            text: 'Delete',
            onPress: () => {
              console.log('Deleting record:', record.id);
              setExpandedRecordId(null);
              Alert.alert('Success', 'Record deleted successfully!');
            },
            style: 'destructive',
          },
        ]
      );
    };

    return (
      <View style={styles.recordItemWrapper}>
        <TouchableOpacity
          style={[
            styles.recordItem,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setExpandedRecordId(isExpanded ? null : record.id)}
          activeOpacity={0.7}
        >
          <View style={styles.recordLeft}>
            <View
              style={[
                styles.recordIcon,
                {
                  backgroundColor: isIncome ? colors.income : isTransfer ? colors.transfer : colors.expense,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={record.icon}
                size={20}
                color="#FFFFFF"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.recordCategory, { color: colors.text }]}>
                {record.category}
              </Text>
              <Text style={[styles.recordAccount, { color: colors.textSecondary }]}>
                {record.account}
              </Text>
            </View>
          </View>
          <View style={styles.recordRight}>
            <Text
              style={[
                styles.recordAmount,
                {
                  color: isIncome ? colors.income : isTransfer ? colors.transfer : colors.expense,
                },
              ]}
            >
              {isIncome ? '+' : isTransfer ? '↔️ ' : '-'}₹{record.amount.toLocaleString()}
            </Text>
            <Text style={[styles.recordDate, { color: colors.textSecondary }]}>
              {record.date.toLocaleDateString()}
            </Text>
          </View>
          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>

        {/* Expanded Actions */}
        {isExpanded && (
          <View
            style={[
              styles.recordActions,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={[styles.actionsDivider, { backgroundColor: colors.border }]} />
            
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: colors.accent + '15',
                    borderColor: colors.accent,
                  },
                ]}
                onPress={handleEdit}
              >
                <MaterialCommunityIcons name="pencil" size={18} color={colors.accent} />
                <Text style={[styles.actionButtonText, { color: colors.accent }]}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: colors.expense + '15',
                    borderColor: colors.expense,
                  },
                ]}
                onPress={handleDelete}
              >
                <MaterialCommunityIcons name="trash-can" size={18} color={colors.expense} />
                <Text style={[styles.actionButtonText, { color: colors.expense }]}>Delete</Text>
              </TouchableOpacity>
            </View>

            {/* Notes Display */}
            {record.notes && (
              <View style={[styles.notesSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.notesLabel, { color: colors.textSecondary }]}>Notes</Text>
                <Text style={[styles.notesText, { color: colors.text }]}>{record.notes}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Financial Overview
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Track your monthly records
          </Text>
        </View>

        {/* Month Navigator */}
        <MonthNavigator />

        {/* Monthly Chart */}
        <MonthlyChart />

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            label="Expense"
            amount={totals.expense}
            color={colors.expense}
            icon="trending-down"
          />
          <StatCard
            label="Income"
            amount={totals.income}
            color={colors.income}
            icon="trending-up"
          />
          <StatCard
            label="Total"
            amount={totals.total}
            color={colors.accent}
            icon="wallet"
          />
        </View>

        {/* Records List */}
        <View style={styles.recordsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Transactions
          </Text>

          {monthRecords.length > 0 ? (
            <View>
              {monthRecords.map((record) => (
                <RecordItem key={record.id} record={record} />
              ))}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <MaterialCommunityIcons
                name="inbox-multiple"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                No records in this month
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                Add your first transaction to get started
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* FAB Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => router.push('/add-record-modal')}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentInner: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  statAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recordsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  recordItemWrapper: {
    marginBottom: 8,
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  recordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  recordIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordCategory: {
    fontSize: 14,
    fontWeight: '600',
  },
  recordAccount: {
    fontSize: 12,
    marginTop: 2,
  },
  recordRight: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  recordAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  recordDate: {
    fontSize: 12,
    marginTop: 2,
  },
  recordActions: {
    borderRadius: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  actionsDivider: {
    height: 1,
    width: '100%',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notesSection: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    paddingVertical: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    marginTop: 6,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  // Chart styles
  chartContainer: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  barChartWrapper: {
    flexDirection: 'row',
    gap: 24,
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 180,
    marginBottom: 20,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
    gap: 12,
  },
  barLabelGroup: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  barAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  barBackground: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderRadius: 8,
    minHeight: 10,
  },
  chartSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  // Month Navigator Styles
  monthNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  monthDisplay: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '700',
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  todayButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
