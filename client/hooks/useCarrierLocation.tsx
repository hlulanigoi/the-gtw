import { useState, useEffect, useCallback } from "react";
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

export interface CarrierLocation {
  id: string;
  parcelId: string;
  carrierId: string;
  lat: number;
  lng: number;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
  timestamp: Date;
}

export function useCarrierLocation(parcelId?: string) {
  const { user } = useAuth();
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

  const startTracking = useCallback(async (trackingParcelId: string) => {
    if (!user || Platform.OS === "web") return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Location permission denied");
        return;
      }

      setIsTracking(true);

      const subscription = await Location.watchPositionAsync(
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
              lat: latitude,
              lng: longitude,
              heading: heading ?? null,
              speed: speed ?? null,
              accuracy: accuracy ?? null,
              timestamp: serverTimestamp(),
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
    carrierLocation,
    isTracking,
    startTracking,
    stopTracking,
  };
}
