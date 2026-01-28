import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { useMessages, Message } from "@/hooks/useMessages";
import { Parcel } from "@/hooks/useParcels";

interface ParcelMessagesTabProps {
  parcelId: string;
  parcel: Parcel;
}

function RoleBadge({ role }: { role: "sender" | "carrier" | "receiver" }) {
  const { theme } = useTheme();
  
  const badgeColors = {
    sender: Colors.primary,
    carrier: Colors.secondary,
    receiver: Colors.warning,
  };

  const badgeLabels = {
    sender: "Sender",
    carrier: "Carrier",
    receiver: "Receiver",
  };

  return (
    <View
      style={[
        styles.roleBadge,
        { backgroundColor: badgeColors[role] + "20" },
      ]}
    >
      <ThemedText
        type="caption"
        style={{
          color: badgeColors[role],
          fontWeight: "600",
          fontSize: 10,
        }}
      >
        {badgeLabels[role]}
      </ThemedText>
    </View>
  );
}

export function ParcelMessagesTab({ parcelId, parcel }: ParcelMessagesTabProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { messages, sendMessage, isLoading, userRole } = useMessages(parcelId, parcel);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsSending(true);
    try {
      await sendMessage(inputText.trim());
      setInputText("");
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.isOwn ? styles.ownMessageContainer : styles.theirMessageContainer,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          item.isOwn ? styles.ownMessage : styles.theirMessage,
          {
            backgroundColor: item.isOwn ? Colors.primary : theme.backgroundDefault,
          },
        ]}
      >
        {!item.isOwn && (
          <View style={styles.messageHeader}>
            <ThemedText
              type="caption"
              style={{
                fontWeight: "600",
                color: item.isOwn ? "rgba(255,255,255,0.9)" : theme.text,
              }}
            >
              {item.senderName}
            </ThemedText>
            <RoleBadge role={item.senderRole} />
          </View>
        )}
        
        {item.isOwn && (
          <View style={[styles.messageHeader, { alignSelf: "flex-end" }]}>
            <RoleBadge role={item.senderRole} />
          </View>
        )}

        <ThemedText
          type="body"
          style={{ color: item.isOwn ? "#FFFFFF" : theme.text }}
        >
          {item.content}
        </ThemedText>
        
        <ThemedText
          type="caption"
          style={[
            styles.messageTime,
            { color: item.isOwn ? "rgba(255,255,255,0.7)" : theme.textSecondary },
          ]}
        >
          {formatTime(item.createdAt)}
        </ThemedText>
      </View>
    </View>
  );

  if (!userRole) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.emptyContainer}>
          <Feather name="alert-circle" size={48} color={theme.textSecondary} />
          <ThemedText type="h3" style={{ marginTop: Spacing.md }}>
            Access Denied
          </ThemedText>
          <ThemedText
            type="small"
            style={[styles.emptyText, { color: theme.textSecondary }]}
          >
            You don't have permission to view messages for this parcel.
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      {isLoading && messages.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          style={styles.messagesList}
          contentContainerStyle={{
            paddingTop: Spacing.lg,
            paddingBottom: Spacing.lg,
            paddingHorizontal: Spacing.lg,
          }}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
                Start the conversation with the {userRole === "sender" ? "carrier or receiver" : userRole === "carrier" ? "sender or receiver" : "sender or carrier"}
              </ThemedText>
            </View>
          }
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.backgroundRoot,
            paddingBottom: insets.bottom > 0 ? insets.bottom : Spacing.sm,
            borderTopColor: theme.border,
          },
        ]}
      >
        <View
          style={[
            styles.inputWrapper,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Type a message..."
            placeholderTextColor={theme.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isSending}
          />
        </View>
        <Pressable
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
          style={({ pressed }) => [
            styles.sendButton,
            {
              backgroundColor:
                inputText.trim() && !isSending
                  ? Colors.primary
                  : theme.backgroundSecondary,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather
              name="send"
              size={20}
              color={inputText.trim() ? "#FFFFFF" : theme.textSecondary}
            />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  messagesList: {
    flex: 1,
  },
  messageContainer: {
    width: "100%",
  },
  ownMessageContainer: {
    alignItems: "flex-end",
  },
  theirMessageContainer: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  ownMessage: {
    borderBottomRightRadius: Spacing.xs,
  },
  theirMessage: {
    borderBottomLeftRadius: Spacing.xs,
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  roleBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  messageTime: {
    marginTop: Spacing.xs,
    alignSelf: "flex-end",
  },
  separator: {
    height: Spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  emptyIcon: {
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
  },
  emptyText: {
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 44,
    maxHeight: 120,
  },
  input: {
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
