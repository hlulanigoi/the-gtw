import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert, ActivityIndicator, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";

import { useAuth } from "@/contexts/AuthContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Card } from "@/components/Card";

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Validation Error", "All fields are required");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Validation Error", "New password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Validation Error", "New passwords do not match");
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert("Validation Error", "New password must be different from current password");
      return;
    }

    try {
      setIsChanging(true);
      await changePassword(currentPassword, newPassword);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        "Success",
        "Your password has been changed successfully",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      let errorMessage = "Failed to change password";
      
      if (error.code === "auth/wrong-password") {
        errorMessage = "Current password is incorrect";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "New password is too weak";
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage = "Please log out and log back in before changing your password";
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setIsChanging(false);
    }
  };

  const PasswordInput = ({
    label,
    value,
    onChangeText,
    show,
    onToggleShow,
    testId,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    show: boolean;
    onToggleShow: () => void;
    testId: string;
  }) => (
    <View style={styles.inputGroup}>
      <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
      <Pressable
        style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
        onPress={() => {
          Alert.prompt(
            label,
            "Enter password",
            [
              { text: "Cancel", style: "cancel" },
              { text: "OK", onPress: (text) => text !== undefined && onChangeText(text) }
            ],
            show ? "plain-text" : "secure-text",
            value
          );
        }}
      >
        <ThemedText type="body" style={{ flex: 1 }} data-testid={testId}>
          {value ? "●".repeat(value.length) : "Enter password"}
        </ThemedText>
        <Pressable onPress={onToggleShow}>
          <Feather name={show ? "eye-off" : "eye"} size={20} color={theme.textSecondary} />
        </Pressable>
      </Pressable>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: Colors.primary + "20" }]}>
          <Feather name="lock" size={32} color={Colors.primary} />
        </View>
        <ThemedText type="h3" style={{ marginTop: Spacing.md }}>
          Change Password
        </ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.xs, textAlign: "center" }}>
          Make sure your new password is strong and secure
        </ThemedText>
      </View>

      <Card elevation={1} style={styles.formCard}>
        <PasswordInput
          label="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          show={showCurrentPassword}
          onToggleShow={() => setShowCurrentPassword(!showCurrentPassword)}
          testId="change-password-current-input"
        />

        <PasswordInput
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          show={showNewPassword}
          onToggleShow={() => setShowNewPassword(!showNewPassword)}
          testId="change-password-new-input"
        />

        <PasswordInput
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          show={showConfirmPassword}
          onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
          testId="change-password-confirm-input"
        />

        <View style={styles.requirements}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Password requirements:
          </ThemedText>
          <View style={styles.requirementItem}>
            <Feather 
              name={newPassword.length >= 6 ? "check-circle" : "circle"} 
              size={14} 
              color={newPassword.length >= 6 ? Colors.success : theme.textSecondary} 
            />
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
              At least 6 characters
            </ThemedText>
          </View>
          <View style={styles.requirementItem}>
            <Feather 
              name={newPassword === confirmPassword && newPassword ? "check-circle" : "circle"} 
              size={14} 
              color={newPassword === confirmPassword && newPassword ? Colors.success : theme.textSecondary} 
            />
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
              Passwords match
            </ThemedText>
          </View>
        </View>
      </Card>

      <Pressable
        style={[
          styles.changeButton,
          { backgroundColor: Colors.primary },
          isChanging && styles.changeButtonDisabled
        ]}
        onPress={handleChangePassword}
        disabled={isChanging}
        data-testid="change-password-submit-button"
      >
        {isChanging ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Feather name="shield" size={20} color="#FFFFFF" />
            <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
              Change Password
            </ThemedText>
          </>
        )}
      </Pressable>

      <Pressable
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
        disabled={isChanging}
      >
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          Cancel
        </ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  formCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.xs,
    fontWeight: "600",
    textTransform: "uppercase",
    fontSize: 12,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    minHeight: 48,
    gap: Spacing.sm,
  },
  requirements: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: BorderRadius.sm,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    minHeight: 52,
  },
  changeButtonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    alignItems: "center",
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
});
