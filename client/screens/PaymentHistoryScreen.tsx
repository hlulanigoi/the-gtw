import React from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { useCurrency } from "@/hooks/useCurrency";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { usePayments } from "@/hooks/usePayments";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";
import { formatCurrency } from "@/lib/currency";

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function PaymentHistoryScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { currency } = useCurrency();
  const navigation = useNavigation<NavigationProp>();
  const { payments, isLoading } = usePayments();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
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

  const getStatusIcon = (status: string): "check-circle" | "clock" | "x-circle" | "alert-circle" => {
    switch (status) {
      case "success":
        return "check-circle";
      case "pending":
        return "clock";
      case "failed":
      case "cancelled":
        return "x-circle";
      default:
        return "alert-circle";
    }
  };

  const renderPayment = ({ item }: { item: any }) => (
    <Card style={[styles.paymentCard, { marginHorizontal: Spacing.lg, marginBottom: Spacing.md }] as any}>
      <View style={styles.paymentHeader}>
        <View>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            Parcel #{item.parcelId.slice(0, 8)}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
            {new Date(item.createdAt).toLocaleDateString()}
          </ThemedText>
        </View>
        <View style={styles.statusBadge}>
          <Feather
            name={getStatusIcon(item.status)}
            size={16}
            color={getStatusColor(item.status)}
          />
          <ThemedText
            type="small"
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.divider, { borderColor: theme.backgroundSecondary }]} />

      <View style={styles.amountSection}>
        <View>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Amount
          </ThemedText>
          <ThemedText type="body">
            {formatCurrency(item.amount / 100, currency)}
          </ThemedText>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Total (with fee)
          </ThemedText>
          <ThemedText type="body" style={{ color: Colors.primary, fontWeight: "600" }}>
            {formatCurrency(item.totalAmount / 100, currency)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.methodSection}>
        <Feather name="credit-card" size={16} color={theme.textSecondary} />
        <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>
          {item.paymentMethod === "paystack" ? "Paystack" : "Cash"}
        </ThemedText>
      </View>

      {item.status === "success" && (
        <Pressable
          onPress={() => navigation.navigate("Receipt", { payment: item })}
          style={({ pressed }) => [
            styles.receiptButton,
            {
              backgroundColor: Colors.primary,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Feather name="download" size={16} color="#FFFFFF" />
          <ThemedText type="small" style={{ color: "#FFFFFF", marginLeft: Spacing.sm, fontWeight: "600" }}>
            View Receipt
          </ThemedText>
        </Pressable>
      )}
    </Card>
  );

  const emptyState = (
    <View style={styles.emptyContainer}>
      <Feather name="credit-card" size={48} color={theme.textSecondary} />
      <ThemedText type="h3" style={{ marginTop: Spacing.lg, textAlign: "center" }}>
        No Payments Yet
      </ThemedText>
      <ThemedText
        type="body"
        style={{
          color: theme.textSecondary,
          textAlign: "center",
          marginTop: Spacing.md,
        }}
      >
        Your payment history will appear here
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={payments}
        renderItem={renderPayment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListEmptyComponent={emptyState}
        scrollEnabled={payments.length > 0}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  paymentCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  statusText: {
    fontWeight: "600",
  },
  divider: {
    height: 1,
    marginBottom: Spacing.md,
  },
  amountSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  methodSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  receiptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
