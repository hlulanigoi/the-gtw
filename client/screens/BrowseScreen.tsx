import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeOut,
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

const quickFilters: QuickFilter[] = [
  { id: "today", label: "Today", icon: "clock" },
  { id: "thisWeek", label: "This Week", icon: "calendar" },
  { id: "small", label: "Small", icon: "package" },
  { id: "medium", label: "Medium", icon: "box" },
  { id: "large", label: "Large", icon: "truck" },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function BrowseScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { parcels } = useParcels();

  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

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
        const pickupDate = parcel.pickupDate instanceof Date 
          ? parcel.pickupDate 
          : new Date(parcel.pickupDate);
        dateMatch = pickupDate.toDateString() === today;
      } else if (activeFilters.includes("thisWeek")) {
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const pickupDate = parcel.pickupDate instanceof Date 
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

  const handleParcelPress = (parcelId: string) => {
    navigation.navigate("ParcelDetail", { parcelId });
  };

  const handleCreateParcel = () => {
    navigation.navigate("CreateParcel");
  };

  const handleFilter = () => {
    navigation.navigate("RouteFilter");
  };

  const handleSwapLocations = useCallback(() => {
    swapScale.value = withSpring(0.8, { duration: 150 }, () => {
      swapScale.value = withSpring(1, { duration: 150 });
    });
    const temp = fromLocation;
    setFromLocation(toLocation);
    setToLocation(temp);
  }, [fromLocation, toLocation, swapScale]);

  const toggleQuickFilter = useCallback((filterId: string) => {
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
    activeFilters.length +
    (fromLocation ? 1 : 0) +
    (toLocation ? 1 : 0);

  const renderSearchHeader = () => (
    <View style={styles.searchContainer}>
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
              <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
            </View>
            <TextInput
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
                <Feather name="x-circle" size={18} color={theme.textSecondary} />
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
              <View style={[styles.routeDot, { backgroundColor: Colors.secondary }]} />
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
                <Feather name="x-circle" size={18} color={theme.textSecondary} />
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
              <ThemedText
                type="caption"
                style={{ color: Colors.primary }}
              >
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
        style={styles.list}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.sm,
          paddingBottom: tabBarHeight + Spacing.xl + 72,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListHeaderComponent={renderSearchHeader}
        data={filteredParcels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ParcelCard parcel={item} onPress={() => handleParcelPress(item.id)} />
        )}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
