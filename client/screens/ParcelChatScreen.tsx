import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { useParcels } from "@/hooks/useParcels";
import { useMessages, Message } from "@/hooks/useMessages";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

type ParcelChatRouteParams = {
  ParcelChat: {
    parcelId: string;
    userRole: "sender" | "carrier" | "receiver";
  };
};

type RouteProps = RouteProp<ParcelChatRouteParams, "ParcelChat">;

function MessageBubble({
  message,
  index,
  theme,
}: {
  message: Message;
  index: number;
  theme: any;
}) {
  const isOwn = message.isOwn;

  const getRoleColor = (role: string) => {
    switch (role) {
      case "sender":
        return Colors.primary;
      case "carrier":
        return Colors.success;
      case "receiver":
        return Colors.secondary;
      default:
        return theme.textSecondary;
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 30).duration(200)}
      style={[
        styles.messageBubble,
        isOwn ? styles.ownMessage : styles.otherMessage,
        {
          backgroundColor: isOwn ? Colors.primary : theme.backgroundDefault,
        },
      ]}
    >
      {!isOwn ? (
        <View style={styles.messageHeader}>
          <ThemedText
            type="caption"
            style={{ color: getRoleColor(message.senderRole), fontWeight: "600" }}
          >
            {message.senderName}
          </ThemedText>
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: getRoleColor(message.senderRole) + "20" },
            ]}
          >
            <ThemedText
              type="caption"
              style={{
                color: getRoleColor(message.senderRole),
                fontSize: 10,
                textTransform: "capitalize",
              }}
            >
              {message.senderRole}
            </ThemedText>
          </View>
        </View>
      ) : null}
      <ThemedText
        type="body"
        style={{ color: isOwn ? "#FFFFFF" : theme.text }}
      >
        {message.content}
      </ThemedText>
      <ThemedText
        type="caption"
        style={{
          color: isOwn ? "rgba(255,255,255,0.7)" : theme.textSecondary,
          marginTop: 4,
          alignSelf: isOwn ? "flex-end" : "flex-start",
        }}
      >
        {message.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </ThemedText>
    </Animated.View>
  );
}

export default function ParcelChatScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const route = useRoute<RouteProps>();
  const { theme } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { parcelId, userRole } = route.params;
  const { parcels } = useParcels();
  const { messages, sendMessage, isLoading } = useMessages(parcelId);
  const parcel = parcels.find((p) => p.id === parcelId);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!messageText.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(messageText, userRole);
      setMessageText("");
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
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
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.md,
          paddingBottom: Spacing.md,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        renderItem={({ item, index }) => (
          <MessageBubble message={item} index={index} theme={theme} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="message-circle" size={48} color={theme.textSecondary} />
            <ThemedText
              type="body"
              style={{ color: theme.textSecondary, marginTop: Spacing.md, textAlign: "center" }}
            >
              No messages yet. Start the conversation!
            </ThemedText>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.backgroundDefault,
            borderTopColor: theme.border,
            paddingBottom: insets.bottom + Spacing.sm,
          },
        ]}
      >
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
            },
          ]}
          placeholder="Type a message..."
          placeholderTextColor={theme.textSecondary}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={500}
        />
        <Pressable
          onPress={handleSend}
          disabled={!messageText.trim() || isSending}
          style={[
            styles.sendButton,
            {
              backgroundColor: messageText.trim() ? Colors.primary : theme.backgroundSecondary,
            },
          ]}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather
              name="send"
              size={20}
              color={messageText.trim() ? "#FFFFFF" : theme.textSecondary}
            />
          )}
        </Pressable>
      </View>
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
  messageBubble: {
    maxWidth: "80%",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  ownMessage: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});
