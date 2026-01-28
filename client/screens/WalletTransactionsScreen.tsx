import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { useCurrency } from "@/hooks/useCurrency";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/lib/query-client";
import { formatCurrency } from "@/lib/currency";

type Transaction = {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
  balanceAfter: number;
};

export default function WalletTransactionsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { currency } = useCurrency();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const apiUrl = getApiUrl();
      const token = await user.getIdToken();
      const response = await fetch(`${apiUrl}/api/wallet/transactions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string): keyof typeof Feather.glyphMap => {
    switch (type) {
      case "topup":
        return "arrow-down-circle";
      case "debit":
        return "arrow-up-circle";
      case "refund":
        return "rotate-ccw";
      case "bonus":
        return "gift";
      default:
        return "circle";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "topup":
      case "refund":
      case "bonus":
        return Colors.success;
      case "debit":
        return Colors.error;
      default:
        return theme.textSecondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return Colors.success;
      case "pending":
        return Colors.warning;
      case "failed":
      case "cancelled":
        return Colors.error;
      default:
        return theme.textSecondary;
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <Card
      style={[
        styles.transactionCard,
        { marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
      ] as any}
      data-testid={`transaction-${item.id}`}
    >
      <View style={styles.transactionHeader}>
        <View style={styles.transactionLeft}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: getTypeColor(item.type) + "20" },
            ]}
          >
            <Feather name={getTypeIcon(item.type)} size={20} color={getTypeColor(item.type)} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="body" style={{ fontWeight: "600", marginBottom: 2 }}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </ThemedText>
            {item.description && (
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {item.description}
              </ThemedText>
            )}
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4 }}>
              {new Date(item.createdAt).toLocaleDateString()} at{" "}
              {new Date(item.createdAt).toLocaleTimeString()}
            </ThemedText>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <ThemedText
            type="body"
            style={{
              fontWeight: "700",
              color: getTypeColor(item.type),
              fontSize: 16,
            }}
          >
            {item.type === "debit" ? "-" : "+"}
            {formatCurrency(item.amount / 100, item.currency)}
          </ThemedText>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + "20" },
            ]}
          >
            <ThemedText
              type="small"
              style={{
                color: getStatusColor(item.status),
                fontWeight: "600",
                fontSize: 10,
              }}
            >
              {item.status.toUpperCase()}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={[styles.divider, { borderColor: theme.backgroundSecondary }]} />

      <View style={styles.balanceRow}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          Balance after transaction
        </ThemedText>
        <ThemedText type="small" style={{ fontWeight: "600" }}>
          {formatCurrency(item.balanceAfter / 100, item.currency)}
        </ThemedText>
      </View>
    </Card>
  );

  const emptyState = (
    <View style={styles.emptyContainer}>
      <Feather name="inbox" size={48} color={theme.textSecondary} />
      <ThemedText type="h3" style={{ marginTop: Spacing.lg, textAlign: "center" }}>
        No Transactions Yet
      </ThemedText>
      <ThemedText
        type="body"
        style={{
          color: theme.textSecondary,
          textAlign: "center",
          marginTop: Spacing.md,
        }}
      >
        Your wallet transaction history will appear here
      </ThemedText>
    </View>
  );

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <ThemedText style={{ marginTop: Spacing.md, color: theme.textSecondary }}>
            Loading transactions...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListEmptyComponent={emptyState}
        scrollEnabled={transactions.length > 0}
        data-testid="transactions-list"
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  transactionCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  transactionRight: {
    alignItems: "flex-end",
    gap: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  divider: {
    height: 1,
    marginBottom: Spacing.sm,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
});
