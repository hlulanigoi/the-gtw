import { useState, useEffect, useCallback } from "react";
import * as Location from "expo-location";
import { Platform } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";

export interface CarrierLocation {
  id: string;
  parcelId: string;
  carrierId: string;
  lat: number;
  lng: number;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
  timestamp: Date | string;
}

export function useCarrierLocation(parcelId?: string) {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);

  const { data: carrierLocation } = useQuery<CarrierLocation | null>({
    queryKey: ["/api/parcels", parcelId, "carrier-location"],
    queryFn: async () => {
      if (!parcelId) return null;
      const response = (await apiRequest("GET", `/api/parcels/${parcelId}/carrier-location`)) as any;
      return response ? { ...response, timestamp: new Date(response.timestamp) } : null;
    },
    enabled: !!parcelId,
    refetchInterval: 10000,
  });

  const startTracking = useCallback(async (trackingParcelId: string) => {
    if (!user || Platform.OS === "web") return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      setIsTracking(true);

      const subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 50 },
        async (location) => {
          const { latitude, longitude, heading, speed, accuracy } = location.coords;
          try {
            await apiRequest("POST", `/api/parcels/${trackingParcelId}/carrier-location`, {
              lat: latitude,
              lng: longitude,
              heading: heading ?? null,
              speed: speed ?? null,
              accuracy: accuracy ?? null,
            });
          } catch (err) {
            console.error("Error updating carrier location:", err);
          }
        }
      );

      setLocationSubscription(subscription);
    } catch (err) {
      console.error("Error starting location tracking:", err);
      setIsTracking(false);
    }
  }, [user]);

  const stopTracking = useCallback(() => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    setIsTracking(false);
  }, [locationSubscription]);

  useEffect(() => {
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [locationSubscription]);

  return {
    carrierLocation: carrierLocation || null,
    isTracking,
    startTracking,
    stopTracking,
  };
}
