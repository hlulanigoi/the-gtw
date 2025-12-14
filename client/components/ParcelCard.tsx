import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { Parcel } from "@/hooks/useParcels";

interface ParcelCardProps {
  parcel: Parcel;
  onPress: () => void;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ParcelCard({ parcel, onPress }: ParcelCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const sizeIcons: Record<string, string> = {
    small: "package",
    medium: "box",
    large: "archive",
  };

  const statusColors: Record<string, string> = {
    Pending: Colors.warning,
    "In Transit": Colors.primary,
    Delivered: Colors.success,
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }
    return date.toLocaleDateString("en-ZA", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.routeContainer}>
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
            <ThemedText type="body" style={{ fontWeight: "600" }} numberOfLines={1}>
              {parcel.origin}
            </ThemedText>
          </View>
          <View style={styles.routeArrow}>
            <Feather name="arrow-down" size={14} color={theme.textSecondary} />
          </View>
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: Colors.secondary }]} />
            <ThemedText type="body" style={{ fontWeight: "600" }} numberOfLines={1}>
              {parcel.destination}
            </ThemedText>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <ThemedText type="h3" style={{ color: Colors.primary }}>
            R{parcel.compensation}
          </ThemedText>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Feather
            name={sizeIcons[parcel.size] as any}
            size={14}
            color={theme.textSecondary}
          />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {parcel.size.charAt(0).toUpperCase() + parcel.size.slice(1)}
          </ThemedText>
        </View>

        <View style={styles.detailItem}>
          <Feather name="calendar" size={14} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {formatDate(parcel.pickupDate)}
          </ThemedText>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColors[parcel.status] + "20" },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: statusColors[parcel.status] },
            ]}
          />
          <ThemedText
            type="caption"
            style={{ color: statusColors[parcel.status], fontWeight: "600" }}
          >
            {parcel.status}
          </ThemedText>
        </View>
      </View>

      {parcel.intermediateStops && parcel.intermediateStops.length > 0 ? (
        <View style={styles.stopsContainer}>
          <Feather name="map" size={12} color={theme.textSecondary} />
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Via: {parcel.intermediateStops.join(", ")}
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.footer}>
        <View style={styles.senderInfo}>
          <View
            style={[styles.senderAvatar, { backgroundColor: theme.backgroundSecondary }]}
          >
            <ThemedText type="caption" style={{ fontWeight: "600" }}>
              {parcel.senderName.charAt(0)}
            </ThemedText>
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {parcel.senderName}
          </ThemedText>
          <View style={styles.ratingContainer}>
            <Feather name="star" size={12} color={Colors.warning} />
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {parcel.senderRating}
            </ThemedText>
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  routeContainer: {
    flex: 1,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeArrow: {
    marginLeft: 2,
    paddingVertical: Spacing.xs,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  details: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stopsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  senderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  senderAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
});
