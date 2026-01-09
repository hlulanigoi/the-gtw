<<<<<<< HEAD
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
=======
import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
>>>>>>> origin/payments
import { useAuth } from "@/contexts/AuthContext";

type ConnectionType = "trusted_carrier" | "saved_contact";

type Connection = {
  id: string;
  userId: string;
  connectedUserId: string;
  connectionType: ConnectionType;
  note: string | null;
  createdAt: string;
  connectedUser: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    rating: number | null;
    verified: boolean | null;
  };
};

export function useConnections() {
  const { user } = useAuth();
<<<<<<< HEAD
  const queryClient = useQueryClient();

  const { data: connections = [], isLoading, error } = useQuery<Connection[]>({
    queryKey: ["/api/users", user?.uid, "connections"],
    queryFn: async () => {
      if (!user) return [];
      return ((await apiRequest("GET", `/api/users/${user.uid}/connections`)) as unknown) as Connection[];
    },
    enabled: !!user,
  });

  const addConnectionMutation = useMutation({
    mutationFn: async ({ connectedUserId, connectionType, note }: { connectedUserId: string; connectionType: ConnectionType; note?: string }) => {
      if (!user) throw new Error("User not authenticated");
      return apiRequest("POST", `/api/users/${user.uid}/connections`, {
        connectedUserId,
        connectionType,
        note: note || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.uid, "connections"] });
    },
  });

  const removeConnectionMutation = useMutation({
    mutationFn: async (connectedUserId: string) => {
      if (!user) throw new Error("User not authenticated");
      return apiRequest("DELETE", `/api/users/${user.uid}/connections/${connectedUserId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.uid, "connections"] });
    },
  });
=======
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (!user) {
      setConnections([]);
      setIsLoading(false);
      return;
    }

    const connectionsRef = collection(db, "connections");
    const q = query(connectionsRef, where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const connectionsData: Connection[] = [];

        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          
          let connectedUser = {
            id: data.connectedUserId,
            name: "Unknown User",
            email: "",
            phone: null as string | null,
            rating: null as number | null,
            verified: null as boolean | null,
          };

          if (data.connectedUserId) {
            const userDoc = await getDoc(doc(db, "users", data.connectedUserId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              connectedUser = {
                id: data.connectedUserId,
                name: userData.name || "Unknown User",
                email: userData.email || "",
                phone: userData.phone || null,
                rating: userData.rating || null,
                verified: userData.verified || null,
              };
            }
          }

          const createdAt = data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString();

          connectionsData.push({
            id: docSnapshot.id,
            userId: data.userId,
            connectedUserId: data.connectedUserId,
            connectionType: data.connectionType,
            note: data.note || null,
            createdAt,
            connectedUser,
          });
        }

        setConnections(connectionsData);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching connections:", err);
        setError(err as Error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);
>>>>>>> origin/payments

  const addConnection = async (
    connectedUserId: string,
    connectionType: ConnectionType,
    note?: string
  ) => {
<<<<<<< HEAD
    return addConnectionMutation.mutateAsync({ connectedUserId, connectionType, note });
  };

  const removeConnection = async (connectionId: string) => {
    return removeConnectionMutation.mutateAsync(connectionId);
=======
    if (!user) return;
    setIsAdding(true);

    try {
      await addDoc(collection(db, "connections"), {
        userId: user.uid,
        connectedUserId,
        connectionType,
        note: note || null,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error adding connection:", err);
      throw err;
    } finally {
      setIsAdding(false);
    }
  };

  const removeConnection = async (connectionId: string) => {
    setIsRemoving(true);
    try {
      await deleteDoc(doc(db, "connections", connectionId));
    } catch (err) {
      console.error("Error removing connection:", err);
      throw err;
    } finally {
      setIsRemoving(false);
    }
>>>>>>> origin/payments
  };

  const isConnected = (userId: string) => {
    return connections.some((c) => c.connectedUserId === userId);
  };

  const trustedCarriers = connections.filter(
    (c) => c.connectionType === "trusted_carrier"
  );
  const savedContacts = connections.filter(
    (c) => c.connectionType === "saved_contact"
  );

  return {
    connections,
    trustedCarriers,
    savedContacts,
    addConnection,
    removeConnection,
    isConnected,
    isLoading,
    error,
<<<<<<< HEAD
    isAdding: addConnectionMutation.isPending,
    isRemoving: removeConnectionMutation.isPending,
=======
    isAdding,
    isRemoving,
>>>>>>> origin/payments
  };
}
