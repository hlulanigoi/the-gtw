import React, { useState, useMemo } from "react";
import { View, FlatList, StyleSheet, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";

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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TabButton({
  label,
  active,
  count,
  onPress,
  theme,
}: {
  label: string;
  active: boolean;
  count: number;
  onPress: () => void;
  theme: any;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  return (
    <AnimatedPressable
      onPress={() => {
        onPress();
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.tab,
        animatedStyle,
        {
          backgroundColor: active ? Colors.primary : theme.backgroundDefault,
        },
      ]}
    >
      <ThemedText
        type="body"
        style={{
          color: active ? "#FFFFFF" : theme.text,
          fontWeight: "600",
        }}
      >
        {label}
      </ThemedText>
      {count > 0 ? (
        <View
          style={[
            styles.countBadge,
            {
              backgroundColor: active
                ? "rgba(255,255,255,0.25)"
                : theme.backgroundSecondary,
            },
          ]}
        >
          <ThemedText
            type="caption"
            style={{
              color: active ? "#FFFFFF" : theme.textSecondary,
              fontWeight: "600",
            }}
          >
            {count}
          </ThemedText>
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

function EmptyState({
  type,
  onCreateRoute,
  theme,
}: {
  type: "active" | "past";
  onCreateRoute: () => void;
  theme: any;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  if (type === "past") {
    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.emptyContainer, { backgroundColor: theme.backgroundDefault }]}
      >
        <View style={[styles.emptyIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="archive" size={32} color={theme.textSecondary} />
        </View>
        <ThemedText type="h3" style={styles.emptyTitle}>
          No Past Routes
        </ThemedText>
        <ThemedText
          type="body"
          style={[styles.emptyText, { color: theme.textSecondary }]}
        >
          Your completed, expired, and cancelled routes will appear here
        </ThemedText>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[styles.emptyContainer, { backgroundColor: theme.backgroundDefault }]}
    >
      <View
        style={[
          styles.emptyIconContainer,
          { backgroundColor: `${Colors.primary}15` },
        ]}
      >
        <Feather name="navigation" size={32} color={Colors.primary} />
      </View>
      <ThemedText type="h3" style={styles.emptyTitle}>
        Start Earning
      </ThemedText>
      <ThemedText
        type="body"
        style={[styles.emptyText, { color: theme.textSecondary }]}
      >
        Create your first route to start accepting parcels from senders along your journey
      </ThemedText>
      <AnimatedPressable
        onPress={() => {
          onCreateRoute();
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.createButton, animatedStyle]}
      >
        <Feather name="plus" size={20} color="#FFFFFF" />
        <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
          Create Your First Route
        </ThemedText>
      </AnimatedPressable>
    </Animated.View>
  );
}

function StatsBar({ activeCount, theme }: { activeCount: number; theme: any }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(300)}
      style={[styles.statsBar, { backgroundColor: theme.backgroundDefault }]}
    >
      <View style={styles.statItem}>
        <View style={[styles.statIconContainer, { backgroundColor: `${Colors.primary}15` }]}>
          <Feather name="navigation" size={16} color={Colors.primary} />
        </View>
        <View>
          <ThemedText type="h3" style={{ color: Colors.primary }}>
            {activeCount}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Active Routes
          </ThemedText>
        </View>
      </View>
      <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
      <View style={styles.statItem}>
        <View style={[styles.statIconContainer, { backgroundColor: `${Colors.success}15` }]}>
          <Feather name="check-circle" size={16} color={Colors.success} />
        </View>
        <View>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Ready to accept
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            parcel requests
          </ThemedText>
        </View>
      </View>
    </Animated.View>
  );
}

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

  const activeRouteCount = useMemo(() => {
    return routes.filter((route) => route.isOwner && route.status === "Active").length;
  }, [routes]);

  const pastRouteCount = useMemo(() => {
    return routes.filter(
      (route) =>
        route.isOwner &&
        (route.status === "Completed" ||
          route.status === "Expired" ||
          route.status === "Cancelled")
    ).length;
  }, [routes]);

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
          <View style={styles.headerContent}>
            <View style={styles.tabsContainer}>
              <TabButton
                label="Active"
                active={activeTab === "active"}
                count={activeRouteCount}
                onPress={() => setActiveTab("active")}
                theme={theme}
              />
              <TabButton
                label="Past"
                active={activeTab === "past"}
                count={pastRouteCount}
                onPress={() => setActiveTab("past")}
                theme={theme}
              />
            </View>
            {activeTab === "active" && activeRouteCount > 0 ? (
              <StatsBar activeCount={activeRouteCount} theme={theme} />
            ) : null}
          </View>
        }
        data={myRoutes}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
            <RouteCard route={item} onPress={() => handleRoutePress(item.id)} />
          </Animated.View>
        )}
        ListEmptyComponent={
          <EmptyState
            type={activeTab}
            onCreateRoute={handleCreateRoute}
            theme={theme}
          />
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
  headerContent: {
    marginBottom: Spacing.lg,
  },
  tabsContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  countBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    minWidth: 24,
    alignItems: "center",
  },
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    marginHorizontal: Spacing.md,
  },
  separator: {
    height: Spacing.md,
  },
  emptyContainer: {
    alignItems: "center",
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
});
