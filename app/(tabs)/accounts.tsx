import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export default function AccountsScreen() {
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

  const accounts = [
    {
      id: '1',
      name: 'Savings Account',
      type: 'Bank',
      balance: 50000,
      icon: 'bank',
    },
    {
      id: '2',
      name: 'Credit Card',
      type: 'Credit',
      balance: -5000,
      icon: 'credit-card',
    },
    {
      id: '3',
      name: 'Cash',
      type: 'Cash',
      balance: 10000,
      icon: 'wallet',
    },
    {
      id: '4',
      name: 'Investment',
      type: 'Investment',
      balance: 100000,
      icon: 'trending-up',
    },
  ];

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const AccountCard = ({ account }: any) => (
    <TouchableOpacity
      style={[
        styles.accountCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.accountHeader}>
        <View style={[styles.accountIcon, { backgroundColor: colors.accent }]}>
          <MaterialCommunityIcons
            name={account.icon}
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
              color: account.balance >= 0 ? colors.text : '#EF4444',
            },
          ]}
        >
          ₹{account.balance.toLocaleString()}
        </Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={colors.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );

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
          <TouchableOpacity style={[styles.actionButton, { borderColor: '#FFFFFF' }]}>
            <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Add Account</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Accounts List */}
      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Your Accounts
        </Text>
        {accounts.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
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
});
