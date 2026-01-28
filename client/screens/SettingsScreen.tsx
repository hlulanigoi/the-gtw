import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { LocationPickerModal } from "@/components/LocationPickerModal";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { userProfile, updateUserProfile, signOut } = useAuth();
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  const handleEditProfile = () => {
    navigation.navigate("EditProfile");
  };

  const handleChangePassword = () => {
    navigation.navigate("ChangePassword");
  };

  const handlePhoneNumber = () => {
    Alert.prompt(
      "Phone Number",
      "Enter your phone number",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Save", 
          onPress: async (text) => {
            if (text !== undefined) {
              try {
                await updateUserProfile({ phone: text.trim() || null });
                Alert.alert("Success", "Phone number updated");
              } catch (error: any) {
                Alert.alert("Error", error.message || "Failed to update phone number");
              }
            }
          } 
        }
      ],
      "plain-text",
      userProfile?.phone || ""
    );
  };

  const handleSetLocation = (location: { name: string; fullAddress: string; lat: number; lng: number }) => {
    updateUserProfile({
      savedLocationName: location.name,
      savedLocationAddress: location.fullAddress,
      savedLocationLat: location.lat,
      savedLocationLng: location.lng,
    });
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert("Location Saved", "Your delivery location has been saved. When someone sends you a parcel, they can use this location as the destination.");
  };

  const handleClearLocation = () => {
    Alert.alert(
      "Clear Location",
      "Are you sure you want to remove your saved delivery location?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            updateUserProfile({
              savedLocationName: undefined,
              savedLocationAddress: undefined,
              savedLocationLat: undefined,
              savedLocationLng: undefined,
            });
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  const handleLocationPress = () => {
    if (userProfile?.savedLocationName) {
      Alert.alert(
        "Delivery Location",
        `Current location: ${userProfile.savedLocationName}\n\n${userProfile.savedLocationAddress || ""}`,
        [
          { text: "Keep", style: "cancel" },
          { text: "Change", onPress: () => setShowLocationPicker(true) },
          { text: "Clear", style: "destructive", onPress: handleClearLocation },
        ]
      );
    } else {
      setShowLocationPicker(true);
    }
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
        { label: "Edit Profile", icon: "edit-2" as const, onPress: handleEditProfile },
        {
          label: "Change Password",
          icon: "lock" as const,
          onPress: handleChangePassword,
        },
        {
          label: "Phone Number",
          icon: "phone" as const,
          onPress: handlePhoneNumber,
          value: userProfile?.phone || "Not set",
        },
      ],
    },
    {
      title: "Delivery",
      items: [
        {
          label: "My Delivery Location",
          icon: "map-pin" as const,
          onPress: handleLocationPress,
          value: userProfile?.savedLocationName || "Not set",
          highlight: !userProfile?.savedLocationName,
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          label: "Notifications",
          icon: "bell" as const,
          onPress: () => Alert.alert("Notifications", "Notification settings coming soon"),
        },
        { 
          label: "Privacy", 
          icon: "shield" as const, 
          onPress: () => Alert.alert("Privacy", "Privacy settings coming soon"),
        },
        { label: "Language", icon: "globe" as const, value: "English" },
      ],
    },
    {
      title: "Support",
      items: [
        {
          label: "Help Center",
          icon: "help-circle" as const,
          onPress: () => Alert.alert("Help Center", "For support, please contact: support@parcelpeer.com"),
        },
        {
          label: "Terms of Service",
          icon: "file-text" as const,
          onPress: () => Alert.alert("Terms of Service", "Terms of Service will be displayed here"),
        },
        {
          label: "Privacy Policy",
          icon: "shield" as const,
          onPress: () => Alert.alert("Privacy Policy", "Privacy Policy will be displayed here"),
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
                data-testid={`settings-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
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
                      style={{ 
                        color: "highlight" in item && item.highlight ? Colors.primary : theme.textSecondary,
                        fontWeight: "highlight" in item && item.highlight ? "600" : "normal",
                      }}
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
          data-testid="settings-logout-button"
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
          data-testid="settings-delete-account-button"
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

      <LocationPickerModal
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelectLocation={handleSetLocation}
        type="destination"
      />
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
