import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { BrowseStackParamList } from "@/navigation/BrowseStackNavigator";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList & BrowseStackParamList
>;

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || isProcessing) return;

    setScanned(true);
    setIsProcessing(true);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      // Try to find parcel by tracking code
      const response = await fetch(`${API_URL}/api/parcels/tracking/${encodeURIComponent(data)}`);
      
      if (response.ok) {
        const parcel = await response.json();
        
        // Navigate to parcel detail
        navigation.navigate("ParcelDetail", { parcelId: parcel.id });
      } else if (response.status === 404) {
        Alert.alert(
          "Parcel Not Found",
          `No parcel found with tracking code: ${data}`,
          [
            {
              text: "Scan Again",
              onPress: () => {
                setScanned(false);
                setIsProcessing(false);
              },
            },
            {
              text: "Cancel",
              onPress: () => navigation.goBack(),
              style: "cancel",
            },
          ]
        );
      } else {
        throw new Error("Failed to fetch parcel");
      }
    } catch (error) {
      console.error("Scan error:", error);
      Alert.alert(
        "Error",
        "Failed to look up parcel. Please try again.",
        [
          {
            text: "Scan Again",
            onPress: () => {
              setScanned(false);
              setIsProcessing(false);
            },
          },
          {
            text: "Cancel",
            onPress: () => navigation.goBack(),
            style: "cancel",
          },
        ]
      );
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={[styles.permissionContainer, { paddingTop: insets.top }]}>
          <ThemedText type="body">Requesting camera permission...</ThemedText>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={[styles.permissionContainer, { paddingTop: insets.top }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="camera-off" size={48} color={theme.textSecondary} />
          </View>
          <ThemedText type="h3" style={styles.permissionTitle}>
            Camera Access Required
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.permissionText, { color: theme.textSecondary }]}
          >
            Please enable camera access in your device settings to scan parcel codes.
          </ThemedText>
          <Pressable
            onPress={requestPermission}
            style={[styles.permissionButton, { backgroundColor: Colors.primary, marginBottom: Spacing.md }]}
          >
            <ThemedText type="body" style={{ color: "#FFFFFF" }}>
              Enable Camera
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={handleClose}
            style={[styles.permissionButton, { backgroundColor: theme.backgroundSecondary }]}
          >
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Go Back
            </ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.md,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
          },
        ]}
      >
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <Feather name="x" size={24} color="#FFFFFF" />
        </Pressable>
        <ThemedText type="body" style={{ color: "#FFFFFF", flex: 1, textAlign: "center" }}>
          Scan Parcel Code
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Scanning Frame */}
      <View style={styles.scannerContainer}>
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />
        </View>
      </View>

      {/* Instructions */}
      <View
        style={[
          styles.instructionsContainer,
          {
            paddingBottom: insets.bottom + Spacing.xl,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
          },
        ]}
      >
        <View style={styles.instructionIconContainer}>
          <Feather name="maximize" size={32} color="#FFFFFF" />
        </View>
        <ThemedText type="body" style={[styles.instructionText, { color: "#FFFFFF" }]}>
          {isProcessing
            ? "Processing scan..."
            : "Position the QR code or barcode within the frame"}
        </ThemedText>
        {scanned && !isProcessing && (
          <Pressable
            onPress={() => {
              setScanned(false);
              setIsProcessing(false);
            }}
            style={[styles.scanAgainButton, { backgroundColor: Colors.primary }]}
          >
            <Feather name="refresh-cw" size={18} color="#FFFFFF" />
            <ThemedText type="body" style={{ color: "#FFFFFF", marginLeft: Spacing.sm }}>
              Scan Again
            </ThemedText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  permissionTitle: {
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  permissionText: {
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  permissionButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scannerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#FFFFFF",
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: BorderRadius.md,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: BorderRadius.md,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: BorderRadius.md,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: BorderRadius.md,
  },
  instructionsContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  instructionIconContainer: {
    marginBottom: Spacing.md,
  },
  instructionText: {
    textAlign: "center",
    lineHeight: 22,
  },
  scanAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.lg,
  },
});
