import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/lib/api';

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'credit' | 'debit' | 'refund' | 'topup';
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  reference: string | null;
  parcelId: string | null;
  paystackReference: string | null;
  metadata: string | null;
  createdAt: Date;
}

export interface WalletTopupResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export function useWallet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isTopupModalVisible, setIsTopupModalVisible] = useState(false);

  // Fetch wallet balance
  const { data: balanceData, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['wallet', 'balance', user?.uid],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/wallet/balance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch balance');
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch wallet transactions
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['wallet', 'transactions', user?.uid],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/wallet/transactions?limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    enabled: !!user,
  });

  // Initialize top-up
  const topupMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!user) throw new Error('User not authenticated');
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/wallet/topup`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initialize top-up');
      }
      return response.json() as Promise<WalletTopupResponse>;
    },
  });

  // Verify top-up
  const verifyTopupMutation = useMutation({
    mutationFn: async (reference: string) => {
      if (!user) throw new Error('User not authenticated');
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/wallet/topup/verify/${reference}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to verify top-up');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });

  return {
    balance: balanceData?.balance || 0,
    transactions,
    isLoadingBalance,
    isLoadingTransactions,
    initializeTopup: topupMutation.mutateAsync,
    verifyTopup: verifyTopupMutation.mutateAsync,
    isTopupModalVisible,
    setIsTopupModalVisible,
  };
}
