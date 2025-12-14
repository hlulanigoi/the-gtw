import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeOut,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ParcelCard } from "@/components/ParcelCard";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { BrowseStackParamList } from "@/navigation/BrowseStackNavigator";
import { useParcels } from "@/hooks/useParcels";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList & BrowseStackParamList
>;

type QuickFilter = {
  id: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
};

type StatCard = {
  id: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  getValue: (parcels: any[]) => number;
};

type QuickAction = {
  id: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
};

const quickFilters: QuickFilter[] = [
  { id: "today", label: "Today", icon: "clock" },
  { id: "thisWeek", label: "This Week", icon: "calendar" },
  { id: "small", label: "Small", icon: "package" },
  { id: "medium", label: "Medium", icon: "box" },
  { id: "large", label: "Large", icon: "truck" },
];

const statCards: StatCard[] = [
  {
    id: "inTransit",
    label: "In Transit",
    icon: "truck",
    color: Colors.primary,
    getValue: (parcels) => parcels.filter((p) => p.status === "In Transit").length,
  },
  {
    id: "pending",
    label: "Pending",
    icon: "clock",
    color: Colors.warning,
    getValue: (parcels) => parcels.filter((p) => p.status === "Pending").length,
  },
  {
    id: "delivered",
    label: "Delivered",
    icon: "check-circle",
    color: Colors.success,
    getValue: (parcels) => parcels.filter((p) => p.status === "Delivered").length,
  },
  {
    id: "total",
    label: "Total",
    icon: "package",
    color: "#8B5CF6",
    getValue: (parcels) => parcels.length,
  },
];

const quickActions: QuickAction[] = [
  { id: "scan", label: "Scan", icon: "camera", color: Colors.primary },
  { id: "track", label: "Track", icon: "search", color: Colors.secondary },
  { id: "send", label: "Send", icon: "send", color: Colors.success },
  { id: "history", label: "History", icon: "clock", color: "#8B5CF6" },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function BrowseScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { parcels, isLoading, refetch } = useParcels();

  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const fromInputRef = useRef<TextInput>(null);
  const swapScale = useSharedValue(1);

  const filteredParcels = useMemo(() => {
    return parcels.filter((parcel) => {
      const fromMatch = fromLocation
        ? parcel.origin.toLowerCase().includes(fromLocation.toLowerCase())
        : true;
      const toMatch = toLocation
        ? parcel.destination.toLowerCase().includes(toLocation.toLowerCase()) ||
          parcel.intermediateStops?.some((stop) =>
            stop.toLowerCase().includes(toLocation.toLowerCase())
          )
        : true;

      let dateMatch = true;
      let sizeMatch = true;

      if (activeFilters.includes("today")) {
        const today = new Date().toDateString();
        const pickupDate =
          parcel.pickupDate instanceof Date
            ? parcel.pickupDate
            : new Date(parcel.pickupDate);
        dateMatch = pickupDate.toDateString() === today;
      } else if (activeFilters.includes("thisWeek")) {
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const pickupDate =
          parcel.pickupDate instanceof Date
            ? parcel.pickupDate
            : new Date(parcel.pickupDate);
        dateMatch = pickupDate >= now && pickupDate <= weekFromNow;
      }

      if (activeFilters.includes("small")) {
        sizeMatch = parcel.size === "small";
      } else if (activeFilters.includes("medium")) {
        sizeMatch = parcel.size === "medium";
      } else if (activeFilters.includes("large")) {
        sizeMatch = parcel.size === "large";
      }

      return fromMatch && toMatch && dateMatch && sizeMatch;
    });
  }, [parcels, fromLocation, toLocation, activeFilters]);

  const recentActivity = useMemo(() => {
    return parcels
      .slice(0, 5)
      .map((parcel) => ({
        id: parcel.id,
        title: `${parcel.origin} to ${parcel.destination}`,
        status: parcel.status,
        time: parcel.createdAt ? new Date(parcel.createdAt) : new Date(),
        icon:
          parcel.status === "Delivered"
            ? "check-circle"
            : parcel.status === "In Transit"
            ? "truck"
            : "clock",
        color:
          parcel.status === "Delivered"
            ? Colors.success
            : parcel.status === "In Transit"
            ? Colors.primary
            : Colors.warning,
      }));
  }, [parcels]);

  const handleParcelPress = (parcelId: string) => {
    navigation.navigate("ParcelDetail", { parcelId });
  };

  const handleCreateParcel = () => {
    navigation.navigate("CreateParcel");
  };

  const handleFilter = () => {
    navigation.navigate("RouteFilter");
  };

  const handleQuickAction = useCallback(
    (actionId: string) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      switch (actionId) {
        case "track":
          fromInputRef.current?.focus();
          break;
        case "send":
          navigation.navigate("CreateParcel");
          break;
        case "history":
          navigation.getParent()?.navigate("MyParcelsTab");
          break;
      }
    },
    [navigation]
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const handleSwapLocations = useCallback(() => {
    swapScale.value = withSpring(0.8, { duration: 150 }, () => {
      swapScale.value = withSpring(1, { duration: 150 });
    });
    const temp = fromLocation;
    setFromLocation(toLocation);
    setToLocation(temp);
  }, [fromLocation, toLocation, swapScale]);

  const toggleQuickFilter = useCallback((filterId: string) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    setActiveFilters((prev) => {
      const dateFilters = ["today", "thisWeek"];
      const sizeFilters = ["small", "medium", "large"];

      if (prev.includes(filterId)) {
        return prev.filter((f) => f !== filterId);
      }

      let newFilters = [...prev];
      if (dateFilters.includes(filterId)) {
        newFilters = newFilters.filter((f) => !dateFilters.includes(f));
      }
      if (sizeFilters.includes(filterId)) {
        newFilters = newFilters.filter((f) => !sizeFilters.includes(f));
      }

      return [...newFilters, filterId];
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFromLocation("");
    setToLocation("");
    setActiveFilters([]);
  }, []);

  const swapButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: swapScale.value }, { rotate: "90deg" }],
  }));

  const totalActiveFilters =
    activeFilters.length + (fromLocation ? 1 : 0) + (toLocation ? 1 : 0);

  const renderWelcomeBanner = () => (
    <Animated.View
      entering={FadeInDown.duration(400).delay(100)}
      style={styles.welcomeContainer}
    >
      <View>
        <ThemedText type="h2">{getGreeting()}</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {parcels.length > 0
            ? `You have ${parcels.filter((p) => p.status !== "Delivered").length} active parcels`
            : "Ready to send or find a parcel?"}
        </ThemedText>
      </View>
    </Animated.View>
  );

  const renderStatsCards = () => (
    <Animated.View
      entering={FadeInDown.duration(400).delay(200)}
      style={styles.statsContainer}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsScrollContent}
      >
        {statCards.map((stat, index) => (
          <Animated.View
            key={stat.id}
            entering={FadeInDown.duration(300).delay(250 + index * 50)}
            style={[
              styles.statCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: `${stat.color}15` },
              ]}
            >
              <Feather name={stat.icon} size={18} color={stat.color} />
            </View>
            <ThemedText type="h2" style={{ color: stat.color }}>
              {stat.getValue(parcels)}
            </ThemedText>
            <ThemedText
              type="caption"
              style={{ color: theme.textSecondary, marginTop: 2 }}
            >
              {stat.label}
            </ThemedText>
          </Animated.View>
        ))}
      </ScrollView>
    </Animated.View>
  );

  const renderQuickActions = () => (
    <Animated.View
      entering={FadeInDown.duration(400).delay(300)}
      style={styles.quickActionsContainer}
    >
      <ThemedText
        type="small"
        style={[styles.sectionTitle, { color: theme.textSecondary }]}
      >
        Quick Actions
      </ThemedText>
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action) => {
          const isDisabled = action.id === "scan";
          return (
            <Pressable
              key={action.id}
              onPress={isDisabled ? undefined : () => handleQuickAction(action.id)}
              disabled={isDisabled}
              style={[
                styles.quickActionButton,
                { backgroundColor: theme.backgroundDefault },
                isDisabled && { opacity: 0.5 },
              ]}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: `${action.color}15` },
                ]}
              >
                <Feather name={action.icon} size={22} color={isDisabled ? theme.textSecondary : action.color} />
              </View>
              <ThemedText type="caption" style={{ marginTop: Spacing.xs, color: isDisabled ? theme.textSecondary : theme.text }}>
                {action.label}
              </ThemedText>
              {isDisabled ? (
                <View style={styles.comingSoonBadge}>
                  <ThemedText type="caption" style={styles.comingSoonText}>
                    Soon
                  </ThemedText>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );

  const renderActivityTimeline = () => {
    if (recentActivity.length === 0) return null;

    return (
      <Animated.View
        entering={FadeInDown.duration(400).delay(400)}
        style={styles.activityContainer}
      >
        <View style={styles.sectionHeader}>
          <ThemedText
            type="small"
            style={[styles.sectionTitle, { color: theme.textSecondary }]}
          >
            Recent Activity
          </ThemedText>
          <Pressable>
            <ThemedText type="caption" style={{ color: Colors.primary }}>
              See all
            </ThemedText>
          </Pressable>
        </View>
        <View
          style={[
            styles.activityCard,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          {recentActivity.slice(0, 3).map((activity, index) => (
            <Pressable
              key={activity.id}
              onPress={() => handleParcelPress(activity.id)}
              style={[
                styles.activityItem,
                index < recentActivity.slice(0, 3).length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.activityIconContainer,
                  { backgroundColor: `${activity.color}15` },
                ]}
              >
                <Feather
                  name={activity.icon as keyof typeof Feather.glyphMap}
                  size={16}
                  color={activity.color}
                />
              </View>
              <View style={styles.activityContent}>
                <ThemedText type="small" numberOfLines={1} style={{ flex: 1 }}>
                  {activity.title}
                </ThemedText>
                <View style={styles.activityMeta}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${activity.color}15` },
                    ]}
                  >
                    <ThemedText
                      type="caption"
                      style={{ color: activity.color, fontSize: 10 }}
                    >
                      {activity.status}
                    </ThemedText>
                  </View>
                  <ThemedText
                    type="caption"
                    style={{ color: theme.textSecondary }}
                  >
                    {getTimeAgo(activity.time)}
                  </ThemedText>
                </View>
              </View>
              <Feather
                name="chevron-right"
                size={16}
                color={theme.textSecondary}
              />
            </Pressable>
          ))}
        </View>
      </Animated.View>
    );
  };

  const renderSearchHeader = () => (
    <Animated.View
      entering={FadeInDown.duration(400).delay(500)}
      style={styles.searchContainer}
    >
      <View style={styles.sectionHeader}>
        <ThemedText
          type="small"
          style={[styles.sectionTitle, { color: theme.textSecondary }]}
        >
          Find Parcels
        </ThemedText>
      </View>

      <View style={styles.searchInputsWrapper}>
        <View style={styles.routeInputs}>
          <View
            style={[
              styles.searchBox,
              styles.searchBoxTop,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <View
                style={[styles.routeDot, { backgroundColor: Colors.primary }]}
              />
            </View>
            <TextInput
              ref={fromInputRef}
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="From where?"
              placeholderTextColor={theme.textSecondary}
              value={fromLocation}
              onChangeText={setFromLocation}
            />
            {fromLocation ? (
              <Pressable
                onPress={() => setFromLocation("")}
                hitSlop={8}
                style={styles.clearButton}
              >
                <Feather
                  name="x-circle"
                  size={18}
                  color={theme.textSecondary}
                />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.routeConnector}>
            <View
              style={[styles.routeLine, { backgroundColor: theme.border }]}
            />
          </View>

          <View
            style={[
              styles.searchBox,
              styles.searchBoxBottom,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <View
                style={[styles.routeDot, { backgroundColor: Colors.secondary }]}
              />
            </View>
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="To where?"
              placeholderTextColor={theme.textSecondary}
              value={toLocation}
              onChangeText={setToLocation}
            />
            {toLocation ? (
              <Pressable
                onPress={() => setToLocation("")}
                hitSlop={8}
                style={styles.clearButton}
              >
                <Feather
                  name="x-circle"
                  size={18}
                  color={theme.textSecondary}
                />
              </Pressable>
            ) : null}
          </View>
        </View>

        <AnimatedPressable
          onPress={handleSwapLocations}
          style={[
            styles.swapButton,
            { backgroundColor: theme.backgroundSecondary },
            swapButtonStyle,
          ]}
          hitSlop={8}
        >
          <Feather name="repeat" size={18} color={theme.text} />
        </AnimatedPressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickFiltersContainer}
        style={styles.quickFiltersScroll}
      >
        {quickFilters.map((filter) => {
          const isActive = activeFilters.includes(filter.id);
          return (
            <Pressable
              key={filter.id}
              onPress={() => toggleQuickFilter(filter.id)}
              style={[
                styles.quickFilterChip,
                {
                  backgroundColor: isActive
                    ? Colors.primary
                    : theme.backgroundDefault,
                  borderColor: isActive ? Colors.primary : theme.border,
                },
              ]}
            >
              <Feather
                name={filter.icon}
                size={14}
                color={isActive ? "#FFFFFF" : theme.textSecondary}
              />
              <ThemedText
                type="caption"
                style={{
                  color: isActive ? "#FFFFFF" : theme.text,
                  marginLeft: Spacing.xs,
                }}
              >
                {filter.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.filterRow}>
        <View style={styles.resultCount}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {filteredParcels.length}{" "}
            {filteredParcels.length === 1 ? "parcel" : "parcels"} found
          </ThemedText>
          {totalActiveFilters > 0 ? (
            <Pressable onPress={clearAllFilters} style={styles.clearAllButton}>
              <ThemedText type="caption" style={{ color: Colors.primary }}>
                Clear all
              </ThemedText>
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={handleFilter}
          style={[
            styles.filterButton,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.border,
            },
          ]}
        >
          <Feather name="sliders" size={16} color={theme.text} />
          <ThemedText type="small" style={styles.filterButtonText}>
            Filter
          </ThemedText>
          {totalActiveFilters > 0 ? (
            <View style={styles.filterBadge}>
              <ThemedText type="caption" style={styles.filterBadgeText}>
                {totalActiveFilters}
              </ThemedText>
            </View>
          ) : null}
        </Pressable>
      </View>
    </Animated.View>
  );

  const renderListHeader = () => (
    <View>
      {renderWelcomeBanner()}
      {renderStatsCards()}
      {renderQuickActions()}
      {renderActivityTimeline()}
      {renderSearchHeader()}
    </View>
  );

  const renderEmptyState = () => (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.emptyContainer}
    >
      <View
        style={[
          styles.emptyIconContainer,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <Feather name="search" size={32} color={theme.textSecondary} />
      </View>
      <ThemedText type="h3" style={styles.emptyTitle}>
        No parcels found
      </ThemedText>
      <ThemedText
        type="small"
        style={[styles.emptyText, { color: theme.textSecondary }]}
      >
        {totalActiveFilters > 0
          ? "Try adjusting your filters to see more results"
          : "Be the first to create a parcel for this route"}
      </ThemedText>

      <View style={styles.emptyActions}>
        {totalActiveFilters > 0 ? (
          <Pressable
            onPress={clearAllFilters}
            style={[
              styles.emptyActionButton,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <Feather name="x" size={18} color={theme.text} />
            <ThemedText type="body" style={{ marginLeft: Spacing.sm }}>
              Clear Filters
            </ThemedText>
          </Pressable>
        ) : null}
        <Pressable
          onPress={handleCreateParcel}
          style={[
            styles.emptyActionButton,
            styles.primaryButton,
            { backgroundColor: Colors.primary },
          ]}
        >
          <Feather name="plus" size={18} color="#FFFFFF" />
          <ThemedText
            type="body"
            style={{ color: "#FFFFFF", marginLeft: Spacing.sm }}
          >
            Create Parcel
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.suggestionsContainer}>
        <ThemedText
          type="caption"
          style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}
        >
          Popular routes
        </ThemedText>
        <View style={styles.suggestionChips}>
          {[
            { from: "New York", to: "Los Angeles" },
            { from: "Chicago", to: "Miami" },
            { from: "Seattle", to: "Denver" },
          ].map((route, index) => (
            <Pressable
              key={index}
              onPress={() => {
                setFromLocation(route.from);
                setToLocation(route.to);
              }}
              style={[
                styles.suggestionChip,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <ThemedText type="caption">
                {route.from} → {route.to}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        ref={flatListRef}
        style={styles.list}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.sm,
          paddingBottom: tabBarHeight + Spacing.xl + 72,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListHeaderComponent={renderListHeader}
        data={filteredParcels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ParcelCard parcel={item} onPress={() => handleParcelPress(item.id)} />
        )}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      />
      <FloatingActionButton
        onPress={handleCreateParcel}
        bottom={tabBarHeight + Spacing.xl}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  welcomeContainer: {
    marginBottom: Spacing.lg,
  },
  statsContainer: {
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.lg,
  },
  statsScrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  statCard: {
    width: 90,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  quickActionsContainer: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  quickActionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickActionButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  comingSoonBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: Colors.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  comingSoonText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  activityContainer: {
    marginBottom: Spacing.lg,
  },
  activityCard: {
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  activityIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  activityContent: {
    flex: 1,
  },
  activityMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  searchContainer: {
    marginBottom: Spacing.lg,
  },
  searchInputsWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  routeInputs: {
    flex: 1,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  searchBoxTop: {
    borderTopLeftRadius: BorderRadius.sm,
    borderTopRightRadius: BorderRadius.sm,
    borderBottomWidth: 0,
  },
  searchBoxBottom: {
    borderBottomLeftRadius: BorderRadius.sm,
    borderBottomRightRadius: BorderRadius.sm,
  },
  routeConnector: {
    position: "absolute",
    left: Spacing.md + 5,
    top: Spacing.inputHeight - 4,
    height: 8,
    justifyContent: "center",
  },
  routeLine: {
    width: 2,
    height: "100%",
  },
  iconContainer: {
    width: 20,
    alignItems: "center",
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  quickFiltersScroll: {
    marginTop: Spacing.md,
  },
  quickFiltersContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  quickFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.md,
  },
  resultCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  clearAllButton: {
    paddingVertical: Spacing.xs,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  filterButtonText: {
    marginLeft: Spacing.xs,
  },
  filterBadge: {
    backgroundColor: Colors.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.xs,
  },
  filterBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  separator: {
    height: Spacing.md,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
  },
  emptyText: {
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 20,
  },
  emptyActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  emptyActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  primaryButton: {
    elevation: 2,
  },
  suggestionsContainer: {
    alignItems: "center",
    marginTop: Spacing["2xl"],
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    width: "100%",
  },
  suggestionChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  suggestionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
});
