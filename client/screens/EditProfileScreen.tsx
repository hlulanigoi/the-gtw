import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert, ActivityIndicator, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";

import { useAuth } from "@/contexts/AuthContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Card } from "@/components/Card";

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { userProfile, updateUserProfile } = useAuth();

  const [name, setName] = useState(userProfile?.name || "");
  const [phone, setPhone] = useState(userProfile?.phone || "");
  const [photoUri, setPhotoUri] = useState(userProfile?.photoUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant photo library access to change your profile picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images" as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to pick image: " + error.message);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant camera access to take a photo.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to take photo: " + error.message);
    }
  };

  const handlePhotoOptions = () => {
    Alert.alert(
      "Profile Photo",
      "Choose an option",
      [
        { text: "Take Photo", onPress: handleTakePhoto },
        { text: "Choose from Library", onPress: handlePickImage },
        ...(photoUri ? [{ text: "Remove Photo", style: "destructive" as const, onPress: () => setPhotoUri("") }] : []),
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Name is required");
      return;
    }

    if (phone && !/^\+?[\d\s\-()]+$/.test(phone)) {
      Alert.alert("Validation Error", "Please enter a valid phone number");
      return;
    }

    try {
      setIsSaving(true);
      
      const updates: any = {
        name: name.trim(),
        phone: phone.trim() || null,
      };

      // If photo changed, include it
      if (photoUri !== userProfile?.photoUrl) {
        updates.photoUrl = photoUri || null;
      }

      await updateUserProfile(updates);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert("Success", "Profile updated successfully", [
        { text: "OK" }
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      <View style={styles.avatarSection}>
        <Pressable 
          onPress={handlePhotoOptions} 
          style={styles.avatarContainer}
          data-testid="edit-profile-avatar-button"
        >
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: Colors.primary }]}>
              <ThemedText type="h1" style={{ color: "#FFFFFF" }}>
                {(name || "U").substring(0, 2).toUpperCase()}
              </ThemedText>
            </View>
          )}
          <View style={[styles.editBadge, { backgroundColor: Colors.primary }]}>
            <Feather name="camera" size={16} color="#FFFFFF" />
          </View>
        </Pressable>
        <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
          Tap to change photo
        </ThemedText>
      </View>

      <Card elevation={1} style={styles.formCard}>
        <View style={styles.inputGroup}>
          <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
            Full Name *
          </ThemedText>
          <Pressable
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
            onPress={() => {
              // Focus on text input
              Alert.prompt(
                "Full Name",
                "Enter your full name",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Save", onPress: (text) => text && setName(text) }
                ],
                "plain-text",
                name
              );
            }}
          >
            <ThemedText type="body" data-testid="edit-profile-name-input">
              {name || "Enter your name"}
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
            Email
          </ThemedText>
          <View style={[styles.input, styles.disabledInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              {userProfile?.email || ""}
            </ThemedText>
            <Feather name="lock" size={16} color={theme.textSecondary} />
          </View>
          <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
            Email cannot be changed
          </ThemedText>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
            Phone Number
          </ThemedText>
          <Pressable
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
            onPress={() => {
              Alert.prompt(
                "Phone Number",
                "Enter your phone number",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Save", onPress: (text) => text !== undefined && setPhone(text) }
                ],
                "plain-text",
                phone
              );
            }}
          >
            <ThemedText type="body" data-testid="edit-profile-phone-input">
              {phone || "Enter phone number"}
            </ThemedText>
          </Pressable>
        </View>
      </Card>

      <Pressable
        style={[
          styles.saveButton,
          { backgroundColor: Colors.primary },
          isSaving && styles.saveButtonDisabled
        ]}
        onPress={handleSave}
        disabled={isSaving}
        data-testid="edit-profile-save-button"
      >
        {isSaving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Feather name="check" size={20} color="#FFFFFF" />
            <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
              Save Changes
            </ThemedText>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
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
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: "center",
  },
  disabledInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    minHeight: 52,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
});
