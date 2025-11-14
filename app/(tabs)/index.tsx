import { useAuth } from '@/context/Auth';
import { deleteRecord, readRecords } from '@/lib/finance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';

type ViewMode = 'DAILY' | 'WEEKLY' | 'MONTHLY' | '3MONTHS' | '6MONTHS' | 'YEARLY';

export default function RecordsScreen() {
  const router = useRouter();
  const { user, session } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [displayModalVisible, setDisplayModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('MONTHLY');
  const [showTotal, setShowTotal] = useState(true);
  const [carryOver, setCarryOver] = useState(false);

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
      console.log("Loaded records:", JSON.stringify(data, null, 2));
      
      // Transform backend data to match UI expectations
      const transformedRecords = (data || []).map((record: any) => ({
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
      
      setRecords(transformedRecords);
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

  // Filter records based on view mode
  const filteredRecords = useMemo(() => {
    const { start, end } = getDateRange(viewMode, selectedDate);
    return records.filter((r) => {
      const recordDate = new Date(r.date);
      return recordDate >= start && recordDate < end;
    });
  }, [records, selectedDate, viewMode]);

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
    // Always use filtered records to show data for current view mode
    const recordsToUse = filteredRecords;
    
    const expense = recordsToUse
      .filter((r) => r.type === 'EXPENSE')
      .reduce((sum, r) => sum + r.amount, 0);
    const income = recordsToUse
      .filter((r) => r.type === 'INCOME')
      .reduce((sum, r) => sum + r.amount, 0);
    const total = income - expense;

    return { expense, income, total };
  }, [filteredRecords]);

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

  // Helper function to get period label
  const getPeriodLabel = () => {
    switch (viewMode) {
      case 'DAILY':
        return `Track your daily records`;
      case 'WEEKLY':
        return `Track your weekly records`;
      case 'MONTHLY':
        return `Track your monthly records`;
      case '3MONTHS':
        return `Track your 3-month records`;
      case '6MONTHS':
        return `Track your 6-month records`;
      case 'YEARLY':
        return `Track your yearly records`;
      default:
        return `Track your records`;
    }
  };

  // Helper function to get chart title
  const getChartTitle = () => {
    switch (viewMode) {
      case 'DAILY':
        return `Daily Income vs Expense`;
      case 'WEEKLY':
        return `Weekly Income vs Expense`;
      case 'MONTHLY':
        return `Monthly Income vs Expense`;
      case '3MONTHS':
        return `3-Month Income vs Expense`;
      case '6MONTHS':
        return `6-Month Income vs Expense`;
      case 'YEARLY':
        return `Yearly Income vs Expense`;
      default:
        return `Income vs Expense`;
    }
  };

  // Monthly chart visualization
  const MonthlyChart = () => {
    const maxAmount = Math.max(totals.income, totals.expense, 1);
    const incomeHeight = (totals.income / maxAmount) * 100;
    const expenseHeight = (totals.expense / maxAmount) * 100;

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>{getChartTitle()}</Text>
        
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
              Choose how you want to view your transactions
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

          {/* Show Total Toggle */}
          <View style={styles.modalSection}>
            <View style={styles.toggleHeader}>
              <View>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>Show Total</Text>
                <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                  Display total amount in header
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleSwitch,
                  { backgroundColor: showTotal ? colors.income : colors.textSecondary },
                ]}
                onPress={() => setShowTotal(!showTotal)}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    {
                      transform: [{ translateX: showTotal ? 20 : 0 }],
                    },
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />

          {/* Carry Over Toggle */}
          <View style={styles.modalSection}>
            <View style={styles.toggleHeader}>
              <View>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>Carry Over</Text>
                <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                  Include previous balance
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleSwitch,
                  { backgroundColor: carryOver ? colors.income : colors.textSecondary },
                ]}
                onPress={() => setCarryOver(!carryOver)}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    {
                      transform: [{ translateX: carryOver ? 20 : 0 }],
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
              These display options help you customize how your financial data is presented
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.headerContainer, { justifyContent: 'space-between' }]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Financial Overview
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {getPeriodLabel()}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setDisplayModalVisible(true)}
          >
            <MaterialCommunityIcons name="filter-outline" size={24} color={colors.accent} />
          </TouchableOpacity>
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

          {filteredRecords.length > 0 ? (
            <View>
              {filteredRecords.map((record) => (
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
                No records in this period
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                Add your first transaction to get started
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Display Options Modal */}
      <DisplayOptionsModal />

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
  // Header Container
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 12,
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
