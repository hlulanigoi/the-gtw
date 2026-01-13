import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/lib/api';

export interface Dispute {
  id: string;
  parcelId: string;
  complainantId: string;
  respondentId: string;
  subject: string;
  description: string;
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  resolution: string | null;
  refundAmount: number | null;
  refundedToWallet: boolean;
  adminId: string | null;
  resolvedAt: Date | null;
  autoCloseAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DisputeMessage {
  id: string;
  disputeId: string;
  senderId: string;
  message: string;
  attachmentUrl: string | null;
  isAdminMessage: boolean;
  createdAt: Date;
}

export function useDisputes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's disputes
  const { data: disputes = [], isLoading } = useQuery({
    queryKey: ['disputes', 'me', user?.uid],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/disputes/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch disputes');
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch specific dispute
  const getDispute = async (disputeId: string) => {
    if (!user) throw new Error('User not authenticated');
    const token = await user.getIdToken();
    const response = await fetch(`${API_URL}/disputes/${disputeId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch dispute');
    return response.json();
  };

  // Fetch dispute messages
  const getDisputeMessages = async (disputeId: string) => {
    if (!user) throw new Error('User not authenticated');
    const token = await user.getIdToken();
    const response = await fetch(`${API_URL}/disputes/${disputeId}/messages`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  };

  // Create dispute
  const createDisputeMutation = useMutation({
    mutationFn: async (data: {
      parcelId: string;
      respondentId: string;
      subject: string;
      description: string;
    }) => {
      if (!user) throw new Error('User not authenticated');
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/disputes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create dispute');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
    },
  });

  // Send dispute message
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      disputeId,
      message,
    }: {
      disputeId: string;
      message: string;
    }) => {
      if (!user) throw new Error('User not authenticated');
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/disputes/${disputeId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
  });

  return {
    disputes,
    isLoading,
    getDispute,
    getDisputeMessages,
    createDispute: createDisputeMutation.mutateAsync,
    sendMessage: sendMessageMutation.mutateAsync,
  };
}
