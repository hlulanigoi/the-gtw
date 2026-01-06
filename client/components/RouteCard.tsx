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
import { Route } from "@/hooks/useRoutes";

interface RouteCardProps {
  route: Route;
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

export function RouteCard({ route, onPress }: RouteCardProps) {
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

  const statusColors: Record<string, string> = {
    Active: Colors.success,
    Completed: Colors.primary,
    Expired: Colors.warning,
    Cancelled: Colors.error,
  };

  const frequencyLabels: Record<string, string> = {
    one_time: "One-time",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
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
            <View
              style={[styles.routeDot, { backgroundColor: Colors.primary }]}
            />
            <ThemedText
              type="body"
              style={{ fontWeight: "600" }}
              numberOfLines={1}
            >
              {route.origin}
            </ThemedText>
          </View>
          <View style={styles.routeArrow}>
            <Feather name="arrow-down" size={14} color={theme.textSecondary} />
          </View>
          <View style={styles.routeRow}>
            <View
              style={[styles.routeDot, { backgroundColor: Colors.secondary }]}
            />
            <ThemedText
              type="body"
              style={{ fontWeight: "600" }}
              numberOfLines={1}
            >
              {route.destination}
            </ThemedText>
          </View>
        </View>
        {route.pricePerKg ? (
          <View style={styles.priceContainer}>
            <ThemedText type="h3" style={{ color: Colors.primary }}>
              R{route.pricePerKg}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              /kg
            </ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Feather name="calendar" size={14} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {formatDate(route.departureDate)}
          </ThemedText>
        </View>

        {route.departureTime ? (
          <View style={styles.detailItem}>
            <Feather name="clock" size={14} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {route.departureTime}
            </ThemedText>
          </View>
        ) : null}

        {route.frequency !== "one_time" ? (
          <View style={styles.detailItem}>
            <Feather name="repeat" size={14} color={Colors.primary} />
            <ThemedText type="small" style={{ color: Colors.primary, fontWeight: "500" }}>
              {frequencyLabels[route.frequency]}
            </ThemedText>
          </View>
        ) : null}

        {route.recurrenceEndDate ? (
          <View style={styles.detailItem}>
            <Feather name="calendar" size={14} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Until {new Date(route.recurrenceEndDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
            </ThemedText>
          </View>
        ) : null}

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColors[route.status] + "20" },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: statusColors[route.status] },
            ]}
          />
          <ThemedText
            type="caption"
            style={{ color: statusColors[route.status], fontWeight: "600" }}
          >
            {route.status}
          </ThemedText>
        </View>
      </View>

      {route.maxParcelSize || route.maxWeight || route.availableCapacity ? (
        <View style={styles.capacityContainer}>
          {route.maxParcelSize ? (
            <View style={styles.detailItem}>
              <Feather name="package" size={12} color={theme.textSecondary} />
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Max: {route.maxParcelSize}
              </ThemedText>
            </View>
          ) : null}
          {route.maxWeight ? (
            <View style={styles.detailItem}>
              <Feather name="box" size={12} color={theme.textSecondary} />
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {route.maxWeight}kg
              </ThemedText>
            </View>
          ) : null}
          {route.availableCapacity ? (
            <View style={styles.detailItem}>
              <Feather name="truck" size={12} color={theme.textSecondary} />
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {route.capacityUsed || 0}/{route.availableCapacity} spots
              </ThemedText>
            </View>
          ) : null}
        </View>
      ) : null}

      {route.intermediateStops && route.intermediateStops.length > 0 ? (
        <View style={styles.stopsContainer}>
          <Feather name="map" size={12} color={theme.textSecondary} />
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Via: {route.intermediateStops.join(", ")}
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.footer}>
        <View style={styles.carrierInfo}>
          <View
            style={[
              styles.carrierAvatar,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <ThemedText type="caption" style={{ fontWeight: "600" }}>
              {route.carrierName.charAt(0)}
            </ThemedText>
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {route.carrierName}
          </ThemedText>
          {route.carrierRating ? (
            <View style={styles.ratingContainer}>
              <Feather name="star" size={12} color={Colors.warning} />
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {route.carrierRating}
              </ThemedText>
            </View>
          ) : null}
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
    flexDirection: "row",
    alignSelf: "flex-start",
  },
  details: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
    flexWrap: "wrap",
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
  capacityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
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
  carrierInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  carrierAvatar: {
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
