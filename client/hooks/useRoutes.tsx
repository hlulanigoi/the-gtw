import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { useAuth } from "@/contexts/AuthContext";

export interface Route {
  id: string;
  carrierId: string;
  origin: string;
  destination: string;
  originLat?: number | null;
  originLng?: number | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
  intermediateStops?: string[] | null;
  departureDate: Date;
  departureTime?: string | null;
  frequency: "one_time" | "daily" | "weekly" | "monthly";
  maxParcelSize?: "small" | "medium" | "large" | null;
  maxWeight?: number | null;
  availableCapacity?: number | null;
  pricePerKg?: number | null;
  notes?: string | null;
  status: "Active" | "Completed" | "Expired" | "Cancelled";
  expiresAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  carrierName: string;
  carrierRating: number | null;
  isOwner?: boolean;
}

interface RouteApiResponse {
  id: string;
  carrierId: string;
  origin: string;
  destination: string;
  originLat?: number | null;
  originLng?: number | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
  intermediateStops?: string[] | null;
  departureDate: string;
  departureTime?: string | null;
  frequency: "one_time" | "daily" | "weekly" | "monthly";
  maxParcelSize?: "small" | "medium" | "large" | null;
  maxWeight?: number | null;
  availableCapacity?: number | null;
  pricePerKg?: number | null;
  notes?: string | null;
  status: "Active" | "Completed" | "Expired" | "Cancelled";
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  carrier?: {
    id: string;
    name: string;
    rating: number | null;
  };
}

function mapApiRouteToRoute(
  apiRoute: RouteApiResponse,
  userId?: string
): Route {
  return {
    id: apiRoute.id,
    carrierId: apiRoute.carrierId,
    origin: apiRoute.origin,
    destination: apiRoute.destination,
    originLat: apiRoute.originLat,
    originLng: apiRoute.originLng,
    destinationLat: apiRoute.destinationLat,
    destinationLng: apiRoute.destinationLng,
    intermediateStops: apiRoute.intermediateStops,
    departureDate: new Date(apiRoute.departureDate),
    departureTime: apiRoute.departureTime,
    frequency: apiRoute.frequency || "one_time",
    maxParcelSize: apiRoute.maxParcelSize,
    maxWeight: apiRoute.maxWeight,
    availableCapacity: apiRoute.availableCapacity,
    pricePerKg: apiRoute.pricePerKg,
    notes: apiRoute.notes,
    status: apiRoute.status || "Active",
    expiresAt: apiRoute.expiresAt ? new Date(apiRoute.expiresAt) : null,
    createdAt: apiRoute.createdAt ? new Date(apiRoute.createdAt) : undefined,
    updatedAt: apiRoute.updatedAt ? new Date(apiRoute.updatedAt) : undefined,
    carrierName: apiRoute.carrier?.name || "Unknown",
    carrierRating: apiRoute.carrier?.rating || null,
    isOwner: userId === apiRoute.carrierId,
  };
}

export function useRoutes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: routes = [],
    isLoading,
    error,
    refetch,
  } = useQuery<RouteApiResponse[], Error, Route[]>({
    queryKey: ["/api/routes"],
    select: (data: RouteApiResponse[]) =>
      data.map((route) => mapApiRouteToRoute(route, user?.uid)),
    enabled: true,
  });

  const createRouteMutation = useMutation({
    mutationFn: async (
      route: Omit<
        Route,
        | "id"
        | "carrierName"
        | "carrierRating"
        | "createdAt"
        | "updatedAt"
        | "status"
        | "isOwner"
        | "carrierId"
      >
    ) => {
      const res = await apiRequest("POST", "/api/routes", {
        ...route,
        departureDate:
          route.departureDate instanceof Date
            ? route.departureDate.toISOString()
            : route.departureDate,
        expiresAt: route.expiresAt
          ? route.expiresAt instanceof Date
            ? route.expiresAt.toISOString()
            : route.expiresAt
          : null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routes"] });
    },
  });

  const updateRouteMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Route>;
    }) => {
      const updateData: any = { ...updates };

      if (updates.departureDate) {
        updateData.departureDate =
          updates.departureDate instanceof Date
            ? updates.departureDate.toISOString()
            : updates.departureDate;
      }

      if (updates.expiresAt) {
        updateData.expiresAt =
          updates.expiresAt instanceof Date
            ? updates.expiresAt.toISOString()
            : updates.expiresAt;
      }

      delete updateData.isOwner;
      delete updateData.carrierName;
      delete updateData.carrierRating;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      const res = await apiRequest("PATCH", `/api/routes/${id}`, updateData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routes"] });
    },
  });

  const deleteRouteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/routes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routes"] });
    },
  });

  const addRoute = async (
    route: Omit<
      Route,
      | "id"
      | "carrierName"
      | "carrierRating"
      | "createdAt"
      | "updatedAt"
      | "status"
      | "isOwner"
      | "carrierId"
    >
  ) => {
    await createRouteMutation.mutateAsync(route);
  };

  const updateRoute = async (id: string, updates: Partial<Route>) => {
    await updateRouteMutation.mutateAsync({ id, updates });
  };

  const deleteRoute = async (id: string) => {
    await deleteRouteMutation.mutateAsync(id);
  };

  const cancelRoute = async (id: string) => {
    await updateRoute(id, { status: "Cancelled" });
  };

  return {
    routes,
    addRoute,
    updateRoute,
    deleteRoute,
    cancelRoute,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
