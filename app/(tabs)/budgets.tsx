import { useAuth } from '@/context/Auth';
import { useTheme } from '@/context/Theme';
import { useUIMode } from '@/hooks/useUIMode';
import { deleteBudget, readBudgets, readRecordsWithSpending } from '@/lib/finance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BudgetsScreen() {
  const router = useRouter();
  const { user, session } = useAuth();
  const { isDark, colors } = useTheme();
  const spacing = useUIMode();
  const styles = createBudgetsStyles(spacing);

  const [budgets, setBudgets] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'month' | 'year'>('month');

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
      loadData();
    }
  }, [user, session]);

  // Reload budgets whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user && session) {
        loadData();
      }
    }, [user, session])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [budgetsData, recordsData] = await Promise.all([readBudgets(), readRecordsWithSpending()]);
      
      const transformedBudgets = (budgetsData || []).map((budget: any) => ({
        ...budget,
        icon: categoryIcons[budget.categories?.name] || 'tag',
        name: budget.categories?.name || 'Unknown',
        color: budget.categories?.color || '#888888',
        limit: budget.amount,
        spent: 0,
      }));
      
      console.log('📊 BUDGET DEBUG INFO:');
      console.log('Budgets loaded:', transformedBudgets.length);
      console.log('Records loaded:', (recordsData || []).length);
      
      // Debug: Log each budget's category_id
      transformedBudgets.forEach(b => {
        console.log(`  Budget: ${b.name} (ID: ${b.id}, Category ID: ${b.category_id})`);
      });
      
      // Debug: Log each record's category_id
      (recordsData || []).forEach(r => {
        console.log(`  Record: ${r.categories?.name} - ₹${r.amount} (Category ID: ${r.category_id}, Type: ${r.type})`);
      });
      
      setBudgets(transformedBudgets);
      setRecords(recordsData || []);
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

  const handleEditBudget = (budget: any) => {
    // Navigate to add-budget-modal with budget data for editing
    router.push({
      pathname: '/(modal)/add-budget-modal',
      params: { budget: JSON.stringify(budget) },
    } as any);
  };

  const getProgressColor = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 100) return colors.expense || '#FF6B6B';
    if (percentage >= 80) return '#FFA500';
    return colors.accent;
  };

  // Calculate spent amount for each budget based on date range
  const getCurrentDateRange = useCallback(() => {
    const today = new Date();
    let start, end;

    if (timeRange === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
    }

    return { start, end };
  }, [timeRange]);

  // Compute budgets with spending data
  const budgetsWithSpending = useMemo(() => {
    const { start, end } = getCurrentDateRange();

    return budgets.map((budget) => {
      const matchingRecords = records.filter((record) => {
        const recordDate = new Date(record.transaction_date || record.date);
        const isExpense = record.type === 'EXPENSE' || record.type === 'expense';
        const categoryMatch = record.category_id === budget.category_id;
        const dateInRange = recordDate >= start && recordDate <= end;
        
        return isExpense && categoryMatch && dateInRange;
      });

      const spent = matchingRecords.reduce((sum, record) => sum + Number(record.amount || 0), 0);

      // Debug log for this specific budget
      if (matchingRecords.length > 0) {
        console.log(`💰 ${budget.name}: Found ${matchingRecords.length} matching records = ₹${spent}`);
        matchingRecords.forEach(r => {
          console.log(`    - ₹${r.amount} on ${new Date(r.transaction_date).toLocaleDateString()}`);
        });
      }

      return { ...budget, spent };
    });
  }, [budgets, records, getCurrentDateRange]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalBudget = budgetsWithSpending.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = budgetsWithSpending.reduce((sum, b) => sum + b.spent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const overBudgetCount = budgetsWithSpending.filter((b) => b.spent > b.limit).length;
    const avgUtilization = budgetsWithSpending.length > 0 
      ? (totalSpent / totalBudget) * 100 
      : 0;

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      overBudgetCount,
      avgUtilization,
    };
  }, [budgetsWithSpending]);

  const BudgetCard = ({ budget }: any) => {
    const percentage = (budget.spent / budget.limit) * 100;
    const progressColor = getProgressColor(budget.spent, budget.limit);
    const isExpanded = expandedBudgetId === budget.id;
    const isOverBudget = budget.spent > budget.limit;
    const daysRemaining = getDaysRemaining();

    return (
      <TouchableOpacity
        style={[
          styles.budgetCard,
          {
            backgroundColor: colors.surface,
            borderColor: isOverBudget ? (colors.expense || '#FF6B6B') : colors.border,
            borderWidth: isOverBudget ? 1.5 : 1,
          },
        ]}
        onPress={() => setExpandedBudgetId(isExpanded ? null : budget.id)}
        activeOpacity={0.7}
      >
        {/* Alert Badge for Over Budget */}
        {isOverBudget && (
          <View style={[styles.alertBadge, { backgroundColor: colors.expense || '#FF6B6B' }]}>
            <MaterialCommunityIcons name="alert-circle" size={12} color="#FFFFFF" />
            <Text style={styles.alertBadgeText}>Over Budget</Text>
          </View>
        )}

        <View style={styles.budgetHeader}>
          <View style={styles.budgetTitleContainer}>
            <View style={[styles.iconContainer, { backgroundColor: budget.color + '20' }]}>
              <MaterialCommunityIcons
                name={budget.icon}
                size={20}
                color={budget.color}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.budgetName, { color: colors.text }]}>
                {budget.name}
              </Text>
              <Text style={[styles.budgetSubtext, { color: colors.textSecondary }]}>
                Budget: ₹{budget.limit.toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={styles.budgetHeaderRight}>
            <View style={styles.percentageTag}>
              <Text style={[styles.percentageTagText, { color: progressColor }]}>
                {Math.min(percentage, 999).toFixed(0)}%
              </Text>
            </View>
            <MaterialCommunityIcons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textSecondary}
            />
          </View>
        </View>

        {/* Progress Bar with Label */}
        <View style={styles.progressSection}>
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
          <View style={styles.progressLabels}>
            <Text style={[styles.spentText, { color: colors.text }]}>
              Spent: ₹{budget.spent.toLocaleString()}
            </Text>
            <Text style={[styles.remainingText, { color: colors.accent }]}>
              Remaining: ₹{Math.max(0, budget.limit - budget.spent).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={[styles.expandedContent, { borderTopColor: colors.border }]}>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Daily Avg
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  ₹{(budget.spent / daysRemaining).toFixed(0)}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Days Left
                </Text>
                <Text style={[styles.statValue, { color: colors.accent }]}>
                  {daysRemaining}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Daily Budget
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  ₹{(budget.limit / daysRemaining).toFixed(0)}
                </Text>
              </View>
            </View>

            {/* Warning Message if Over Budget */}
            {isOverBudget && (
              <View style={[styles.warningBox, { backgroundColor: (colors.expense || '#FF6B6B') + '15' }]}>
                <MaterialCommunityIcons 
                  name="alert" 
                  size={18} 
                  color={colors.expense || '#FF6B6B'} 
                />
                <Text style={[styles.warningText, { color: colors.expense || '#FF6B6B' }]}>
                  You've exceeded this budget by ₹{(budget.spent - budget.limit).toLocaleString()}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.expandedActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.accent + '20', borderColor: colors.accent }]}
                onPress={() => handleEditBudget(budget)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="pencil" size={16} color={colors.accent} />
                <Text style={[styles.actionButtonText, { color: colors.accent }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: (colors.expense || '#FF6B6B') + '20', borderColor: colors.expense || '#FF6B6B' }]}
                onPress={() => handleDeleteBudget(budget.id, budget.name)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="trash-can" size={16} color={colors.expense || '#FF6B6B'} />
                <Text style={[styles.actionButtonText, { color: colors.expense || '#FF6B6B' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getDaysRemaining = useCallback(() => {
    if (timeRange === 'month') {
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    } else {
      return 365;
    }
  }, [timeRange]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Period Toggle */}
      <View style={styles.headerSection}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Budget Tracker</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {timeRange === 'month' ? 'Current Month' : 'Current Year'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.periodToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setTimeRange(timeRange === 'month' ? 'year' : 'month')}
          >
            <MaterialCommunityIcons name="calendar-month" size={16} color={colors.accent} />
            <Text style={[styles.periodToggleText, { color: colors.text }]}>
              {timeRange === 'month' ? 'Month' : 'Year'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Cards - Key Metrics */}
        <View style={styles.metricsContainer}>
          {summaryStats.overBudgetCount > 0 && (
            <View style={[styles.metricCard, { backgroundColor: (colors.expense || '#FF6B6B') + '10', borderColor: colors.expense || '#FF6B6B' }]}>
              <View style={styles.metricIconBox}>
                <MaterialCommunityIcons name="alert-circle" size={20} color={colors.expense || '#FF6B6B'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Alerts</Text>
                <Text style={[styles.metricValue, { color: colors.expense || '#FF6B6B' }]}>
                  {summaryStats.overBudgetCount} over budget
                </Text>
              </View>
            </View>
          )}
          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.metricIconBox}>
              <MaterialCommunityIcons name="wallet" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Budget</Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                ₹{summaryStats.totalBudget.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Budgets Section */}
      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Your Budgets ({budgetsWithSpending.length})
          </Text>
          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: colors.accent, borderColor: colors.accent },
            ]}
            onPress={() => router.push('/(modal)/add-budget-modal')}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: 12 }]}>
              Loading budgets...
            </Text>
          </View>
        ) : budgetsWithSpending.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="wallet-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.text, marginTop: 12 }]}>
              No budgets yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary, marginTop: 8 }]}>
              Create budgets to track your spending and reach your financial goals
            </Text>
            <TouchableOpacity
              style={[styles.emptyActionButton, { backgroundColor: colors.accent }]}
              onPress={() => router.push('/(modal)/add-budget-modal')}
            >
              <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
              <Text style={styles.emptyActionButtonText}>Create Budget</Text>
            </TouchableOpacity>
          </View>
        ) : (
          budgetsWithSpending.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} />
          ))
        )}
      </View>

      {/* Summary & Statistics */}
      {budgetsWithSpending.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md }]}>
            Summary & Insights
          </Text>
          
          {/* Main Summary Card */}
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
                ₹{summaryStats.totalBudget.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Total Spent
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                ₹{summaryStats.totalSpent.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Remaining
              </Text>
              <Text style={[styles.summaryValue, { 
                color: summaryStats.totalRemaining >= 0 ? colors.income || '#4CAF50' : colors.expense || '#FF6B6B'
              }]}>
                ₹{summaryStats.totalRemaining.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Utilization Bar */}
          <View style={[styles.utilizationBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.utilizationHeader}>
              <Text style={[styles.utilizationLabel, { color: colors.textSecondary }]}>
                Overall Utilization
              </Text>
              <Text style={[styles.utilizationPercent, { color: colors.accent }]}>
                {summaryStats.avgUtilization.toFixed(1)}%
              </Text>
            </View>
            <View
              style={[
                styles.utilizationBar,
                { backgroundColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.utilizationFill,
                  {
                    width: `${Math.min(summaryStats.avgUtilization, 100)}%`,
                    backgroundColor: getProgressColor(summaryStats.totalSpent, summaryStats.totalBudget),
                  },
                ]}
              />
            </View>
            <Text style={[styles.utilizationNote, { color: colors.textSecondary }]}>
              {summaryStats.totalRemaining >= 0 
                ? `₹${summaryStats.totalRemaining.toLocaleString()} under budget`
                : `₹${Math.abs(summaryStats.totalRemaining).toLocaleString()} over budget`}
            </Text>
          </View>

          {/* Pro Tips */}
          <View style={[styles.tipsBox, { backgroundColor: colors.accent + '10', borderColor: colors.accent + '30' }]}>
            <View style={styles.tipsHeader}>
              <MaterialCommunityIcons name="lightbulb-outline" size={20} color={colors.accent} />
              <Text style={[styles.tipsTitle, { color: colors.accent }]}>Pro Tips</Text>
            </View>
            <Text style={[styles.tipsText, { color: colors.text }]}>
              • Review budgets monthly to track spending patterns{'\n'}
              • Set realistic limits based on your income{'\n'}
              • Adjust budgets as your circumstances change
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const createBudgetsStyles = (spacing: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: spacing.lg,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  budgetCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
  },
  alertBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
    alignItems: 'center',
    zIndex: 10,
  },
  alertBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  budgetHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  budgetTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  budgetName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  budgetSubtext: {
    fontSize: 12,
  },
  percentageTag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  percentageTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressSection: {
    marginBottom: spacing.md,
  },
  progressBarContainer: {
    height: 10,
    borderRadius: 5,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expandedContent: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  statLabel: {
    fontSize: 11,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  warningBox: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    gap: spacing.md,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  expandedActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 8,
    borderWidth: 1.5,
    gap: spacing.xs,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyActionButton: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyActionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  summaryItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  divider: {
    height: 1,
  },
  utilizationBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  utilizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  utilizationLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  utilizationPercent: {
    fontSize: 18,
    fontWeight: '700',
  },
  utilizationBar: {
    height: 12,
    borderRadius: 6,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  utilizationFill: {
    height: 12,
    borderRadius: 6,
  },
  utilizationNote: {
    fontSize: 12,
    textAlign: 'center',
  },
  tipsBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  tipsText: {
    fontSize: 12,
    lineHeight: 18,
  },
  headerSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: spacing.xs,
  },
  periodToggle: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  periodToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  metricsContainer: {
    gap: spacing.md,
  },
  metricCard: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.md,
  },
  metricIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
  },
});
