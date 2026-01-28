import React from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/hooks/useCurrency";

export default function HeaderActions() {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  const balance = userProfile?.walletBalance ?? 0;
  const { currency, setCurrency } = useCurrency();

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => navigation.navigate("ProfileTab" as any, { screen: "Profile" as any })}
        accessibilityLabel={`Open profile`}
        style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.75 }]}
      >
        <ThemedText style={styles.avatarText}>{(userProfile?.name || "?").charAt(0)}</ThemedText>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate("ProfileTab" as any, { screen: "Wallet" as any })}
        onLongPress={() => {
          // allow user to select currency on long-press
          Alert.alert("Choose currency", "Select display currency:", [
            { text: "USD", onPress: () => setCurrency("USD") },
            { text: "EUR", onPress: () => setCurrency("EUR") },
            { text: "ZAR (R)", onPress: () => setCurrency("ZAR") },
            { text: "NGN (₦)", onPress: () => setCurrency("NGN"), style: "cancel" },
          ]);
        }}
        accessibilityLabel={`Open wallet, balance ${balance}`}
        style={({ pressed }) => [styles.container, pressed && { opacity: 0.75 }]}
      >
        <View style={styles.inner}>
          <Feather name="credit-card" size={20} color="#0A58FF" />
          <ThemedText style={styles.amount}>{balance ? balance.toLocaleString() : "0"}</ThemedText>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    minHeight: 44,
    justifyContent: "center",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  amount: {
    marginLeft: 8,
    fontWeight: "600",
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0A58FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  avatarText: {
    color: "white",
    fontWeight: "700",
  },
});
