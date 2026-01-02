import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
<<<<<<< HEAD
import { getApiUrl } from "@/lib/query-client";
=======
import { apiRequest } from "@/lib/query-client";
import { useWebSocket } from "./useWebSocket";
>>>>>>> origin/payments

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
<<<<<<< HEAD
  const API_URL = getApiUrl();
=======
  const { subscribe } = useWebSocket();
>>>>>>> origin/payments

  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    try {
<<<<<<< HEAD
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
=======
      const response = await apiRequest('GET', `/api/users/${user.uid}/conversations`);
      const data = await response.json();
      
      setConversations(data);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError(err as Error);
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
      
      // Update conversations with new message
      setConversations(prev => {
        const convIndex = prev.findIndex(c => c.id === message.conversationId);
        if (convIndex === -1) {
          // New conversation, reload
          loadConversations();
          return prev;
        }

        const updated = [...prev];
        const conv = { ...updated[convIndex] };
        
        // Add message to conversation
        conv.messages = [...(conv.messages || []), {
          id: message.id,
          text: message.text,
          isMe: message.senderId === user.uid,
          timestamp: new Date(message.createdAt || Date.now()),
          senderId: message.senderId,
          conversationId: message.conversationId,
        }];
        
        // Update last message info
        conv.lastMessage = message.text;
        conv.lastMessageTime = new Date(message.createdAt || Date.now());
        
        updated[convIndex] = conv;
        
        // Sort by last message time
        updated.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
        
        return updated;
      });
    });

    return () => unsubscribe();
  }, [user, subscribe, loadConversations]);
>>>>>>> origin/payments

  const addMessage = async (conversationId: string, message: Message) => {
    if (!user) return;

    try {
<<<<<<< HEAD
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
=======
      const response = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, {
        text: message.text,
        senderId: user.uid,
      });
      
      const newMessage = await response.json();
      
      // Optimistically update local state
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
>>>>>>> origin/payments
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
<<<<<<< HEAD
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
=======
      const response = await apiRequest('POST', '/api/conversations', {
        participant1Id: user.uid,
        participant2Id: otherUserId,
        parcelId: parcelId || null,
      });
      
      const conversation = await response.json();
      
      // Reload conversations to get the new one
>>>>>>> origin/payments
      await loadConversations();
      
      return conversation.id;
    } catch (err) {
      console.error("Error creating conversation:", err);
      throw err;
    }
  };

  const markAsRead = (conversationId: string) => {
<<<<<<< HEAD
    // Future implementation for marking messages as read
=======
    // TODO: Implement mark as read functionality
>>>>>>> origin/payments
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
