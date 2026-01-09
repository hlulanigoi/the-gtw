import { useState, useEffect, useCallback } from "react";
<<<<<<< HEAD
import * as Location from "expo-location";
import { Platform } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
=======
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import * as Location from "expo-location";
import { Platform } from "react-native";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
>>>>>>> origin/payments

export interface CarrierLocation {
  id: string;
  parcelId: string;
  carrierId: string;
  lat: number;
  lng: number;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
<<<<<<< HEAD
  timestamp: Date | string;
=======
  timestamp: Date;
>>>>>>> origin/payments
}

export function useCarrierLocation(parcelId?: string) {
  const { user } = useAuth();
<<<<<<< HEAD
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
=======
  const [carrierLocation, setCarrierLocation] = useState<CarrierLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (!parcelId) return;

    const locationsRef = collection(db, "carrierLocations");
    const q = query(
      locationsRef,
      where("parcelId", "==", parcelId),
      orderBy("timestamp", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const docData = snapshot.docs[0];
          const data = docData.data();
          const timestamp = data.timestamp instanceof Timestamp
            ? data.timestamp.toDate()
            : new Date(data.timestamp);

          setCarrierLocation({
            id: docData.id,
            parcelId: data.parcelId,
            carrierId: data.carrierId,
            lat: data.lat,
            lng: data.lng,
            heading: data.heading,
            speed: data.speed,
            accuracy: data.accuracy,
            timestamp,
          });
        }
      },
      (err) => {
        console.error("Error fetching carrier location:", err);
      }
    );

    return () => unsubscribe();
  }, [parcelId]);
>>>>>>> origin/payments

  const startTracking = useCallback(async (trackingParcelId: string) => {
    if (!user || Platform.OS === "web") return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
<<<<<<< HEAD
      if (status !== "granted") return;
=======
      if (status !== "granted") {
        console.log("Location permission denied");
        return;
      }
>>>>>>> origin/payments

      setIsTracking(true);

      const subscription = await Location.watchPositionAsync(
<<<<<<< HEAD
        { accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 50 },
        async (location) => {
          const { latitude, longitude, heading, speed, accuracy } = location.coords;
          try {
            await apiRequest("POST", `/api/parcels/${trackingParcelId}/carrier-location`, {
=======
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000,
          distanceInterval: 50,
        },
        async (location) => {
          const { latitude, longitude, heading, speed, accuracy } = location.coords;

          try {
            await addDoc(collection(db, "carrierLocations"), {
              parcelId: trackingParcelId,
              carrierId: user.uid,
>>>>>>> origin/payments
              lat: latitude,
              lng: longitude,
              heading: heading ?? null,
              speed: speed ?? null,
              accuracy: accuracy ?? null,
<<<<<<< HEAD
=======
              timestamp: serverTimestamp(),
>>>>>>> origin/payments
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
<<<<<<< HEAD
    carrierLocation: carrierLocation || null,
=======
    carrierLocation,
>>>>>>> origin/payments
    isTracking,
    startTracking,
    stopTracking,
  };
}
