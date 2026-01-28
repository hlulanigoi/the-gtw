import React from "react";
import { View, StyleSheet, ScrollView, Share, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { useCurrency } from "@/hooks/useCurrency";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { formatCurrency } from "@/lib/currency";

type ReceiptScreenRouteProp = RouteProp<
  { Receipt: { payment: any } },
  "Receipt"
>;

export default function ReceiptScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { currency } = useCurrency();
  const route = useRoute<ReceiptScreenRouteProp>();
  const { payment } = route.params;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Receipt for Parcel Payment\n\nReference: ${payment.reference}\nAmount: ${formatCurrency(payment.totalAmount / 100, currency)}\nStatus: ${payment.status}\nDate: ${new Date(payment.createdAt).toLocaleDateString()}`,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        {/* Receipt Header */}
        <View style={styles.receiptHeader}>
          <View
            style={[
              styles.receiptIcon,
              { backgroundColor: Colors.success + "20" },
            ]}
          >
            <Feather name="check-circle" size={32} color={Colors.success} />
          </View>
          <ThemedText type="h2" style={{ marginTop: Spacing.lg }}>
            Payment Receipt
          </ThemedText>
        </View>

        {/* Receipt Card */}
        <Card style={[styles.receiptCard, { marginTop: Spacing.lg }] as any}>
          {/* Reference */}
          <View style={styles.section}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Transaction Reference
            </ThemedText>
            <ThemedText type="body" style={{ fontFamily: "monospace", marginTop: Spacing.xs }}>
              {payment.reference}
            </ThemedText>
          </View>

          <View style={[styles.divider, { borderColor: theme.backgroundSecondary }]} />

          {/* Date & Status */}
          <View style={styles.section}>
            <View style={styles.row}>
              <View>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Date
                </ThemedText>
                <ThemedText type="body">
                  {new Date(payment.createdAt).toLocaleDateString()}
                </ThemedText>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Status
                </ThemedText>
                <ThemedText
                  type="body"
                  style={{
                    color:
                      payment.status === "success"
                        ? Colors.success
                        : Colors.warning,
                    fontWeight: "600",
                  }}
                >
                  {payment.status.charAt(0).toUpperCase() +
                    payment.status.slice(1)}
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={[styles.divider, { borderColor: theme.backgroundSecondary }]} />

          {/* Parcel Info */}
          <View style={styles.section}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Parcel ID
            </ThemedText>
            <ThemedText type="body" style={{ marginTop: Spacing.xs }}>
              {payment.parcelId}
            </ThemedText>
          </View>

          <View style={[styles.divider, { borderColor: theme.backgroundSecondary }]} />

          {/* Amount Breakdown */}
          <View style={styles.section}>
            <View style={styles.row}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Parcel Compensation
              </ThemedText>
              <ThemedText type="body">
                ₦{payment.amount.toLocaleString()}
              </ThemedText>
            </View>
            <View style={[styles.row, { marginTop: Spacing.md }]}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Platform Fee (3%)
              </ThemedText>
              <ThemedText type="body">
                ₦{payment.platformFee.toLocaleString()}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.divider, { borderColor: theme.backgroundSecondary }]} />

          {/* Total */}
          <View style={styles.section}>
            <View
              style={[
                styles.row,
                {
                  borderTopWidth: 1,
                  borderTopColor: theme.backgroundSecondary,
                  paddingTop: Spacing.md,
                },
              ]}
            >
              <ThemedText type="h3">Total Amount</ThemedText>
              <ThemedText
                type="h3"
                style={{
                  color: Colors.primary,
                  fontWeight: "700",
                }}
              >
                ₦{payment.totalAmount.toLocaleString()}
              </ThemedText>
            </View>
          </View>

          {/* Payment Method */}
          <View style={[styles.section, { marginTop: Spacing.lg }]}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Payment Method
            </ThemedText>
            <View style={styles.row}>
              <Feather
                name={payment.paymentMethod === "paystack" ? "credit-card" : "dollar-sign"}
                size={16}
                color={theme.text}
              />
              <ThemedText type="body" style={{ marginLeft: Spacing.sm }}>
                {payment.paymentMethod === "paystack" ? "Paystack Card" : "Cash"}
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={[styles.actions, { marginTop: Spacing.xl }]}>
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: theme.backgroundDefault,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather name="share-2" size={20} color={Colors.primary} />
            <ThemedText type="body" style={{ marginLeft: Spacing.sm }}>
              Share
            </ThemedText>
          </Pressable>
        </View>

        <ThemedText
          type="small"
          style={{
            color: theme.textSecondary,
            textAlign: "center",
            marginTop: Spacing.xl,
          }}
        >
          Receipt generated on {new Date().toLocaleDateString()}
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  receiptHeader: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  receiptIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  receiptCard: {
    padding: Spacing.lg,
  },
  section: {
    marginVertical: Spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  divider: {
    height: 1,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
});
