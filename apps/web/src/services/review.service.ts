// apps/web/src/services/review.service.ts

import { apiClient } from "./apiClient.js";
import {
  ReviewDTO,
  CreateReviewPayload,
  ProductReviewsResponse,
} from "@vyre/shared";

export const reviewService = {
  /**
   * Fetch approved reviews and aggregated metrics for a product
   */
  getProductReviews: async (productId: string): Promise<ProductReviewsResponse> => {
    const res = await apiClient.get<{ success: boolean; data: ProductReviewsResponse }>(
      `/reviews/product/${productId}`
    );
    return res.data.data;
  },

  /**
   * Submit a verified customer review
   */
  createReview: async (payload: CreateReviewPayload): Promise<ReviewDTO> => {
    const res = await apiClient.post<{ success: boolean; message: string; data: ReviewDTO }>(
      "/reviews",
      payload
    );
    return res.data.data;
  },

  /**
   * Admin: Fetch all reviews for moderation
   */
  getAdminReviews: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    approved?: boolean;
    rating?: number;
    productId?: string;
  }): Promise<{ reviews: ReviewDTO[]; total: number; page: number; totalPages: number }> => {
    const res = await apiClient.get<{
      success: boolean;
      data: { reviews: ReviewDTO[]; total: number; page: number; totalPages: number };
    }>("/reviews/admin", { params });
    return res.data.data;
  },

  /**
   * Admin: Approve or hide a review
   */
  toggleApproval: async (id: string): Promise<ReviewDTO> => {
    const res = await apiClient.patch<{
      success: boolean;
      message: string;
      data: ReviewDTO;
    }>(`/reviews/${id}/toggle`);
    return res.data.data;
  },

  /**
   * Admin: Delete a review
   */
  deleteReview: async (id: string): Promise<void> => {
    await apiClient.delete(`/reviews/${id}`);
  },
};
