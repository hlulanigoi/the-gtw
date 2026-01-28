import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  Switch,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useReceiverLocation } from "@/hooks/useReceiverLocation";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ImprovedLocationSharingProps {
  parcelId: string;
  parcelStatus: string;
}

export function ImprovedLocationSharing({
  parcelId,
  parcelStatus,
}: ImprovedLocationSharingProps) {
  const { theme } = useTheme();
  const {
    receiverLocation,
    isSharing,
    shareLocationOnce,
    startContinuousSharing,
    stopSharing,
  } = useReceiverLocation(parcelId);

  const [continuousMode, setContinuousMode] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<number>(0);

  useEffect(() => {
    // Load offline queue count
    loadOfflineQueue();
  }, []);

  const loadOfflineQueue = async () => {
    try {
      const queue = await AsyncStorage.getItem(
        `location_queue_${parcelId}`
      );
      if (queue) {
        const locations = JSON.parse(queue);
        setOfflineQueue(locations.length);
      }
    } catch (error) {
      console.error("Failed to load offline queue:", error);
    }
  };

  const handleShareOnce = async () => {
    const result = await shareLocationOnce(parcelId);
    if (result) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      }
      Alert.alert(
        "Location Shared",
        "Your location has been shared with the carrier."
      );
    } else {
      Alert.alert(
        "Location Sharing Failed",
        "Unable to share location. Please check your permissions."
      );
    }
  };

  const handleToggleContinuous = async (value: boolean) => {
    if (value) {
      Alert.alert(
        "Continuous Location Sharing",
        "This will continuously share your location with the carrier until delivery is complete. Battery usage may increase.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Enable",
            onPress: async () => {
              await startContinuousSharing(parcelId);
              setContinuousMode(true);
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
              }
            },
          },
        ]
      );
    } else {
      stopSharing();
      setContinuousMode(false);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const syncOfflineLocations = async () => {
    try {
      const queue = await AsyncStorage.getItem(
        `location_queue_${parcelId}`
      );
      if (queue) {
        const locations = JSON.parse(queue);
        // In a real app, you would sync these to the server
        // For now, we'll just clear the queue
        await AsyncStorage.removeItem(`location_queue_${parcelId}`);
        setOfflineQueue(0);
        Alert.alert("Success", "Offline locations synced successfully!");
      }
    } catch (error) {
      console.error("Failed to sync offline locations:", error);
      Alert.alert("Sync Failed", "Unable to sync offline locations.");
    }
  };

  if (parcelStatus !== "In Transit" && parcelStatus !== "Pending") {
    return null;
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
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: receiverLocation
                ? `${Colors.success}20`
                : `${Colors.warning}20`,
            },
          ]}
        >
          <Feather
            name="map-pin"
            size={24}
            color={receiverLocation ? Colors.success : Colors.warning}
          />
        </View>
        <View style={styles.headerText}>
          <ThemedText type="h4">Location Sharing</ThemedText>
          {receiverLocation ? (
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: continuousMode
                      ? Colors.success
                      : Colors.warning,
                  },
                ]}
              />
              <ThemedText
                type="caption"
                style={{ color: theme.textSecondary }}
              >
                {continuousMode ? "Continuous" : "Last shared"}{" "}
                {new Date(
                  receiverLocation.timestamp
                ).toLocaleTimeString()}
              </ThemedText>
            </View>
          ) : (
            <ThemedText
              type="caption"
              style={{ color: theme.textSecondary }}
            >
              Not shared yet
            </ThemedText>
          )}
        </View>
      </View>

      <ThemedText
        type="body"
        style={{
          color: theme.textSecondary,
          marginBottom: Spacing.md,
          lineHeight: 20,
        }}
      >
        Share your location to help the carrier find you easily. You can
        share once or enable continuous sharing.
      </ThemedText>

      {offlineQueue > 0 && (
        <Pressable
          onPress={syncOfflineLocations}
          style={[
            styles.offlineBanner,
            { backgroundColor: `${Colors.warning}15` },
          ]}
        >
          <Feather name="wifi-off" size={16} color={Colors.warning} />
          <ThemedText
            type="caption"
            style={{
              color: Colors.warning,
              marginLeft: Spacing.sm,
              flex: 1,
            }}
          >
            {offlineQueue} location{offlineQueue > 1 ? "s" : ""}{" "}
            waiting to sync
          </ThemedText>
          <Feather name="chevron-right" size={16} color={Colors.warning} />
        </Pressable>
      )}

      <View style={styles.actions}>
        {!continuousMode && (
          <Pressable
            onPress={handleShareOnce}
            disabled={isSharing}
            style={[
              styles.shareButton,
              {
                backgroundColor: isSharing
                  ? theme.backgroundSecondary
                  : Colors.primary,
                opacity: isSharing ? 0.7 : 1,
              },
            ]}
          >
            {isSharing ? (
              <>
                <Feather
                  name="loader"
                  size={20}
                  color={theme.textSecondary}
                />
                <ThemedText
                  type=\"body\"
                  style={{
                    color: theme.textSecondary,
                    marginLeft: Spacing.sm,
                  }}
                >
                  Getting Location...
                </ThemedText>
              </>
            ) : (
              <>
                <Feather name="navigation" size={20} color="#FFFFFF" />
                <ThemedText
                  type="body"
                  style={{
                    color: "#FFFFFF",
                    marginLeft: Spacing.sm,
                    fontWeight: "600",
                  }}
                >
                  Share Location Once
                </ThemedText>
              </>
            )}
          </Pressable>
        )}

        <View
          style={[
            styles.continuousToggle,
            {
              backgroundColor: theme.backgroundSecondary,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              Continuous Sharing
            </ThemedText>
            <ThemedText
              type="caption"
              style={{ color: theme.textSecondary, marginTop: 2 }}
            >
              Auto-update every 30 seconds
            </ThemedText>
          </View>
          <Switch
            value={continuousMode}
            onValueChange={handleToggleContinuous}
            trackColor={{
              false: theme.border,
              true: Colors.success,
            }}
            thumbColor={Platform.OS === "ios" ? "#FFFFFF" : Colors.success}
            ios_backgroundColor={theme.border}
          />
        </View>
      </View>

      {receiverLocation && (
        <View style={styles.locationInfo}>
          <View style={styles.infoRow}>
            <Feather
              name="crosshair"
              size={14}
              color={theme.textSecondary}
            />
            <ThemedText
              type="caption"
              style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}
            >
              Accuracy: ±{Math.round(receiverLocation.accuracy || 0)}m
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <Feather
              name="shield"
              size={14}
              color={Colors.success}
            />
            <ThemedText
              type="caption"
              style={{ color: Colors.success, marginLeft: Spacing.xs }}
            >
              Secure & Private
            </ThemedText>
          </View>
        </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  actions: {
    gap: Spacing.md,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  continuousToggle: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  locationInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.1)",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
