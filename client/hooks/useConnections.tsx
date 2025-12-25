import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
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

  const addConnection = async (
    connectedUserId: string,
    connectionType: ConnectionType,
    note?: string
  ) => {
    return addConnectionMutation.mutateAsync({ connectedUserId, connectionType, note });
  };

  const removeConnection = async (connectionId: string) => {
    return removeConnectionMutation.mutateAsync(connectionId);
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
    isAdding: addConnectionMutation.isPending,
    isRemoving: removeConnectionMutation.isPending,
  };
}
