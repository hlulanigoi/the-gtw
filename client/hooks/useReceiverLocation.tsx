import { useState, useEffect, useCallback } from "react";
<<<<<<< HEAD
import * as Location from "expo-location";
import { Platform, Alert, Linking } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
=======
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import * as Location from "expo-location";
import { Platform, Alert, Linking } from "react-native";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
>>>>>>> origin/payments
import { apiRequest } from "@/lib/query-client";

export interface ReceiverLocation {
  id: string;
  parcelId: string;
  receiverId: string;
  lat: number;
  lng: number;
  accuracy?: number | null;
<<<<<<< HEAD
  timestamp: Date | string;
=======
  timestamp: Date;
>>>>>>> origin/payments
}

export function useReceiverLocation(parcelId?: string) {
  const { user } = useAuth();
<<<<<<< HEAD
=======
  const [receiverLocation, setReceiverLocation] = useState<ReceiverLocation | null>(null);
>>>>>>> origin/payments
  const [isSharing, setIsSharing] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);

<<<<<<< HEAD
  const { data: receiverLocation } = useQuery<ReceiverLocation | null>({
    queryKey: ["/api/parcels", parcelId, "receiver-location"],
    queryFn: async () => {
      if (!parcelId) return null;
      const response = (await apiRequest("GET", `/api/parcels/${parcelId}/receiver-location`)) as any;
      return response ? { ...response, timestamp: new Date(response.timestamp) } : null;
    },
    enabled: !!parcelId,
    refetchInterval: 10000,
  });
=======
  useEffect(() => {
    if (!parcelId) return;

    const locationsRef = collection(db, "receiverLocations");
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

          setReceiverLocation({
            id: docData.id,
            parcelId: data.parcelId,
            receiverId: data.receiverId,
            lat: data.lat,
            lng: data.lng,
            accuracy: data.accuracy,
            timestamp,
          });
        }
      },
      (err) => {
        console.error("Error fetching receiver location:", err);
      }
    );

    return () => unsubscribe();
  }, [parcelId]);
>>>>>>> origin/payments

  const checkPermission = useCallback(async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setPermissionStatus(status);
    return status;
  }, []);

  const requestPermission = useCallback(async () => {
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(status);
    
    if (status !== "granted" && !canAskAgain && Platform.OS !== "web") {
      Alert.alert(
        "Location Permission Required",
        "Please enable location access in your device settings to share your location with the carrier.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Open Settings", 
            onPress: async () => {
              try {
                await Linking.openSettings();
<<<<<<< HEAD
              } catch {}
=======
              } catch {
              }
>>>>>>> origin/payments
            }
          },
        ]
      );
    }
    
    return status;
  }, []);

  const shareLocationOnce = useCallback(async (sharingParcelId: string) => {
    if (!user) {
      setIsSharing(false);
      return null;
    }

    if (Platform.OS === "web") {
      Alert.alert("Not Available", "Location sharing is not available on web. Please use the mobile app.");
      return null;
    }

    try {
      const status = await requestPermission();
      if (status !== "granted") {
        setIsSharing(false);
        return null;
      }

      setIsSharing(true);

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude, accuracy } = location.coords;

<<<<<<< HEAD
      await apiRequest("POST", `/api/parcels/${sharingParcelId}/receiver-location`, {
        lat: latitude,
        lng: longitude,
        accuracy: accuracy ?? null,
      });

=======
      await addDoc(collection(db, "receiverLocations"), {
        parcelId: sharingParcelId,
        receiverId: user.uid,
        lat: latitude,
        lng: longitude,
        accuracy: accuracy ?? null,
        timestamp: serverTimestamp(),
      });

      try {
        await apiRequest("PATCH", `/api/parcels/${sharingParcelId}/receiver-location`, {
          lat: latitude,
          lng: longitude,
        });
      } catch (apiErr) {
        console.warn("Failed to sync receiver location with server:", apiErr);
      }

>>>>>>> origin/payments
      setIsSharing(false);
      return { lat: latitude, lng: longitude };
    } catch (err) {
      console.error("Error sharing location:", err);
      setIsSharing(false);
      return null;
    }
  }, [user, requestPermission]);

  const startContinuousSharing = useCallback(async (sharingParcelId: string) => {
    if (!user || Platform.OS === "web") {
      setIsSharing(false);
      return;
    }

    try {
      const status = await requestPermission();
      if (status !== "granted") {
        setIsSharing(false);
        return;
      }

      setIsSharing(true);

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000,
          distanceInterval: 25,
        },
        async (location) => {
          const { latitude, longitude, accuracy } = location.coords;

          try {
<<<<<<< HEAD
            await apiRequest("POST", `/api/parcels/${sharingParcelId}/receiver-location`, {
              lat: latitude,
              lng: longitude,
              accuracy: accuracy ?? null,
=======
            await addDoc(collection(db, "receiverLocations"), {
              parcelId: sharingParcelId,
              receiverId: user.uid,
              lat: latitude,
              lng: longitude,
              accuracy: accuracy ?? null,
              timestamp: serverTimestamp(),
            });

            apiRequest("PATCH", `/api/parcels/${sharingParcelId}/receiver-location`, {
              lat: latitude,
              lng: longitude,
>>>>>>> origin/payments
            }).catch(() => {});
          } catch (err) {
            console.error("Error updating receiver location:", err);
          }
        }
      );

      setLocationSubscription(subscription);
    } catch (err) {
      console.error("Error starting location sharing:", err);
      setIsSharing(false);
    }
  }, [user, requestPermission]);

  const stopSharing = useCallback(() => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    setIsSharing(false);
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
    receiverLocation: receiverLocation || null,
=======
    receiverLocation,
>>>>>>> origin/payments
    isSharing,
    permissionStatus,
    checkPermission,
    requestPermission,
    shareLocationOnce,
    startContinuousSharing,
    stopSharing,
  };
}
