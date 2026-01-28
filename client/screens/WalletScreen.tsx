import React from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/hooks/useCurrency";
import { useTheme } from "@/hooks/useTheme";
import { formatCurrency, CURRENCY_NAMES } from "@/lib/currency";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { userProfile } = useAuth();
  const { currency } = useCurrency();
  const navigation = useNavigation<NavigationProp>();

  const balance = (userProfile?.walletBalance || 0) / 100;

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        {/* Balance Card */}
        <Card
          style={[
            styles.balanceCard,
            { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
          ] as any}
          data-testid="wallet-balance-card"
        >
          <View style={styles.balanceHeader}>
            <Feather name="credit-card" size={32} color={Colors.primary} />
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
              Available Balance
            </ThemedText>
          </View>
          <ThemedText
            type="h1"
            style={{ fontSize: 48, marginTop: Spacing.md, color: Colors.primary }}
            data-testid="wallet-balance-amount"
          >
            {formatCurrency(balance, currency)}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
            {CURRENCY_NAMES[currency]}
          </ThemedText>
        </Card>

        {/* Action Buttons */}
        <View style={{ marginHorizontal: Spacing.lg, gap: Spacing.md }}>
          <Button
            onPress={() => navigation.navigate("TopUp" as any)}
            data-testid="topup-button"
          >
            <View style={styles.buttonContent}>
              <Feather name="plus-circle" size={20} color="white" />
              <ThemedText style={{ color: "white", marginLeft: Spacing.sm, fontWeight: "600" }}>
                Top Up Wallet
              </ThemedText>
            </View>
          </Button>

          <Pressable
            onPress={() => navigation.navigate("WalletTransactions" as any)}
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                backgroundColor: theme.backgroundSecondary,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            data-testid="transactions-button"
          >
            <View style={styles.buttonContent}>
              <Feather name="list" size={20} color={Colors.primary} />
              <ThemedText style={{ color: Colors.primary, marginLeft: Spacing.sm, fontWeight: "600" }}>
                View Transactions
              </ThemedText>
            </View>
          </Pressable>
        </View>

        {/* Info Section */}
        <Card
          style={[
            styles.infoCard,
            { marginHorizontal: Spacing.lg, marginTop: Spacing.xl },
          ] as any}
        >
          <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
            About Your Wallet
          </ThemedText>
          <View style={styles.infoItem}>
            <Feather name="shield" size={16} color={Colors.primary} />
            <ThemedText type="small" style={{ color: theme.textSecondary, flex: 1, marginLeft: Spacing.sm }}>
              Your wallet balance is secure and can be used for parcel payments
            </ThemedText>
          </View>
          <View style={styles.infoItem}>
            <Feather name="zap" size={16} color={Colors.primary} />
            <ThemedText type="small" style={{ color: theme.textSecondary, flex: 1, marginLeft: Spacing.sm }}>
              Instant top-ups via secure payment gateway
            </ThemedText>
          </View>
          <View style={styles.infoItem}>
            <Feather name="globe" size={16} color={Colors.primary} />
            <ThemedText type="small" style={{ color: theme.textSecondary, flex: 1, marginLeft: Spacing.sm }}>
              Multi-currency support: USD, EUR, GBP, ZAR
            </ThemedText>
          </View>
        </Card>
      </ScrollView>
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
  balanceHeader: {
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  infoCard: {
    padding: Spacing.lg,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
});
