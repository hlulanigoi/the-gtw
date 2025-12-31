import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { useAuth } from "@/contexts/AuthContext";

export interface Parcel {
  id: string;
  origin: string;
  destination: string;
  originLat?: number | null;
  originLng?: number | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
  intermediateStops?: string[] | null;
  size: "small" | "medium" | "large";
  weight?: number | null;
  description?: string | null;
  specialInstructions?: string | null;
  isFragile?: boolean | null;
  compensation: number;
  pickupDate: Date;
  pickupWindowEnd?: Date | null;
  deliveryWindowStart?: Date | null;
  deliveryWindowEnd?: Date | null;
  expiresAt?: Date | null;
  declaredValue?: number | null;
  insuranceNeeded?: boolean | null;
  contactPhone?: string | null;
  status: "Pending" | "In Transit" | "Delivered" | "Expired";
  senderId: string;
  transporterId?: string | null;
  senderName: string;
  senderRating: number | null;
  createdAt?: Date;
  isOwner?: boolean;
  isTransporting?: boolean;
  receiverId?: string | null;
  receiverName?: string | null;
  receiverPhone?: string | null;
  receiverEmail?: string | null;
  deliveryConfirmed?: boolean;
  deliveryConfirmedAt?: Date | null;
  deliveryProofPhoto?: string | null;
  receiverRating?: number | null;
  isReceiver?: boolean;
  photoUrl?: string | null;
}

export function useParcels() {
  const { user, userProfile } = useAuth();
  const queryClient = useQueryClient();

  const { data: parcels = [], isLoading, error } = useQuery<Parcel[]>({
    queryKey: ["/api/parcels"],
    queryFn: async () => {
      const response = ((await apiRequest("GET", "/api/parcels")) as unknown) as any[];
      return response.map((p: any) => ({
        ...p,
        pickupDate: new Date(p.pickupDate),
        createdAt: new Date(p.createdAt),
        pickupWindowEnd: p.pickupWindowEnd ? new Date(p.pickupWindowEnd) : null,
        deliveryWindowStart: p.deliveryWindowStart ? new Date(p.deliveryWindowStart) : null,
        deliveryWindowEnd: p.deliveryWindowEnd ? new Date(p.deliveryWindowEnd) : null,
        expiresAt: p.expiresAt ? new Date(p.expiresAt) : null,
        deliveryConfirmedAt: p.deliveryConfirmedAt ? new Date(p.deliveryConfirmedAt) : null,
        isOwner: user?.uid === p.senderId,
        isTransporting: user?.uid === p.transporterId,
        isReceiver: user?.uid === p.receiverId || 
          (userProfile?.email && p.receiverEmail && 
           userProfile.email.toLowerCase() === p.receiverEmail.toLowerCase()),
      }));
    },
  });

  const addParcelMutation = useMutation({
    mutationFn: async (parcel: Omit<Parcel, "id" | "senderName" | "senderRating" | "createdAt" | "status" | "transporterId" | "isOwner" | "isTransporting" | "senderId">) => {
      return apiRequest("POST", "/api/parcels", {
        ...parcel,
        pickupDate: parcel.pickupDate instanceof Date ? parcel.pickupDate.toISOString() : parcel.pickupDate,
        pickupWindowEnd: parcel.pickupWindowEnd ? new Date(parcel.pickupWindowEnd).toISOString() : null,
        deliveryWindowStart: parcel.deliveryWindowStart ? new Date(parcel.deliveryWindowStart).toISOString() : null,
        deliveryWindowEnd: parcel.deliveryWindowEnd ? new Date(parcel.deliveryWindowEnd).toISOString() : null,
        expiresAt: parcel.expiresAt ? new Date(parcel.expiresAt).toISOString() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parcels"] });
    },
  });

  const updateParcelMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Parcel> }) => {
      return apiRequest("PATCH", `/api/parcels/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parcels"] });
    },
  });

  const deleteParcelMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/parcels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parcels"] });
    },
  });

  const addParcel = async (parcel: Omit<Parcel, "id" | "senderName" | "senderRating" | "createdAt" | "status" | "transporterId" | "isOwner" | "isTransporting" | "senderId">) => {
    return addParcelMutation.mutateAsync(parcel);
  };

  const updateParcel = async (id: string, updates: Partial<Parcel>) => {
    return updateParcelMutation.mutateAsync({ id, updates });
  };

  const acceptParcel = async (id: string) => {
    return updateParcelMutation.mutateAsync({
      id,
      updates: { status: "In Transit" as const },
    });
  };

  const deleteParcel = async (id: string) => {
    return deleteParcelMutation.mutateAsync(id);
  };

  const confirmDelivery = async (id: string, proofPhotoUrl?: string) => {
    return updateParcelMutation.mutateAsync({
      id,
      updates: {
        deliveryConfirmed: true,
        deliveryConfirmedAt: new Date(),
        deliveryProofPhoto: proofPhotoUrl || null,
        status: "Delivered" as const,
      },
    });
  };

  const rateCarrierAsReceiver = async (id: string, rating: number) => {
    return updateParcelMutation.mutateAsync({
      id,
      updates: { receiverRating: rating },
    });
  };

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/parcels"] });
  };

  return {
    parcels,
    addParcel,
    updateParcel,
    acceptParcel,
    deleteParcel,
    confirmDelivery,
    rateCarrierAsReceiver,
    isLoading,
    error,
    refetch,
  };
}
