import { useAuth } from '@/context/Auth';
import { useTheme } from '@/context/Theme';
import { useSmartLoading } from '@/hooks/useSmartLoading';
import { useUIMode } from '@/hooks/useUIMode';
import { deleteRecord, readRecords } from '@/lib/finance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import IncomeExpenseCalendar from '../components/IncomeExpenseCalendar';

type ViewMode = 'DAILY' | 'WEEKLY' | 'MONTHLY' | '3MONTHS' | '6MONTHS' | 'YEARLY' | 'CALENDAR' | 'CHART';

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
  const [showTotal] = useState(true);
  const [carryOver] = useState(false);
  const [pagerView, setPagerView] = useState<'CALENDAR' | 'CHART'>('CALENDAR');
  const [fabExpanded, setFabExpanded] = useState(false);

  // explicit start/end for calendar range
  // Default: current month from 1st to today
  const initializeCurrentMonthRange = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start: firstDay, end: today };
  };
  
  const { start: defaultStart, end: defaultEnd } = initializeCurrentMonthRange();
  const [startDate, setStartDate] = useState<Date>(defaultStart);
  const [endDate, setEndDate] = useState<Date>(defaultEnd);
  const [activePresetDays, setActivePresetDays] = useState<'CURRENT_MONTH' | 'CUSTOM' | number>('CURRENT_MONTH');

  // caching last 90 days
  const lastComputedDateRef = useRef<string>('');
  const cachedLast90DaysRef = useRef<
    Array<{ date: Date; key: string; income: number; expense: number; net: number; cumulative: number }>
  >([]);

  const toDateKey = useCallback((d: Date) => d.toISOString().slice(0, 10), []);

  const shiftRange = useCallback((days: number) => {
    setStartDate((s) => {
      const ns = new Date(s.getFullYear(), s.getMonth(), s.getDate() + days);
      return ns;
    });
    setEndDate((e) => {
      const ne = new Date(e.getFullYear(), e.getMonth(), e.getDate() + days);
      return ne;
    });
    setActivePresetDays('CUSTOM');
  }, []);

  const setPresetRange = useCallback((days: number | 'CURRENT_MONTH') => {
    if (days === 'CURRENT_MONTH') {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay);
      setEndDate(today);
    } else {
      const end = new Date();
      const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - (days - 1));
      setStartDate(start);
      setEndDate(end);
    }
    setActivePresetDays(days);
  }, []);

  const getDaysArray = useCallback((start: Date, end: Date) => {
    const arr: Date[] = [];
    const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cur <= last) {
      arr.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return arr;
  }, []);

  const getLast90DaysData = useCallback(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const shouldRecompute = todayKey !== lastComputedDateRef.current;

    if (!shouldRecompute && cachedLast90DaysRef.current.length > 0) {
      return cachedLast90DaysRef.current;
    }

    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 89);

    const days = getDaysArray(start, end);
    const map: Record<string, { income: number; expense: number; net: number }> = {};
    days.forEach((d) => {
      const key = toDateKey(d);
      map[key] = { income: 0, expense: 0, net: 0 };
    });

    (records || []).forEach((r) => {
      const rDate = new Date(r.date);
      const key = toDateKey(rDate);
      if (map[key]) {
        if (r.type === 'INCOME') map[key].income += Number(r.amount || 0);
        else if (r.type === 'EXPENSE') map[key].expense += Number(r.amount || 0);
        map[key].net = map[key].income - map[key].expense;
      }
    });

    const list: Array<{ date: Date; key: string; income: number; expense: number; net: number; cumulative: number }> = [];
    let running = 0;
    days.forEach((d) => {
      const key = toDateKey(d);
      const { income, expense, net } = map[key] || { income: 0, expense: 0, net: 0 };
      running += net;
      list.push({ date: d, key, income, expense, net, cumulative: running });
    });

    cachedLast90DaysRef.current = list;
    lastComputedDateRef.current = todayKey;
    return list;
  }, [records, getDaysArray, toDateKey]);

  const dailyData = useMemo(() => {
    const last90Days = getLast90DaysData();
    const startKey = toDateKey(startDate);
    const endKey = toDateKey(endDate);
    return last90Days.filter((item) => item.key >= startKey && item.key <= endKey);
  }, [startDate, endDate, getLast90DaysData, toDateKey]);

  const rangeTotals = useMemo(() => {
    const income = dailyData.reduce((s, d) => s + d.income, 0);
    const expense = dailyData.reduce((s, d) => s + d.expense, 0);
    const net = income - expense;
    return { income, expense, net };
  }, [dailyData]);

  const { loading, handleLoad } = useSmartLoading(
    async () => {
      const data = await readRecords();
      const transformedRecords = (data || []).map((record: any) => ({
        id: record.id,
        type: (record.type || 'EXPENSE').toUpperCase(),
        amount: Number(record.amount || 0),
        category: record.categories?.name || 'Unknown',
        category_id: record.category_id,
        category_color: record.categories?.color || '#888888',
        icon: record.categories?.icon || 'cash',
        account: record.accounts?.name || 'Unknown Account',
        account_id: record.account_id,
        date: new Date(record.transaction_date || record.date || new Date()),
        notes: record.notes || '',
      }));
      setRecords(transformedRecords);
      // refresh 90-day cache after new records load
      cachedLast90DaysRef.current = [];
      lastComputedDateRef.current = '';
    },
    [user, session]
  );

  useEffect(() => {
    if (user && session) {
      handleLoad();
    }
  }, [user, session, handleLoad]);

  useFocusEffect(
    useCallback(() => {
      if (user && session) {
        handleLoad();
      }
    }, [user, session, handleLoad])
  );

  const deleteRecordHandler = useCallback((recordId: string, recordAmount: number) => {
    Alert.alert('Delete Record', `Are you sure you want to delete this ₹${recordAmount} record?`, [
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
            setRecords((prev) => prev.filter((r) => r.id !== recordId));
            Alert.alert('Success', 'Record deleted successfully!');
          } catch (error) {
            console.error('Error deleting record:', error);
            Alert.alert('Error', 'Failed to delete record');
          }
        },
        style: 'destructive',
      },
    ]);
  }, []);

  const getCurrentMonthYear = useCallback(() => {
    return selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [selectedDate]);

  const goToPreviousMonth = useCallback(() => {
    setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }, []);

  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const isCurrentMonth = useCallback(() => {
    const now = new Date();
    return selectedDate.getMonth() === now.getMonth() && selectedDate.getFullYear() === now.getFullYear();
  }, [selectedDate]);

  const isFutureMonth = useCallback(() => {
    const now = new Date();
    return selectedDate.getFullYear() > now.getFullYear() || (selectedDate.getFullYear() === now.getFullYear() && selectedDate.getMonth() > now.getMonth());
  }, [selectedDate]);

  const getDateRange = useCallback((mode: ViewMode, referenceDate: Date) => {
    const date = new Date(referenceDate);
    let start, end;

    switch (mode) {
      case 'DAILY':
        start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        break;
      case 'WEEKLY': {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        start = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
        end = new Date(start);
        end.setDate(start.getDate() + 7);
      }
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
  }, []);

  const filteredRecords = useMemo(() => {
    const { start, end } = getDateRange(viewMode, selectedDate);
    return records.filter((r) => {
      const recordDate = new Date(r.date);
      return recordDate >= start && recordDate < end;
    });
  }, [records, selectedDate, viewMode, getDateRange]);

  const monthRecords = useMemo(() => {
    return records.filter((r) => {
      const recordDate = new Date(r.date);
      return recordDate.getMonth() === selectedDate.getMonth() && recordDate.getFullYear() === selectedDate.getFullYear();
    });
  }, [records, selectedDate]);

  const totals = useMemo(() => {
    const recordsToUse = filteredRecords;
    const expense = recordsToUse.filter((r) => r.type === 'EXPENSE').reduce((s, r) => s + Number(r.amount || 0), 0);
    const income = recordsToUse.filter((r) => r.type === 'INCOME').reduce((s, r) => s + Number(r.amount || 0), 0);
    const total = income - expense;
    return { expense, income, total };
  }, [filteredRecords]);

  // ======= Components (non-memoized navigator components) =======

  const ChartMonthNavigator = useCallback(() => (
    <View style={[styles.monthNavigator, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity
        style={[styles.navButton, { opacity: selectedDate.getFullYear() === 2020 && selectedDate.getMonth() === 0 ? 0.5 : 1 }]}
        onPress={goToPreviousMonth}
        disabled={selectedDate.getFullYear() === 2020 && selectedDate.getMonth() === 0}
        activeOpacity={0.6}
      >
        <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.monthDisplay}>
        <Text style={[styles.monthText, { color: colors.text }]}>{getCurrentMonthYear()}</Text>
        {!isCurrentMonth() && (
          <TouchableOpacity style={[styles.todayButton, { backgroundColor: colors.accent }]} onPress={goToToday} activeOpacity={0.7}>
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.navButton, { opacity: isFutureMonth() ? 0.5 : 1 }]}
        onPress={goToNextMonth}
        disabled={isFutureMonth()}
        activeOpacity={0.6}
      >
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} />
      </TouchableOpacity>
    </View>
  ), [selectedDate, colors, styles, goToPreviousMonth, goToNextMonth, goToToday, getCurrentMonthYear, isCurrentMonth, isFutureMonth]);

  const RangeNavigator = useCallback(() => {
    if (pagerView === 'CHART') return null;

    // compute inclusive number of days between start and end
    const msPerDay = 24 * 60 * 60 * 1000;
    const rangeDays = Math.round((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;

    return (
      <View style={[styles.monthNavigator, { backgroundColor: colors.surface, borderColor: colors.border }]}>

        <View style={styles.monthDisplay}>
          <Text numberOfLines={1} style={[styles.monthText, { color: colors.text }]}>
            {startDate.toLocaleDateString()} — {endDate.toLocaleDateString()}
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow} scrollEventThrottle={16}>
            {/* Current Month Button */}
            <TouchableOpacity
              style={[
                styles.presetButton,
                { backgroundColor: activePresetDays === 'CURRENT_MONTH' ? colors.accent : colors.surface, borderColor: colors.border },
              ]}
              onPress={() => setPresetRange('CURRENT_MONTH')}
              activeOpacity={0.7}
            >
              <Text style={[styles.presetText, { color: activePresetDays === 'CURRENT_MONTH' ? '#fff' : colors.text }]}>This Month</Text>
            </TouchableOpacity>
            
            {[7, 14, 30, 90].map((d) => {
              const isActive = activePresetDays === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.presetButton,
                    { backgroundColor: isActive ? colors.accent : colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => {
                    setPresetRange(d);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetText, { color: isActive ? '#fff' : colors.text }]}>{d}d</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    );
  }, [pagerView, endDate, startDate, activePresetDays, colors, styles, shiftRange, setPresetRange]);

  // Monthly chart
  const MonthlyChart = useCallback(() => {
    const maxAmount = Math.max(totals.income, totals.expense, 1);
    const incomeHeight = (totals.income / maxAmount) * 100;
    const expenseHeight = (totals.expense / maxAmount) * 100;

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: spacing?.xl ?? 24 }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>{getChartTitle(viewMode)}</Text>

        <View style={styles.barChartWrapper}>
          <View style={styles.barGroup}>
            <View style={styles.barLabelGroup}>
              <Text style={[styles.barLabel, { color: colors.textSecondary }]}>Income</Text>
              <Text style={[styles.barAmount, { color: colors.income }]}>₹{totals.income.toLocaleString()}</Text>
            </View>
            <View style={[styles.barBackground, { backgroundColor: colors.surface }]}>
              <View style={[styles.bar, { height: `${incomeHeight || 5}%`, backgroundColor: colors.income }]} />
            </View>
          </View>

          <View style={styles.barGroup}>
            <View style={styles.barLabelGroup}>
              <Text style={[styles.barLabel, { color: colors.textSecondary }]}>Expense</Text>
              <Text style={[styles.barAmount, { color: colors.expense }]}>₹{totals.expense.toLocaleString()}</Text>
            </View>
            <View style={[styles.barBackground, { backgroundColor: colors.surface }]}>
              <View style={[styles.bar, { height: `${expenseHeight || 5}%`, backgroundColor: colors.expense }]} />
            </View>
          </View>
        </View>

        <View style={styles.chartSummary}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Net Balance</Text>
            <Text style={[styles.summaryValue, { color: totals.total >= 0 ? colors.income : colors.expense }]}>₹{totals.total.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Save Rate</Text>
            <Text style={[styles.summaryValue, { color: colors.income }]}>
              {totals.income > 0 ? ((totals.total / totals.income) * 100).toFixed(1) : 0}%
            </Text>
          </View>
        </View>
      </View>
    );
  }, [totals, colors, styles, spacing, viewMode]);

  // Some small helpers
  function getChartTitle(mode: ViewMode) {
    switch (mode) {
      case 'DAILY': return `Daily Income vs Expense`;
      case 'WEEKLY': return `Weekly Income vs Expense`;
      case 'MONTHLY': return `Monthly Income vs Expense`;
      case '3MONTHS': return `3-Month Income vs Expense`;
      case '6MONTHS': return `6-Month Income vs Expense`;
      case 'YEARLY': return `Yearly Income vs Expense`;
      default: return `Income vs Expense`;
    }
  }

  // StatCard component
  const StatCard = ({ label, amount, color, icon }: any) => (
    <View style={[styles.statCard, { backgroundColor: color, borderColor: color }]}>
      <View style={styles.statCardContent}>
        <MaterialCommunityIcons name={icon} size={24} color="#FFFFFF" />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statAmount}>₹{amount.toLocaleString()}</Text>
    </View>
  );

  // RecordItem as memoized component to avoid re-renders
  const RecordItem = React.memo(({ record, onEdit, onDelete, isExpandedLocal, toggleExpand }: any) => {
    const isIncome = record.type === 'INCOME';
    const isTransfer = record.type === 'TRANSFER';
    const isExpanded = isExpandedLocal;

    return (
      <View style={styles.recordItemWrapper}>
        <TouchableOpacity
          style={[
            styles.recordItem,
            {
              backgroundColor: colors.surface,
            },
          ]}
          onPress={() => toggleExpand(record.id)}
          activeOpacity={0.6}
        >
          <View style={styles.recordLeft}>
            <View style={[styles.recordIcon, { backgroundColor: isIncome ? colors.income : isTransfer ? colors.transfer : colors.expense }]}>
              <MaterialCommunityIcons name={record.icon} size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.recordCategory, { color: colors.text }]} numberOfLines={1}>{record.category}</Text>
              <Text style={[styles.recordAccount, { color: colors.textSecondary }]} numberOfLines={1}>{record.account}</Text>
            </View>
          </View>

          <View style={styles.recordRight}>
            <Text style={[styles.recordAmount, { color: isIncome ? colors.income : isTransfer ? colors.transfer : colors.expense }]}>
              {isIncome ? '+' : isTransfer ? '↔️ ' : '-'}₹{Number(record.amount).toLocaleString()}
            </Text>
            <Text style={[styles.recordDate, { color: colors.textSecondary }]}>{new Date(record.date).toLocaleDateString()}</Text>
          </View>

          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={colors.accent}
            style={{ marginLeft: spacing.md ?? 12 }}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={[styles.recordActions, { backgroundColor: colors.surface }]}>
            <View style={[styles.actionsDivider, { backgroundColor: colors.border }]} />
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.accent + '12', borderColor: colors.accent + '30' }]}
                onPress={() => onEdit(record)}
                activeOpacity={0.6}
              >
                <MaterialCommunityIcons name="pencil" size={20} color={colors.accent} />
                <Text style={[styles.actionButtonText, { color: colors.accent }]}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.expense + '12', borderColor: colors.expense + '30' }]}
                onPress={() => onDelete(record)}
                activeOpacity={0.6}
              >
                <MaterialCommunityIcons name="trash-can" size={20} color={colors.expense} />
                <Text style={[styles.actionButtonText, { color: colors.expense }]}>Delete</Text>
              </TouchableOpacity>
            </View>

            {record.notes && (
              <View style={[styles.notesSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.notesLabel, { color: colors.accent }]}>📝 Notes</Text>
                <Text style={[styles.notesText, { color: colors.text }]}>{record.notes}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  });

  // Handlers for RecordItem
  const handleEditRecord = useCallback((record: any) => {
    setExpandedRecordId(null);
    const payload = {
      id: record.id,
      amount: record.amount,
      type: (record.type || 'expense').toLowerCase(),
      account_id: record.account_id,
      category_id: record.category_id,
      notes: record.notes || null,
      transaction_date: record.date instanceof Date ? record.date.toISOString() : new Date(record.date).toISOString(),
    };
    router.push(`/add-record-modal?record=${encodeURIComponent(JSON.stringify(payload))}` as any);
  }, [router]);

  const handleDeleteRecord = useCallback((record: any) => {
    setExpandedRecordId(null);
    deleteRecordHandler(record.id, record.amount);
  }, [deleteRecordHandler]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedRecordId((prev) => (prev === id ? null : id));
  }, []);

  // Ensure pager scrolls when pagerView changes
  // [Removed - no longer needed with simple dropdown selection]

  // Pager onMomentum handler
  // [Removed - no longer needed with simple dropdown selection]

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
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{getPeriodLabel(viewMode)}</Text>
          </View>
          <View style={{ width: 28 }} />
        </View>

        {/* View Selector */}
        <View style={[styles.selectorHeader, { marginBottom: spacing.sm }]}>
          <View style={styles.selectorLabel}>
            <View style={[styles.iconBackdrop, { backgroundColor: colors.surfaceLight, borderColor: colors.borderLight }]}>
              <MaterialCommunityIcons name="chart-box-multiple-outline" size={18} color={colors.accent} />
            </View>
            <View>
              <Text style={[styles.selectorLabelSmall, { color: colors.accent }]}>Financial Charts</Text>
              <Text style={[styles.selectorLabelText, { color: colors.text }]}>Select your view</Text>
            </View>
          </View>
        </View>

        <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.borderLight, shadowColor: colors.accent }]}>
          <Picker
            selectedValue={pagerView}
            onValueChange={(itemValue) => {
              setPagerView(itemValue as 'CALENDAR' | 'CHART');
              if (itemValue === 'CHART') {
                setViewMode('MONTHLY');
              }
            }}
            style={[styles.picker, { color: colors.text, backgroundColor: colors.surface }]}
            dropdownIconColor={colors.accent}
            mode="dropdown"
          >
            <Picker.Item label="📅 Calendar View" value="CALENDAR" color={colors.text} style={{ backgroundColor: colors.surface }} />
            <Picker.Item label="📊 Monthly Chart" value="CHART" color={colors.text} style={{ backgroundColor: colors.surface }} />
          </Picker>
        </View>

        {/* Stat Cards */}
        {(() => {
          const display = (pagerView === 'CALENDAR' ? rangeTotals : totals) as any;
          const displayIncome: number = Number(display.income ?? 0);
          const displayExpense: number = Number(display.expense ?? 0);
          const displayNet: number = typeof display.net === 'number' ? display.net : Number(display.total ?? (displayIncome - displayExpense));

          return (
            <View style={{ flexDirection: 'row', gap: 5, marginVertical: spacing.lg }}>
              <StatCard label="Total Income" amount={displayIncome} color={colors.income} icon="arrow-up-circle" />
              <StatCard label="Total Expense" amount={displayExpense} color={colors.expense} icon="arrow-down-circle" />
              <StatCard label="Net Total" amount={displayNet} color={displayNet >= 0 ? colors.income : colors.expense} icon="currency-rupee" />
            </View>
          );
        })()}

        {/* View Content */}
        {pagerView === 'CALENDAR' ? (
          <>
            {RangeNavigator()}
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
          </>
        ) : (
          <>
            {ChartMonthNavigator()}
            <MonthlyChart />
          </>
        )}

        {/* Records List */}
        <View style={{ paddingBottom: spacing.xl }}>
          {monthRecords.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="folder-off" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: colors.text }]}>No records found</Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>Try adding some transactions</Text>
            </View>
          ) : (
            monthRecords.map((record) => (
              <RecordItem
                key={record.id}
                record={record}
                onEdit={handleEditRecord}
                onDelete={handleDeleteRecord}
                isExpandedLocal={expandedRecordId === record.id}
                toggleExpand={toggleExpand}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button Menu - Outside ScrollView */}
      {/* Overlay Backdrop */}
      {fabExpanded && (
        <TouchableOpacity
          style={styles.fabBackdrop}
          activeOpacity={1}
          onPress={() => setFabExpanded(false)}
        />
      )}

      {/* FAB Menu Items */}
      {fabExpanded && (
        <View style={styles.fabMenu}>
          {/* Income Button */}
          <TouchableOpacity
            style={[styles.fabMenuItem, { backgroundColor: colors.income }]}
            onPress={() => {
              setFabExpanded(false);
              setExpandedRecordId(null);
              router.push('/add-record-modal?type=income' as any);
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="arrow-up-circle" size={24} color="#FFFFFF" />
            <Text style={styles.fabMenuLabel}>Income</Text>
          </TouchableOpacity>

          {/* Expense Button */}
          <TouchableOpacity
            style={[styles.fabMenuItem, { backgroundColor: colors.expense }]}
            onPress={() => {
              setFabExpanded(false);
              setExpandedRecordId(null);
              router.push('/add-record-modal?type=expense' as any);
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="arrow-down-circle" size={24} color="#FFFFFF" />
            <Text style={styles.fabMenuLabel}>Expense</Text>
          </TouchableOpacity>

          {/* Transfer Button */}
          <TouchableOpacity
            style={[styles.fabMenuItem, { backgroundColor: colors.accent }]}
            onPress={() => {
              setFabExpanded(false);
              setExpandedRecordId(null);
              router.push('/add-record-modal?type=transfer' as any);
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="swap-horizontal-circle" size={24} color="#FFFFFF" />
            <Text style={styles.fabMenuLabel}>Transfer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main FAB Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => setFabExpanded(!fabExpanded)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name={fabExpanded ? 'close' : 'plus'}
          size={28}
          color="#FFFFFF"
          style={{ fontWeight: 'bold' }}
        />
      </TouchableOpacity>
    </View>
  );
}

// helper labels
function getPeriodLabel(viewMode: ViewMode) {
  switch (viewMode) {
    case 'DAILY': return `Track your daily records`;
    case 'WEEKLY': return `Track your weekly records`;
    case 'MONTHLY': return `Track your monthly records`;
    case '3MONTHS': return `Track your 3-month records`;
    case '6MONTHS': return `Track your 6-month records`;
    case 'YEARLY': return `Track your yearly records`;
    default: return `Track your records`;
  }
}

const getStyles = (spacing: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 8 },
    scrollContentInner: { paddingBottom: 45 },

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

    chartContainer: {
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: spacing?.lg ?? 16,
      paddingVertical: spacing?.lg ?? 16,
      marginBottom: spacing?.xl ?? 24,
    },
    chartTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing?.lg ?? 16 },

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

    toggleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    toggleTitle: { fontSize: 15, fontWeight: '600', marginBottom: spacing?.xs ?? 8 },
    toggleDescription: { fontSize: 12 },

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

    recordItemWrapper: { marginBottom: spacing?.lg ?? 16 },
    recordItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing?.lg ?? 16,
      borderRadius: 16,
      borderWidth: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    recordLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing?.lg ?? 16, flex: 1 },
    recordIcon: {
      width: 56,
      height: 56,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    recordCategory: { fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
    recordAccount: { fontSize: 13, marginTop: 4, letterSpacing: 0.1 },
    recordRight: { alignItems: 'flex-end', marginRight: spacing?.sm ?? 8 },
    recordAmount: { fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
    recordDate: { fontSize: 12, marginTop: 4, letterSpacing: 0.2 },

    recordActions: {
      borderRadius: 0,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
      borderTopWidth: 1,
      borderLeftWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      marginBottom: spacing?.xs ?? 8,
      paddingTop: spacing?.lg ?? 16,
    },
    actionsDivider: { height: 1, width: '100%', marginBottom: spacing?.lg ?? 16 },
    actionsContainer: {
      flexDirection: 'row',
      gap: spacing?.md ?? 12,
      paddingHorizontal: spacing?.lg ?? 16,
      paddingVertical: 0,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: spacing?.md ?? 12,
      borderRadius: 12,
      borderWidth: 1.5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 2,
    },
    actionButtonText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },

    notesSection: {
      paddingHorizontal: spacing?.lg ?? 16,
      paddingVertical: spacing?.lg ?? 16,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0,0,0,0.05)',
      marginTop: spacing?.lg ?? 16,
    },
    notesLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8, letterSpacing: 0.2 },
    notesText: { fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },

    emptyState: { paddingVertical: spacing?.xxl ?? 48, borderRadius: 12, alignItems: 'center' },
    emptyStateText: { fontSize: 16, fontWeight: '600', marginTop: spacing?.md ?? 12 },
    emptyStateSubtext: { fontSize: 13, marginTop: spacing?.sm ?? 8 },

    selectorHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing?.md ?? 12,
      paddingHorizontal: 0,
    },
    selectorLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing?.md ?? 12,
      flex: 1,
    },
    iconBackdrop: {
      width: 44,
      height: 44,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    selectorLabelSmall: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.3,
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
      marginBottom: spacing?.lg ?? 16,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    picker: {
      height: 56,
      justifyContent: 'center',
      paddingHorizontal: spacing?.md ?? 12,
    },

    fab: {
      position: 'absolute',
      bottom: spacing?.xl ?? 24,
      right: spacing?.xl ?? 24,
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 8,
      zIndex: 999,
    },

    fabBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      zIndex: 900,
    },

    fabMenu: {
      position: 'absolute',
      bottom: 100,
      right: spacing?.xl ?? 24,
      gap: 12,
      zIndex: 950,
      alignItems: 'flex-end',
    },

    fabMenuItem: {
      width: 140,
      height: 48,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 5,
      elevation: 6,
    },

    fabMenuLabel: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
  });
