import { useAuth } from '@/context/Auth';
import { deleteAccount, readAccounts } from '@/lib/finance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export default function AccountsScreen() {
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
  };

  const [accounts, setAccounts] = useState<any[]>([]);
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Map account types to icons
  const accountTypeIcons: { [key: string]: string } = {
    'Bank Account': 'bank',
    'Credit Card': 'credit-card',
    'Cash': 'wallet',
    'Investment': 'trending-up',
    'Savings': 'piggy-bank',
    'Loan': 'file-document',
  };

  useEffect(() => {
    if (user && session) {
      loadAccounts();
    }
  }, [user, session]);

  // Reload accounts whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user && session) {
        loadAccounts();
      }
    }, [user, session])
  );

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await readAccounts();
      setAccounts(data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
      Alert.alert('Error', 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = (accountId: string, accountName: string) => {
    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete "${accountName}"?`,
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
              await deleteAccount(accountId);
              setAccounts(accounts.filter((a) => a.id !== accountId));
              Alert.alert('Success', 'Account deleted successfully!');
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account');
            }
          },
          style: 'destructive',
        },
      ],
    );
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.initial_balance || 0), 0);

  const AccountCard = ({ account }: any) => {
    const isExpanded = expandedAccountId === account.id;
    const iconName = accountTypeIcons[account.type] || 'wallet';

    return (
      <TouchableOpacity
        style={[
          styles.accountCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setExpandedAccountId(isExpanded ? null : account.id)}
        activeOpacity={0.7}
      >
        <View style={styles.accountHeader}>
          <View style={[styles.accountIcon, { backgroundColor: colors.accent }]}>
            <MaterialCommunityIcons
              name={iconName as any}
              size={20}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.accountInfo}>
            <Text style={[styles.accountName, { color: colors.text }]}>
              {account.name}
            </Text>
            <Text style={[styles.accountType, { color: colors.textSecondary }]}>
              {account.type}
            </Text>
          </View>
        </View>

        <View style={styles.accountFooter}>
          <Text
            style={[
              styles.accountBalance,
              {
                color: account.initial_balance >= 0 ? colors.text : '#EF4444',
              },
            ]}
          >
            ₹{(account.initial_balance || 0).toLocaleString()}
          </Text>
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
                // TODO: Navigate to edit account modal with account data
                Alert.alert('Edit Account', `Editing "${account.name}"`);
              }}
            >
              <MaterialCommunityIcons name="pencil" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
              onPress={() => handleDeleteAccount(account.id, account.name)}
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
      {/* Total Balance Card */}
      <View
        style={[
          styles.totalBalanceCard,
          {
            backgroundColor: colors.accent,
            borderColor: colors.accent,
          },
        ]}
      >
        <Text style={[styles.totalBalanceLabel, { color: 'rgba(255, 255, 255, 0.8)' }]}>
          Total Balance
        </Text>
        <Text style={[styles.totalBalanceAmount, { color: '#FFFFFF' }]}>
          ₹{totalBalance.toLocaleString()}
        </Text>
        <View style={styles.totalBalanceFooter}>
          <TouchableOpacity style={[styles.actionButton, { borderColor: '#FFFFFF' }]} onPress={() => router.push('/add-account-modal')}>
            <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Add Account</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Accounts List */}
      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Your Accounts {loading && '(Loading...)'}
        </Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading accounts...
            </Text>
          </View>
        ) : accounts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="inbox" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No accounts yet. Add your first account!
            </Text>
          </View>
        ) : (
          accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))
        )}
      </View>

      {/* Account Types Info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Account Types
        </Text>
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons name="information" size={20} color={colors.accent} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            You can manage multiple accounts here. Add different types like bank
            accounts, credit cards, and cash to track your total wealth.
          </Text>
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
  totalBalanceCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  totalBalanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  totalBalanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
  },
  totalBalanceFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  accountCard: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  accountType: {
    fontSize: 12,
  },
  accountFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '700',
  },
  expandedActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
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
