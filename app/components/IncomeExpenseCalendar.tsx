import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type DayItem = {
  date: Date;
  key: string;
  income: number;
  expense: number;
  net: number;
  cumulative: number;
};

type Props = {
  dailyData: DayItem[];
  rangeTotals: { income: number; expense: number; net: number };
  colors: Record<string, string>;
  spacing?: any;
  onDayPress?: (day: DayItem) => void;
  title?: string;
};

export default function IncomeExpenseCalendar({ dailyData, rangeTotals, colors, spacing, onDayPress, title = 'Income vs Expense (Calendar)' }: Props) {
  // Build rows of 7 days
  const rows: DayItem[][] = [];
  for (let i = 0; i < dailyData.length; i += 7) rows.push(dailyData.slice(i, i + 7));

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border, padding: spacing?.md ?? 12 }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

      <View style={styles.rangeRow}>
        <Text style={{ color: colors.textSecondary }}>Range Total</Text>
        <Text style={{ color: rangeTotals.net >= 0 ? colors.income : colors.expense, fontWeight: '700' }}>₹{rangeTotals.net.toLocaleString()}</Text>
      </View>

      <View style={styles.weekHeader}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((w) => (
          <Text key={w} style={[styles.weekHeaderText, { color: colors.textSecondary }]}>{w}</Text>
        ))}
      </View>

      {rows.map((week, idx) => (
        <View key={idx} style={styles.weekRow}>
          {week.map((d) => (
            <TouchableOpacity
              key={d.key}
              style={[styles.dayCell, { backgroundColor: colors.background, borderColor: colors.border }]}
              activeOpacity={0.8}
              onPress={() => onDayPress && onDayPress(d)}
            >
              <Text style={[styles.dayNumber, { color: colors.textSecondary }]}>{d.date.getDate()}</Text>
              {<Text style={[styles.dayNet, { color: colors.income }]}>+₹{Math.abs(d.income).toLocaleString()}</Text>}
              {<Text style={[styles.dayNet, { color: colors.expense }]}>-₹{Math.abs(d.expense).toLocaleString()}</Text>}
              {/* <Text style={[styles.dayCumulative, { color: colors.textSecondary }]}>Cum: ₹{d.cumulative.toLocaleString()}</Text> */}
            </TouchableOpacity>
          ))}

          {week.length < 7 && Array.from({ length: 7 - week.length }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.dayCellEmpty} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayCell: {
    flex: 1,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  dayCellEmpty: {
    flex: 1,
  },
  dayNumber: {
    fontSize: 12,
  },
  dayNet: {
    marginTop: 6,
    fontWeight: '700',
  },
  dayCumulative: {
    fontSize: 11,
    marginTop: 6,
  },
});
