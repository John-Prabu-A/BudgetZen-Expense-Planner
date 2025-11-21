
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUIMode } from '@/hooks/useUIMode';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';

type IncomeExpenseCalendarProps = {
  year: number;
  month: number;
  data: { [day: number]: { income?: number; expense?: number } };
};

const IncomeExpenseCalendar: React.FC<IncomeExpenseCalendarProps> = ({ year, month, data }) => {
  const spacing = useUIMode();
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = {
    background: isDark ? '#1A1A1A' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#A0A0A0' : '#666666',
    border: isDark ? '#404040' : '#E5E5E5',
    income: '#10B981',
    expense: '#EF4444',
  };

  const styles = StyleSheet.create({
    container: {
      padding: spacing.md,
      backgroundColor: colors.background,
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
      height: 60,
      justifyContent: 'flex-start',
      alignItems: 'center',
      borderWidth: 0.5,
      borderColor: colors.border,
      padding: spacing.xs,
    },
    dayText: {
      fontSize: 12,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    amountText: {
      fontSize: 10,
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
      calendarDays.push(
        <View key={day} style={styles.dayCell}>
          <Text style={styles.dayText}>{day}</Text>
          {dayData?.income && (
            <Text style={[styles.amountText, { color: colors.income }]}>
              {dayData.income.toFixed(2)}
            </Text>
          )}
          {dayData?.expense && (
            <Text style={[styles.amountText, { color: colors.expense }]}>
              -{dayData.expense.toFixed(2)}
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
