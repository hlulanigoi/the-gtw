import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/currency";

export default function WalletScreen() {
  const { userProfile } = useAuth();

  return (
    <View style={styles.container}>
      <ThemedText type="h2">Wallet</ThemedText>
      <ThemedText style={styles.balance} type="h1">
        {formatCurrency(userProfile?.walletBalance ?? 0)}
      </ThemedText>
      <Pressable style={styles.topUp} onPress={() => {}}>
        <ThemedText type="body">Top up</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  balance: { marginTop: 12, fontSize: 32 },
  topUp: { marginTop: 24, padding: 12, borderRadius: 8 },
});
