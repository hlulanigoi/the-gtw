import { useState, useEffect, useCallback } from "react";
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

export interface Message {
  id: string;
  parcelId: string;
  senderId: string;
  senderName: string;
  senderRole: "sender" | "carrier" | "receiver";
  content: string;
  createdAt: Date;
  isOwn?: boolean;
}

export function useMessages(parcelId?: string) {
  const { user, userProfile } = useAuth();
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

  const sendMessage = useCallback(
    async (content: string, role: "sender" | "carrier" | "receiver") => {
      if (!user || !parcelId || !content.trim()) return;

      try {
        await addDoc(collection(db, "messages"), {
          parcelId,
          senderId: user.uid,
          senderName: userProfile?.name || "Unknown",
          senderRole: role,
          content: content.trim(),
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.error("Error sending message:", err);
        throw err;
      }
    },
    [user, userProfile, parcelId]
  );

  return {
    messages,
    sendMessage,
    isLoading,
  };
}
