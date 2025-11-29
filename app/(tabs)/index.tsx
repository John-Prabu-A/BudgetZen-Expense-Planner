import { useAuth } from '@/context/Auth';
import { useTheme } from '@/context/Theme';
import { useSmartLoading } from '@/hooks/useSmartLoading';
import { useUIMode } from '@/hooks/useUIMode';
import { deleteRecord, readRecords } from '@/lib/finance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Dimensions, ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import IncomeExpenseCalendar from '../components/IncomeExpenseCalendar';

type ViewMode = 'DAILY' | 'WEEKLY' | 'MONTHLY' | '3MONTHS' | '6MONTHS' | 'YEARLY';

export default function RecordsScreen() {
  const router = useRouter();
  const { user, session } = useAuth();
  const { isDark, colors } = useTheme();
  const spacing = useUIMode();
  const styles = getStyles(spacing);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('MONTHLY');
  const [showTotal, setShowTotal] = useState(true);
  const [carryOver, setCarryOver] = useState(false);
  const pagerRef = useRef<any>(null);
  const [pageIndex, setPageIndex] = useState<number>(viewMode === 'MONTHLY' ? 1 : 0);

  // New: explicit date range control (start/end) for calendar view
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 29))); // default 30 days
  const [endDate, setEndDate] = useState<Date>(new Date());

  // Helper: normalize date to YYYY-MM-DD key
  const toDateKey = (d: Date) => d.toISOString().slice(0, 10);

  // Shift range by number of days (positive or negative)
  const shiftRange = (days: number) => {
    setStartDate((s) => new Date(s.getFullYear(), s.getMonth(), s.getDate() + days));
    setEndDate((e) => new Date(e.getFullYear(), e.getMonth(), e.getDate() + days));
  };

  // Set preset ranges: 7, 14, 30, 90 days
  const setPresetRange = (days: number) => {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - (days - 1));
    setStartDate(start);
    setEndDate(end);
  };

  // Generate array of days between start and end (inclusive)
  const getDaysArray = (start: Date, end: Date) => {
    const arr: Date[] = [];
    const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cur <= last) {
      arr.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return arr;
  };

  // Aggregate records per day within start/end range
  const dailyData = useMemo(() => {
    const days = getDaysArray(startDate, endDate);
    const map: Record<string, { income: number; expense: number; net: number }> = {};
    days.forEach((d) => {
      const key = toDateKey(d);
      map[key] = { income: 0, expense: 0, net: 0 };
    });

    // Sum records falling inside range
    (records || []).forEach((r) => {
      const rDate = new Date(r.date);
      const key = toDateKey(rDate);
      if (map[key]) {
        if (r.type === 'INCOME') map[key].income += r.amount;
        else if (r.type === 'EXPENSE') map[key].expense += r.amount;
        else {
          // transfers treated neutral
        }
        map[key].net = map[key].income - map[key].expense;
      }
    });

    // Build ordered array with cumulative running total
    const list: Array<{ date: Date; key: string; income: number; expense: number; net: number; cumulative: number }> = [];
    let running = 0;
    days.forEach((d) => {
      const key = toDateKey(d);
      const { income, expense, net } = map[key] || { income: 0, expense: 0, net: 0 };
      running += net;
      list.push({ date: d, key, income, expense, net, cumulative: running });
    });

    return list;
  }, [records, startDate, endDate]);

  // Totals over selected range
  const rangeTotals = useMemo(() => {
    const income = dailyData.reduce((s, d) => s + d.income, 0);
    const expense = dailyData.reduce((s, d) => s + d.expense, 0);
    const net = income - expense;
    return { income, expense, net };
  }, [dailyData]);

  // Smart loading hook - only shows loading on first load, not on tab switches
  const { loading, handleLoad } = useSmartLoading(
    async () => {
      const data = await readRecords();
      const transformedRecords = (data || []).map((record: any) => ({
        id: record.id,
        type: record.type.toUpperCase(),
        amount: record.amount,
        category: record.categories?.name || 'Unknown',
        category_id: record.category_id,
        category_color: record.categories?.color || '#888888',
        icon: record.categories?.icon || 'cash',
        account: record.accounts?.name || 'Unknown Account',
        account_id: record.account_id,
        date: new Date(record.transaction_date),
        notes: record.notes || '',
      }));
      setRecords(transformedRecords);
    },
    [user, session]
  );

  useEffect(() => {
    if (user && session) {
      handleLoad();
    }
  }, [user, session, handleLoad]);

  // Reload records whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user && session) {
        handleLoad();
      }
    }, [user, session, handleLoad])
  );

  const deleteRecordHandler = (recordId: string, recordAmount: number) => {
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

  // New RangeNavigator - shows different controls depending on which pager page is visible
  const RangeNavigator = () => {
    // calendar page (0) vs monthly page (1)
    if (pageIndex === 1) {
      // For monthly page reuse MonthNavigator (keeps month navigation controls compact)
      return <MonthNavigator />;
    }

    // Calendar-specific navigator
    const rangeDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const currentRangeDays = rangeDays; // normalized helper for comparisons

    return (
      <View style={[styles.monthNavigator, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => shiftRange(-rangeDays)} style={[styles.navButton, styles.iconButton]}>
          <MaterialCommunityIcons name="chevron-left" size={18} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.monthDisplay}>
          <Text numberOfLines={1} style={[styles.monthText, { color: colors.text }]}>
            {startDate.toLocaleDateString()} — {endDate.toLocaleDateString()}
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
            {[7, 14, 30, 90].map((d) => {
              const isActive = d === currentRangeDays;
              return (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.presetButton,
                    { backgroundColor: isActive ? colors.accent : colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => {
                    setPresetRange(d);
                    // ensure calendar page is visible when a preset is chosen
                    setPageIndex(0);
                    setViewMode('DAILY');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.presetText, { color: isActive ? '#fff' : colors.text }]}>{d}d</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

        </View>

        <TouchableOpacity onPress={() => shiftRange(rangeDays)} style={[styles.navButton, styles.iconButton]}>
          <MaterialCommunityIcons name="chevron-right" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>
    );
  };

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
      <View style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: pageIndex === 1 ? (spacing?.md ?? 12) : (spacing?.xl ?? 24) }]}>
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
      // close expansion and open Add Record modal in edit mode by passing record data
      setExpandedRecordId(null);
      const payload = {
        id: record.id,
        amount: record.amount,
        type: record.type.toLowerCase(),
        account_id: record.account_id,
        category_id: record.category_id,
        notes: record.notes || null,
        transaction_date: record.date instanceof Date ? record.date.toISOString() : new Date(record.date).toISOString(),
      };
      router.push(`/add-record-modal?record=${encodeURIComponent(JSON.stringify(payload))}` as any);
    };

    const handleDelete = () => {
      // delegate to existing delete handler which shows confirmation and updates state
      setExpandedRecordId(null);
      deleteRecordHandler(record.id, record.amount);
    };

    return (
      <View style={styles.recordItemWrapper}>
        <TouchableOpacity
          style={[
            styles.recordItem,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
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

  // Range Navigator Component
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

  // Keep pager in sync when pageIndex changes
  useEffect(() => {
    const w = Dimensions.get('window').width;
    if (pagerRef.current && typeof pagerRef.current.scrollTo === 'function') {
      pagerRef.current.scrollTo({ x: pageIndex * w, animated: true });
    }
  }, [pageIndex]);

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
            <Text style={[styles.headerTitle, { color: colors.text }]}>Financial Overview</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{getPeriodLabel()}</Text>
          </View>
          <View style={{ width: 28 }} />
        </View>

        {/* Range Navigator (controls) */}
        <RangeNavigator />

        {/* Pager: swipe horizontally between calendar (index 0) and monthly chart (index 1) */}
        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const w = Dimensions.get('window').width;
            const newIndex = Math.round(e.nativeEvent.contentOffset.x / w);
            setPageIndex(newIndex);
            setViewMode(newIndex === 1 ? 'MONTHLY' : 'DAILY');
          }}
        >
          <View style={{ width: Dimensions.get('window').width - 8, paddingRight: 8 }}>
            <IncomeExpenseCalendar
              dailyData={dailyData}
              rangeTotals={rangeTotals}
              colors={colors}
              spacing={spacing}
              onDayPress={(day: any) => {
                setSelectedDate(new Date(day.date));
                setViewMode('DAILY');
              }}
            />
          </View>

          <View style={{ width: Dimensions.get('window').width - 18, paddingRight: 0, marginRight: 2 }}>
            <MonthlyChart />
          </View>
        </ScrollView>

        {/* Stat Cards - Income, Expense, Total */}
        {/* Use range totals when calendar page is visible, otherwise use filtered view totals */}
        {(() => {
          // Compute display totals in a type-safe way (rangeTotals has {income,expense,net}, totals has {income,expense,total})
          const display = (pageIndex === 0 ? rangeTotals : totals) as any;
          const displayIncome: number = Number(display.income ?? 0);
          const displayExpense: number = Number(display.expense ?? 0);
          const displayNet: number = typeof display.net === 'number' ? display.net : Number(display.total ?? (displayIncome - displayExpense));

          return (
            <View style={{ flexDirection: 'row', gap: 5, marginVertical: spacing.lg }}>
              <StatCard
                label="Total Income"
                amount={displayIncome}
                color={colors.income}
                icon="arrow-up-circle"
              />
              <StatCard
                label="Total Expense"
                amount={displayExpense}
                color={colors.expense}
                icon="arrow-down-circle"
              />
              <StatCard
                label="Net Total"
                amount={displayNet}
                color={displayNet >= 0 ? colors.income : colors.expense}
                icon="currency-rupee"
              />
            </View>
          );
        })()}

        {/* Records List - show monthRecords directly */}
        <View style={{ paddingBottom: spacing.xl }}>
          {monthRecords.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="folder-off" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: colors.text }]}>No records found</Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                Try adding some transactions
              </Text>
            </View>
          ) : (
            monthRecords.map((record) => <RecordItem key={record.id} record={record} />)
          )}
        </View>

        {/* Floating Action Button for adding records */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.accent }]}
          onPress={() => {
            // Open Add Record modal
            setExpandedRecordId(null);
            router.push('/add-record-modal' as any);
          }}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const getStyles = (spacing: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 8 },
    scrollContentInner: { paddingBottom: 45 },

    // Header
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacing?.xl ?? 24,
      gap: spacing?.md ?? 16,
      margin: 5,
    },
    header: { flex: 1 },
    headerTitle: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
    headerSubtitle: { fontSize: 14, color: '#A0A0A0' },
    filterButton: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      marginTop: 4,
    },

    // Range / Month Navigator
    monthNavigator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing?.md ?? 12,
      paddingVertical: spacing?.sm ?? 10,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: spacing?.lg ?? 18,
      gap: 12,
    },
    navButton: {
      padding: 6,
      borderRadius: 8,
    },
    iconButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthDisplay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    monthText: { fontSize: 14, fontWeight: '700' },
    todayButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    todayButtonText: { fontSize: 11, fontWeight: '600', color: '#FFFFFF' },
    presetRow: { paddingVertical: 8, paddingHorizontal: 4, alignItems: 'center', gap: 8 },
    presetButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      marginRight: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    presetText: { fontSize: 13, fontWeight: '600' },
    viewModeButton: {
      paddingHorizontal: spacing?.lg ?? 12,
      paddingVertical: spacing?.xs ?? 6,
      borderRadius: 999,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 48,
    },
    viewModeText: { fontSize: 13, fontWeight: '600' },

    // Charts
    chartContainer: {
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: spacing?.lg ?? 16,
      paddingVertical: spacing?.lg ?? 16,
      marginBottom: spacing?.xl ?? 24,
    },
    chartTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing?.lg ?? 16 },

    // Bar chart
    barChartWrapper: {
      flexDirection: 'row',
      gap: 16,
      justifyContent: 'space-around',
      alignItems: 'flex-end',
      height: 180,
      marginBottom: 16,
    },
    barGroup: { flex: 1, alignItems: 'center', gap: 8 },
    barLabelGroup: { alignItems: 'center', width: '100%', marginBottom: 4 },
    barLabel: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
    barAmount: { fontSize: 14, fontWeight: '700' },
    barBackground: {
      width: '100%',
      height: 120,
      borderRadius: 8,
      overflow: 'hidden',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    bar: { width: '100%', borderRadius: 8, minHeight: 10 },

    // Chart summary
    chartSummary: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0,0,0,0.1)',
    },
    summaryItem: { alignItems: 'center', flex: 1 },
    summaryLabel: { fontSize: 12, marginBottom: 4 },
    summaryValue: { fontSize: 16, fontWeight: '700' },
    summaryDivider: { width: 1, height: 40, backgroundColor: 'rgba(0,0,0,0.1)' },

    // Stat Card
    statCard: {
      flex: 1,
      borderRadius: 12,
      padding: spacing?.md ?? 12,
      alignItems: 'flex-start',
      justifyContent: 'space-around',
    },
    statCardContent: { flexDirection: 'row', alignItems: 'center', gap: 0, marginLeft: -4 },
    statLabel: { color: '#FFFFFF', marginLeft: 0 },
    statAmount: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },

    // Modal
    modalContainer: { flex: 1, paddingTop: 60 },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing?.lg ?? 16,
      paddingVertical: spacing?.lg ?? 16,
      borderBottomWidth: 1,
    },
    modalTitle: { fontSize: 18, fontWeight: '700' },
    modalContent: { flex: 1, paddingHorizontal: spacing?.lg ?? 16, paddingTop: spacing?.lg ?? 16 },
    modalSection: { marginBottom: spacing?.lg ?? 16 },
    modalSectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing?.xs ?? 8 },
    modalSectionDescription: { fontSize: 13, marginBottom: spacing?.md ?? 12 },
    modalDivider: { height: 1, marginVertical: spacing?.lg ?? 16 },

    // Toggles
    toggleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    toggleTitle: { fontSize: 15, fontWeight: '600', marginBottom: spacing?.xs ?? 8 },
    toggleDescription: { fontSize: 12 },
    toggleSwitch: { width: 50, height: 28, borderRadius: 14, padding: 2, justifyContent: 'center' },
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
      gap: spacing?.md ?? 12,
      paddingHorizontal: spacing?.md ?? 12,
      paddingVertical: spacing?.md ?? 12,
      borderRadius: 10,
      borderWidth: 1,
      marginTop: spacing?.lg ?? 16,
    },
    infoText: { fontSize: 12, flex: 1, lineHeight: 16 },

    modalFooter: {
      flexDirection: 'row',
      gap: spacing?.md ?? 12,
      paddingHorizontal: spacing?.lg ?? 16,
      paddingVertical: spacing?.lg ?? 16,
      borderTopWidth: 1,
    },
    footerButton: { flex: 1, paddingVertical: spacing?.md ?? 12, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
    footerButtonText: { fontSize: 14, fontWeight: '600' },

    // Record item
    recordItemWrapper: { marginBottom: spacing?.md ?? 12 },
    recordItem: { flexDirection: 'row', alignItems: 'center', padding: spacing?.md ?? 12, borderRadius: 12, borderWidth: 1 },
    recordLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing?.md ?? 12, flex: 1 },
    recordIcon: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    recordCategory: { fontSize: 14, fontWeight: '600' },
    recordAccount: { fontSize: 12, marginTop: 2 },
    recordRight: { alignItems: 'flex-end', marginRight: spacing?.xs ?? 4 },
    recordAmount: { fontSize: 14, fontWeight: '700' },
    recordDate: { fontSize: 12, marginTop: 2 },

    recordActions: {
      borderRadius: 0,
      borderBottomLeftRadius: 10,
      borderBottomRightRadius: 10,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      marginBottom: spacing?.xs ?? 8,
    },
    actionsDivider: { height: 1, width: '100%' },
    actionsContainer: { flexDirection: 'row', gap: spacing?.md ?? 12, paddingHorizontal: spacing?.md ?? 12, paddingVertical: spacing?.md ?? 12 },
    actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
    actionButtonText: { fontSize: 12, fontWeight: '600' },

    notesSection: { paddingHorizontal: spacing?.md ?? 12, paddingVertical: spacing?.md ?? 12, borderTopWidth: 1 },
    notesLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
    notesText: { fontSize: 13, lineHeight: 18 },

    emptyState: { paddingVertical: spacing?.xxl ?? 48, borderRadius: 12, alignItems: 'center' },
    emptyStateText: { fontSize: 16, fontWeight: '600', marginTop: spacing?.md ?? 12 },
    emptyStateSubtext: { fontSize: 13, marginTop: spacing?.sm ?? 8 },

    fab: {
      position: 'absolute',
      bottom: spacing?.lg ?? 16,
      right: spacing?.lg ?? 16,
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
  });
