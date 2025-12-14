import React, { useState, useMemo } from "react";
import { View, FlatList, StyleSheet, Pressable } from "react-native";
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
import { MyParcelsStackParamList } from "@/navigation/MyParcelsStackNavigator";
import { useParcels } from "@/hooks/useParcels";

type NavigationProp = NativeStackNavigationProp<RootStackParamList & MyParcelsStackParamList>;

type TabType = "created" | "transporting";

export default function MyParcelsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { parcels } = useParcels();
  
  const [activeTab, setActiveTab] = useState<TabType>("created");

  const myParcels = useMemo(() => {
    return parcels.filter((parcel) => {
      if (activeTab === "created") {
        return parcel.isOwner;
      }
      return parcel.isTransporting;
    });
  }, [parcels, activeTab]);

  const handleParcelPress = (parcelId: string) => {
    navigation.navigate("ParcelDetail", { parcelId });
  };

  const handleCreateParcel = () => {
    navigation.navigate("CreateParcel");
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
          <View style={styles.tabsContainer}>
            <Pressable
              onPress={() => setActiveTab("created")}
              style={[
                styles.tab,
                activeTab === "created" && {
                  backgroundColor: Colors.primary,
                },
                activeTab !== "created" && {
                  backgroundColor: theme.backgroundDefault,
                },
              ]}
            >
              <ThemedText
                type="small"
                style={{
                  color:
                    activeTab === "created" ? "#FFFFFF" : theme.textSecondary,
                  fontWeight: "600",
                }}
              >
                Created
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("transporting")}
              style={[
                styles.tab,
                activeTab === "transporting" && {
                  backgroundColor: Colors.primary,
                },
                activeTab !== "transporting" && {
                  backgroundColor: theme.backgroundDefault,
                },
              ]}
            >
              <ThemedText
                type="small"
                style={{
                  color:
                    activeTab === "transporting"
                      ? "#FFFFFF"
                      : theme.textSecondary,
                  fontWeight: "600",
                }}
              >
                Transporting
              </ThemedText>
            </Pressable>
          </View>
        }
        data={myParcels}
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
              No parcels yet
            </ThemedText>
            <ThemedText
              type="small"
              style={[styles.emptyText, { color: theme.textSecondary }]}
            >
              {activeTab === "created"
                ? "Create your first parcel to get started"
                : "Accept a parcel to transport"}
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
  tabsContainer: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
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
