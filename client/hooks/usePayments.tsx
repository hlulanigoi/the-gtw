import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/query-client";
import { useAuth } from "@/contexts/AuthContext";

export interface Payment {
  id: string;
  parcelId: string;
  userId: string;
  reference: string;
  amount: number;
  platformFee: number;
  totalAmount: number;
  status: "pending" | "success" | "failed" | "cancelled";
  paymentMethod: string;
  paystackData?: string;
  createdAt: Date;
  updatedAt: Date;
}

export function usePayments() {
  const { user } = useAuth();

  const { data: payments = [], isLoading, error } = useQuery<Payment[]>({
    queryKey: ["/api/payments/history"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user?.uid,
  });

  const mappedPayments = (payments || []).map((p: any) => ({
    ...p,
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.updatedAt),
  }));

  return { payments: mappedPayments, isLoading, error };
}
