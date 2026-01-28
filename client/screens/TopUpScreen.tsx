import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { useCurrency } from "@/hooks/useCurrency";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/lib/query-client";
import { formatCurrency, TOPUP_AMOUNTS, CURRENCY_NAMES } from "@/lib/currency";

export default function TopUpScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { user, userProfile, refetchUserProfile } = useAuth();
  const { currency } = useCurrency();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const predefinedAmounts = TOPUP_AMOUNTS[currency] || TOPUP_AMOUNTS.USD;
  const minAmount = currency === "ZAR" ? 50 : 5;
  const maxAmount = currency === "ZAR" ? 50000 : 5000;

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (text: string) => {
    setCustomAmount(text);
    setSelectedAmount(null);
  };

  const getFinalAmount = (): number | null => {
    if (selectedAmount) return selectedAmount;
    const parsed = parseFloat(customAmount);
    if (isNaN(parsed) || parsed < minAmount || parsed > maxAmount) return null;
    return parsed;
  };

  const handleTopUp = async () => {
    const amount = getFinalAmount();
    if (!amount) {
      Alert.alert("Invalid Amount", `Please enter an amount between ${formatCurrency(minAmount, currency)} and ${formatCurrency(maxAmount, currency)}`);
      return;
    }

    if (!user?.email) {
      Alert.alert("Error", "User email not found");
      return;
    }

    setIsProcessing(true);

    try {
      const apiUrl = getApiUrl();
      const token = await user.getIdToken();

      // Initialize wallet top-up
      const initResponse = await fetch(`${apiUrl}/api/wallet/topup/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          currency,
          email: user.email,
        }),
      });

      const initData = await initResponse.json();

      if (!initData.authorization_url) {
        throw new Error(initData.error || "Failed to initialize top-up");
      }

      // Open browser for payment
      const result = await WebBrowser.openBrowserAsync(initData.authorization_url);

      // Verify payment after browser closes
      const verifyResponse = await fetch(
        `${apiUrl}/api/wallet/topup/verify/${initData.reference}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const verifyData = await verifyResponse.json();

      if (verifyData.status && verifyData.data.status === "success") {
        await refetchUserProfile();
        Alert.alert(
          "Success",
          `${formatCurrency(amount, currency)} added to your wallet!`,
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert(
          "Payment Pending",
          "Your top-up is being processed. Please check your wallet balance in a few moments."
        );
      }
    } catch (error: any) {
      console.error("Top-up error:", error);
      Alert.alert("Top-up Error", error.message || "Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  };

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
        {/* Current Balance */}
        <Card
          style={[
            styles.balanceCard,
            { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
          ] as any}
        >
          <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
            Current Balance
          </ThemedText>
          <ThemedText type="h1" style={{ color: Colors.primary }}>
            {formatCurrency((userProfile?.walletBalance || 0) / 100, currency)}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
            {CURRENCY_NAMES[currency]}
          </ThemedText>
        </Card>

        {/* Predefined Amounts */}
        <View style={{ marginHorizontal: Spacing.lg, marginBottom: Spacing.lg }}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
            Quick Amounts
          </ThemedText>
          <View style={styles.amountsGrid}>
            {predefinedAmounts.map((amount) => (
              <Pressable
                key={amount}
                onPress={() => handleAmountSelect(amount)}
                style={({ pressed }) => [
                  styles.amountButton,
                  {
                    borderColor: selectedAmount === amount ? Colors.primary : theme.border,
                    backgroundColor:
                      selectedAmount === amount
                        ? Colors.primary + "15"
                        : theme.backgroundDefault,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                data-testid={`topup-amount-${amount}`}
              >
                <ThemedText
                  type="body"
                  style={{
                    fontWeight: "600",
                    color: selectedAmount === amount ? Colors.primary : theme.text,
                  }}
                >
                  {formatCurrency(amount, currency)}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Custom Amount */}
        <View style={{ marginHorizontal: Spacing.lg, marginBottom: Spacing.lg }}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
            Or Enter Custom Amount
          </ThemedText>
          <Card style={styles.inputCard as any}>
            <View style={styles.inputContainer}>
              <ThemedText type="h3" style={{ color: theme.textSecondary }}>
                {currency === "ZAR" ? "R" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "£"}
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    borderBottomColor: theme.border,
                  },
                ]}
                placeholder={`${minAmount} - ${maxAmount}`}
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                value={customAmount}
                onChangeText={handleCustomAmountChange}
                data-testid="custom-amount-input"
              />
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
              Min: {formatCurrency(minAmount, currency)} • Max: {formatCurrency(maxAmount, currency)}
            </ThemedText>
          </Card>
        </View>

        {/* Payment Info */}
        <Card
          style={[
            styles.infoCard,
            { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
          ] as any}
        >
          <View style={styles.infoRow}>
            <Feather name="info" size={20} color={Colors.primary} />
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <ThemedText type="body" style={{ marginBottom: Spacing.xs }}>
                Secure Payment via Paystack
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                • Funds are added instantly
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                • All transactions are encrypted
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                • No hidden fees
              </ThemedText>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Action Button */}
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
          onPress={handleTopUp}
          disabled={isProcessing || !getFinalAmount()}
          style={{ opacity: isProcessing || !getFinalAmount() ? 0.6 : 1 }}
          data-testid="confirm-topup-button"
        >
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator color="white" size="small" />
              <ThemedText style={{ color: "white", marginLeft: Spacing.sm }}>Processing...</ThemedText>
            </View>
          ) : (
            `Top Up ${getFinalAmount() ? formatCurrency(getFinalAmount()!, currency) : ""}`
          )}
        </Button>
      </View>
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
  balanceCard: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  amountsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  amountButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    minWidth: 110,
    alignItems: "center",
  },
  inputCard: {
    padding: Spacing.lg,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 32,
    fontWeight: "700",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 2,
  },
  infoCard: {
    padding: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: Spacing.lg,
  },
  processingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});
