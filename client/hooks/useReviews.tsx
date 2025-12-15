import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl, apiRequest } from "@/lib/query-client";

export interface Review {
  id: string;
  parcelId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string | null;
  reviewType: string;
  createdAt: Date;
  reviewer: {
    id: string;
    name: string;
    rating: number | null;
  };
}

export function useReviews(userId?: string) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const targetUserId = userId || user?.uid;

  const fetchReviews = async () => {
    if (!targetUserId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        new URL(`/api/users/${targetUserId}/reviews`, getApiUrl()).toString()
      );
      if (!response.ok) throw new Error("Failed to fetch reviews");
      const data = await response.json();
      setReviews(
        data.map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt),
        }))
      );
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [targetUserId]);

  const submitReview = async (
    parcelId: string,
    revieweeId: string,
    rating: number,
    comment: string,
    reviewType: "sender_to_transporter" | "transporter_to_sender"
  ) => {
    const response = await apiRequest("POST", "/api/reviews", {
      parcelId,
      revieweeId,
      rating,
      comment: comment || null,
      reviewType,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to submit review");
    }

    const newReview = await response.json();
    await fetchReviews();
    return newReview;
  };

  const hasReviewedParcel = (parcelId: string) => {
    return reviews.some((r) => r.parcelId === parcelId);
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  return {
    reviews,
    isLoading,
    error,
    submitReview,
    refetch: fetchReviews,
    averageRating,
    reviewCount: reviews.length,
    hasReviewedParcel,
  };
}
