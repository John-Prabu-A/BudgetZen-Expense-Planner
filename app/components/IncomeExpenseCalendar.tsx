
import { ThemeColors, useTheme } from '@/context/Theme';
import { useUIMode } from '@/hooks/useUIMode';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type DailyDataItem = {
  date: Date;
  key: string;
  income: number;
  expense: number;
  net: number;
  cumulative: number;
};

type RangeTotals = {
  income: number;
  expense: number;
  net: number;
};

type IncomeExpenseCalendarProps = {
  dailyData?: DailyDataItem[];
  rangeTotals?: RangeTotals;
  colors?: ThemeColors;
  spacing?: any;
  onDayPress?: (day: DailyDataItem) => void;
  // Legacy props for backward compatibility
  year?: number;
  month?: number;
  data?: { [day: number]: { income?: number; expense?: number } };
  isDark?: boolean;
  type?: 'income' | 'expense' | 'both';
};

const IncomeExpenseCalendar: React.FC<IncomeExpenseCalendarProps> = ({
  dailyData,
  rangeTotals,
  colors: propsColors,
  spacing: propsSpacing,
  onDayPress,
  year,
  month,
  data,
  isDark: overrideDark,
  type = 'both',
}) => {
  const { isDark: themeDark, colors: themeColors } = useTheme();
  const spacing = propsSpacing || useUIMode();
  const colors = propsColors || themeColors;
  const isDark = overrideDark !== undefined ? overrideDark : themeDark;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      borderRadius: 16,
      marginVertical: spacing.lg,
    },
    monthSection: {
      marginBottom: spacing.xl,
      backgroundColor: colors.surface,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    monthHeader: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      backgroundColor: colors.accent,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 70,
    },
    monthTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: '#FFFFFF',
      flex: 1,
      letterSpacing: 0.3,
    },
    monthStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    statBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,0.25)',
      minWidth: 80,
      justifyContent: 'center',
    },
    statText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.2,
    },
    dayHeaders: {
      flexDirection: 'row',
      paddingHorizontal: 0,
      paddingVertical: spacing.md,
      borderBottomWidth: 1.5,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    dayHeader: {
      flex: 1,
      fontSize: 12,
      fontWeight: '800',
      color: colors.accent,
      textAlign: 'center',
      paddingVertical: spacing.sm,
      letterSpacing: 0.3,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 0,
      paddingVertical: 0,
      backgroundColor: colors.surface,
    },
    dayCell: {
      width: '14.285%',
      minHeight: 55,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 0,
      marginVertical: 0,
      marginHorizontal: 0,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      backgroundColor: colors.background,
      borderWidth: 0.8,
      borderColor: colors.border,
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    dayCellActive: {
      backgroundColor: colors.accent + '18',
      borderColor: colors.accent,
      borderWidth: 1.2,
    },
    dayEmptyCell: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
      shadowColor: 'transparent',
      elevation: 0,
    },
    dayText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 2,
      lineHeight: 15,
      letterSpacing: 0.1,
    },
    dayTextDim: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textSecondary,
      marginBottom: 2,
      lineHeight: 15,
      letterSpacing: 0.1,
      opacity: 0.4,
    },
    amountContainer: {
      alignItems: 'center',
      gap: 0.5,
      width: '100%',
    },
    amountText: {
      fontSize: 8,
      fontWeight: '700',
      lineHeight: 9,
      letterSpacing: 0.1,
    },
    amountTextDim: {
      fontSize: 8,
      fontWeight: '700',
      lineHeight: 9,
      letterSpacing: 0.1,
      opacity: 0.4,
    },
    zeroDayIndicator: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.income,
      marginTop: 2,
    },
    legendContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xs,
      backgroundColor: colors.border,
      gap: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    legendDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    legendText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  });

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Convert legacy data format to dailyData format if needed
  const processedDailyData = useMemo(() => {
    // If dailyData is provided, use it directly
    if (dailyData && dailyData.length > 0) {
      return dailyData;
    }

    // If legacy data is provided, convert it
    if (data && year !== undefined && month !== undefined) {
      const convertedData: DailyDataItem[] = [];
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const dayData = data[day];
        const date = new Date(year, month, day);
        const key = date.toISOString().slice(0, 10);

        if (dayData && (dayData.income || dayData.expense)) {
          convertedData.push({
            date,
            key,
            income: dayData.income || 0,
            expense: dayData.expense || 0,
            net: (dayData.income || 0) - (dayData.expense || 0),
            cumulative: 0,
          });
        }
      }

      return convertedData;
    }

    return [];
  }, [dailyData, data, year, month]);

  // Group daily data by month
  const monthlyGroups = useMemo(() => {
    if (!processedDailyData || processedDailyData.length === 0) return [];

    const grouped: { [key: string]: DailyDataItem[] } = {};

    processedDailyData.forEach((item: DailyDataItem) => {
      const monthKey = `${item.date.getFullYear()}-${item.date.getMonth()}`;
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(item);
    });

    return Object.entries(grouped)
      .map(([key, items]) => ({
        monthKey: key,
        date: items[0].date,
        items: items.sort((a: DailyDataItem, b: DailyDataItem) => a.date.getTime() - b.date.getTime()),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [processedDailyData]);

  const renderMonth = (monthData: any) => {
    const monthDate = monthData.date;
    const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getDay();
    const monthItems: DailyDataItem[] = monthData.items;
    const itemMap = new Map(monthItems.map((item: DailyDataItem) => [item.key, item]));

    // Calculate month totals
    const monthIncome = monthItems.reduce((sum: number, item: DailyDataItem) => sum + item.income, 0);
    const monthExpense = monthItems.reduce((sum: number, item: DailyDataItem) => sum + item.expense, 0);

    // Get range of dates in dailyData
    const dailyDataDates = processedDailyData?.map(d => d.date.getTime()) || [];
    const minDate = dailyDataDates.length > 0 ? Math.min(...dailyDataDates) : null;
    const maxDate = dailyDataDates.length > 0 ? Math.max(...dailyDataDates) : null;

    const calendarDays = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(
        <View key={`empty-${i}`} style={[styles.dayCell, styles.dayEmptyCell]} />
      );
    }

    // Days of the month
    for (let day = 1; day <= 31; day++) {
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      if (date.getMonth() !== monthDate.getMonth()) break;

      const key = date.toISOString().slice(0, 10);
      const item = itemMap.get(key) as DailyDataItem | undefined;
      
      // Check if day is within the selected date range
      const dateTime = date.getTime();
      const isInRange = minDate !== null && maxDate !== null && dateTime >= minDate && dateTime <= maxDate;
      const isDimmed = !isInRange;

      calendarDays.push(
        <TouchableOpacity
          key={key}
          style={[
            styles.dayCell,
            item && (item.income > 0 || item.expense > 0) && styles.dayCellActive,
            isDimmed && { opacity: 0.5 },
          ]}
          onPress={() => item && onDayPress?.(item)}
          activeOpacity={0.7}
        >
          <Text style={isDimmed ? styles.dayTextDim : styles.dayText}>{day}</Text>
          {item && (
            <View style={styles.amountContainer}>
              {(type === 'income' || type === 'both') && item.income > 0 && (
                <Text style={[isDimmed ? styles.amountTextDim : styles.amountText, { color: colors.income }]}>
                  +₹{item.income.toFixed(0)}
                </Text>
              )}
              {(type === 'expense' || type === 'both') && item.expense > 0 && (
                <Text style={[isDimmed ? styles.amountTextDim : styles.amountText, { color: colors.expense }]}>
                  -₹{item.expense.toFixed(0)}
                </Text>
              )}
              {item.income === 0 && item.expense === 0 && (
                <View style={styles.zeroDayIndicator} />
              )}
            </View>
          )}
        </TouchableOpacity>
      );
    }

    const monthName = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
      <View key={monthData.monthKey} style={styles.monthSection}>
        <View style={styles.monthHeader}>
          <Text style={styles.monthTitle}>{monthName}</Text>
          <View style={styles.monthStats}>
            {monthIncome > 0 && (
              <View style={styles.statBadge}>
                <Text style={[styles.statText, { color: colors.income }]}>↑</Text>
                <Text style={styles.statText}>₹{monthIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
              </View>
            )}
            {monthExpense > 0 && (
              <View style={styles.statBadge}>
                <Text style={[styles.statText, { color: colors.expense }]}>↓</Text>
                <Text style={styles.statText}>₹{monthExpense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.dayHeaders}>
          {dayHeaders.map((day) => (
            <Text key={day} style={styles.dayHeader}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>{calendarDays}</View>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.income }]} />
            <Text style={styles.legendText}>Zero spending</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
            <Text style={styles.legendText}>Active day</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {monthlyGroups.map((monthData, index) => (
        <View key={monthData.monthKey}>
          {renderMonth(monthData)}
        </View>
      ))}
    </View>
  );
};

export default IncomeExpenseCalendar;
