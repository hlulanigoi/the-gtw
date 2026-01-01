import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/lib/query-client";

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
  const { user, getIdToken } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const API_URL = getApiUrl();

  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const token = await getIdToken();
      
      // Fetch conversations from backend API
      const response = await fetch(`${API_URL}/api/users/${user.uid}/conversations`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }

      const conversationsData = await response.json();

      // Transform backend data to match our interface
      const formattedConversations: Conversation[] = conversationsData.map((conv: any) => ({
        id: conv.id,
        userName: conv.userName || "Unknown User",
        lastMessage: conv.lastMessage || "No messages yet",
        lastMessageTime: new Date(conv.lastMessageTime),
        unread: false,
        messages: (conv.messages || []).map((msg: any) => ({
          id: msg.id,
          text: msg.text,
          isMe: msg.isMe,
          timestamp: new Date(msg.timestamp),
          senderId: msg.senderId,
          conversationId: conv.id,
        })),
        parcelId: conv.parcelId,
        participant1Id: conv.participant1Id,
        participant2Id: conv.participant2Id,
        otherUserId: conv.participant1Id === user.uid ? conv.participant2Id : conv.participant1Id,
      }));

      setConversations(formattedConversations);
      setError(null);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, getIdToken, API_URL]);

  useEffect(() => {
    loadConversations();

    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      loadConversations();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadConversations]);

  const addMessage = async (conversationId: string, message: Message) => {
    if (!user) return;

    try {
      const token = await getIdToken();
      
      const response = await fetch(`${API_URL}/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: message.text,
          senderId: user.uid,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Refresh conversations to show the new message
      await loadConversations();
    } catch (err) {
      console.error("Error adding message:", err);
      throw err;
    }
  };

  const createConversation = async (otherUserId: string, parcelId?: string) => {
    if (!user) return null;

    try {
      const token = await getIdToken();
      
      const response = await fetch(`${API_URL}/api/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          participant1Id: user.uid,
          participant2Id: otherUserId,
          parcelId: parcelId || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create conversation");
      }

      const conversation = await response.json();
      
      // Refresh conversations
      await loadConversations();
      
      return conversation.id;
    } catch (err) {
      console.error("Error creating conversation:", err);
      throw err;
    }
  };

  const markAsRead = (conversationId: string) => {
    // Future implementation for marking messages as read
  };

  return {
    conversations,
    addMessage,
    createConversation,
    markAsRead,
    isLoading,
    error,
    refreshConversations: loadConversations,
  };
}
