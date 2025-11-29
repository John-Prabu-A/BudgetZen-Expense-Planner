import { useAuth } from '@/context/Auth';
import { useTheme } from '@/context/Theme';
import { useUIMode } from '@/hooks/useUIMode';
import { deleteCategory, readCategories } from '@/lib/finance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CategoriesScreen() {
  const router = useRouter();
  const { user, session } = useAuth();
  const { isDark, colors } = useTheme();
  const spacing = useUIMode();
  const styles = createCategoriesStyles(spacing);

  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<any[]>([]);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const defaultCategoryColors: { [key: string]: string } = {
    'Housing': '#FF6B6B',
    'Food': '#4ECDC4',
    'Shopping': '#FFE66D',
    'Entertainment': '#A8E6CF',
    'Transportation': '#FF8B94',
    'Utilities': '#95E1D3',
    'Salary': '#6BCB77',
    'Freelance': '#4D96FF',
    'Investment': '#FFB700',
    'Other': '#FF6B9D',
  };

  useEffect(() => {
    if (user && session) {
      loadCategories();
    }
  }, [user, session]);

  // Reload categories whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user && session) {
        loadCategories();
      }
    }, [user, session])
  );

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await readCategories();
      // For now, separate by type if available, otherwise all in expense
      const expense = (data || []).filter((c: any) => !c.type || c.type === 'expense');
      const income = (data || []).filter((c: any) => c.type === 'income');
      
      setExpenseCategories(expense);
      setIncomeCategories(income);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string, type: string) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${categoryName}"?`,
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
              await deleteCategory(categoryId);
              if (type === 'Expense') {
                setExpenseCategories(expenseCategories.filter((c) => c.id !== categoryId));
              } else {
                setIncomeCategories(incomeCategories.filter((c) => c.id !== categoryId));
              }
              Alert.alert('Success', 'Category deleted successfully!');
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Error', 'Failed to delete category');
            }
          },
          style: 'destructive',
        },
      ],
    );
  };

  const CategoryCard = ({ category, type }: any) => {
    const isExpanded = expandedCategoryId === category.id;

    return (
      <TouchableOpacity
        style={[
          styles.categoryCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setExpandedCategoryId(isExpanded ? null : category.id)}
        activeOpacity={0.7}
      >
        <View style={styles.categoryHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
            <MaterialCommunityIcons name={category.icon} size={24} color="#FFFFFF" />
          </View>
          <View style={styles.categoryInfo}>
            <Text style={[styles.categoryName, { color: colors.text }]}>
              {category.name}
            </Text>
            <Text style={[styles.categoryType, { color: colors.textSecondary }]}>
              {type}
            </Text>
          </View>
          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </View>

        {/* Expanded Actions */}
        {isExpanded && (
          <View style={[styles.expandedActions, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.accent }]}
              onPress={() => {
                router.push({
                  pathname: '/edit-category-modal',
                  params: { category: JSON.stringify(category) }
                });
              }}
            >
              <MaterialCommunityIcons name="pencil" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
              onPress={() => handleDeleteCategory(category.id, category.name, type)}
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
      {/* Expense Categories */}
      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Expense Categories {loading && '(Loading...)'}
          </Text>
          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => router.push('/(modal)/add-category-modal')}
          >
            <MaterialCommunityIcons name="plus" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading categories...
            </Text>
          </View>
        ) : expenseCategories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="inbox" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No expense categories yet.
            </Text>
          </View>
        ) : (
          expenseCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              type="Expense"
            />
          ))
        )}
      </View>

      {/* Income Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Income Categories {loading && '(Loading...)'}
          </Text>
          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => router.push('/(modal)/add-category-modal')}
          >
            <MaterialCommunityIcons name="plus" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading categories...
            </Text>
          </View>
        ) : incomeCategories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="inbox" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No income categories yet.
            </Text>
          </View>
        ) : (
          incomeCategories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            type="Income"
          />
        )))}
      </View>
    </ScrollView>
  );
}

const createCategoriesStyles = (spacing: any) => StyleSheet.create({
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
    marginBottom: spacing.md,
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
  categoryCard: {
    flexDirection: 'column',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryType: {
    fontSize: 12,
  },
  expandedActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  loadingContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
