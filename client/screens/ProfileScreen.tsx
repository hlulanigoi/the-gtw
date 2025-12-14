import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const handleSettings = () => {
    navigation.navigate("Settings");
  };

  const stats = [
    { label: "Parcels Sent", value: 12, icon: "package" as const },
    { label: "Delivered", value: 8, icon: "check-circle" as const },
    { label: "Rating", value: "4.8", icon: "star" as const },
  ];

  const menuItems = [
    { label: "Edit Profile", icon: "edit-2" as const, onPress: () => {} },
    { label: "Payment Methods", icon: "credit-card" as const, onPress: () => {} },
    { label: "Transaction History", icon: "clock" as const, onPress: () => {} },
    { label: "Settings", icon: "settings" as const, onPress: handleSettings },
    { label: "Help & Support", icon: "help-circle" as const, onPress: () => {} },
  ];

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.profileHeader}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: Colors.primary },
          ]}
        >
          <ThemedText type="h1" style={{ color: "#FFFFFF" }}>
            JD
          </ThemedText>
        </View>
        <ThemedText type="h2" style={styles.userName}>
          John Doe
        </ThemedText>
        <View style={styles.ratingContainer}>
          <Feather name="star" size={16} color={Colors.warning} />
          <ThemedText type="body" style={styles.ratingText}>
            4.8 Rating
          </ThemedText>
        </View>
        <View style={styles.verifiedBadge}>
          <Feather name="check-circle" size={14} color={Colors.success} />
          <ThemedText
            type="small"
            style={[styles.verifiedText, { color: Colors.success }]}
          >
            Verified
          </ThemedText>
        </View>
      </View>

      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <Card key={index} elevation={1} style={styles.statCard}>
            <Feather name={stat.icon} size={24} color={Colors.primary} />
            <ThemedText type="h3" style={styles.statValue}>
              {stat.value}
            </ThemedText>
            <ThemedText
              type="caption"
              style={[styles.statLabel, { color: theme.textSecondary }]}
            >
              {stat.label}
            </ThemedText>
          </Card>
        ))}
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <Pressable
            key={index}
            onPress={item.onPress}
            style={({ pressed }) => [
              styles.menuItem,
              {
                backgroundColor: theme.backgroundDefault,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <View style={styles.menuItemLeft}>
              <View
                style={[
                  styles.menuIconContainer,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
              >
                <Feather name={item.icon} size={18} color={theme.text} />
              </View>
              <ThemedText type="body">{item.label}</ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>
        ))}
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  userName: {
    marginBottom: Spacing.sm,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  ratingText: {
    marginLeft: Spacing.xs,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  verifiedText: {
    marginLeft: Spacing.xs,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing["2xl"],
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  statValue: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    textAlign: "center",
  },
  menuContainer: {
    gap: Spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
