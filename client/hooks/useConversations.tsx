import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { useAuth } from "@/contexts/AuthContext";

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
  otherUserId?: string;
}

export function useConversations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading, error } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    queryFn: async () => {
      if (!user) return [];
      return ((await apiRequest("GET", "/api/conversations")) as unknown) as Conversation[];
    },
    enabled: !!user,
  });

  const addMessageMutation = useMutation({
    mutationFn: async ({ conversationId, message }: { conversationId: string; message: Message }) => {
      return apiRequest("POST", `/api/conversations/${conversationId}/messages`, {
        text: message.text,
        senderId: user?.uid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const createConversationMutation = useMutation({
    mutationFn: async ({ otherUserId, parcelId }: { otherUserId: string; parcelId?: string }) => {
      const response = (await apiRequest("POST", "/api/conversations", {
        participant1Id: user?.uid,
        participant2Id: otherUserId,
        parcelId: parcelId || null,
      })) as any;
      return response.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const addMessage = async (conversationId: string, message: Message) => {
    return addMessageMutation.mutateAsync({ conversationId, message });
  };

  const createConversation = async (otherUserId: string, parcelId?: string) => {
    return createConversationMutation.mutateAsync({ otherUserId, parcelId });
  };

  const markAsRead = (conversationId: string) => {
    // Optional: Implement if needed
  };

  return {
    conversations,
    addMessage,
    createConversation,
    markAsRead,
    isLoading,
    error,
  };
}
