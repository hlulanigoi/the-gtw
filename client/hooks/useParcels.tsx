import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";

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
  pickupDate: string;
  status: "Pending" | "In Transit" | "Delivered";
  senderId: string;
  transporterId?: string | null;
  senderName: string;
  senderRating: number | null;
  createdAt?: string;
}

const CURRENT_USER_ID = "user-1";

export function useParcels() {
  const queryClient = useQueryClient();

  const { data: parcels = [], isLoading, error, refetch } = useQuery<Parcel[]>({
    queryKey: ["/api/parcels"],
  });

  const parcelsWithOwnership = parcels.map((parcel) => ({
    ...parcel,
    isOwner: parcel.senderId === CURRENT_USER_ID,
    isTransporting: parcel.transporterId === CURRENT_USER_ID,
    pickupDate: new Date(parcel.pickupDate),
  }));

  const addParcelMutation = useMutation({
    mutationFn: async (parcel: Omit<Parcel, "id" | "senderName" | "senderRating" | "createdAt" | "status" | "transporterId">) => {
      const response = await apiRequest("POST", "/api/parcels", {
        ...parcel,
        senderId: CURRENT_USER_ID,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parcels"] });
    },
  });

  const updateParcelMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Parcel> }) => {
      const response = await apiRequest("PATCH", `/api/parcels/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parcels"] });
    },
  });

  const acceptParcelMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/parcels/${id}/accept`, {
        transporterId: CURRENT_USER_ID,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parcels"] });
    },
  });

  const deleteParcelMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/parcels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parcels"] });
    },
  });

  const addParcel = (parcel: Omit<Parcel, "id" | "senderName" | "senderRating" | "createdAt" | "status" | "transporterId">) => {
    addParcelMutation.mutate(parcel);
  };

  const updateParcel = (id: string, updates: Partial<Parcel>) => {
    updateParcelMutation.mutate({ id, updates });
  };

  const acceptParcel = (id: string) => {
    acceptParcelMutation.mutate(id);
  };

  const deleteParcel = (id: string) => {
    deleteParcelMutation.mutate(id);
  };

  return {
    parcels: parcelsWithOwnership,
    addParcel,
    updateParcel,
    acceptParcel,
    deleteParcel,
    isLoading,
    error,
    refetch,
  };
}
