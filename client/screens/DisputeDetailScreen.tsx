import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { useDisputes, Dispute, DisputeMessage } from '@/hooks/useDisputes';
import { useAuth } from '@/contexts/AuthContext';

type DisputeDetailScreenParams = {
  disputeId: string;
};

type RouteType = RouteProp<{ DisputeDetail: DisputeDetailScreenParams }, 'DisputeDetail'>;

function DisputeStatusBadge({ status }: { status: Dispute['status'] }) {
  const statusConfig = {
    open: { color: Colors.warning, label: 'Open', icon: 'alert-circle' as const },
    in_review: { color: Colors.info, label: 'In Review', icon: 'eye' as const },
    resolved: { color: Colors.success, label: 'Resolved', icon: 'check-circle' as const },
    closed: { color: Colors.textSecondary, label: 'Closed', icon: 'x-circle' as const },
  };

  const config = statusConfig[status];

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
      <Feather name={config.icon} size={14} color={config.color} />
      <ThemedText type="small" style={{ color: config.color, fontWeight: '600', marginLeft: 4 }}>
        {config.label}
      </ThemedText>
    </View>
  );
}

function MessageBubble({
  message,
  index,
  theme,
  isOwnMessage,
}: {
  message: DisputeMessage;
  index: number;
  theme: any;
  isOwnMessage: boolean;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 30).duration(200)}
      style={[
        styles.messageBubble,
        isOwnMessage ? styles.ownMessage : styles.otherMessage,
      ]}
    >
      {message.isAdminMessage ? (
        <View style={[styles.adminMessageContainer, { backgroundColor: Colors.error + '10' }]}>
          <View style={styles.adminBadge}>
            <Feather name="shield" size={12} color={Colors.error} />
            <ThemedText type="caption" style={{ color: Colors.error, fontWeight: '700', marginLeft: 4 }}>
              ADMIN
            </ThemedText>
          </View>
          <ThemedText type="body" style={{ color: theme.text }}>
            {message.message}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
            {new Date(message.createdAt).toLocaleTimeString()}
          </ThemedText>
        </View>
      ) : (
        <View
          style={[
            styles.userMessageContainer,
            {
              backgroundColor: isOwnMessage ? Colors.primary : theme.backgroundDefault,
            },
          ]}
        >
          <ThemedText type="body" style={{ color: isOwnMessage ? '#FFFFFF' : theme.text }}>
            {message.message}
          </ThemedText>
          <ThemedText
            type="caption"
            style={{
              color: isOwnMessage ? 'rgba(255,255,255,0.8)' : theme.textSecondary,
              marginTop: Spacing.xs,
              alignSelf: 'flex-end',
            }}
          >
            {new Date(message.createdAt).toLocaleTimeString()}
          </ThemedText>
        </View>
      )}
    </Animated.View>
  );
}

export default function DisputeDetailScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const route = useRoute<RouteType>();
  const { disputeId } = route.params;
  const { getDispute, getDisputeMessages, sendMessage } = useDisputes();
  const { user } = useAuth();

  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [messages, setMessages] = useState<DisputeMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadDisputeData();
    // Poll for new messages every 10 seconds
    const interval = setInterval(loadMessages, 10000);
    return () => clearInterval(interval);
  }, [disputeId]);

  const loadDisputeData = async () => {
    try {
      setIsLoading(true);
      const [disputeData, messagesData] = await Promise.all([
        getDispute(disputeId),
        getDisputeMessages(disputeId),
      ]);
      setDispute(disputeData);
      setMessages(messagesData);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load dispute data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const messagesData = await getDisputeMessages(disputeId);
      setMessages(messagesData);
    } catch (error) {
      console.error('Failed to refresh messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    const tempMessage = messageText.trim();
    setMessageText('');
    setIsSending(true);

    try {
      await sendMessage({ disputeId, message: tempMessage });

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Refresh messages
      await loadMessages();

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send message');
      setMessageText(tempMessage); // Restore message
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
            Loading dispute...
          </ThemedText>
        </View>
      </View>
    );
  }

  if (!dispute) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.emptyContainer}>
          <Feather name="alert-circle" size={48} color={theme.textSecondary} />
          <ThemedText type="h3">Dispute not found</ThemedText>
        </View>
      </View>
    );
  }

  const canSendMessages = dispute.status === 'open' || dispute.status === 'in_review';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header Card */}
      <View style={[styles.headerCard, { backgroundColor: theme.backgroundDefault, borderBottomColor: theme.border }]}>
        <View style={styles.headerContent}>
          <View style={[styles.headerIcon, { backgroundColor: Colors.error + '15' }]}>
            <Feather name="alert-triangle" size={20} color={Colors.error} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="h4">{dispute.subject}</ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              Created {new Date(dispute.createdAt).toLocaleDateString()}
            </ThemedText>
          </View>
          <DisputeStatusBadge status={dispute.status} />
        </View>

        {dispute.resolution ? (
          <Card elevation={1} style={[styles.resolutionCard, { backgroundColor: Colors.success + '10' }]}>
            <View style={styles.resolutionHeader}>
              <Feather name="check-circle" size={16} color={Colors.success} />
              <ThemedText type="small" style={{ fontWeight: '700', color: Colors.success }}>
                RESOLUTION
              </ThemedText>
            </View>
            <ThemedText type="small" style={{ color: theme.text, marginTop: Spacing.xs }}>
              {dispute.resolution}
            </ThemedText>
            {dispute.refundAmount ? (
              <ThemedText type="small" style={{ color: Colors.success, marginTop: Spacing.xs, fontWeight: '600' }}>
                Refund: ₦{(dispute.refundAmount / 100).toFixed(2)} {dispute.refundedToWallet ? '(Credited to Wallet)' : ''}
              </ThemedText>
            ) : null}
          </Card>
        ) : null}
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: Spacing.xl,
        }}
        ListEmptyComponent={
          <View style={styles.emptyMessages}>
            <Feather name="message-square" size={48} color={theme.textSecondary} />
            <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
              No messages yet
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
              Start the conversation to resolve this dispute
            </ThemedText>
          </View>
        }
        renderItem={({ item, index }) => (
          <MessageBubble
            message={item}
            index={index}
            theme={theme}
            isOwnMessage={item.senderId === user?.uid}
          />
        )}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input */}
      {canSendMessages ? (
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.backgroundDefault,
              borderTopColor: theme.border,
              paddingBottom: insets.bottom + Spacing.md,
            },
          ]}
        >
          <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Type your message..."
              placeholderTextColor={theme.textSecondary}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={500}
            />
            <Pressable
              onPress={handleSendMessage}
              disabled={!messageText.trim() || isSending}
              style={[
                styles.sendButton,
                {
                  backgroundColor: messageText.trim() && !isSending ? Colors.primary : theme.border,
                },
              ]}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Feather name="send" size={20} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.closedContainer,
            {
              backgroundColor: theme.backgroundSecondary,
              borderTopColor: theme.border,
              paddingBottom: insets.bottom + Spacing.md,
            },
          ]}
        >
          <Feather name="lock" size={20} color={theme.textSecondary} />
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            This dispute is {dispute.status}. No new messages can be sent.
          </ThemedText>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  headerCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  resolutionCard: {
    marginTop: Spacing.md,
    padding: Spacing.md,
  },
  resolutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emptyMessages: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
  },
  messageBubble: {
    marginBottom: Spacing.md,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  adminMessageContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  userMessageContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  inputContainer: {
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: Spacing.xs,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  closedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: 1,
  },
});
