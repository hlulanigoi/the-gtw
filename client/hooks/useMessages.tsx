import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { Parcel } from "@/hooks/useParcels";

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

export function useMessages(parcelId?: string, parcel?: Parcel) {
  const { user, userProfile } = useAuth();
  const queryClient = useQueryClient();

  // Determine current user's role in this parcel
  const userRole: "sender" | "carrier" | "receiver" | null = (() => {
    if (!parcel || !user) return null;
    
    if (user.uid === parcel.senderId) return "sender";
    if (user.uid === parcel.transporterId) return "carrier";
    if (user.uid === parcel.receiverId) return "receiver";
    if (userProfile?.email && parcel.receiverEmail && 
        userProfile.email.toLowerCase() === parcel.receiverEmail.toLowerCase()) {
      return "receiver";
    }
    
    return null;
  })();

  const { data: messages = [], isLoading, refetch } = useQuery<Message[]>({
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
    refetchInterval: 5000, // Auto-refresh every 5 seconds for real-time updates
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!parcelId || !user || !userRole) {
        throw new Error("Missing parcelId, user, or user role");
      }
      return apiRequest("POST", `/api/parcels/${parcelId}/messages`, {
        content: content.trim(),
        senderRole: userRole,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parcels", parcelId, "messages"] });
    },
  });

  const sendMessage = useCallback(
    async (content: string) => {
      if (!user || !parcelId || !content.trim() || !userRole) return;
      try {
        await sendMessageMutation.mutateAsync(content);
      } catch (err) {
        console.error("Error sending message:", err);
        throw err;
      }
    },
    [user, parcelId, userRole, sendMessageMutation]
  );

  return {
    messages,
    sendMessage,
    isLoading,
    userRole,
    refetch,
  };
}
