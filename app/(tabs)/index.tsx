import { EmptyStateView } from '@/components/EmptyStateView';
import { useAuth } from '@/context/Auth';
import { useTheme } from '@/context/Theme';
import useAppSettings from '@/hooks/useAppSettings';
import { useSmartLoading } from '@/hooks/useSmartLoading';
import { useUIMode } from '@/hooks/useUIMode';
import { readRecords } from '@/lib/finance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RecordsScreen() {
  const { isDark, colors } = useTheme();
  const spacing = useUIMode();
  const { formatCurrency, currencySign } = useAppSettings();
  const { user, session } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const { loading, handleLoad } = useSmartLoading(
    async () => {
      const data = await readRecords();
      setRecords(data || []);
    }
  );

  // Load records on mount
  useFocusEffect(
    useCallback(() => {
      if (user && session) {
        handleLoad();
      }
    }, [user, session])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await readRecords();
      setRecords(data || []);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleAddRecord = () => {
    router.push('/(modal)/add-record-modal');
  };

  const handleDeleteRecord = (recordId: string) => {
    // Delete implementation would go here
    console.log('Delete record:', recordId);
  };

  const handleEditRecord = (record: any) => {
    // Navigate to edit modal with record data
    router.push({
      pathname: '/(modal)/add-record-modal',
      params: { recordId: record.id },
    });
  };

  const renderRecordItem = ({ item }: { item: any }) => (
    <View
      style={[
        styles.recordCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.recordInfo}>
        <Text style={[styles.recordCategory, { color: colors.text }]}>
          {item.categories?.name || 'Unknown'}
        </Text>
        <Text style={[styles.recordAccount, { color: colors.textSecondary }]}>
          {item.accounts?.name || 'Unknown Account'}
        </Text>
      </View>
      <View style={styles.recordActions}>
        <Text
          style={[
            styles.recordAmount,
            {
              color: item.type === 'INCOME' ? '#4CAF50' : '#FF6B6B',
            },
          ]}
        >
          {item.type === 'INCOME' ? '+' : '-'}
          {currencySign}
          {formatCurrency(item.amount)}
        </Text>
        <TouchableOpacity onPress={() => handleEditRecord(item)}>
          <MaterialCommunityIcons name="pencil" size={18} color={colors.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <EmptyStateView
      icon="receipt-text-outline"
      title="No Records Yet"
      subtitle="Start tracking your expenses and income"
      actionText="Add Record"
      onAction={handleAddRecord}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <FlatList
        data={records}
        renderItem={renderRecordItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        refreshControl={<RefreshControl refreshing={refreshing || loading} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        scrollIndicatorInsets={{ right: 1 }}
      />
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={handleAddRecord}
      >
        <MaterialCommunityIcons name="plus" size={24} color={colors.textOnAccent} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  recordCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  recordInfo: {
    flex: 1,
  },
  recordCategory: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  recordAccount: {
    fontSize: 13,
    fontWeight: '500',
  },
  recordActions: {
    alignItems: 'flex-end',
    gap: 12,
  },
  recordAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
});
