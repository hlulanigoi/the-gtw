import React, { useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInDown,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { useParcels, Parcel } from "@/hooks/useParcels";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IncomingStackParamList } from "@/navigation/IncomingStackNavigator";

type NavigationProp = NativeStackNavigationProp<IncomingStackParamList>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function EmptyState({ theme }: { theme: any }) {
  return (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconContainer,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <Feather name="inbox" size={48} color={theme.textSecondary} />
      </View>
      <ThemedText type="h3" style={styles.emptyTitle}>
        No Incoming Parcels
      </ThemedText>
      <ThemedText
        type="body"
        style={[styles.emptyText, { color: theme.textSecondary }]}
      >
        When someone sends you a parcel, it will appear here
      </ThemedText>
    </View>
  );
}

function ParcelCard({
  parcel,
  index,
  onPress,
  theme,
}: {
  parcel: Parcel;
  index: number;
  onPress: () => void;
  theme: any;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return Colors.success;
      case "In Transit":
        return Colors.primary;
      case "Pending":
        return Colors.warning;
      default:
        return theme.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Delivered":
        return "check-circle";
      case "In Transit":
        return "truck";
      case "Pending":
        return "clock";
      default:
        return "package";
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      }}
      style={animatedStyle}
    >
      <Animated.View
        entering={FadeInDown.delay(index * 50).duration(300)}
        style={[
          styles.parcelCard,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.routeInfo}>
            <View style={styles.locationRow}>
              <View
                style={[styles.locationDot, { backgroundColor: Colors.primary }]}
              />
              <ThemedText type="body" style={{ color: theme.text }} numberOfLines={1}>
                {parcel.origin}
              </ThemedText>
            </View>
            <View style={styles.routeLine}>
              <View style={[styles.dottedLine, { borderColor: theme.border }]} />
            </View>
            <View style={styles.locationRow}>
              <View
                style={[styles.locationDot, { backgroundColor: Colors.secondary }]}
              />
              <ThemedText type="body" style={{ color: theme.text }} numberOfLines={1}>
                {parcel.destination}
              </ThemedText>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(parcel.status)}15` },
            ]}
          >
            <Feather
              name={getStatusIcon(parcel.status) as any}
              size={14}
              color={getStatusColor(parcel.status)}
            />
            <ThemedText
              type="caption"
              style={{ color: getStatusColor(parcel.status), marginLeft: 4 }}
            >
              {parcel.status}
            </ThemedText>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardFooter}>
          <View style={styles.senderInfo}>
            <Feather name="user" size={14} color={theme.textSecondary} />
            <ThemedText
              type="caption"
              style={{ color: theme.textSecondary, marginLeft: 4 }}
            >
              From: {parcel.senderName}
            </ThemedText>
          </View>

          <View style={styles.parcelMeta}>
            <View style={styles.metaItem}>
              <Feather name="package" size={14} color={theme.textSecondary} />
              <ThemedText
                type="caption"
                style={{ color: theme.textSecondary, marginLeft: 4, textTransform: "capitalize" }}
              >
                {parcel.size}
              </ThemedText>
            </View>
            {parcel.deliveryConfirmed ? (
              <View style={styles.metaItem}>
                <Feather name="check" size={14} color={Colors.success} />
                <ThemedText
                  type="caption"
                  style={{ color: Colors.success, marginLeft: 4 }}
                >
                  Confirmed
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>
      </Animated.View>
    </AnimatedPressable>
  );
}

export default function IncomingScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { parcels, isLoading, refetch } = useParcels();
  const [refreshing, setRefreshing] = useState(false);

  const incomingParcels = parcels.filter((p) => p.isReceiver);

  const handleRefresh = async () => {
    setRefreshing(true);
    refetch();
    setRefreshing(false);
  };

  const handleParcelPress = (parcel: Parcel) => {
    navigation.navigate("IncomingParcelDetail", { parcelId: parcel.id });
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={incomingParcels}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.md,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
        renderItem={({ item, index }) => (
          <ParcelCard
            parcel={item}
            index={index}
            onPress={() => handleParcelPress(item)}
            theme={theme}
          />
        )}
        ListEmptyComponent={<EmptyState theme={theme} />}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  emptyText: {
    textAlign: "center",
  },
  parcelCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  routeInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeLine: {
    paddingLeft: 4,
    height: 16,
  },
  dottedLine: {
    width: 1,
    height: "100%",
    borderLeftWidth: 2,
    borderStyle: "dashed",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(128, 128, 128, 0.1)",
    marginVertical: Spacing.md,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  senderInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  parcelMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
});
