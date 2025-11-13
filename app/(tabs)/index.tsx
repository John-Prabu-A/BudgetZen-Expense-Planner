import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Animated, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

const getCurrentMonthYear = () => {
  const now = new Date();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${monthNames[now.getMonth()]}, ${now.getFullYear()}`;
};

export default function RecordsScreen() {
  const colorScheme = useColorScheme();
  const [records, setRecords] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0));

  const isDark = colorScheme === 'dark';
  const colors = {
    background: isDark ? '#1A1A1A' : '#FFFFFF',
    surface: isDark ? '#262626' : '#F5F5F5',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#A0A0A0' : '#666666',
    border: isDark ? '#404040' : '#E5E5E5',
    expense: '#EF4444',
    income: '#10B981',
    neutral: '#8B5CF6',
  };

  // Calculate totals
  const monthRecords = records.filter(record => {
    const recordDate = new Date(record.date);
    const now = new Date();
    return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
  });

  const expense = monthRecords
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const income = monthRecords
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0);

  const totals = {
    expense: expense,
    income: income,
    total: income - expense,
  };

  const toggleAddModal = () => {
    setShowAddModal(!showAddModal);
    Animated.spring(scaleAnim, {
      toValue: showAddModal ? 0 : 1,
      useNativeDriver: true,
    }).start();
  };

  const StatCard = ({ title, amount, color, icon }: any) => (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: color,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.statCardHeader}>
        <MaterialCommunityIcons name={icon} size={24} color="#FFFFFF" />
        <Text style={[styles.statCardTitle, { color: '#FFFFFF' }]}>{title}</Text>
      </View>
      <Text style={[styles.statCardAmount, { color: '#FFFFFF' }]}>
        ₹{amount.toFixed(2)}
      </Text>
    </View>
  );

  const RecordItem = ({ item }: any) => (
    <View
      style={[
        styles.recordItem,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.recordIcon}>
        <MaterialCommunityIcons
          name={item.type === 'income' ? 'plus-circle' : 'minus-circle'}
          size={32}
          color={item.type === 'income' ? colors.income : colors.expense}
        />
      </View>
      <View style={styles.recordInfo}>
        <Text style={[styles.recordCategory, { color: colors.text }]}>
          {item.category}
        </Text>
        <Text style={[styles.recordNote, { color: colors.textSecondary }]}>
          {item.note || 'No note'}
        </Text>
      </View>
      <Text
        style={[
          styles.recordAmount,
          {
            color: item.type === 'income' ? colors.income : colors.expense,
          },
        ]}
      >
        {item.type === 'income' ? '+' : '-'}₹{item.amount.toFixed(2)}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Month Header */}
      <View style={[styles.monthHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.monthText, { color: colors.text }]}>
          {getCurrentMonthYear()}
        </Text>
      </View>

      {/* Statistics Cards */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsContainer}>
          <StatCard
            title="EXPENSE"
            amount={totals.expense}
            color={colors.expense}
            icon="credit-card"
          />
          <StatCard
            title="INCOME"
            amount={totals.income}
            color={colors.income}
            icon="cash-plus"
          />
          <StatCard
            title="TOTAL"
            amount={totals.total}
            color={colors.neutral}
            icon="wallet"
          />
        </View>

        {/* Records List */}
        <View style={styles.recordsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Transactions
          </Text>
          {monthRecords.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="inbox"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                No records in this month
              </Text>
            </View>
          ) : (
            <FlatList
              data={monthRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
              renderItem={RecordItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <Animated.View
        style={[
          styles.fab,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.fabButton, { backgroundColor: '#0284c7' }]}
          onPress={toggleAddModal}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* Add New Record Modal */}
      {showAddModal && (
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Add New Record
              </Text>
              <TouchableOpacity onPress={toggleAddModal}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Modal Form */}
            <View style={styles.formSection}>
              {/* Type Selection */}
              <Text style={[styles.formLabel, { color: colors.text }]}>Type</Text>
              <View style={styles.typeButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor: colors.expense,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name="minus-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.typeButtonText}>Expense</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor: colors.income,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name="plus-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.typeButtonText}>Income</Text>
                </TouchableOpacity>
              </View>

              {/* Form Fields */}
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Amount</Text>
                <View
                  style={[
                    styles.input,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                    },
                  ]}
                >
                  <Text style={[styles.inputCurrency, { color: colors.textSecondary }]}>₹</Text>
                  <TextInput
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="decimal-pad"
                    style={[styles.inputText, { color: colors.text }]}
                  />
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Category</Text>
                <TouchableOpacity
                  style={[
                    styles.input,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                    },
                  ]}
                >
                  <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                    Select category
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Note</Text>
                <TextInput
                  placeholder="Add a note (optional)"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.inputMultiline,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                      color: colors.text,
                    },
                  ]}
                  multiline
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={toggleAddModal}
                >
                  <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#0284c7' }]}
                >
                  <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

import { TextInput } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  monthHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  monthText: {
    fontSize: 20,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statCardAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  recordsSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderBottomWidth: 1,
  },
  recordIcon: {
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordCategory: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  recordNote: {
    fontSize: 12,
  },
  recordAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 16,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  formSection: {
    padding: 16,
    gap: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  formField: {
    marginTop: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  inputCurrency: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputText: {
    flex: 1,
    fontSize: 16,
  },
  placeholderText: {
    fontSize: 14,
    flex: 1,
  },
  inputMultiline: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
