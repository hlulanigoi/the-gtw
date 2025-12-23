import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
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

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const route = useRoute<RouteType>();
  const navigation = useNavigation();
  const { parcelId } = route.params;
  const { parcels, refetch } = useParcels();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
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
        {/* Payment Summary */}
        <Card
          style={[
            styles.summaryCard,
            { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
          ]}
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
            style={[
              styles.processingCard,
              { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
            ]}
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
            style={[
              styles.successCard,
              { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
            ]}
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
});
