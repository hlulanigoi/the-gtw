import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Parcel {
  id: string;
  origin: string;
  destination: string;
  intermediateStops?: string[];
  size: "small" | "medium" | "large";
  weight?: number;
  description?: string;
  specialInstructions?: string;
  isFragile?: boolean;
  compensation: number;
  pickupDate: Date;
  status: "Pending" | "In Transit" | "Delivered";
  isOwner: boolean;
  isTransporting: boolean;
  senderName: string;
  senderRating: number;
}

interface ParcelsContextType {
  parcels: Parcel[];
  addParcel: (parcel: Omit<Parcel, "id">) => void;
  updateParcel: (id: string, updates: Partial<Parcel>) => void;
  acceptParcel: (id: string) => void;
}

const ParcelsContext = createContext<ParcelsContextType | undefined>(undefined);

const initialParcels: Parcel[] = [
  {
    id: "1",
    origin: "Boksburg",
    destination: "Kempton Park",
    intermediateStops: ["Edenvale"],
    size: "small",
    weight: 2.5,
    description: "Documents and small electronics",
    compensation: 75,
    pickupDate: new Date(Date.now() + 86400000),
    status: "Pending",
    isOwner: false,
    isTransporting: false,
    senderName: "Sarah M",
    senderRating: 4.8,
  },
  {
    id: "2",
    origin: "Johannesburg CBD",
    destination: "Sandton",
    size: "medium",
    weight: 5,
    description: "Office supplies and books",
    compensation: 120,
    pickupDate: new Date(Date.now() + 172800000),
    status: "Pending",
    isOwner: false,
    isTransporting: false,
    senderName: "Michael K",
    senderRating: 4.5,
  },
  {
    id: "3",
    origin: "Pretoria",
    destination: "Midrand",
    intermediateStops: ["Centurion"],
    size: "large",
    weight: 15,
    description: "Furniture items - handle with care",
    specialInstructions: "Fragile items, please handle carefully",
    isFragile: true,
    compensation: 250,
    pickupDate: new Date(Date.now() + 259200000),
    status: "Pending",
    isOwner: false,
    isTransporting: false,
    senderName: "David L",
    senderRating: 4.9,
  },
  {
    id: "4",
    origin: "Benoni",
    destination: "Germiston",
    size: "small",
    compensation: 50,
    pickupDate: new Date(Date.now() + 43200000),
    status: "Pending",
    isOwner: false,
    isTransporting: false,
    senderName: "Linda P",
    senderRating: 4.7,
  },
  {
    id: "5",
    origin: "Randburg",
    destination: "Roodepoort",
    intermediateStops: ["Northgate"],
    size: "medium",
    weight: 8,
    description: "Sports equipment",
    compensation: 100,
    pickupDate: new Date(Date.now() + 345600000),
    status: "Pending",
    isOwner: false,
    isTransporting: false,
    senderName: "James R",
    senderRating: 4.6,
  },
];

export function ParcelsProvider({ children }: { children: ReactNode }) {
  const [parcels, setParcels] = useState<Parcel[]>(initialParcels);

  const addParcel = (parcel: Omit<Parcel, "id">) => {
    const newParcel: Parcel = {
      ...parcel,
      id: Date.now().toString(),
    };
    setParcels((prev) => [newParcel, ...prev]);
  };

  const updateParcel = (id: string, updates: Partial<Parcel>) => {
    setParcels((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const acceptParcel = (id: string) => {
    setParcels((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, isTransporting: true, status: "In Transit" } : p
      )
    );
  };

  return (
    <ParcelsContext.Provider
      value={{ parcels, addParcel, updateParcel, acceptParcel }}
    >
      {children}
    </ParcelsContext.Provider>
  );
}

export function useParcels() {
  const context = useContext(ParcelsContext);
  if (!context) {
    throw new Error("useParcels must be used within a ParcelsProvider");
  }
  return context;
}
