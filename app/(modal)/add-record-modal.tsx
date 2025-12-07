import { useAuth } from '@/context/Auth';
import { useTheme } from '@/context/Theme';
import { createRecord, readAccounts, readCategories, updateRecord } from '@/lib/finance';
import { TempStore } from '@/lib/tempStore'; // Make sure to create this file
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddRecordModal() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const params = useLocalSearchParams();

  // Parse incoming params once
  const incomingRecord = params.record ? JSON.parse(params.record as string) : null;
  const initialType = params.type ? (params.type as string).toUpperCase() : 'EXPENSE';
  
  // State
  const [recordType, setRecordType] = useState<'INCOME' | 'EXPENSE' | 'TRANSFER'>(
    incomingRecord ? incomingRecord.type.toUpperCase() : (initialType as any)
  );
  
  // If type was passed via FAB, we lock the tabs
  const typeLocked = !!params.type && !incomingRecord; 

  const [amount, setAmount] = useState(incomingRecord ? String(incomingRecord.amount) : '');
  const [notes, setNotes] = useState(incomingRecord ? incomingRecord.notes : '');
  const [date, setDate] = useState(incomingRecord ? new Date(incomingRecord.transaction_date) : new Date());
  
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedToAccount, setSelectedToAccount] = useState<any>(null); // For transfers

  // Modals for selection
  const [modalType, setModalType] = useState<'NONE' | 'ACCOUNT' | 'CATEGORY' | 'TO_ACCOUNT'>('NONE');

  // Load Data
  const loadData = async () => {
    try {
      const [accData, catData] = await Promise.all([readAccounts(), readCategories()]);
      setAccounts(accData || []);
      setCategories(catData || []);

      // If editing, set selections
      if (incomingRecord) {
        setSelectedAccount(accData?.find((a) => a.id === incomingRecord.account_id) || null);
        setSelectedCategory(catData?.find((c) => c.id === incomingRecord.category_id) || null);
        // For transfer records, also set the destination account
        if (incomingRecord.type.toUpperCase() === 'TRANSFER' && incomingRecord.to_account_id) {
          setSelectedToAccount(accData?.find((a) => a.id === incomingRecord.to_account_id) || null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Focus Effect: Reload data and check for newly created items
  useFocusEffect(
    useCallback(() => {
      // 1. Reload list in case a new item was added
      loadData().then(() => {
        // 2. Check TempStore for newly created IDs
        const newAccId = TempStore.getNewAccount();
        const newCatId = TempStore.getNewCategory();

        if (newAccId) {
            // We need to find it in the refreshed list. 
            // Since setState is async, we do this inside the promise chain or use a ref.
            // For simplicity, we re-read the updated state in a separate effect or just read from source here.
            readAccounts().then(updated => {
                setAccounts(updated || []);
                const match = updated?.find(a => a.id === newAccId);
                if (match) setSelectedAccount(match);
            });
        }

        if (newCatId) {
            readCategories().then(updated => {
                setCategories(updated || []);
                const match = updated?.find(c => c.id === newCatId);
                if (match) setSelectedCategory(match);
            });
        }
      });
    }, [])
  );

  const handleSave = async () => {
    if (!amount || parseFloat(amount) === 0) return Alert.alert('Error', 'Enter a valid amount');
    if (!selectedAccount) return Alert.alert('Error', 'Select an account');
    
    // Validate category for non-transfer records
    if (recordType !== 'TRANSFER' && !selectedCategory) {
      return Alert.alert('Error', 'Select a category');
    }
    
    // Validate destination account for transfers
    if (recordType === 'TRANSFER' && !selectedToAccount) {
      return Alert.alert('Error', 'Select destination account');
    }
    
    // Prevent transfer to same account
    if (recordType === 'TRANSFER' && selectedAccount.id === selectedToAccount.id) {
      return Alert.alert('Error', 'Cannot transfer to the same account');
    }

    try {
      const payload: any = {
        user_id: user?.id,
        amount: parseFloat(amount),
        type: recordType.toLowerCase(),
        account_id: selectedAccount.id,
        notes,
        transaction_date: date.toISOString(),
      };

      // Add category only for non-transfer records
      if (recordType !== 'TRANSFER') {
        payload.category_id = selectedCategory?.id;
      } else {
        // For transfers, add the destination account
        payload.to_account_id = selectedToAccount.id;
      }

      // LOGGING: Before save
      console.log('💾 [handleSave] Saving record with payload:', {
        type: payload.type,
        amount: payload.amount,
        account: selectedAccount?.name,
        category: selectedCategory?.name,
        to_account: selectedToAccount?.name,
        has_to_account_id: !!payload.to_account_id,
      });

      if (incomingRecord?.id) {
         delete (payload as any).user_id; // Don't update user_id
         await updateRecord(incomingRecord.id, payload);
         console.log('✏️ [handleSave] Record updated successfully:', incomingRecord.id);
      } else {
         const result = await createRecord(payload);
         console.log('✅ [handleSave] Record created successfully:', result?.id);
      }
      
      // Navigate back
      if (navigation.canGoBack()) router.back();
      else router.replace('/(tabs)');
      
    } catch (e) {
      console.error('❌ [handleSave] Error saving record:', e);
      Alert.alert('Error', 'Failed to save record');
    }
  };

  // Filter categories based on type
  const currentCategories = categories.filter(c => 
    c.type === recordType.toLowerCase() || !c.type
  );

  const getTypeColor = () => {
    if (recordType === 'INCOME') return colors.income;
    if (recordType === 'EXPENSE') return colors.expense;
    return colors.transfer;
  };

  const handleNumberPress = (val: string) => {
    if (val === 'DEL') setAmount(prev => prev.slice(0, -1));
    else if (val === '.' && amount.includes('.')) return;
    else setAmount(prev => prev + val);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
            {incomingRecord ? 'Edit Record' : 'Add Record'}
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={{ color: getTypeColor(), fontWeight: 'bold', fontSize: 16 }}>SAVE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        
        {/* Type Selector */}
        <View style={styles.typeRow}>
            {['INCOME', 'EXPENSE', 'TRANSFER'].map((t) => (
                <TouchableOpacity
                    key={t}
                    disabled={typeLocked}
                    style={[
                        styles.typeBtn, 
                        { 
                            backgroundColor: recordType === t ? getTypeColor() : colors.surface,
                            opacity: (typeLocked && recordType !== t) ? 0.3 : 1
                        }
                    ]}
                    onPress={() => {
                        setRecordType(t as any);
                        setSelectedCategory(null); // Reset category on type change
                        setSelectedToAccount(null); // Reset destination account on type change
                    }}
                >
                    <Text style={{ color: recordType === t ? '#fff' : colors.text, fontWeight:'600' }}>{t}</Text>
                </TouchableOpacity>
            ))}
        </View>

        {/* Amount */}
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
            <Text style={{ fontSize: 16, color: colors.textSecondary }}>Amount</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 32, color: getTypeColor(), fontWeight: 'bold' }}>₹</Text>
                <Text style={{ fontSize: 48, color: colors.text, fontWeight: 'bold' }}>
                    {amount || '0'}
                </Text>
            </View>
        </View>

        {/* Custom Keypad (Simplified) */}
        <View style={styles.keypad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'DEL'].map((k) => (
                <TouchableOpacity 
                    key={k} 
                    style={[styles.key, { borderColor: colors.border }]} 
                    onPress={() => handleNumberPress(String(k))}
                >
                    {k === 'DEL' ? (
                        <MaterialCommunityIcons name="backspace-outline" size={24} color={colors.text} />
                    ) : (
                        <Text style={{ fontSize: 24, color: colors.text }}>{k}</Text>
                    )}
                </TouchableOpacity>
            ))}
        </View>

        {/* Selections */}
        <View style={{ gap: 16, marginTop: 20 }}>
            {/* Account Selector */}
            <TouchableOpacity 
                style={[styles.selector, { backgroundColor: colors.surface }]}
                onPress={() => setModalType('ACCOUNT')}
            >
                <Text style={{ color: colors.textSecondary }}>
                  {recordType === 'TRANSFER' ? 'From Account' : 'Account'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
                        {selectedAccount ? selectedAccount.name : 'Select Account'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
                </View>
            </TouchableOpacity>

            {/* Transfer To Account Selector - Only for transfers */}
            {recordType === 'TRANSFER' && (
              <TouchableOpacity 
                  style={[styles.selector, { backgroundColor: colors.surface }]}
                  onPress={() => setModalType('TO_ACCOUNT')}
              >
                  <Text style={{ color: colors.textSecondary }}>To Account</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
                          {selectedToAccount ? selectedToAccount.name : 'Select Account'}
                      </Text>
                      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
                  </View>
              </TouchableOpacity>
            )}

            {/* Category Selector - Only for income/expense */}
            {recordType !== 'TRANSFER' && (
              <TouchableOpacity 
                  style={[styles.selector, { backgroundColor: colors.surface }]}
                  onPress={() => setModalType('CATEGORY')}
              >
                  <Text style={{ color: colors.textSecondary }}>Category</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
                          {selectedCategory ? selectedCategory.name : 'Select Category'}
                      </Text>
                      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
                  </View>
              </TouchableOpacity>
            )}

            {/* Notes */}
            <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                placeholder="Add a note..."
                placeholderTextColor={colors.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
            />
        </View>
      </ScrollView>

      {/* Internal Selection Modal (Replaces external navigation loops for better UX) */}
      <Modal visible={modalType !== 'NONE'} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={() => setModalType('NONE')}>
            <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.headerTitle, {color: colors.text}]}>
                                {modalType === 'ACCOUNT' && 'Select Account'}
                                {modalType === 'TO_ACCOUNT' && 'Select Destination Account'}
                                {modalType === 'CATEGORY' && 'Select Category'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalType('NONE')}>
                                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView contentContainerStyle={{ padding: 16 }}>
                            {/* Accounts List */}
                            {(modalType === 'ACCOUNT' || modalType === 'TO_ACCOUNT') && accounts.map(item => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.listItem, { borderBottomColor: colors.border }]}
                                    onPress={() => {
                                        if (modalType === 'ACCOUNT') {
                                          setSelectedAccount(item);
                                        } else if (modalType === 'TO_ACCOUNT') {
                                          setSelectedToAccount(item);
                                        }
                                        setModalType('NONE');
                                    }}
                                >
                                    <View style={[styles.iconDot, { backgroundColor: item.color || colors.accent }]}>
                                        <MaterialCommunityIcons name="bank" size={16} color="#fff" />
                                    </View>
                                    <Text style={{ color: colors.text, fontSize: 16, flex: 1 }}>{item.name}</Text>
                                    {((modalType === 'ACCOUNT' && selectedAccount?.id === item.id) || 
                                      (modalType === 'TO_ACCOUNT' && selectedToAccount?.id === item.id)) && (
                                        <MaterialCommunityIcons name="check" size={20} color={colors.accent} />
                                    )}
                                </TouchableOpacity>
                            ))}
                            
                            {/* Categories List */}
                            {modalType === 'CATEGORY' && currentCategories.map(item => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.listItem, { borderBottomColor: colors.border }]}
                                    onPress={() => {
                                        setSelectedCategory(item);
                                        setModalType('NONE');
                                    }}
                                >
                                    <View style={[styles.iconDot, { backgroundColor: item.color || colors.accent }]}>
                                        <MaterialCommunityIcons name={item.icon || 'circle'} size={16} color="#fff" />
                                    </View>
                                    <Text style={{ color: colors.text, fontSize: 16, flex: 1 }}>{item.name}</Text>
                                    {selectedCategory?.id === item.id && (
                                        <MaterialCommunityIcons name="check" size={20} color={colors.accent} />
                                    )}
                                </TouchableOpacity>
                            ))}
                            
                            {/* Add New Button - Only for categories */}
                            {modalType === 'CATEGORY' && (
                              <TouchableOpacity 
                                  style={[styles.addNewBtn, { borderColor: colors.accent }]}
                                  onPress={() => {
                                      setModalType('NONE');
                                      router.push({
                                          pathname: '/(modal)/add-category-modal',
                                          params: { type: recordType }
                                      });
                                  }}
                              >
                                  <MaterialCommunityIcons name="plus" size={20} color={colors.accent} />
                                  <Text style={{ color: colors.accent, fontWeight: 'bold' }}>
                                      Create New Category
                                  </Text>
                              </TouchableOpacity>
                            )}

                            {/* Add New Account Button - Only for accounts */}
                            {(modalType === 'ACCOUNT' || modalType === 'TO_ACCOUNT') && (
                              <TouchableOpacity 
                                  style={[styles.addNewBtn, { borderColor: colors.accent }]}
                                  onPress={() => {
                                      setModalType('NONE');
                                      router.push('/(modal)/add-account-modal');
                                  }}
                              >
                                  <MaterialCommunityIcons name="plus" size={20} color={colors.accent} />
                                  <Text style={{ color: colors.accent, fontWeight: 'bold' }}>
                                      Create New Account
                                  </Text>
                              </TouchableOpacity>
                            )}
                        </ScrollView>
                    </View>
                </TouchableWithoutFeedback>
            </View>
        </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, alignItems:'center' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  keypad: { flexDirection: 'row', flexWrap: 'wrap' },
  key: { width: '33.33%', height: 60, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: '#ccc' },
  selector: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderRadius: 12, alignItems: 'center' },
  input: { padding: 16, borderRadius: 12, minHeight: 100, textAlignVertical: 'top' },
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { height: '70%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  listItem: { flexDirection: 'row', padding: 16, alignItems: 'center', gap: 12, borderBottomWidth: 0.5 },
  iconDot: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  addNewBtn: { flexDirection: 'row', padding: 16, justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed', borderRadius: 8, marginTop: 16 }
});