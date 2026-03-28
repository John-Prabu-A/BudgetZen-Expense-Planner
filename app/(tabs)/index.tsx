import { useAuth } from '@/context/Auth';
import { useTheme } from '@/context/Theme';
import { useToast } from '@/context/Toast';
import useAppSettings from '@/hooks/useAppSettings';
import useNotifications from '@/hooks/useNotifications';
import { useSmartLoading } from '@/hooks/useSmartLoading';
import { useUIMode } from '@/hooks/useUIMode';
import { deleteRecord, readRecords } from '@/lib/finance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Easing,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import IncomeExpenseCalendar, { DailyDataItem } from '../components/IncomeExpenseCalendar';

type ViewMode = 'DAILY' | 'WEEKLY' | 'MONTHLY' | '3MONTHS' | '6MONTHS' | 'YEARLY' | 'CALENDAR' | 'CHART';

// Emoji to Material Community Icon mapping
const EMOJI_TO_ICON_MAP: { [key: string]: string } = {
  '🏠': 'home',
  '🍔': 'food',
  '🍕': 'pizza',
  '🛍️': 'shopping',
  '🎬': 'movie',
  '💻': 'laptop',
  '🚗': 'car',
  '🏥': 'hospital-box',
  '💰': 'cash-multiple',
  '💡': 'lightbulb',
  '📚': 'book',
  '⚽': 'soccer',
  '✈️': 'airplane',
  '🏨': 'hotel',
  '📱': 'phone',
  '👕': 'tshirt-v',
  '🎓': 'school',
  '💊': 'pill',
  '🎮': 'gamepad-variant',
  '📺': 'television',
  '🎵': 'music',
  '💇': 'scissors-cutting',
  '🐕': 'dog',
  '🌳': 'tree',
  '⚡': 'lightning-bolt',
  '🎁': 'gift',
  '🍰': 'cake',
  '📸': 'camera',
  '🚴': 'bike',
  '💄': 'palette',
  '🏋️': 'dumbbell',
  '🧘': 'meditation',
  '🌮': 'taco',
  '☕': 'coffee',
  '🍷': 'wine',
  '🎤': 'microphone',
  '⌚': 'watch',
  '💍': 'ring',
  '🌟': 'star',
  '📊': 'chart-box',
  '📈': 'chart-line',
  '💸': 'cash',
  '💳': 'credit-card',
  '🏦': 'bank',
  '📝': 'clipboard-text',
};

// Function to get valid icon name from category icon (handles emojis)
const getValidIconName = (icon: string | undefined): string => {
  if (!icon) return 'cash';
  
  // Check if it's an emoji and map it to a valid icon
  if (EMOJI_TO_ICON_MAP[icon]) {
    return EMOJI_TO_ICON_MAP[icon];
  }
  
  // If it's already a valid icon name, return it
  return icon;
};

export default function RecordsScreen() {
  const router = useRouter();
  const { user, session } = useAuth();
  const { isDark, colors } = useTheme();
  const spacing = useUIMode();
  const styles = getStyles(spacing);
  const toast = useToast();
  const { sendBudgetWarning } = useNotifications();
  const { formatCurrencyValue, currencyPosition, currencySign, decimalPlaces, formatCurrencyWithPosition } = useAppSettings();

  // Animation refs
  const fabRotateAnim = useRef(new Animated.Value(0)).current;
  const fabScaleAnim = useRef(new Animated.Value(1)).current;
  const menuOpacityAnim = useRef(new Animated.Value(0)).current;
  const menuScaleAnim = useRef(new Animated.Value(0.8)).current;

  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('MONTHLY');
  const [pagerView, setPagerView] = useState<'CALENDAR' | 'CHART'>('CALENDAR');
  const [fabExpanded, setFabExpanded] = useState(false);

  // --- Date Range Logic (Preserved) ---
  const initializeCurrentMonthRange = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start: firstDay, end: today };
  };

  const { start: defaultStart, end: defaultEnd } = initializeCurrentMonthRange();
  const [startDate, setStartDate] = useState<Date>(defaultStart);
  const [endDate, setEndDate] = useState<Date>(defaultEnd);
  const [activePresetDays, setActivePresetDays] = useState<'CURRENT_MONTH' | 'CUSTOM' | number>('CURRENT_MONTH');

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

  // --- Data Loading & Transformation ---
  // Use useCallback to create a stable function reference
  const loadRecordsData = useCallback(async () => {
    if (!user) return;
    try {
      const data = await readRecords();
      
      if (!data || data.length === 0) {
        setRecords([]);
        return;
      }

      // Transform to standard format with error handling
      const transformedRecords = data.map((record: any) => {
        try {
          const recordType = (record.type || 'EXPENSE').toUpperCase();

          return {
            id: record.id,
            type: recordType,
            amount: Math.max(0, Number(record.amount || 0)),
            category: recordType === 'TRANSFER'
              ? (record.to_account?.name || 'Unknown Account')
              : (record.categories?.name || 'Unknown'),
            category_id: record.category_id,
            category_color: recordType === 'TRANSFER'
              ? '#8B5CF6'
              : (record.categories?.color || '#888888'),
            icon: recordType === 'TRANSFER'
              ? 'swap-horizontal'
              : (record.categories?.icon || 'cash'),
            account: record.accounts?.name || 'Unknown Account',
            account_id: record.account_id,
            to_account_id: record.to_account_id,
            to_account: record.to_account?.name,
            date: new Date(record.transaction_date || record.date || new Date()),
            notes: record.notes || '',
          };
        } catch (error) {
          console.error('Error transforming record:', error);
          return null;
        }
      }).filter((r: any) => r !== null);

      // Sort by date descending
      const sortedRecords = transformedRecords.sort((a: any, b: any) => b.date.getTime() - a.date.getTime());
      setRecords(sortedRecords);
    } catch (error) {
      console.error('Error loading records:', error);
      setRecords([]);
      toast?.error?.('Failed to load records');
    }
  }, [user, toast]);

  const { loading, handleLoad } = useSmartLoading(loadRecordsData, [user, session, toast]);

  useFocusEffect(
    useCallback(() => {
      // Load data when screen comes into focus
      handleLoad();
      setFabExpanded(false);
      // Reset animations
      fabRotateAnim.setValue(0);
      fabScaleAnim.setValue(1);
      menuOpacityAnim.setValue(0);
      menuScaleAnim.setValue(0.8);
    }, []) // Empty dependency array - only run on focus, not on every render
  );

  // FAB animation effect
  useEffect(() => {
    if (fabExpanded) {
      Animated.parallel([
        Animated.timing(fabRotateAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fabScaleAnim, {
          toValue: 1.1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(menuOpacityAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(menuScaleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fabRotateAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fabScaleAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(menuOpacityAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(menuScaleAnim, {
          toValue: 0.8,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fabExpanded, fabRotateAnim, fabScaleAnim, menuOpacityAnim, menuScaleAnim]);

  // --- Calculations (Memoized) ---

  const toDateKey = useCallback((d: Date) => d.toISOString().slice(0, 10), []);

  const filteredRecords = useMemo(() => {
    if (!records || records.length === 0) return [];
    
    try {
      if (pagerView === 'CHART') {
        const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        return records.filter(r => r && r.date >= start && r.date <= end);
      } else {
        const endInclusive = new Date(endDate);
        endInclusive.setHours(23, 59, 59, 999);
        return records.filter(r => r && r.date >= startDate && r.date <= endInclusive);
      }
    } catch (error) {
      console.error('Error filtering records:', error);
      return [];
    }
  }, [records, startDate, endDate, selectedDate, pagerView]);

  // Convert filtered records into DailyData format for the Calendar
  const dailyData: DailyDataItem[] = useMemo(() => {
    if (!filteredRecords || filteredRecords.length === 0) return [];
    
    try {
      const map: { [key: string]: DailyDataItem } = {};

      filteredRecords.forEach(r => {
        if (!r || !r.date) return;
        const key = toDateKey(r.date);
        if (!map[key]) {
          map[key] = {
            date: r.date,
            key,
            income: 0,
            expense: 0,
            net: 0,
            cumulative: 0
          };
        }
        if (r.type === 'INCOME') map[key].income += r.amount || 0;
        if (r.type === 'EXPENSE') map[key].expense += r.amount || 0;
        map[key].net = map[key].income - map[key].expense;
      });

      return Object.values(map).sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (error) {
      console.error('Error processing daily data:', error);
      return [];
    }
  }, [filteredRecords, toDateKey]);

  const totals = useMemo(() => {
    if (!filteredRecords || filteredRecords.length === 0) {
      return { income: 0, expense: 0, total: 0 };
    }
    
    try {
      return filteredRecords.reduce((acc, r) => {
        if (!r) return acc;
        if (r.type === 'INCOME') acc.income += r.amount || 0;
        if (r.type === 'EXPENSE') acc.expense += r.amount || 0;
        acc.total = acc.income - acc.expense;
        return acc;
      }, { income: 0, expense: 0, total: 0 });
    } catch (error) {
      console.error('Error calculating totals:', error);
      return { income: 0, expense: 0, total: 0 };
    }
  }, [filteredRecords]);

  const handleDeleteRecord = useCallback(async (record: any) => {
    Alert.alert('Delete Record', `Are you sure you want to delete this ${formatCurrencyWithPosition(record.amount)}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
            await deleteRecord(record.id);
            setExpandedRecordId(null);
            handleLoad();
        },
      },
    ]);
  }, [handleLoad, formatCurrencyWithPosition]);

  const handleEditRecord = useCallback((record: any) => {
    setExpandedRecordId(null);
    setFabExpanded(false);

    const payload = {
      id: record.id,
      amount: record.amount,
      type: record.type.toLowerCase(),
      account_id: record.account_id,
      category_id: record.category_id,
      notes: record.notes || null,
      transaction_date: record.date.toISOString(),
    };

    router.push({
        pathname: '/(modal)/add-record-modal',
        params: { record: JSON.stringify(payload) }
    });
  }, [router]);

  const openAddModal = useCallback((type: string) => {
      setFabExpanded(false);
      router.push({
          pathname: '/(modal)/add-record-modal',
          params: { type: type.toLowerCase() }
      });
  }, [router]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedRecordId((prev) => (prev === id ? null : id));
  }, []);

  // --- Navigation Helpers (Memoized) ---

  const goToPreviousMonth = useCallback(() => setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)), []);
  const goToNextMonth = useCallback(() => setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)), []);
  const goToToday = useCallback(() => setSelectedDate(new Date()), []);

  const getCurrentMonthYear = useCallback(() => selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' }), [selectedDate]);
  const isCurrentMonth = useCallback(() => {
    const now = new Date();
    return selectedDate.getMonth() === now.getMonth() && selectedDate.getFullYear() === now.getFullYear();
  }, [selectedDate]);
  const isFutureMonth = useCallback(() => {
    const now = new Date();
    return selectedDate > now;
  }, [selectedDate]);

  // --- UI Components (Memoized) ---

  const ChartMonthNavigator = useCallback(() => (
    <View style={[styles.monthNavigator, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity
        style={[styles.navButton, { opacity: selectedDate.getFullYear() === 2020 ? 0.5 : 1 }]}
        onPress={goToPreviousMonth}
      >
        <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.monthDisplay}>
        <Text style={[styles.monthText, { color: colors.text }]}>{getCurrentMonthYear()}</Text>
        {!isCurrentMonth() && (
          <TouchableOpacity style={[styles.todayButton, { backgroundColor: colors.accent }]} onPress={goToToday}>
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
  ), [colors, selectedDate, goToPreviousMonth, goToNextMonth, goToToday, getCurrentMonthYear, isCurrentMonth, isFutureMonth, styles]);

  const RangeNavigator = useCallback(() => {
    return (
      <View style={[styles.monthNavigator, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.monthDisplay}>
          <Text numberOfLines={1} style={[styles.monthText, { color: colors.text }]}>
            {startDate.toLocaleDateString()} — {endDate.toLocaleDateString()}
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
            <TouchableOpacity
              style={[
                styles.presetButton,
                { backgroundColor: activePresetDays === 'CURRENT_MONTH' ? colors.accent : colors.surface, borderColor: colors.border },
              ]}
              onPress={() => setPresetRange('CURRENT_MONTH')}
            >
              <Text style={[styles.presetText, { color: activePresetDays === 'CURRENT_MONTH' ? '#fff' : colors.text }]}>This Month</Text>
            </TouchableOpacity>

            {[7, 14, 30, 90].map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.presetButton,
                  { backgroundColor: activePresetDays === d ? colors.accent : colors.surface, borderColor: colors.border },
                ]}
                onPress={() => setPresetRange(d)}
              >
                <Text style={[styles.presetText, { color: activePresetDays === d ? '#fff' : colors.text }]}>{d}d</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  }, [colors, startDate, endDate, activePresetDays, setPresetRange, styles]);

  const MonthlyChart = useCallback(() => {
    const maxAmount = Math.max(totals.income, totals.expense, 1);
    const incomeHeight = (totals.income / maxAmount) * 100;
    const expenseHeight = (totals.expense / maxAmount) * 100;

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: spacing?.xl ?? 24 }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Monthly Income vs Expense</Text>

        <View style={styles.barChartWrapper}>
          <View style={styles.barGroup}>
            <View style={styles.barLabelGroup}>
              <Text style={[styles.barLabel, { color: colors.textSecondary }]}>Income</Text>
              <Text style={[styles.barAmount, { color: colors.income }]}>{formatCurrencyWithPosition(totals.income)}</Text>
            </View>
            <View style={[styles.barBackground, { backgroundColor: colors.surface }]}>
              <View style={[styles.bar, { height: `${incomeHeight || 5}%`, backgroundColor: colors.income }]} />
            </View>
          </View>

          <View style={styles.barGroup}>
            <View style={styles.barLabelGroup}>
              <Text style={[styles.barLabel, { color: colors.textSecondary }]}>Expense</Text>
              <Text style={[styles.barAmount, { color: colors.expense }]}>{formatCurrencyWithPosition(totals.expense)}</Text>
            </View>
            <View style={[styles.barBackground, { backgroundColor: colors.surface }]}>
              <View style={[styles.bar, { height: `${expenseHeight || 5}%`, backgroundColor: colors.expense }]} />
            </View>
          </View>
        </View>

        <View style={styles.chartSummary}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Net Balance</Text>
            <Text style={[styles.summaryValue, { color: totals.total >= 0 ? colors.income : colors.expense }]}>{formatCurrencyWithPosition(totals.total)}</Text>
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
  }, [colors, totals, spacing, styles]);

  const StatCard = useCallback(({ label, amount, color, icon }: any) => (
    <View style={[styles.statCard, { backgroundColor: color, borderColor: color }]}>
      <View style={styles.statCardContent}>
        <MaterialCommunityIcons name={icon} size={24} color="#FFFFFF" />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statAmount}>{formatCurrencyWithPosition(amount)}</Text>
    </View>
  ), [styles, formatCurrencyWithPosition]);

  const RecordItem = React.memo(({ record, isExpanded, toggleExpand }: any) => {
    const isIncome = record.type === 'INCOME';
    const isTransfer = record.type === 'TRANSFER';
    const validIconName = getValidIconName(record.icon);

    return (
      <View style={styles.recordItemWrapper}>
        <TouchableOpacity
          style={[styles.recordItem, { backgroundColor: colors.surface }]}
          onPress={() => toggleExpand(record.id)}
          activeOpacity={0.6}
        >
          <View style={styles.recordLeft}>
            <View style={[styles.recordIcon, { backgroundColor: isIncome ? colors.income : isTransfer ? colors.transfer : colors.expense }]}>
              <MaterialCommunityIcons name={validIconName as any} size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.recordCategory, { color: colors.text }]} numberOfLines={1}>{record.category}</Text>
              <Text style={[styles.recordAccount, { color: colors.textSecondary }]} numberOfLines={1}>{record.account}</Text>
            </View>
          </View>

          <View style={styles.recordRight}>
            <Text style={[styles.recordAmount, { color: isIncome ? colors.income : isTransfer ? colors.transfer : colors.expense }]}>
              {isIncome ? '+' : isTransfer ? '↔️ ' : '-'}{formatCurrencyWithPosition(record.amount)}
            </Text>
            <Text style={[styles.recordDate, { color: colors.textSecondary }]}>{record.date.toLocaleDateString()}</Text>
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
                onPress={() => handleEditRecord(record)}
              >
                <MaterialCommunityIcons name="pencil" size={20} color={colors.accent} />
                <Text style={[styles.actionButtonText, { color: colors.accent }]}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.expense + '12', borderColor: colors.expense + '30' }]}
                onPress={() => handleDeleteRecord(record)}
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentInner}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        removeClippedSubviews={true}
      >
        {/* Header
        <View style={[styles.selectorHeader, styles.headerContainer, {justifyContent: 'space-between' },  { marginBottom: spacing.sm }]}>
          <View style={styles.selectorLabel}>
            <View style={[styles.iconBackdrop, { backgroundColor: colors.surfaceLight, borderColor: colors.borderLight }]}>
              <MaterialCommunityIcons name="chart-box-multiple-outline" size={18} color={colors.accent} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.accent }]}>Financial Overview</Text>
              <Text style={[styles.selectorLabelText, { color: colors.textSecondary }]}>{getPeriodLabel(viewMode)}</Text>
            </View>
          </View>
        </View> */}

        {/* Stat Cards */}
        <View style={{ flexDirection: 'row', gap: 5, marginVertical: spacing.lg }}>
            <StatCard label="Total Income" amount={totals.income} color={colors.income} icon="arrow-up-circle" />
            <StatCard label="Total Expense" amount={totals.expense} color={colors.expense} icon="arrow-down-circle" />
            <StatCard label="Net Total" amount={totals.total} color={totals.total >= 0 ? colors.income : colors.expense} icon="currency-rupee" />
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

        {/* View Content */}
        {pagerView === 'CALENDAR' ? (
          <>
            {RangeNavigator()}
            <IncomeExpenseCalendar
              dailyData={dailyData}
              rangeTotals={totals}
              colors={colors}
              spacing={spacing}
              onDayPress={(day) => {
                setSelectedDate(new Date(day.date));
                setViewMode('DAILY');
              }}
            />
          </>
        ) : (
          <>
            {ChartMonthNavigator()}
            {MonthlyChart()}
          </>
        )}

        {/* Records List */}
        <View style={{ paddingBottom: spacing.xl }}>
          {loading ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="loading" size={48} color={colors.accent} />
              <Text style={[styles.emptyStateText, { color: colors.text }]}>Loading records...</Text>
            </View>
          ) : filteredRecords.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="folder-off" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: colors.text }]}>No records found</Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>Try adding some transactions</Text>
            </View>
          ) : (
            filteredRecords.map((record) => (
              <RecordItem
                key={`${record.id}-${record.date.getTime()}`}
                record={record}
                isExpanded={expandedRecordId === record.id}
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
        <Animated.View
          style={[
            styles.fabMenu,
            {
              opacity: menuOpacityAnim,
              transform: [{ scale: menuScaleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.fabMenuItem, { backgroundColor: colors.income }]}
            onPress={() => openAddModal('INCOME')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="arrow-up-circle" size={24} color="#FFFFFF" />
            <Text style={styles.fabMenuLabel}>Income</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.fabMenuItem, { backgroundColor: colors.expense }]}
            onPress={() => openAddModal('EXPENSE')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="arrow-down-circle" size={24} color="#FFFFFF" />
            <Text style={styles.fabMenuLabel}>Expense</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.fabMenuItem, { backgroundColor: colors.accent }]}
            onPress={() => openAddModal('TRANSFER')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="swap-horizontal-circle" size={24} color="#FFFFFF" />
            <Text style={styles.fabMenuLabel}>Transfer</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Main FAB Button */}
      <Animated.View
        style={[
          styles.fabContainer,
          {
            transform: [{ scale: fabScaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.accent }]}
          onPress={() => setFabExpanded(!fabExpanded)}
          activeOpacity={0.8}
        >
          <Animated.View
            style={{
              transform: [
                {
                  rotate: fabRotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '45deg'],
                  }),
                },
              ],
            }}
          >
            <MaterialCommunityIcons
              name={fabExpanded ? 'close' : 'plus'}
              size={28}
              color="#FFFFFF"
              style={{ fontWeight: 'bold' }}
            />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
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
      marginTop: spacing?.lg ?? 16,
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

    fabContainer: {
      position: 'absolute',
      bottom: spacing?.xl ?? 24,
      right: spacing?.xl ?? 24,
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