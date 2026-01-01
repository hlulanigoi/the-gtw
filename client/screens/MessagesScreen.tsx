import React from "react";
import { View, FlatList, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { MessagesStackParamList } from "@/navigation/MessagesStackNavigator";
import { useConversations } from "@/hooks/useConversations";

type NavigationProp = NativeStackNavigationProp<MessagesStackParamList>;

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { conversations } = useConversations();

  const handleConversationPress = (conversationId: string, userName: string) => {
    navigation.navigate("Conversation", { conversationId, userName });
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        style={styles.list}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.sm,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleConversationPress(item.id, item.userName)}
            style={({ pressed }) => [
              styles.conversationCard,
              {
                backgroundColor: theme.backgroundDefault,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <View
              style={[styles.avatar, { backgroundColor: theme.backgroundSecondary }]}
            >
              <ThemedText type="h3" style={{ color: theme.text }}>
                {item.userName.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
            <View style={styles.conversationContent}>
              <View style={styles.conversationHeader}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {item.userName}
                </ThemedText>
                <ThemedText
                  type="caption"
                  style={{ color: theme.textSecondary }}
                >
                  {formatTime(item.lastMessageTime)}
                </ThemedText>
              </View>
              <ThemedText
                type="small"
                numberOfLines={1}
                style={{
                  color: item.unread ? theme.text : theme.textSecondary,
                  fontWeight: item.unread ? "600" : "400",
                }}
              >
                {item.lastMessage}
              </ThemedText>
            </View>
            {item.unread ? (
              <View style={styles.unreadDot} />
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather
              name="message-circle"
              size={48}
              color={theme.textSecondary}
              style={styles.emptyIcon}
            />
            <ThemedText type="h3" style={styles.emptyTitle}>
              No messages yet
            </ThemedText>
            <ThemedText
              type="small"
              style={[styles.emptyText, { color: theme.textSecondary }]}
            >
              When you accept or create a parcel, you can chat with other users
              here
            </ThemedText>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  conversationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  conversationContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0A7EA4",
    marginLeft: Spacing.sm,
  },
  separator: {
    height: Spacing.sm,
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
    paddingHorizontal: Spacing.xl,
  },
});
