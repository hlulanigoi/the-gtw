import { useState, useEffect, useCallback } from "react";
<<<<<<< HEAD
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
=======
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
>>>>>>> origin/payments

export interface Message {
  id: string;
  parcelId: string;
  senderId: string;
  senderName: string;
  senderRole: "sender" | "carrier" | "receiver";
  content: string;
<<<<<<< HEAD
  createdAt: Date | string;
=======
  createdAt: Date;
>>>>>>> origin/payments
  isOwn?: boolean;
}

export function useMessages(parcelId?: string) {
  const { user, userProfile } = useAuth();
<<<<<<< HEAD
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/parcels", parcelId, "messages"],
    queryFn: async () => {
      if (!parcelId) return [];
      const response = ((await apiRequest("GET", `/api/parcels/${parcelId}/messages`)) as unknown) as any[];
      return response.map((m: any) => ({
        ...m,
        createdAt: new Date(m.createdAt),
        isOwn: user?.uid === m.senderId,
      }));
    },
    enabled: !!parcelId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!parcelId || !user) throw new Error("Missing parcelId or user");
      return apiRequest("POST", `/api/parcels/${parcelId}/messages`, {
        content: content.trim(),
        senderRole: "sender",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parcels", parcelId, "messages"] });
    },
  });
=======
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!parcelId) {
      setIsLoading(false);
      return;
    }

    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("parcelId", "==", parcelId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messagesData: Message[] = [];

        snapshot.docs.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          const createdAt = data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : data.createdAt ? new Date(data.createdAt) : new Date();

          messagesData.push({
            id: docSnapshot.id,
            parcelId: data.parcelId,
            senderId: data.senderId,
            senderName: data.senderName,
            senderRole: data.senderRole,
            content: data.content,
            createdAt,
            isOwn: user?.uid === data.senderId,
          });
        });

        setMessages(messagesData);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching messages:", err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [parcelId, user?.uid]);
>>>>>>> origin/payments

  const sendMessage = useCallback(
    async (content: string, role: "sender" | "carrier" | "receiver") => {
      if (!user || !parcelId || !content.trim()) return;
<<<<<<< HEAD
      try {
        await sendMessageMutation.mutateAsync(content);
=======

      try {
        await addDoc(collection(db, "messages"), {
          parcelId,
          senderId: user.uid,
          senderName: userProfile?.name || "Unknown",
          senderRole: role,
          content: content.trim(),
          createdAt: serverTimestamp(),
        });
>>>>>>> origin/payments
      } catch (err) {
        console.error("Error sending message:", err);
        throw err;
      }
    },
<<<<<<< HEAD
    [user, parcelId, sendMessageMutation]
=======
    [user, userProfile, parcelId]
>>>>>>> origin/payments
  );

  return {
    messages,
    sendMessage,
    isLoading,
  };
}
