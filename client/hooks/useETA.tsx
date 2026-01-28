import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";

export interface ETAData {
  available: boolean;
  distance?: number;
  etaMinutes?: number;
  carrierLocation?: {
    lat: number;
    lng: number;
    timestamp: Date | string;
    speed?: number | null;
  };
  message?: string;
}

export function useETA(parcelId: string | null, enabled: boolean = true) {
  const { data, isLoading, error, refetch } = useQuery<ETAData>({
    queryKey: ["/api/parcels", parcelId, "eta"],
    queryFn: async () => {
      if (!parcelId) return { available: false };
      const response = (await apiRequest(
        "GET",
        `/api/parcels/${parcelId}/eta`
      )) as any;
      return response ? await response.json() : { available: false };
    },
    enabled: !!parcelId && enabled,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return {
    eta: data || { available: false },
    isLoading,
    error,
    refetch,
  };
}
