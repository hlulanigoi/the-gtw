import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/query-client";
import { useWebSocket } from "./useWebSocket";

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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { subscribe } = useWebSocket();

  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiRequest('GET', `/api/users/${user.uid}/conversations`);
      const data = await response.json();
      
      const formattedConversations: Conversation[] = data.map((conv: any) => ({
        ...conv,
        lastMessageTime: new Date(conv.lastMessageTime),
        messages: (conv.messages || []).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
          isMe: msg.senderId === user.uid
        })),
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
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Subscribe to new messages via WebSocket
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribe('new_message', (payload) => {
      const message = payload;
      
      setConversations(prev => {
        const convIndex = prev.findIndex(c => c.id === message.conversationId);
        if (convIndex === -1) {
          loadConversations();
          return prev;
        }

        const updated = [...prev];
        const conv = { ...updated[convIndex] };
        
        conv.messages = [...(conv.messages || []), {
          id: message.id,
          text: message.text,
          isMe: message.senderId === user.uid,
          timestamp: new Date(message.createdAt || Date.now()),
          senderId: message.senderId,
          conversationId: message.conversationId,
        }];
        
        conv.lastMessage = message.text;
        conv.lastMessageTime = new Date(message.createdAt || Date.now());
        
        updated[convIndex] = conv;
        updated.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
        
        return updated;
      });
    });

    return () => unsubscribe();
  }, [user, subscribe, loadConversations]);

  const addMessage = async (conversationId: string, message: Message) => {
    if (!user) return;

    try {
      const response = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, {
        text: message.text,
        senderId: user.uid,
      });
      
      const newMessage = await response.json();
      
      setConversations(prev => {
        const convIndex = prev.findIndex(c => c.id === conversationId);
        if (convIndex === -1) return prev;

        const updated = [...prev];
        const conv = { ...updated[convIndex] };
        
        conv.messages = [...(conv.messages || []), {
          id: newMessage.id,
          text: newMessage.text,
          isMe: true,
          timestamp: new Date(newMessage.createdAt || Date.now()),
          senderId: user.uid,
          conversationId,
        }];
        
        conv.lastMessage = newMessage.text;
        conv.lastMessageTime = new Date(newMessage.createdAt || Date.now());
        
        updated[convIndex] = conv;
        updated.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
        
        return updated;
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }
    } catch (err) {
      console.error("Error adding message:", err);
      throw err;
    }
  };

  const createConversation = async (otherUserId: string, parcelId?: string) => {
    if (!user) return null;

    try {
      const response = await apiRequest('POST', '/api/conversations', {
        participant1Id: user.uid,
        participant2Id: otherUserId,
        parcelId: parcelId || null,
      });
      
      const conversation = await response.json();
      await loadConversations();
      return conversation.id;
    } catch (err) {
      console.error("Error creating conversation:", err);
      throw err;
    }
  };

  const markAsRead = (conversationId: string) => {
    // TODO: Implement mark as read functionality
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
