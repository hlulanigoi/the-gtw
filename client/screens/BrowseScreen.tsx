import React, { useState, useMemo } from "react";
import { View, FlatList, TextInput, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ParcelCard } from "@/components/ParcelCard";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { BrowseStackParamList } from "@/navigation/BrowseStackNavigator";
import { useParcels } from "@/hooks/useParcels";

type NavigationProp = NativeStackNavigationProp<RootStackParamList & BrowseStackParamList>;

export default function BrowseScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { parcels } = useParcels();

  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");

  const filteredParcels = useMemo(() => {
    return parcels.filter((parcel) => {
      const fromMatch = fromLocation
        ? parcel.origin.toLowerCase().includes(fromLocation.toLowerCase())
        : true;
      const toMatch = toLocation
        ? parcel.destination.toLowerCase().includes(toLocation.toLowerCase()) ||
          (parcel.intermediateStops?.some((stop) =>
            stop.toLowerCase().includes(toLocation.toLowerCase())
          ))
        : true;
      return fromMatch && toMatch;
    });
  }, [parcels, fromLocation, toLocation]);

  const handleParcelPress = (parcelId: string) => {
    navigation.navigate("ParcelDetail", { parcelId });
  };

  const handleCreateParcel = () => {
    navigation.navigate("CreateParcel");
  };

  const handleFilter = () => {
    navigation.navigate("RouteFilter");
  };

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
        ListHeaderComponent={
          <View style={styles.searchContainer}>
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: theme.border,
                },
              ]}
            >
              <Feather name="map-pin" size={18} color={Colors.primary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="From where?"
                placeholderTextColor={theme.textSecondary}
                value={fromLocation}
                onChangeText={setFromLocation}
              />
            </View>
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: theme.border,
                },
              ]}
            >
              <Feather name="navigation" size={18} color={Colors.secondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="To where?"
                placeholderTextColor={theme.textSecondary}
                value={toLocation}
                onChangeText={setToLocation}
              />
            </View>
            <View style={styles.filterRow}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {filteredParcels.length} parcels found
              </ThemedText>
              <Pressable
                onPress={handleFilter}
                style={[
                  styles.filterButton,
                  { backgroundColor: theme.backgroundDefault },
                ]}
              >
                <Feather name="filter" size={16} color={theme.text} />
                <ThemedText type="small" style={styles.filterButtonText}>
                  Filter
                </ThemedText>
              </Pressable>
            </View>
          </View>
        }
        data={filteredParcels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ParcelCard parcel={item} onPress={() => handleParcelPress(item.id)} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather
              name="package"
              size={48}
              color={theme.textSecondary}
              style={styles.emptyIcon}
            />
            <ThemedText type="h3" style={styles.emptyTitle}>
              No parcels found
            </ThemedText>
            <ThemedText
              type="small"
              style={[styles.emptyText, { color: theme.textSecondary }]}
            >
              Try adjusting your search or create a new parcel
            </ThemedText>
          </View>
        }
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
    gap: Spacing.sm,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    gap: Spacing.xs,
  },
  filterButtonText: {
    marginLeft: Spacing.xs,
  },
  separator: {
    height: Spacing.md,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  emptyIcon: {
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
  },
  emptyText: {
    textAlign: "center",
  },
});
