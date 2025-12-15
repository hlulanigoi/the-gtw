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
import { RouteCard } from "@/components/RouteCard";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { MyRoutesStackParamList } from "@/navigation/MyRoutesStackNavigator";
import { useRoutes } from "@/hooks/useRoutes";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList & MyRoutesStackParamList
>;

type TabType = "active" | "past";

export default function MyRoutesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { routes } = useRoutes();

  const [activeTab, setActiveTab] = useState<TabType>("active");

  const myRoutes = useMemo(() => {
    return routes.filter((route) => {
      if (!route.isOwner) return false;
      if (activeTab === "active") {
        return route.status === "Active";
      }
      return (
        route.status === "Completed" ||
        route.status === "Expired" ||
        route.status === "Cancelled"
      );
    });
  }, [routes, activeTab]);

  const handleRoutePress = (routeId: string) => {
    navigation.navigate("RouteDetail", { routeId });
  };

  const handleCreateRoute = () => {
    navigation.navigate("CreateRoute");
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
              onPress={() => setActiveTab("active")}
              style={[
                styles.tab,
                activeTab === "active" && {
                  backgroundColor: Colors.primary,
                },
                activeTab !== "active" && {
                  backgroundColor: theme.backgroundDefault,
                },
              ]}
            >
              <ThemedText
                type="small"
                style={{
                  color:
                    activeTab === "active" ? "#FFFFFF" : theme.textSecondary,
                  fontWeight: "600",
                }}
              >
                Active
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("past")}
              style={[
                styles.tab,
                activeTab === "past" && {
                  backgroundColor: Colors.primary,
                },
                activeTab !== "past" && {
                  backgroundColor: theme.backgroundDefault,
                },
              ]}
            >
              <ThemedText
                type="small"
                style={{
                  color:
                    activeTab === "past" ? "#FFFFFF" : theme.textSecondary,
                  fontWeight: "600",
                }}
              >
                Past
              </ThemedText>
            </Pressable>
          </View>
        }
        data={myRoutes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RouteCard route={item} onPress={() => handleRoutePress(item.id)} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather
              name="navigation"
              size={48}
              color={theme.textSecondary}
              style={styles.emptyIcon}
            />
            <ThemedText type="h3" style={styles.emptyTitle}>
              No routes yet
            </ThemedText>
            <ThemedText
              type="small"
              style={[styles.emptyText, { color: theme.textSecondary }]}
            >
              {activeTab === "active"
                ? "Create a route to start accepting parcels"
                : "Your completed routes will appear here"}
            </ThemedText>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <FloatingActionButton
        onPress={handleCreateRoute}
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
