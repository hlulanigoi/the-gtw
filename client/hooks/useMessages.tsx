import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";

export interface Message {
  id: string;
  parcelId: string;
  senderId: string;
  senderName: string;
  senderRole: "sender" | "carrier" | "receiver";
  content: string;
  createdAt: Date | string;
  isOwn?: boolean;
}

export function useMessages(parcelId?: string) {
  const { user, userProfile } = useAuth();
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

  const sendMessage = useCallback(
    async (content: string, role: "sender" | "carrier" | "receiver") => {
      if (!user || !parcelId || !content.trim()) return;
      try {
        await sendMessageMutation.mutateAsync(content);
      } catch (err) {
        console.error("Error sending message:", err);
        throw err;
      }
    },
    [user, parcelId, sendMessageMutation]
  );

  return {
    messages,
    sendMessage,
    isLoading,
  };
}
