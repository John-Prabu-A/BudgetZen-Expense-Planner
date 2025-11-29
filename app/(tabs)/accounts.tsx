import { useAuth } from '@/context/Auth';
import { useTheme } from '@/context/Theme';
import { useUIMode } from '@/hooks/useUIMode';
import { deleteAccount, readAccounts, readRecords } from '@/lib/finance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AccountsScreen() {
  const router = useRouter();
  const { user, session } = useAuth();
  const { isDark, colors } = useTheme();
  const spacing = useUIMode();
  const styles = createAccountsStyles(spacing, colors);

  const [accounts, setAccounts] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
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
      loadData();
    }
  }, [user, session]);

  // Reload accounts and records whenever screen comes into focus
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
      const [accountsData, recordsData] = await Promise.all([
        readAccounts(),
        readRecords(),
      ]);
      setAccounts(accountsData || []);
      setRecords(recordsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  // Calculate account balance based on transactions
  const calculateAccountBalance = useCallback((accountId: string): { balance: number; income: number; expense: number } => {
    const accountRecords = records.filter(r => r.account_id === accountId);
    const income = accountRecords
      .filter(r => r.type.toUpperCase() === 'INCOME')
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const expense = accountRecords
      .filter(r => r.type.toUpperCase() === 'EXPENSE')
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);
    
    const initialBalance = accounts.find(a => a.id === accountId)?.initial_balance || 0;
    const balance = initialBalance + income - expense;
    
    return { balance, income, expense };
  }, [records, accounts]);

  // Calculate total balance
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, account) => {
      const { balance } = calculateAccountBalance(account.id);
      return sum + balance;
    }, 0);
  }, [accounts, calculateAccountBalance]);

  // Get balance summary for an account
  const getAccountSummary = useCallback((accountId: string) => {
    return calculateAccountBalance(accountId);
  }, [calculateAccountBalance]);

  const handleDeleteAccount = (accountId: string, accountName: string) => {
    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete "${accountName}"? This action cannot be undone.`,
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
              // Also remove records for this account
              setRecords(records.filter(r => r.account_id !== accountId));
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

  const handleEditAccount = (account: any) => {
    // Pass account data and callback to edit modal
    router.push({
      pathname: '/add-account-modal',
      params: {
        mode: 'edit',
        accountId: account.id,
        accountName: account.name,
        accountType: account.type,
        initialBalance: account.initial_balance?.toString(),
      },
    });
  };

  const AccountCard = ({ account }: any) => {
    const isExpanded = expandedAccountId === account.id;
    const iconName = accountTypeIcons[account.type] || 'wallet';
    const { balance, income, expense } = getAccountSummary(account.id);
    const isNegativeBalance = balance < 0;

    return (
      <TouchableOpacity
        style={[
          styles.accountCard,
          {
            backgroundColor: colors.surface,
            borderColor: isNegativeBalance ? colors.expense : colors.border,
            borderWidth: isNegativeBalance ? 1.5 : 1,
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

        {/* Balance Summary */}
        <View style={styles.balanceSummary}>
          <View style={styles.balanceItem}>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Initial</Text>
            <Text style={[styles.balanceValue, { color: colors.textSecondary }]}>
              ₹{(account.initial_balance || 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={[styles.balanceLabel, { color: colors.income }]}>+Income</Text>
            <Text style={[styles.balanceValue, { color: colors.income }]}>
              ₹{income.toFixed(2)}
            </Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={[styles.balanceLabel, { color: colors.expense }]}>-Expense</Text>
            <Text style={[styles.balanceValue, { color: colors.expense }]}>
              ₹{expense.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.accountFooter}>
          <View>
            <Text style={[styles.currentBalanceLabel, { color: colors.textSecondary }]}>
              Current Balance
            </Text>
            <Text
              style={[
                styles.accountBalance,
                {
                  color: isNegativeBalance ? colors.expense : colors.income,
                },
              ]}
            >
              ₹{balance.toFixed(2)}
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
              onPress={() => handleEditAccount(account)}
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
          <TouchableOpacity style={[styles.actionButton, { borderColor: '#FFFFFF' }]} onPress={() => router.push('/(modal)/add-account-modal')}>
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

const createAccountsStyles = (spacing: any, colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingVertical: spacing.lg,
  },
  totalBalanceCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  totalBalanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.xs,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  totalBalanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: spacing.lg,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  totalBalanceFooter: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 8,
    backgroundColor: colors.accent,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.md,
    color: colors.text,
    letterSpacing: 0.3,
  },
  accountCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.accent,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    color: colors.text,
    letterSpacing: 0.2,
  },
  accountType: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  balanceSummary: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  balanceValue: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  balanceDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  accountFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  currentBalanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  accountBalance: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  expandedActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  loadingContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
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
    fontWeight: '500',
    color: colors.textSecondary,
  },
});
