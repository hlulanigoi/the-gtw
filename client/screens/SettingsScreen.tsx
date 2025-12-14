import React from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: () => {} },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirm Deletion",
              "All your data will be permanently deleted.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Delete Forever", style: "destructive", onPress: () => {} },
              ]
            );
          },
        },
      ]
    );
  };

  const settingsGroups = [
    {
      title: "Account",
      items: [
        { label: "Edit Profile", icon: "edit-2" as const, onPress: () => {} },
        {
          label: "Change Password",
          icon: "lock" as const,
          onPress: () => {},
        },
        {
          label: "Phone Number",
          icon: "phone" as const,
          onPress: () => {},
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          label: "Notifications",
          icon: "bell" as const,
          onPress: () => {},
        },
        { label: "Privacy", icon: "shield" as const, onPress: () => {} },
        { label: "Language", icon: "globe" as const, value: "English" },
      ],
    },
    {
      title: "Support",
      items: [
        {
          label: "Help Center",
          icon: "help-circle" as const,
          onPress: () => {},
        },
        {
          label: "Terms of Service",
          icon: "file-text" as const,
          onPress: () => {},
        },
        {
          label: "Privacy Policy",
          icon: "shield" as const,
          onPress: () => {},
        },
      ],
    },
  ];

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      {settingsGroups.map((group, groupIndex) => (
        <View key={groupIndex} style={styles.settingsGroup}>
          <ThemedText
            type="small"
            style={[styles.groupTitle, { color: theme.textSecondary }]}
          >
            {group.title}
          </ThemedText>
          <View
            style={[
              styles.groupContainer,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            {group.items.map((item, itemIndex) => (
              <Pressable
                key={itemIndex}
                onPress={item.onPress}
                style={({ pressed }) => [
                  styles.settingsItem,
                  itemIndex !== group.items.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  },
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View style={styles.settingsItemLeft}>
                  <Feather name={item.icon} size={20} color={theme.text} />
                  <ThemedText type="body" style={styles.settingsItemLabel}>
                    {item.label}
                  </ThemedText>
                </View>
                <View style={styles.settingsItemRight}>
                  {"value" in item && item.value ? (
                    <ThemedText
                      type="small"
                      style={{ color: theme.textSecondary }}
                    >
                      {item.value}
                    </ThemedText>
                  ) : null}
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={theme.textSecondary}
                  />
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.dangerZone}>
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.dangerButton,
            { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="log-out" size={20} color={Colors.error} />
          <ThemedText type="body" style={{ color: Colors.error }}>
            Log Out
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={handleDeleteAccount}
          style={({ pressed }) => [
            styles.dangerButton,
            { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="trash-2" size={20} color={Colors.error} />
          <ThemedText type="body" style={{ color: Colors.error }}>
            Delete Account
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.versionContainer}>
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          The GTW v1.0.0
        </ThemedText>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingsGroup: {
    marginBottom: Spacing.xl,
  },
  groupTitle: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  groupContainer: {
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  settingsItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  settingsItemLabel: {
    marginLeft: Spacing.sm,
  },
  settingsItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  dangerZone: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  versionContainer: {
    alignItems: "center",
    marginTop: Spacing["2xl"],
  },
});
