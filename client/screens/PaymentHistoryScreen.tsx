<<<<<<< HEAD
import React from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { usePayments } from "@/hooks/usePayments";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function PaymentHistoryScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { payments, isLoading } = usePayments();
=======
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { usePayments, type Payment } from "@/hooks/usePayments";

export default function PaymentHistoryScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { getUserPayments, isLoading } = usePayments();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadPayments = async () => {
    if (!user) return;
    const data = await getUserPayments(user.uid);
    setPayments(data);
  };

  useEffect(() => {
    loadPayments();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  };
>>>>>>> origin/payments

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
<<<<<<< HEAD
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
            ₦{item.amount.toLocaleString()}
          </ThemedText>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Total (with fee)
          </ThemedText>
          <ThemedText type="body" style={{ color: Colors.primary, fontWeight: "600" }}>
            ₦{item.totalAmount.toLocaleString()}
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
=======
        return "#10b981";
      case "pending":
        return "#f59e0b";
      case "failed":
        return "#ef4444";
      case "cancelled":
        return "#6b7280";
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return "checkmark-circle";
      case "pending":
        return "time";
      case "failed":
        return "close-circle";
      case "cancelled":
        return "ban";
      default:
        return "help-circle";
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${currency} ${(amount / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => {
    const isSent = item.senderId === user?.uid;
    
    return (
      <TouchableOpacity
        style={styles.paymentCard}
        data-testid={`payment-item-${item.id}`}
      >
        <View style={styles.paymentHeader}>
          <View style={styles.paymentTitleRow}>
            <Ionicons
              name={isSent ? "arrow-up-circle" : "arrow-down-circle"}
              size={24}
              color={isSent ? "#ef4444" : "#10b981"}
            />
            <Text style={styles.paymentTitle}>
              {isSent ? "Payment Sent" : "Payment Received"}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + "20" },
            ]}
          >
            <Ionicons
              name={getStatusIcon(item.status) as any}
              size={14}
              color={getStatusColor(item.status)}
            />
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.paymentDetails}>
          <Text style={styles.amountText}>
            {formatAmount(item.amount, item.currency)}
          </Text>
          <Text style={styles.dateText}>
            {formatDate(item.createdAt)}
          </Text>
        </View>

        {item.paystackReference && (
          <Text style={styles.referenceText}>
            Ref: {item.paystackReference}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading && payments.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment History</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          data-testid="back-button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment History</Text>
        <View style={{ width: 24 }} />
      </View>

      {payments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="wallet-outline"
            size={80}
            color={Colors.textSecondary}
          />
          <Text style={styles.emptyTitle}>No Payments Yet</Text>
          <Text style={styles.emptyText}>
            Your payment history will appear here once you make or receive payments.
          </Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          renderItem={renderPaymentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
>>>>>>> origin/payments
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
<<<<<<< HEAD
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
=======
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
>>>>>>> origin/payments
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
<<<<<<< HEAD
=======
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  listContent: {
    padding: 16,
  },
  paymentCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  paymentTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  paymentDetails: {
    marginBottom: 8,
  },
  amountText: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  referenceText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: "monospace",
>>>>>>> origin/payments
  },
});
