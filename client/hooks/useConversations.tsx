<<<<<<< HEAD
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
=======
import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
>>>>>>> origin/payments
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
<<<<<<< HEAD
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
=======
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    const conversationsRef = collection(db, "conversations");
    const q1 = query(conversationsRef, where("participant1Id", "==", user.uid));
    const q2 = query(conversationsRef, where("participant2Id", "==", user.uid));

    const loadConversations = async () => {
      try {
        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        const allDocs = [...snap1.docs, ...snap2.docs];
        
        const uniqueDocs = new Map();
        allDocs.forEach(docSnap => {
          uniqueDocs.set(docSnap.id, docSnap);
        });

        const conversationsData: Conversation[] = [];

        for (const docSnapshot of uniqueDocs.values()) {
          const data = docSnapshot.data();
          const conversationId = docSnapshot.id;

          const otherUserId = data.participant1Id === user.uid
            ? data.participant2Id
            : data.participant1Id;

          let userName = "Unknown User";
          if (otherUserId) {
            try {
              const userDoc = await getDoc(doc(db, "users", otherUserId));
              if (userDoc.exists()) {
                userName = userDoc.data().name || "Unknown User";
              }
            } catch {}
          }

          const messagesRef = collection(db, "conversations", conversationId, "messages");
          const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));
          const messagesSnapshot = await getDocs(messagesQuery);

          const messagesData: Message[] = messagesSnapshot.docs.map((msgDoc) => {
            const msgData = msgDoc.data();
            const timestamp = msgData.createdAt instanceof Timestamp
              ? msgData.createdAt.toDate()
              : new Date();

            return {
              id: msgDoc.id,
              text: msgData.text,
              isMe: msgData.senderId === user.uid,
              timestamp,
              senderId: msgData.senderId,
              conversationId,
            };
          });

          const lastMessage = messagesData.length > 0
            ? messagesData[messagesData.length - 1].text
            : "No messages yet";

          const lastMessageTime = messagesData.length > 0
            ? messagesData[messagesData.length - 1].timestamp
            : data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : new Date();

          conversationsData.push({
            id: conversationId,
            userName,
            lastMessage,
            lastMessageTime,
            unread: false,
            messages: messagesData,
            parcelId: data.parcelId,
            participant1Id: data.participant1Id,
            participant2Id: data.participant2Id,
            otherUserId,
          });
        }

        conversationsData.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
        setConversations(conversationsData);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching conversations:", err);
        setError(err as Error);
        setIsLoading(false);
      }
    };

    loadConversations();

    const unsubscribe1 = onSnapshot(q1, () => loadConversations());
    const unsubscribe2 = onSnapshot(q2, () => loadConversations());

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [user?.uid]);

  const addMessage = async (conversationId: string, message: Message) => {
    if (!user) return;

    try {
      const messagesRef = collection(db, "conversations", conversationId, "messages");
      await addDoc(messagesRef, {
        text: message.text,
        senderId: user.uid,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error adding message:", err);
      throw err;
    }
  };

  const createConversation = async (otherUserId: string, parcelId?: string) => {
    if (!user) return null;

    try {
      const conversationRef = await addDoc(collection(db, "conversations"), {
        participant1Id: user.uid,
        participant2Id: otherUserId,
        parcelId: parcelId || null,
        createdAt: serverTimestamp(),
      });
      return conversationRef.id;
    } catch (err) {
      console.error("Error creating conversation:", err);
      throw err;
    }
  };

  const markAsRead = (conversationId: string) => {};
>>>>>>> origin/payments

  return {
    conversations,
    addMessage,
    createConversation,
    markAsRead,
    isLoading,
    error,
  };
}
