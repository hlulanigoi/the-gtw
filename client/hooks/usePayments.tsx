import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/lib/query-client";

export interface Payment {
  id: string;
  parcelId: string;
  senderId: string;
  carrierId: string;
  amount: number;
  currency: string;
  status: "pending" | "success" | "failed" | "cancelled";
  paystackReference?: string;
  paystackAccessCode?: string;
  paystackAuthorizationUrl?: string;
  paidAt?: Date;
  metadata?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentInitResponse {
  reference: string;
  access_code: string;
  authorization_url: string;
  paymentId: string;
}

export function usePayments() {
  const { getIdToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const API_URL = getApiUrl();

  const initializePayment = async (
    parcelId: string,
    carrierId: string
  ): Promise<PaymentInitResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getIdToken();
      const response = await fetch(`${API_URL}/api/payments/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ parcelId, carrierId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to initialize payment");
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error("Payment initialization error:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPayment = async (reference: string): Promise<any> => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getIdToken();
      const response = await fetch(`${API_URL}/api/payments/verify/${reference}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to verify payment");
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error("Payment verification error:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getUserPayments = async (userId: string): Promise<Payment[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getIdToken();
      const response = await fetch(`${API_URL}/api/payments/user/${userId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch payments");
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error("Fetch payments error:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getParcelPayment = async (parcelId: string): Promise<Payment | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getIdToken();
      const response = await fetch(`${API_URL}/api/payments/parcel/${parcelId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch payment");
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error("Fetch parcel payment error:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    initializePayment,
    verifyPayment,
    getUserPayments,
    getParcelPayment,
    isLoading,
    error,
  };
}
