<<<<<<< HEAD
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
=======
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
>>>>>>> origin/payments
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
<<<<<<< HEAD
  photoUrl?: string | null;
=======
>>>>>>> origin/payments
}

export function useParcels() {
  const { user, userProfile } = useAuth();
<<<<<<< HEAD
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
=======
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

          const pickupWindowEnd = data.pickupWindowEnd instanceof Timestamp
            ? data.pickupWindowEnd.toDate()
            : data.pickupWindowEnd ? new Date(data.pickupWindowEnd) : null;

          const deliveryWindowStart = data.deliveryWindowStart instanceof Timestamp
            ? data.deliveryWindowStart.toDate()
            : data.deliveryWindowStart ? new Date(data.deliveryWindowStart) : null;

          const deliveryWindowEnd = data.deliveryWindowEnd instanceof Timestamp
            ? data.deliveryWindowEnd.toDate()
            : data.deliveryWindowEnd ? new Date(data.deliveryWindowEnd) : null;

          const expiresAt = data.expiresAt instanceof Timestamp
            ? data.expiresAt.toDate()
            : data.expiresAt ? new Date(data.expiresAt) : null;

          const deliveryConfirmedAt = data.deliveryConfirmedAt instanceof Timestamp
            ? data.deliveryConfirmedAt.toDate()
            : data.deliveryConfirmedAt ? new Date(data.deliveryConfirmedAt) : null;

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
            pickupWindowEnd,
            deliveryWindowStart,
            deliveryWindowEnd,
            expiresAt,
            declaredValue: data.declaredValue,
            insuranceNeeded: data.insuranceNeeded,
            contactPhone: data.contactPhone,
            status: data.status || "Pending",
            senderId: data.senderId,
            transporterId: data.transporterId,
            senderName,
            senderRating,
            createdAt,
            isOwner: user?.uid === data.senderId,
            isTransporting: user?.uid === data.transporterId,
            receiverId: data.receiverId || null,
            receiverName: data.receiverName || null,
            receiverPhone: data.receiverPhone || null,
            receiverEmail: data.receiverEmail || null,
            deliveryConfirmed: data.deliveryConfirmed || false,
            deliveryConfirmedAt,
            deliveryProofPhoto: data.deliveryProofPhoto || null,
            receiverRating: data.receiverRating || null,
            isReceiver: user?.uid === data.receiverId || 
              (userProfile?.email && data.receiverEmail && 
               userProfile.email.toLowerCase() === data.receiverEmail.toLowerCase()),
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
  }, [user?.uid, userProfile?.email]);

  const addParcel = async (
    parcel: Omit<Parcel, "id" | "senderName" | "senderRating" | "createdAt" | "status" | "transporterId" | "isOwner" | "isTransporting" | "senderId">
  ) => {
    if (!user) return;

    try {
      const parcelData: any = {
        origin: parcel.origin,
        destination: parcel.destination,
        originLat: parcel.originLat ?? null,
        originLng: parcel.originLng ?? null,
        destinationLat: parcel.destinationLat ?? null,
        destinationLng: parcel.destinationLng ?? null,
        intermediateStops: parcel.intermediateStops ?? null,
        size: parcel.size,
        weight: parcel.weight ?? null,
        description: parcel.description ?? null,
        specialInstructions: parcel.specialInstructions ?? null,
        isFragile: parcel.isFragile === true,
        compensation: parcel.compensation,
        pickupDate: Timestamp.fromDate(parcel.pickupDate instanceof Date ? parcel.pickupDate : new Date(parcel.pickupDate)),
        pickupWindowEnd: parcel.pickupWindowEnd ? Timestamp.fromDate(parcel.pickupWindowEnd instanceof Date ? parcel.pickupWindowEnd : new Date(parcel.pickupWindowEnd)) : null,
        deliveryWindowStart: parcel.deliveryWindowStart ? Timestamp.fromDate(parcel.deliveryWindowStart instanceof Date ? parcel.deliveryWindowStart : new Date(parcel.deliveryWindowStart)) : null,
        deliveryWindowEnd: parcel.deliveryWindowEnd ? Timestamp.fromDate(parcel.deliveryWindowEnd instanceof Date ? parcel.deliveryWindowEnd : new Date(parcel.deliveryWindowEnd)) : null,
        expiresAt: parcel.expiresAt ? Timestamp.fromDate(parcel.expiresAt instanceof Date ? parcel.expiresAt : new Date(parcel.expiresAt)) : null,
        declaredValue: parcel.declaredValue ?? null,
        insuranceNeeded: parcel.insuranceNeeded === true,
        contactPhone: parcel.contactPhone ?? null,
        senderId: user.uid,
        status: "Pending",
        transporterId: null,
        createdAt: serverTimestamp(),
        receiverId: parcel.receiverId ?? null,
        receiverName: parcel.receiverName ?? null,
        receiverPhone: parcel.receiverPhone ?? null,
        receiverEmail: parcel.receiverEmail ?? null,
        deliveryConfirmed: false,
        deliveryConfirmedAt: null,
        deliveryProofPhoto: null,
        receiverRating: null,
      };

      await addDoc(collection(db, "parcels"), parcelData);
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
      delete updateData.isReceiver;
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

  const confirmDelivery = async (id: string, proofPhotoUrl?: string) => {
    if (!user) return;

    try {
      const parcelRef = doc(db, "parcels", id);
      await updateDoc(parcelRef, {
        deliveryConfirmed: true,
        deliveryConfirmedAt: serverTimestamp(),
        deliveryProofPhoto: proofPhotoUrl || null,
        status: "Delivered",
      });
    } catch (err) {
      console.error("Error confirming delivery:", err);
      throw err;
    }
  };

  const rateCarrierAsReceiver = async (id: string, rating: number) => {
    if (!user) return;

    try {
      const parcelRef = doc(db, "parcels", id);
      await updateDoc(parcelRef, {
        receiverRating: rating,
      });
    } catch (err) {
      console.error("Error rating carrier:", err);
      throw err;
    }
  };

  const refetch = () => {
>>>>>>> origin/payments
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
