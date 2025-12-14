import React, { useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { useConnections } from "@/hooks/useConnections";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";

type TabType = "carriers" | "contacts";

export default function ConnectionsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { trustedCarriers, savedContacts, removeConnection, isLoading, isRemoving } = useConnections();
  const [activeTab, setActiveTab] = useState<TabType>("carriers");

  const connections = activeTab === "carriers" ? trustedCarriers : savedContacts;

  const handleRemove = (userId: string, userName: string) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    
    Alert.alert(
      "Remove Connection",
      `Are you sure you want to remove ${userName} from your ${activeTab === "carriers" ? "trusted carriers" : "saved contacts"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeConnection(userId),
        },
      ]
    );
  };

  const renderConnection = ({ item, index }: { item: any; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50)}>
      <Card elevation={1} style={styles.connectionCard}>
        <View style={styles.connectionContent}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: Colors.primary + "20" },
            ]}
          >
            <ThemedText type="h3" style={{ color: Colors.primary }}>
              {item.connectedUser.name.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          <View style={styles.info}>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              {item.connectedUser.name}
            </ThemedText>
            <View style={styles.ratingRow}>
              <Feather name="star" size={14} color={Colors.warning} />
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary, marginLeft: 4 }}
              >
                {item.connectedUser.rating?.toFixed(1) || "N/A"}
              </ThemedText>
              {item.connectedUser.verified ? (
                <View style={styles.verifiedBadge}>
                  <Feather name="check" size={10} color="#FFF" />
                </View>
              ) : null}
            </View>
            {item.note ? (
              <ThemedText
                type="caption"
                style={{ color: theme.textSecondary, marginTop: 4 }}
                numberOfLines={1}
              >
                {item.note}
              </ThemedText>
            ) : null}
          </View>
          <Pressable
            onPress={() => handleRemove(item.connectedUserId, item.connectedUser.name)}
            style={[styles.removeButton, { backgroundColor: Colors.error + "15" }]}
            disabled={isRemoving}
          >
            <Feather name="user-minus" size={18} color={Colors.error} />
          </Pressable>
        </View>
      </Card>
    </Animated.View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconContainer,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <Feather
          name={activeTab === "carriers" ? "truck" : "users"}
          size={32}
          color={theme.textSecondary}
        />
      </View>
      <ThemedText
        type="body"
        style={{ textAlign: "center", marginTop: Spacing.md }}
      >
        No {activeTab === "carriers" ? "trusted carriers" : "saved contacts"} yet
      </ThemedText>
      <ThemedText
        type="small"
        style={{
          color: theme.textSecondary,
          textAlign: "center",
          marginTop: Spacing.xs,
        }}
      >
        {activeTab === "carriers"
          ? "Save carriers you trust after successful deliveries"
          : "Save contacts you frequently send or receive parcels from"}
      </ThemedText>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.tabContainer, { paddingTop: headerHeight + Spacing.md }]}>
        <View
          style={[
            styles.tabBar,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <Pressable
            onPress={() => setActiveTab("carriers")}
            style={[
              styles.tab,
              activeTab === "carriers" && {
                backgroundColor: Colors.primary,
              },
            ]}
          >
            <Feather
              name="truck"
              size={16}
              color={activeTab === "carriers" ? "#FFF" : theme.textSecondary}
            />
            <ThemedText
              type="small"
              style={{
                color: activeTab === "carriers" ? "#FFF" : theme.text,
                marginLeft: Spacing.xs,
              }}
            >
              Trusted Carriers ({trustedCarriers.length})
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("contacts")}
            style={[
              styles.tab,
              activeTab === "contacts" && {
                backgroundColor: Colors.primary,
              },
            ]}
          >
            <Feather
              name="users"
              size={16}
              color={activeTab === "contacts" ? "#FFF" : theme.textSecondary}
            />
            <ThemedText
              type="small"
              style={{
                color: activeTab === "contacts" ? "#FFF" : theme.text,
                marginLeft: Spacing.xs,
              }}
            >
              Contacts ({savedContacts.length})
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={connections}
        keyExtractor={(item) => item.id}
        renderItem={renderConnection}
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
          flexGrow: 1,
        }}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  connectionCard: {
    marginBottom: Spacing.sm,
  },
  connectionContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.xs,
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
