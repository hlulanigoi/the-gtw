import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
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
  status: "Pending" | "In Transit" | "Delivered";
  senderId: string;
  transporterId?: string | null;
  senderName: string;
  senderRating: number | null;
  createdAt?: Date;
  isOwner?: boolean;
  isTransporting?: boolean;
}

export function useParcels() {
  const { user, userProfile } = useAuth();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const parcelsRef = collection(db, "parcels");
    const q = query(parcelsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const parcelsData: Parcel[] = [];
        
        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          let senderName = "Unknown";
          let senderRating: number | null = null;

          if (data.senderId) {
            const senderDoc = await getDoc(doc(db, "users", data.senderId));
            if (senderDoc.exists()) {
              const senderData = senderDoc.data();
              senderName = senderData.name || "Unknown";
              senderRating = senderData.rating || null;
            }
          }

          const pickupDate = data.pickupDate instanceof Timestamp
            ? data.pickupDate.toDate()
            : new Date(data.pickupDate);

          const createdAt = data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : data.createdAt ? new Date(data.createdAt) : new Date();

          parcelsData.push({
            id: docSnapshot.id,
            origin: data.origin,
            destination: data.destination,
            originLat: data.originLat,
            originLng: data.originLng,
            destinationLat: data.destinationLat,
            destinationLng: data.destinationLng,
            intermediateStops: data.intermediateStops,
            size: data.size,
            weight: data.weight,
            description: data.description,
            specialInstructions: data.specialInstructions,
            isFragile: data.isFragile,
            compensation: data.compensation,
            pickupDate,
            status: data.status || "Pending",
            senderId: data.senderId,
            transporterId: data.transporterId,
            senderName,
            senderRating,
            createdAt,
            isOwner: user?.uid === data.senderId,
            isTransporting: user?.uid === data.transporterId,
          });
        }

        setParcels(parcelsData);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching parcels:", err);
        setError(err as Error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const addParcel = async (
    parcel: Omit<Parcel, "id" | "senderName" | "senderRating" | "createdAt" | "status" | "transporterId" | "isOwner" | "isTransporting">
  ) => {
    if (!user) return;

    try {
      await addDoc(collection(db, "parcels"), {
        ...parcel,
        pickupDate: Timestamp.fromDate(parcel.pickupDate instanceof Date ? parcel.pickupDate : new Date(parcel.pickupDate)),
        senderId: user.uid,
        status: "Pending",
        transporterId: null,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error adding parcel:", err);
      throw err;
    }
  };

  const updateParcel = async (id: string, updates: Partial<Parcel>) => {
    try {
      const parcelRef = doc(db, "parcels", id);
      const updateData: any = { ...updates };
      
      if (updates.pickupDate) {
        updateData.pickupDate = Timestamp.fromDate(
          updates.pickupDate instanceof Date ? updates.pickupDate : new Date(updates.pickupDate)
        );
      }

      delete updateData.isOwner;
      delete updateData.isTransporting;
      delete updateData.senderName;
      delete updateData.senderRating;

      await updateDoc(parcelRef, updateData);
    } catch (err) {
      console.error("Error updating parcel:", err);
      throw err;
    }
  };

  const acceptParcel = async (id: string) => {
    if (!user) return;

    try {
      const parcelRef = doc(db, "parcels", id);
      await updateDoc(parcelRef, {
        transporterId: user.uid,
        status: "In Transit",
      });
    } catch (err) {
      console.error("Error accepting parcel:", err);
      throw err;
    }
  };

  const deleteParcel = async (id: string) => {
    try {
      await deleteDoc(doc(db, "parcels", id));
    } catch (err) {
      console.error("Error deleting parcel:", err);
      throw err;
    }
  };

  const refetch = () => {
  };

  return {
    parcels,
    addParcel,
    updateParcel,
    acceptParcel,
    deleteParcel,
    isLoading,
    error,
    refetch,
  };
}
