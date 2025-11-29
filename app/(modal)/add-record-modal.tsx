import { useAuth } from '@/context/Auth';
import { useTheme } from '@/context/Theme';
import { useUIMode } from '@/hooks/useUIMode';
import { createRecord, readAccounts, readCategories, updateRecord } from '@/lib/finance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function AddRecordModal() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark, colors } = useTheme();
  const spacing = useUIMode();

  const [recordType, setRecordType] = useState<'INCOME' | 'EXPENSE' | 'TRANSFER'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [saving, setSaving] = useState(false);
  const params = useLocalSearchParams();
  const incomingRecord = params.record ? JSON.parse(params.record as string) : null;
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  // State for Supabase data
  const [accounts, setAccounts] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load accounts and categories from Supabase
  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadData();
      }
    }, [user])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsData, categoriesData] = await Promise.all([
        readAccounts(),
        readCategories(),
      ]);
      setAccounts(accountsData || []);
      setAllCategories(categoriesData || []);

      // If opened in edit mode, prefill selections using loaded data
      if (incomingRecord) {
        setEditingRecordId(incomingRecord.id || null);
        setAmount(String(incomingRecord.amount || ''));
        setRecordType((incomingRecord.type || 'expense').toUpperCase() as any);
        setNotes(incomingRecord.notes || '');
        const txnDate = new Date(incomingRecord.transaction_date || new Date());
        setSelectedDate(txnDate);
        const hrs = txnDate.getHours().toString().padStart(2, '0');
        const mins = txnDate.getMinutes().toString().padStart(2, '0');
        setSelectedTime(`${hrs}:${mins}`);

        const acct = (accountsData || []).find((a) => a.id === incomingRecord.account_id);
        if (acct) setSelectedAccount(acct);
        const cat = (categoriesData || []).find((c) => c.id === incomingRecord.category_id);
        if (cat) setSelectedCategory(cat);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load accounts and categories');
    } finally {
      setLoading(false);
    }
  };

  const expenseCategories = allCategories.filter((c) => !c.type || c.type === 'expense');
  const incomeCategories = allCategories.filter((c) => c.type === 'income');
  const categories = recordType === 'EXPENSE' ? expenseCategories : incomeCategories;

  const handleNumberPress = (num: string) => {
    if (num === '.') {
      if (!amount.includes('.')) {
        setAmount(amount + num);
      }
    } else if (num === 'DEL') {
      setAmount(amount.slice(0, -1));
    } else {
      setAmount(amount + num);
    }
  };

  const getTypeColor = () => {
    switch (recordType) {
      case 'INCOME':
        return colors.income;
      case 'EXPENSE':
        return colors.expense;
      case 'TRANSFER':
        return colors.transfer;
      default:
        return colors.accent;
    }
  };

  const handleSave = async () => {
    if (!amount || !selectedAccount || !selectedCategory) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setSaving(true);

      // Combine date and time for transaction_date
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const transactionDate = new Date(selectedDate);
      transactionDate.setHours(hours, minutes, 0, 0);

      const recordData = {
        user_id: user.id,
        account_id: selectedAccount.id,
        category_id: selectedCategory.id,
        amount: parseFloat(amount),
        type: recordType.toLowerCase(),
        notes: notes || null,
        transaction_date: transactionDate.toISOString(),
      };

      if (editingRecordId) {
        // Remove user_id when updating (database may not allow changing owner)
        const updatedData = { ...recordData };
        delete (updatedData as any).user_id;
        await updateRecord(editingRecordId, updatedData);
        Alert.alert('Success', 'Record updated successfully!');
      } else {
        await createRecord(recordData);
        Alert.alert('Success', 'Record saved successfully!');
      }
      router.back();
    } catch (error) {
      console.error('Error saving record:', error);
      Alert.alert('Error', editingRecordId ? 'Failed to update record' : 'Failed to save record');
    } finally {
      setSaving(false);
    }
  };

  // NumericKeypad Component
  const NumericKeypad = () => (
    <View style={styles.keypadContainer}>
      <View style={styles.keypadRow}>
        {['1', '2', '3'].map((num) => (
          <TouchableOpacity
            key={num}
            style={[styles.keypadButton, { borderColor: colors.border }]}
            onPress={() => handleNumberPress(num)}
          >
            <Text style={[styles.keypadButtonText, { color: colors.text }]}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.keypadRow}>
        {['4', '5', '6'].map((num) => (
          <TouchableOpacity
            key={num}
            style={[styles.keypadButton, { borderColor: colors.border }]}
            onPress={() => handleNumberPress(num)}
          >
            <Text style={[styles.keypadButtonText, { color: colors.text }]}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.keypadRow}>
        {['7', '8', '9'].map((num) => (
          <TouchableOpacity
            key={num}
            style={[styles.keypadButton, { borderColor: colors.border }]}
            onPress={() => handleNumberPress(num)}
          >
            <Text style={[styles.keypadButtonText, { color: colors.text }]}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.keypadRow}>
        <TouchableOpacity
          style={[styles.keypadButton, { borderColor: colors.border }]}
          onPress={() => handleNumberPress('.')}
        >
          <Text style={[styles.keypadButtonText, { color: colors.text }]}>.</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.keypadButton, { borderColor: colors.border }]}
          onPress={() => handleNumberPress('0')}
        >
          <Text style={[styles.keypadButtonText, { color: colors.text }]}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.keypadButton, { backgroundColor: colors.accent }]}
          onPress={() => handleNumberPress('DEL')}
        >
          <MaterialCommunityIcons name="backspace" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Modal for Account Selection
  const AccountSelectionModal = () => (
    <Modal visible={showAccountModal} transparent animationType="slide">
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Account</Text>
            <TouchableOpacity onPress={() => setShowAccountModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalList}>
            {accounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                style={[
                  styles.selectItem,
                  {
                    backgroundColor:
                      selectedAccount?.id === account.id ? colors.surface : 'transparent',
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedAccount(account);
                  setShowAccountModal(false);
                }}
              >
                <MaterialCommunityIcons name="bank" size={20} color={colors.accent} />
                <View style={styles.selectItemText}>
                  <Text style={[styles.selectItemName, { color: colors.text }]}>
                    {account.name}
                  </Text>
                  <Text style={[styles.selectItemType, { color: colors.textSecondary }]}>
                    {account.type}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Modal for Category Selection
  const CategorySelectionModal = () => (
    <Modal visible={showCategoryModal} transparent animationType="slide">
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Category</Text>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalList}>
            {categories.length === 0 ? (
              <View style={[styles.emptyStateModal, { backgroundColor: colors.surface }]}>
                <MaterialCommunityIcons
                  name="folder-open"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={[styles.emptyStateText, { color: colors.text }]}>
                  No {recordType.toLowerCase()} categories
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                  Create a category to add {recordType.toLowerCase()} records
                </Text>
                <TouchableOpacity
                  style={[styles.createButtonModal, { backgroundColor: colors.accent }]}
                  onPress={() => {
                    setShowCategoryModal(false);
                    router.push('/(modal)/add-category-modal');
                  }}
                >
                  <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
                  <Text style={styles.createButtonText}>Create Category</Text>
                </TouchableOpacity>
              </View>
            ) : (
              categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.selectItem,
                    {
                      backgroundColor:
                        selectedCategory?.id === category.id ? colors.surface : 'transparent',
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    setSelectedCategory(category);
                    setShowCategoryModal(false);
                  }}
                >
                  <MaterialCommunityIcons
                    name={category.icon as any}
                    size={20}
                    color={category.color}
                  />
                  <Text style={[styles.selectItemName, { color: colors.text }]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add Record</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Type Tabs */}
        <View style={styles.typeTabs}>
          {(['INCOME', 'EXPENSE', 'TRANSFER'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeTab,
                {
                  backgroundColor:
                    recordType === type
                      ? type === 'INCOME'
                        ? colors.income
                        : type === 'EXPENSE'
                        ? colors.expense
                        : colors.transfer
                      : colors.surface,
                  borderColor:
                    recordType === type
                      ? type === 'INCOME'
                        ? colors.income
                        : type === 'EXPENSE'
                        ? colors.expense
                        : colors.transfer
                      : colors.border,
                },
              ]}
              onPress={() => {
                setRecordType(type);
                setSelectedCategory(null);
              }}
            >
              <Text
                style={[
                  styles.typeTabText,
                  {
                    color: recordType === type ? '#FFFFFF' : colors.text,
                    fontWeight: recordType === type ? '600' : '400',
                  },
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount Display */}
        <View style={[styles.amountDisplay, { backgroundColor: getTypeColor() }]}>
          <Text style={styles.amountCurrency}>₹</Text>
          <Text style={styles.amountText}>{amount || '0'}</Text>
        </View>

        {/* Numeric Keypad */}
        <NumericKeypad />

        {/* Account Selection */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>Account</Text>
          <TouchableOpacity
            style={[styles.selectButton, { borderColor: colors.border }]}
            onPress={() => setShowAccountModal(true)}
          >
            <View style={styles.selectButtonContent}>
              {selectedAccount ? (
                <>
                  <MaterialCommunityIcons name="bank" size={20} color={colors.accent} />
                  <View>
                    <Text style={[styles.selectButtonText, { color: colors.text }]}>
                      {selectedAccount.name}
                    </Text>
                    <Text style={[styles.selectButtonSubtext, { color: colors.textSecondary }]}>
                      {selectedAccount.type}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons name="plus" size={20} color={colors.accent} />
                  <Text style={[styles.selectButtonText, { color: colors.textSecondary }]}>
                    Select Account
                  </Text>
                </>
              )}
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Category Selection */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>Category</Text>
          <TouchableOpacity
            style={[styles.selectButton, { borderColor: colors.border }]}
            onPress={() => setShowCategoryModal(true)}
          >
            <View style={styles.selectButtonContent}>
              {selectedCategory ? (
                <>
                  <MaterialCommunityIcons
                    name={selectedCategory.icon as any}
                    size={20}
                    color={selectedCategory.color}
                  />
                  <Text style={[styles.selectButtonText, { color: colors.text }]}>
                    {selectedCategory.name}
                  </Text>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons name="plus" size={20} color={colors.accent} />
                  <Text style={[styles.selectButtonText, { color: colors.textSecondary }]}>
                    Select Category
                  </Text>
                </>
              )}
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Date & Time Selection */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <View style={styles.dateTimeContainer}>
            <TouchableOpacity
              style={[styles.dateTimeButton, { borderColor: colors.border }]}
              onPress={() => setShowDateModal(true)}
            >
              <MaterialCommunityIcons name="calendar" size={20} color={colors.accent} />
              <Text style={[styles.dateTimeText, { color: colors.text }]}>
                {selectedDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateTimeButton, { borderColor: colors.border }]}
              onPress={() => setShowTimeModal(true)}
            >
              <MaterialCommunityIcons name="clock-outline" size={20} color={colors.accent} />
              <Text style={[styles.dateTimeText, { color: colors.text }]}>{selectedTime}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Notes (Optional)</Text>
          <TextInput
            style={[
              styles.notesInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Add notes..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.buttonContainer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: getTypeColor() }]}
          onPress={handleSave}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Save Record</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <AccountSelectionModal />
      <CategorySelectionModal />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  typeTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  typeTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  amountDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingVertical: 30,
    borderRadius: 12,
  },
  amountCurrency: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  amountText: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  keypadContainer: {
    marginBottom: 20,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  keypadButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectButtonSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateTimeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  notesInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '80%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  selectItemText: {
    flex: 1,
  },
  selectItemName: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectItemType: {
    fontSize: 12,
    marginTop: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyStateModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    marginHorizontal: 16,
    marginVertical: 20,
    borderRadius: 12,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  createButtonModal: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  createButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
