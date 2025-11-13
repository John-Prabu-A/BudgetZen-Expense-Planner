import { useAuth } from '@/context/Auth';
import { deleteBudget, readBudgets } from '@/lib/finance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export default function BudgetsScreen() {
  const router = useRouter();
  const { user, session } = useAuth();
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

  const [budgets, setBudgets] = useState<any[]>([]);
  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const categoryIcons: { [key: string]: string } = {
    'Housing': 'home',
    'Food': 'food',
    'Shopping': 'shopping-cart',
    'Entertainment': 'movie',
    'Transportation': 'car',
    'Utilities': 'lightning-bolt',
  };

  useEffect(() => {
    if (user && session) {
      loadBudgets();
    }
  }, [user, session]);

  // Reload budgets whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user && session) {
        loadBudgets();
      }
    }, [user, session])
  );

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const data = await readBudgets();
      const transformedBudgets = (data || []).map((budget: any) => ({
        ...budget,
        icon: categoryIcons[budget.categories?.name] || 'tag',
        name: budget.categories?.name || 'Unknown',
        limit: budget.amount,
        spent: 0,
      }));
      setBudgets(transformedBudgets);
    } catch (error) {
      console.error('Error loading budgets:', error);
      Alert.alert('Error', 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = (budgetId: string, budgetName: string) => {
    Alert.alert(
      'Delete Budget',
      `Are you sure you want to delete "${budgetName}" budget?`,
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
              await deleteBudget(budgetId);
              setBudgets(budgets.filter((b) => b.id !== budgetId));
              Alert.alert('Success', 'Budget deleted successfully!');
            } catch (error) {
              console.error('Error deleting budget:', error);
              Alert.alert('Error', 'Failed to delete budget');
            }
          },
          style: 'destructive',
        },
      ],
    );
  };

  const getProgressColor = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 100) return colors.danger;
    if (percentage >= 80) return colors.warning;
    return colors.accent;
  };

  const BudgetCard = ({ budget }: any) => {
    const percentage = (budget.spent / budget.limit) * 100;
    const progressColor = getProgressColor(budget.spent, budget.limit);
    const isExpanded = expandedBudgetId === budget.id;

    return (
      <TouchableOpacity
        style={[
          styles.budgetCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setExpandedBudgetId(isExpanded ? null : budget.id)}
        activeOpacity={0.7}
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
          <View style={styles.budgetHeaderRight}>
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
            <MaterialCommunityIcons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textSecondary}
            />
          </View>
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

        {/* Expanded Actions */}
        {isExpanded && (
          <View style={[styles.expandedActions, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.accent }]}
              onPress={() => {
                // TODO: Navigate to edit budget modal with budget data
                Alert.alert('Edit Budget', `Editing "${budget.name}" budget`);
              }}
            >
              <MaterialCommunityIcons name="pencil" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.danger }]}
              onPress={() => handleDeleteBudget(budget.id, budget.name)}
            >
              <MaterialCommunityIcons name="trash-can" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
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
            Monthly Budgets {loading && '(Loading...)'}
          </Text>
          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => router.push('/add-budget-modal')}
          >
            <MaterialCommunityIcons name="plus" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading budgets...
            </Text>
          </View>
        ) : budgets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="inbox" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No budgets yet. Create your first budget!
            </Text>
          </View>
        ) : (
          budgets.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} />
          ))
        )}
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
  budgetHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  expandedActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
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
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
