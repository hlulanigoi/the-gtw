import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";

const CURRENT_USER_ID = "user-1";

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
  const queryClient = useQueryClient();

  const { data: connections = [], isLoading, error } = useQuery<Connection[]>({
    queryKey: ["/api/users", CURRENT_USER_ID, "connections"],
  });

  const addConnectionMutation = useMutation({
    mutationFn: async ({
      connectedUserId,
      connectionType,
      note,
    }: {
      connectedUserId: string;
      connectionType: ConnectionType;
      note?: string;
    }) => {
      const response = await apiRequest(
        "POST",
        `/api/users/${CURRENT_USER_ID}/connections`,
        {
          connectedUserId,
          connectionType,
          note,
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/users", CURRENT_USER_ID, "connections"],
      });
    },
  });

  const removeConnectionMutation = useMutation({
    mutationFn: async (connectedUserId: string) => {
      await apiRequest(
        "DELETE",
        `/api/users/${CURRENT_USER_ID}/connections/${connectedUserId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/users", CURRENT_USER_ID, "connections"],
      });
    },
  });

  const addConnection = (
    connectedUserId: string,
    connectionType: ConnectionType,
    note?: string
  ) => {
    return addConnectionMutation.mutateAsync({
      connectedUserId,
      connectionType,
      note,
    });
  };

  const removeConnection = (connectedUserId: string) => {
    return removeConnectionMutation.mutateAsync(connectedUserId);
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
