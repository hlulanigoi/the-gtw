import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest } from "@/lib/query-client";

interface DeliveryProofUploadProps {
  parcelId: string;
  onUploadSuccess?: () => void;
}

export function DeliveryProofUpload({
  parcelId,
  onUploadSuccess,
}: DeliveryProofUploadProps) {
  const { theme } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoUploaded, setPhotoUploaded] = useState(false);

  const requestPermission = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant camera roll permissions to upload photos."
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant camera permissions to take photos."
        );
        return;
      }
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const uploadPhoto = async () => {
    if (!photoUri) return;

    setUploading(true);
    try {
      // In a real app, you would upload to a cloud storage service (S3, Cloudinary, etc.)
      // For now, we'll simulate the upload and use a placeholder URL
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const photoUrl = photoUri; // In production, this would be the cloud URL

      await apiRequest(
        "POST",
        `/api/parcels/${parcelId}/delivery-proof`,
        {
          photoUrl,
          notes: "Delivery proof uploaded by receiver",
        }
      );

      setPhotoUploaded(true);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        "Success!",
        "Delivery proof uploaded successfully. The parcel status has been updated to Delivered.",
        [
          {
            text: "OK",
            onPress: () => {
              if (onUploadSuccess) onUploadSuccess();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error uploading photo:", error);
      Alert.alert(
        "Upload Failed",
        "Failed to upload delivery proof. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  if (photoUploaded) {
    return (
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={[
          styles.successContainer,
          { backgroundColor: `${Colors.success}15` },
        ]}
      >
        <Feather name="check-circle" size={32} color={Colors.success} />
        <View style={{ marginLeft: Spacing.md }}>
          <ThemedText
            type="body"
            style={{ color: Colors.success, fontWeight: "600" }}
          >
            Delivery Proof Uploaded
          </ThemedText>
          <ThemedText type="caption" style={{ color: Colors.success }}>
            Thank you for confirming the delivery!
          </ThemedText>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: theme.border,
        },
      ]}
    >
      <ThemedText type="h4" style={{ marginBottom: Spacing.sm }}>
        Upload Delivery Proof
      </ThemedText>
      <ThemedText
        type="body"
        style={{ color: theme.textSecondary, marginBottom: Spacing.md }}
      >
        Take a photo of the received parcel to confirm delivery
      </ThemedText>

      {photoUri ? (
        <View style={styles.photoPreview}>
          <Image source={{ uri: photoUri }} style={styles.photo} />
          <Pressable
            onPress={() => setPhotoUri(null)}
            style={[
              styles.removeButton,
              { backgroundColor: Colors.error },
            ]}
          >
            <Feather name="x" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : (
        <View style={styles.photoActions}>
          <Pressable
            onPress={takePhoto}
            style={[
              styles.photoButton,
              {
                backgroundColor: theme.backgroundSecondary,
                borderColor: theme.border,
              },
            ]}
          >
            <Feather name="camera" size={24} color={Colors.primary} />
            <ThemedText
              type="body"
              style={{ color: Colors.primary, marginTop: Spacing.xs }}
            >
              Take Photo
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={pickImage}
            style={[
              styles.photoButton,
              {
                backgroundColor: theme.backgroundSecondary,
                borderColor: theme.border,
              },
            ]}
          >
            <Feather name="image" size={24} color={Colors.primary} />
            <ThemedText
              type="body"
              style={{ color: Colors.primary, marginTop: Spacing.xs }}
            >
              Choose Photo
            </ThemedText>
          </Pressable>
        </View>
      )}

      {photoUri && (
        <Pressable
          onPress={uploadPhoto}
          disabled={uploading}
          style={[
            styles.uploadButton,
            {
              backgroundColor: uploading
                ? theme.backgroundSecondary
                : Colors.success,
              opacity: uploading ? 0.7 : 1,
            },
          ]}
        >
          {uploading ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <ThemedText
                type="body"
                style={{ color: "#FFFFFF", marginLeft: Spacing.sm }}
              >
                Uploading...
              </ThemedText>
            </>
          ) : (
            <>
              <Feather name="upload" size={20} color="#FFFFFF" />
              <ThemedText
                type="body"
                style={{
                  color: "#FFFFFF",
                  marginLeft: Spacing.sm,
                  fontWeight: "600",
                }}
              >
                Upload Proof
              </ThemedText>
            </>
          )}
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  photoActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  photoButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: "dashed",
  },
  photoPreview: {
    position: "relative",
    marginBottom: Spacing.md,
  },
  photo: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.md,
  },
  removeButton: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
});
