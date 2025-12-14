import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";

export interface Message {
  id: string;
  text: string;
  isMe: boolean;
  timestamp: Date;
  senderId?: string;
  conversationId?: string;
}

export interface Conversation {
  id: string;
  userName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unread: boolean;
  messages: Message[];
  parcelId?: string | null;
  participant1Id?: string;
  participant2Id?: string;
}

const CURRENT_USER_ID = "current-user";

export function useConversations() {
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading, error } = useQuery<Conversation[]>({
    queryKey: ["/api/users", CURRENT_USER_ID, "conversations"],
  });

  const conversationsWithDates = conversations.map((conv) => ({
    ...conv,
    lastMessageTime: new Date(conv.lastMessageTime),
    unread: false,
    messages: conv.messages.map((msg) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    })),
  }));

  const addMessageMutation = useMutation({
    mutationFn: async ({ conversationId, text }: { conversationId: string; text: string }) => {
      const response = await apiRequest("POST", `/api/conversations/${conversationId}/messages`, {
        senderId: CURRENT_USER_ID,
        text,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", CURRENT_USER_ID, "conversations"] });
    },
  });

  const addMessage = (conversationId: string, message: Message) => {
    addMessageMutation.mutate({ conversationId, text: message.text });
  };

  const markAsRead = (conversationId: string) => {
  };

  return {
    conversations: conversationsWithDates,
    addMessage,
    markAsRead,
    isLoading,
    error,
  };
}
