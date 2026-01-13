import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useWallet, WalletTransaction } from '@/hooks/useWallet';

function TransactionTypeIcon({ type }: { type: WalletTransaction['type'] }) {
  const iconMap = {
    credit: { name: 'arrow-down' as const, color: Colors.success },
    debit: { name: 'arrow-up' as const, color: Colors.error },
    refund: { name: 'rotate-ccw' as const, color: Colors.info },
    topup: { name: 'plus' as const, color: Colors.primary },
  };

  const icon = iconMap[type];
  return (
    <View
      style={[
        styles.transactionIcon,
        { backgroundColor: icon.color + '15' },
      ]}
    >
      <Feather name={icon.name} size={20} color={icon.color} />
    </View>
  );
}

function TransactionItem({ transaction, theme }: { transaction: WalletTransaction; theme: any }) {
  const isCredit = transaction.type === 'credit' || transaction.type === 'topup' || transaction.type === 'refund';
  const amount = transaction.amount / 100; // Convert from kobo to naira

  return (
    <Card elevation={1} style={styles.transactionCard}>
      <View style={styles.transactionContent}>
        <TransactionTypeIcon type={transaction.type} />
        <View style={styles.transactionDetails}>
          <ThemedText type="body" style={{ fontWeight: '600' }}>
            {transaction.description || transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {new Date(transaction.createdAt).toLocaleDateString()} •{' '}
            {new Date(transaction.createdAt).toLocaleTimeString()}
          </ThemedText>
          {transaction.reference ? (
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: 2 }}>
              Ref: {transaction.reference.substring(0, 16)}...
            </ThemedText>
          ) : null}
        </View>
        <ThemedText
          type="body"
          style={{
            fontWeight: '700',
            color: isCredit ? Colors.success : Colors.error,
          }}
        >
          {isCredit ? '+' : '-'}₦{amount.toFixed(2)}
        </ThemedText>
      </View>
    </Card>
  );
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { balance, transactions, isLoadingBalance, isLoadingTransactions, setIsTopupModalVisible } = useWallet();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Trigger refetch via query client
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const balanceInNaira = balance / 100;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Balance Card */}
        <Card elevation={2} style={[styles.balanceCard, { backgroundColor: Colors.primary }]}>
          <View style={styles.balanceContent}>
            <View style={styles.balanceIcon}>
              <Feather name="wallet" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.balanceTextContainer}>
              <ThemedText type="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>
                WALLET BALANCE
              </ThemedText>
              <ThemedText type="h1" style={{ color: '#FFFFFF', marginTop: Spacing.xs }}>
                ₦{isLoadingBalance ? '...' : balanceInNaira.toFixed(2)}
              </ThemedText>
            </View>
          </View>
          <Button
            onPress={() => navigation.navigate('WalletTopup')}
            variant="secondary"
            style={styles.topupButton}
          >
            <View style={styles.topupButtonContent}>
              <Feather name="plus" size={18} color={Colors.primary} />
              <ThemedText type="body" style={{ color: Colors.primary, marginLeft: Spacing.xs, fontWeight: '600' }}>
                Top Up
              </ThemedText>
            </View>
          </Button>
        </Card>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <Card elevation={1} style={styles.statCard}>
            <Feather name="arrow-down" size={20} color={Colors.success} />
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
              Total Received
            </ThemedText>
            <ThemedText type="h4" style={{ marginTop: Spacing.xs }}>
              ₦{(
                transactions
                  .filter((t) => t.type === 'credit' || t.type === 'topup' || t.type === 'refund')
                  .reduce((sum, t) => sum + t.amount, 0) / 100
              ).toFixed(2)}
            </ThemedText>
          </Card>
          <Card elevation={1} style={styles.statCard}>
            <Feather name="arrow-up" size={20} color={Colors.error} />
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
              Total Spent
            </ThemedText>
            <ThemedText type="h4" style={{ marginTop: Spacing.xs }}>
              ₦{(
                transactions
                  .filter((t) => t.type === 'debit')
                  .reduce((sum, t) => sum + t.amount, 0) / 100
              ).toFixed(2)}
            </ThemedText>
          </Card>
        </View>

        {/* Transactions */}
        <View style={styles.transactionsHeader}>
          <ThemedText type="h3">Recent Transactions</ThemedText>
          {transactions.length > 0 ? (
            <Pressable>
              <ThemedText type="body" style={{ color: Colors.primary }}>
                View All
              </ThemedText>
            </Pressable>
          ) : null}
        </View>

        {isLoadingTransactions ? (
          <Card elevation={1} style={styles.emptyCard}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Loading transactions...
            </ThemedText>
          </Card>
        ) : transactions.length === 0 ? (
          <Card elevation={1} style={styles.emptyCard}>
            <Feather name="inbox" size={48} color={theme.textSecondary} />
            <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
              No transactions yet
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
              Your transaction history will appear here
            </ThemedText>
          </Card>
        ) : (
          transactions.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} theme={theme} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  balanceCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
  },
  balanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  balanceIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  balanceTextContainer: {
    flex: 1,
  },
  topupButton: {
    backgroundColor: '#FFFFFF',
  },
  topupButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  transactionCard: {
    marginBottom: Spacing.sm,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
});
