import React from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { MyRoutesStackParamList } from "@/navigation/MyRoutesStackNavigator";
import { useRoutes, useMatchingParcels, MatchingParcel } from "@/hooks/useRoutes";

type RouteDetailRouteProp = RouteProp<MyRoutesStackParamList, "RouteDetail">;
type NavigationProp = NativeStackNavigationProp<MyRoutesStackParamList>;

export default function RouteDetailScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const routeProp = useRoute<RouteDetailRouteProp>();
  const { routeId } = routeProp.params;
  const { routes, cancelRoute, deleteRoute } = useRoutes();
  const { matchingParcels, isLoading: matchingLoading } = useMatchingParcels(routeId);

  const route = routes.find((r) => r.id === routeId);

  if (!route) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      >
        <View style={styles.emptyContainer}>
          <Feather name="alert-circle" size={48} color={theme.textSecondary} />
          <ThemedText type="h3" style={styles.emptyTitle}>
            Route not found
          </ThemedText>
        </View>
      </View>
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const frequencyLabels: Record<string, string> = {
    one_time: "One-time trip",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
  };

  const statusColors: Record<string, string> = {
    Active: Colors.success,
    Completed: Colors.primary,
    Expired: Colors.warning,
    Cancelled: Colors.error,
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Route",
      "Are you sure you want to cancel this route?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            await cancelRoute(routeId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Route",
      "Are you sure you want to permanently delete this route?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Delete",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            await deleteRoute(routeId);
            navigation.goBack();
          },
        },
      ]
    );
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
          type="body"
          style={{ color: statusColors[route.status], fontWeight: "600" }}
        >
          {route.status}
        </ThemedText>
      </View>

      <View style={styles.routeHeader}>
        <View style={styles.routePoint}>
          <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
          <View style={styles.routeTextContainer}>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              From
            </ThemedText>
            <ThemedText type="h3">{route.origin}</ThemedText>
          </View>
        </View>
        <View style={styles.routeLine}>
          <Feather name="arrow-down" size={20} color={theme.textSecondary} />
        </View>
        <View style={styles.routePoint}>
          <View style={[styles.dot, { backgroundColor: Colors.secondary }]} />
          <View style={styles.routeTextContainer}>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              To
            </ThemedText>
            <ThemedText type="h3">{route.destination}</ThemedText>
          </View>
        </View>
      </View>

      {route.intermediateStops && route.intermediateStops.length > 0 ? (
        <View
          style={[styles.card, { backgroundColor: theme.backgroundDefault }]}
        >
          <View style={styles.cardHeader}>
            <Feather name="map" size={18} color={Colors.primary} />
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              Stops Along the Way
            </ThemedText>
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {route.intermediateStops.join(" \u2192 ")}
          </ThemedText>
        </View>
      ) : null}

      <View
        style={[styles.card, { backgroundColor: theme.backgroundDefault }]}
      >
        <View style={styles.cardHeader}>
          <Feather name="calendar" size={18} color={Colors.primary} />
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            Schedule
          </ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Departure
          </ThemedText>
          <ThemedText type="body">{formatDate(route.departureDate)}</ThemedText>
        </View>
        {route.departureTime ? (
          <View style={styles.detailRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Time
            </ThemedText>
            <ThemedText type="body">{route.departureTime}</ThemedText>
          </View>
        ) : null}
        <View style={styles.detailRow}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Frequency
          </ThemedText>
          <ThemedText type="body">
            {frequencyLabels[route.frequency]}
          </ThemedText>
        </View>
      </View>

      <View
        style={[styles.card, { backgroundColor: theme.backgroundDefault }]}
      >
        <View style={styles.cardHeader}>
          <Feather name="truck" size={18} color={Colors.primary} />
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            Capacity
          </ThemedText>
        </View>
        {route.maxParcelSize ? (
          <View style={styles.detailRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Max Size
            </ThemedText>
            <ThemedText type="body">
              {route.maxParcelSize.charAt(0).toUpperCase() +
                route.maxParcelSize.slice(1)}
            </ThemedText>
          </View>
        ) : null}
        {route.maxWeight ? (
          <View style={styles.detailRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Max Weight
            </ThemedText>
            <ThemedText type="body">{route.maxWeight} kg</ThemedText>
          </View>
        ) : null}
        {route.availableCapacity ? (
          <View style={styles.detailRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Available Spots
            </ThemedText>
            <ThemedText type="body">{route.availableCapacity}</ThemedText>
          </View>
        ) : null}
        {route.pricePerKg ? (
          <View style={styles.detailRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Price per kg
            </ThemedText>
            <ThemedText type="body" style={{ color: Colors.primary }}>
              R{route.pricePerKg}
            </ThemedText>
          </View>
        ) : null}
      </View>

      {route.notes ? (
        <View
          style={[styles.card, { backgroundColor: theme.backgroundDefault }]}
        >
          <View style={styles.cardHeader}>
            <Feather name="file-text" size={18} color={Colors.primary} />
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              Notes
            </ThemedText>
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {route.notes}
          </ThemedText>
        </View>
      ) : null}

      {route.isOwner && route.status === "Active" ? (
        <View
          style={[styles.card, { backgroundColor: theme.backgroundDefault }]}
        >
          <View style={styles.cardHeader}>
            <Feather name="package" size={18} color={Colors.success} />
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              Matching Parcels
            </ThemedText>
            {matchingParcels.length > 0 ? (
              <View style={[styles.badge, { backgroundColor: Colors.success }]}>
                <ThemedText type="caption" style={{ color: "#FFFFFF" }}>
                  {matchingParcels.length}
                </ThemedText>
              </View>
            ) : null}
          </View>
          {matchingLoading ? (
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Finding matching parcels...
            </ThemedText>
          ) : matchingParcels.length === 0 ? (
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              No matching parcels found for this route yet. Check back later!
            </ThemedText>
          ) : (
            <View style={styles.matchingParcelsContainer}>
              {matchingParcels.map((parcel: MatchingParcel) => (
                <View
                  key={parcel.id}
                  style={[
                    styles.matchingParcelCard,
                    { backgroundColor: theme.backgroundRoot },
                  ]}
                >
                  <View style={styles.matchingParcelHeader}>
                    <View style={styles.matchingParcelRoute}>
                      <Feather name="map-pin" size={14} color={Colors.primary} />
                      <ThemedText type="small" numberOfLines={1}>
                        {parcel.origin}
                      </ThemedText>
                      <Feather
                        name="arrow-right"
                        size={12}
                        color={theme.textSecondary}
                      />
                      <Feather
                        name="navigation"
                        size={14}
                        color={Colors.secondary}
                      />
                      <ThemedText type="small" numberOfLines={1}>
                        {parcel.destination}
                      </ThemedText>
                    </View>
                    <View
                      style={[
                        styles.matchScoreBadge,
                        {
                          backgroundColor:
                            parcel.matchScore >= 80
                              ? Colors.success + "20"
                              : parcel.matchScore >= 60
                              ? Colors.warning + "20"
                              : Colors.primary + "20",
                        },
                      ]}
                    >
                      <ThemedText
                        type="caption"
                        style={{
                          color:
                            parcel.matchScore >= 80
                              ? Colors.success
                              : parcel.matchScore >= 60
                              ? Colors.warning
                              : Colors.primary,
                          fontWeight: "600",
                        }}
                      >
                        {parcel.matchScore}% match
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.matchingParcelDetails}>
                    <View style={styles.matchingParcelInfo}>
                      <Feather name="box" size={12} color={theme.textSecondary} />
                      <ThemedText
                        type="caption"
                        style={{ color: theme.textSecondary }}
                      >
                        {parcel.size}
                        {parcel.weight ? ` - ${parcel.weight}kg` : ""}
                      </ThemedText>
                    </View>
                    <ThemedText type="body" style={{ color: Colors.primary }}>
                      R{parcel.compensation}
                    </ThemedText>
                  </View>
                  <View style={styles.matchingParcelFooter}>
                    <ThemedText
                      type="caption"
                      style={{ color: theme.textSecondary }}
                    >
                      From {parcel.senderName}
                      {parcel.senderRating ? ` (${parcel.senderRating}/5)` : ""}
                    </ThemedText>
                    <ThemedText
                      type="caption"
                      style={{ color: theme.textSecondary }}
                    >
                      {parcel.pickupDate.toLocaleDateString("en-ZA")}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : null}

      {route.isOwner && route.status === "Active" ? (
        <View style={styles.buttonContainer}>
          <Button onPress={handleCancel} style={styles.button}>
            Cancel Route
          </Button>
          <Button onPress={handleDelete} style={styles.deleteButton}>
            Delete Route
          </Button>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["4xl"],
  },
  emptyTitle: {
    marginTop: Spacing.lg,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeHeader: {
    marginBottom: Spacing.xl,
  },
  routePoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeTextContainer: {
    flex: 1,
  },
  routeLine: {
    marginLeft: 4,
    paddingVertical: Spacing.sm,
  },
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  buttonContainer: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  button: {},
  deleteButton: {
    backgroundColor: Colors.error,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: "auto",
  },
  matchingParcelsContainer: {
    gap: Spacing.sm,
  },
  matchingParcelCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  matchingParcelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  matchingParcelRoute: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flex: 1,
    flexWrap: "wrap",
  },
  matchScoreBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  matchingParcelDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  matchingParcelInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  matchingParcelFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
