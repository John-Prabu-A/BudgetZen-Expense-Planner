
import { useTheme } from '@/context/Theme';
import { useUIMode } from '@/hooks/useUIMode';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type IncomeExpenseCalendarProps = {
  year: number;
  month: number;
  data: { [day: number]: { income?: number; expense?: number } };
  isDark?: boolean;
  type?: 'income' | 'expense' | 'both';
};

const IncomeExpenseCalendar: React.FC<IncomeExpenseCalendarProps> = ({ year, month, data, isDark: overrideDark, type = 'both' }) => {
  const spacing = useUIMode();
  const { isDark: themeDark, colors } = useTheme();
  const isDark = overrideDark !== undefined ? overrideDark : themeDark;

  const styles = StyleSheet.create({
    container: {
      padding: spacing.md,
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginVertical: spacing.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: spacing.md,
    },
    dayHeader: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      width: '14.28%',
      textAlign: 'center',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCell: {
      width: '14.28%',
      minHeight: 70,
      justifyContent: 'flex-start',
      alignItems: 'center',
      borderWidth: 0.5,
      borderColor: colors.border,
      paddingVertical: spacing.xs,
      backgroundColor: colors.surfaceLight,
    },
    dayText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    amountText: {
      fontSize: 11,
      fontWeight: '600',
    },
  });

  const generateCalendar = () => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendarDays = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayData = data[day];
      const hasIncome = dayData?.income && dayData.income > 0;
      const hasExpense = dayData?.expense && dayData.expense > 0;

      calendarDays.push(
        <View key={day} style={styles.dayCell}>
          <Text style={styles.dayText}>{day}</Text>
          {(type === 'income' || type === 'both') && hasIncome && (
            <Text style={[styles.amountText, { color: colors.income }]}>
              +₹{(dayData?.income ?? 0).toFixed(0)}
            </Text>
          )}
          {(type === 'expense' || type === 'both') && hasExpense && (
            <Text style={[styles.amountText, { color: colors.expense }]}>
              -₹{(dayData?.expense ?? 0).toFixed(0)}
            </Text>
          )}
        </View>
      );
    }

    return calendarDays;
  };

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {dayHeaders.map(day => (
          <Text key={day} style={styles.dayHeader}>{day}</Text>
        ))}
      </View>
      <View style={styles.grid}>{generateCalendar()}</View>
    </View>
  );
};

export default IncomeExpenseCalendar;
