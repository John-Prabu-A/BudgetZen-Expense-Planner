import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export default function CategoriesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = {
    background: isDark ? '#1A1A1A' : '#FFFFFF',
    surface: isDark ? '#262626' : '#F5F5F5',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#A0A0A0' : '#666666',
    border: isDark ? '#404040' : '#E5E5E5',
    accent: '#0284c7',
  };

  const expenseCategories = [
    { id: '1', name: 'Housing', icon: 'home', color: '#FF6B6B' },
    { id: '2', name: 'Food', icon: 'food', color: '#4ECDC4' },
    { id: '3', name: 'Shopping', icon: 'shopping', color: '#FFE66D' },
    { id: '4', name: 'Entertainment', icon: 'movie', color: '#A8E6CF' },
    { id: '5', name: 'Transportation', icon: 'car', color: '#FF8B94' },
    { id: '6', name: 'Utilities', icon: 'lightning-bolt', color: '#95E1D3' },
  ];

  const incomeCategories = [
    { id: '7', name: 'Salary', icon: 'briefcase', color: '#6BCB77' },
    { id: '8', name: 'Freelance', icon: 'laptop', color: '#4D96FF' },
    { id: '9', name: 'Investment', icon: 'chart-line', color: '#FFB700' },
    { id: '10', name: 'Other', icon: 'gift', color: '#FF6B9D' },
  ];

  const CategoryCard = ({ category, type }: any) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      activeOpacity={0.7}
    >
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
        name="chevron-right"
        size={20}
        color={colors.textSecondary}
      />
    </TouchableOpacity>
  );

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
            Expense Categories
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

        {expenseCategories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            type="Expense"
          />
        ))}
      </View>

      {/* Income Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Income Categories
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

        {incomeCategories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            type="Income"
          />
        ))}
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
    marginBottom: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
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
});
