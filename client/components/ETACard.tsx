import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useETA } from "@/hooks/useETA";

interface ETACardProps {
  parcelId: string;
  parcelStatus: string;
}

export function ETACard({ parcelId, parcelStatus }: ETACardProps) {
  const { theme } = useTheme();
  const { eta, isLoading, refetch } = useETA(
    parcelId,
    parcelStatus === "In Transit"
  );

  if (parcelStatus !== "In Transit" || !eta.available) {
    return null;
  }

  const formatETA = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getETAColor = (minutes?: number) => {
    if (!minutes) return Colors.primary;
    if (minutes < 15) return Colors.success;
    if (minutes < 45) return Colors.warning;
    return Colors.primary;
  };

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
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
            { backgroundColor: `${getETAColor(eta.etaMinutes)}20` },
          ]}
        >
          <Feather
            name="navigation"
            size={24}
            color={getETAColor(eta.etaMinutes)}
          />
        </View>
        <View style={styles.headerText}>
          <ThemedText type="h4">Carrier on the way</ThemedText>
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : eta.etaMinutes ? (
            <ThemedText
              type="caption"
              style={{ color: theme.textSecondary }}
            >
              Last updated: just now
            </ThemedText>
          ) : null}
        </View>
      </View>

      {eta.etaMinutes && (
        <View style={styles.etaInfo}>
          <View style={styles.etaItem}>
            <ThemedText
              type="body"
              style={{
                color: theme.textSecondary,
                marginBottom: Spacing.xs,
              }}
            >
              Estimated Arrival
            </ThemedText>
            <View style={styles.etaValue}>
              <Feather
                name="clock"
                size={20}
                color={getETAColor(eta.etaMinutes)}
              />
              <ThemedText
                type="h3"
                style={{
                  color: getETAColor(eta.etaMinutes),
                  marginLeft: Spacing.sm,
                }}
              >
                {formatETA(eta.etaMinutes)}
              </ThemedText>
            </View>
          </View>

          {eta.distance && (
            <View style={[styles.etaItem, styles.distanceItem]}>
              <ThemedText
                type="body"
                style={{
                  color: theme.textSecondary,
                  marginBottom: Spacing.xs,
                }}
              >
                Distance
              </ThemedText>
              <View style={styles.etaValue}>
                <Feather name="map-pin" size={20} color={Colors.primary} />
                <ThemedText
                  type="h3"
                  style={{ color: theme.text, marginLeft: Spacing.sm }}
                >
                  {eta.distance.toFixed(1)} km
                </ThemedText>
              </View>
            </View>
          )}
        </View>
      )}

      {eta.etaMinutes && eta.etaMinutes < 15 && (
        <View
          style={[
            styles.urgentBanner,
            { backgroundColor: `${Colors.success}15` },
          ]}
        >
          <Feather name="bell" size={16} color={Colors.success} />
          <ThemedText
            type="caption"
            style={{ color: Colors.success, marginLeft: Spacing.sm }}
          >
            Carrier arriving soon! Please be ready.
          </ThemedText>
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
  etaInfo: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  etaItem: {
    flex: 1,
  },
  distanceItem: {
    borderLeftWidth: 1,
    borderLeftColor: "rgba(128, 128, 128, 0.2)",
    paddingLeft: Spacing.md,
  },
  etaValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  urgentBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
});
