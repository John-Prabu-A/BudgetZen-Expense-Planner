import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export default function BudgetsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = {
    background: isDark ? '#1A1A1A' : '#FFFFFF',
    surface: isDark ? '#262626' : '#F5F5F5',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#A0A0A0' : '#666666',
    border: isDark ? '#404040' : '#E5E5E5',
    accent: '#0284c7',
    warning: '#F59E0B',
    danger: '#EF4444',
  };

  const budgets = [
    { id: '1', name: 'Housing', limit: 15000, spent: 14200, icon: 'home' },
    { id: '2', name: 'Food', limit: 5000, spent: 4500, icon: 'food' },
    { id: '3', name: 'Shopping', limit: 3000, spent: 3200, icon: 'shopping' },
    { id: '4', name: 'Entertainment', limit: 2000, spent: 1500, icon: 'movie' },
  ];

  const getProgressColor = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 100) return colors.danger;
    if (percentage >= 80) return colors.warning;
    return colors.accent;
  };

  const BudgetCard = ({ budget }: any) => {
    const percentage = (budget.spent / budget.limit) * 100;
    const progressColor = getProgressColor(budget.spent, budget.limit);

    return (
      <View
        style={[
          styles.budgetCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.budgetHeader}>
          <View style={styles.budgetTitleContainer}>
            <MaterialCommunityIcons
              name={budget.icon}
              size={24}
              color={colors.accent}
            />
            <View>
              <Text style={[styles.budgetName, { color: colors.text }]}>
                {budget.name}
              </Text>
              <Text style={[styles.budgetLimit, { color: colors.textSecondary }]}>
                Limit: ₹{budget.limit.toLocaleString()}
              </Text>
            </View>
          </View>
          <Text
            style={[
              styles.budgetAmount,
              {
                color: percentage >= 100 ? colors.danger : colors.text,
              },
            ]}
          >
            ₹{budget.spent.toLocaleString()}
          </Text>
        </View>

        {/* Progress Bar */}
        <View
          style={[
            styles.progressBarContainer,
            { backgroundColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: progressColor,
              },
            ]}
          />
        </View>

        <View style={styles.budgetFooter}>
          <Text style={[styles.percentageText, { color: colors.textSecondary }]}>
            {percentage.toFixed(0)}% used
          </Text>
          <Text style={[styles.remainingText, { color: colors.accent }]}>
            ₹{Math.max(0, budget.limit - budget.spent).toLocaleString()} remaining
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Monthly Budgets
          </Text>
          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <MaterialCommunityIcons name="plus" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {budgets.map((budget) => (
          <BudgetCard key={budget.id} budget={budget} />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Budget Summary
        </Text>
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Total Budget
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ₹{budgets.reduce((sum, b) => sum + b.limit, 0).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Total Spent
            </Text>
            <Text style={[styles.summaryValue, { color: colors.accent }]}>
              ₹{budgets.reduce((sum, b) => sum + b.spent, 0).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Remaining
            </Text>
            <Text style={[styles.summaryValue, { color: colors.accent }]}>
              ₹
              {(budgets.reduce((sum, b) => sum + b.limit, 0) -
                budgets.reduce((sum, b) => sum + b.spent, 0)).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  budgetCard: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  budgetName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  budgetLimit: {
    fontSize: 12,
  },
  budgetAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 12,
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryCard: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  summaryItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
  },
});
