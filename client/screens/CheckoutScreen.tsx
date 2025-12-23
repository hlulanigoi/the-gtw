import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { BrowseStackParamList } from "@/navigation/BrowseStackNavigator";
import { useParcels } from "@/hooks/useParcels";
import { useAuth } from "@/contexts/AuthContext";

type RouteType = RouteProp<BrowseStackParamList, "Checkout">;
type PaymentMethod = "paystack" | "cash";

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const route = useRoute<RouteType>();
  const navigation = useNavigation();
  const { parcelId } = route.params;
  const { parcels, refetch } = useParcels();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("paystack");
  const [paymentStep, setPaymentStep] = useState<"summary" | "processing" | "complete">("summary");

  const parcel = parcels.find((p) => p.id === parcelId);

  if (!parcel) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.emptyContainer}>
          <Feather name="alert-circle" size={48} color={theme.textSecondary} />
          <ThemedText type="h3">Parcel not found</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const handlePayment = async () => {
    if (paymentMethod === "cash") {
      handleCashPayment();
    } else {
      handlePaystackPayment();
    }
  };

  const handleCashPayment = async () => {
    if (!user?.uid) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    setIsProcessing(true);
    setPaymentStep("processing");

    try {
      // Just mark the parcel as ready for cash payment
      // The carrier will collect cash upon delivery
      setPaymentStep("complete");
      await refetch();

      setTimeout(() => {
        Alert.alert("Cash Payment Confirmed", "You selected to pay with cash. The carrier will collect payment upon delivery.", [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]);
      }, 500);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
      setPaymentStep("summary");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaystackPayment = async () => {
    if (!user?.email) {
      Alert.alert("Error", "User email not found");
      return;
    }

    setIsProcessing(true);
    setPaymentStep("processing");

    try {
      // Initialize payment
      const initResponse = await fetch(
        `${process.env.EXPO_PUBLIC_DOMAIN}/api/payments/initialize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.uid}`,
          },
          body: JSON.stringify({
            amount: parcel.compensation,
            email: user.email,
            metadata: {
              parcelId,
              userId: user.uid,
            },
          }),
        }
      );

      const initData = await initResponse.json();

      if (!initData.authorization_url) {
        throw new Error(initData.error || "Failed to get payment link");
      }

      // Open browser for payment
      const result = await WebBrowser.openBrowserAsync(initData.authorization_url);

      // Verify payment after browser closes
      const verifyResponse = await fetch(
        `${process.env.EXPO_PUBLIC_DOMAIN}/api/payments/verify/${initData.reference}`,
        {
          headers: {
            Authorization: `Bearer ${user.uid}`,
          },
        }
      );

      const verifyData = await verifyResponse.json();

      if (verifyData.status && verifyData.data.status === "success") {
        setPaymentStep("complete");
        // Refetch parcels to get updated status
        await refetch();
        
        setTimeout(() => {
          Alert.alert("Success", "Payment completed successfully!", [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]);
        }, 500);
      } else {
        Alert.alert(
          "Payment Pending",
          "Your payment is being processed. Please check your transaction history."
        );
        setPaymentStep("summary");
      }
    } catch (error: any) {
      Alert.alert("Payment Error", error.message || "Something went wrong");
      setPaymentStep("summary");
    } finally {
      setIsProcessing(false);
    }
  };

  const platformFee = parcel.compensation * 0.03; // 3% platform fee
  const totalAmount = parcel.compensation + platformFee;

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Spacing.lg,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
      >
        {/* Payment Method Selection */}
        <View style={{ marginHorizontal: Spacing.lg, marginBottom: Spacing.lg }}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
            Payment Method
          </ThemedText>
          <View style={{ gap: Spacing.sm }}>
            <PaymentMethodButton
              method="paystack"
              label="Card Payment"
              description="Pay online via Paystack"
              icon="credit-card"
              isSelected={paymentMethod === "paystack"}
              onPress={() => setPaymentMethod("paystack")}
            />
            <PaymentMethodButton
              method="cash"
              label="Cash on Delivery"
              description="Pay to carrier when delivered"
              icon="dollar-sign"
              isSelected={paymentMethod === "cash"}
              onPress={() => setPaymentMethod("cash")}
            />
          </View>
        </View>

        {/* Payment Summary */}
        <Card
          style={[styles.summaryCard, { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg }] as any}
        >
          <View style={styles.headerSection}>
            <Feather name="package" size={32} color={Colors.primary} />
            <View style={styles.headerText}>
              <ThemedText type="h3">{parcel.origin}</ThemedText>
              <ThemedText type="caption" style={{ marginTop: Spacing.xs }}>
                to {parcel.destination}
              </ThemedText>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Parcel Details */}
          <View style={styles.detailsSection}>
            <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
              Delivery Details
            </ThemedText>

            <View style={styles.detailRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Size
              </ThemedText>
              <ThemedText type="body">{parcel.size}</ThemedText>
            </View>

            <View style={styles.detailRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Weight
              </ThemedText>
              <ThemedText type="body">{parcel.weight || "Not specified"}</ThemedText>
            </View>

            <View style={styles.detailRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Status
              </ThemedText>
              <ThemedText type="body" style={{ color: Colors.warning }}>
                {parcel.status}
              </ThemedText>
            </View>

            {parcel.description && (
              <View style={[styles.detailRow, { alignItems: "flex-start" }]}>
                <ThemedText type="body" style={{ color: theme.textSecondary }}>
                  Description
                </ThemedText>
                <ThemedText type="body" style={{ flex: 1, textAlign: "right" }}>
                  {parcel.description}
                </ThemedText>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Price Breakdown */}
          <View style={styles.priceSection}>
            <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
              Payment Summary
            </ThemedText>

            <View style={styles.priceRow}>
              <ThemedText type="body">Compensation</ThemedText>
              <ThemedText type="body">₦{parcel.compensation.toLocaleString()}</ThemedText>
            </View>

            <View style={[styles.priceRow, { marginBottom: Spacing.md }]}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Platform Fee (3%)
              </ThemedText>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                ₦{platformFee.toLocaleString()}
              </ThemedText>
            </View>

            <View style={[styles.priceRow, styles.totalRow]}>
              <ThemedText type="h3">Total</ThemedText>
              <ThemedText type="h3" style={{ color: Colors.primary }}>
                ₦{totalAmount.toLocaleString()}
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Payment Processing State */}
        {paymentStep === "processing" && (
          <Card
            style={[styles.processingCard, { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg }] as any}
          >
            <ActivityIndicator size="large" color={Colors.primary} />
            <ThemedText
              type="body"
              style={{ textAlign: "center", marginTop: Spacing.md, color: theme.textSecondary }}
            >
              Processing your payment...
            </ThemedText>
          </Card>
        )}

        {/* Success State */}
        {paymentStep === "complete" && (
          <Card
            style={[styles.successCard, { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg }] as any}
          >
            <View style={styles.successContent}>
              <Feather name="check-circle" size={48} color={Colors.success} />
              <ThemedText type="h3" style={{ marginTop: Spacing.md, textAlign: "center" }}>
                Payment Successful
              </ThemedText>
              <ThemedText
                type="body"
                style={{
                  textAlign: "center",
                  marginTop: Spacing.sm,
                  color: theme.textSecondary,
                }}
              >
                Your payment has been processed successfully
              </ThemedText>
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Action Button */}
      {paymentStep !== "complete" && (
        <View
          style={[
            styles.footer,
            {
              paddingBottom: insets.bottom + Spacing.lg,
              paddingHorizontal: Spacing.lg,
              backgroundColor: theme.backgroundRoot,
            },
          ]}
        >
          <Button
            onPress={handlePayment}
            disabled={isProcessing}
            style={{ opacity: isProcessing ? 0.6 : 1 }}
          >
            {isProcessing ? "Processing..." : "Proceed to Payment"}
          </Button>
        </View>
      )}
    </ThemedView>
  );
}

function PaymentMethodButton({
  method,
  label,
  description,
  icon,
  isSelected,
  onPress,
}: {
  method: PaymentMethod;
  label: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  isSelected: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Pressable onPress={onPress} style={{ opacity: isSelected ? 1 : 0.7 }}>
      <Card
        style={[
          styles.methodButton,
          {
            borderWidth: isSelected ? 2 : 1,
            borderColor: isSelected ? Colors.primary : theme.border,
            backgroundColor: isSelected ? Colors.primary + "10" : theme.backgroundDefault,
          },
        ] as any}
      >
        <View style={styles.methodContent}>
          <View style={styles.methodLeft}>
            <View
              style={[
                styles.methodIcon,
                {
                  backgroundColor: isSelected ? Colors.primary + "20" : theme.border + "20",
                },
              ]}
            >
              <Feather
                name={icon as any}
                size={24}
                color={isSelected ? Colors.primary : theme.textSecondary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="h4">{label}</ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
                {description}
              </ThemedText>
            </View>
          </View>
          <View
            style={[
              styles.methodCheckbox,
              {
                borderColor: isSelected ? Colors.primary : theme.border,
                backgroundColor: isSelected ? Colors.primary : "transparent",
              },
            ]}
          >
            {isSelected && <Feather name="check" size={16} color="white" />}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  summaryCard: {
    padding: Spacing.lg,
  },
  processingCard: {
    padding: Spacing.lg,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  successCard: {
    padding: Spacing.lg,
  },
  successContent: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  headerText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  detailsSection: {
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  priceSection: {
    marginTop: Spacing.lg,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  totalRow: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: Spacing.lg,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: Spacing.lg,
  },
  methodButton: {
    padding: Spacing.md,
  },
  methodContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  methodLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  methodCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: Spacing.md,
  },
});
