// packages/shared/src/types/review.types.ts

export interface ReviewDTO {
  id: string;
  productId: string;
  productName?: string;
  productImage?: string | null;
  userId?: string | null;
  authorName: string;
  rating: number; // 1 to 5
  comment: string;
  verified: boolean;
  approved: boolean;
  orderId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewPayload {
  productId: string;
  rating: number;
  comment: string;
}

export interface ReviewStatsDTO {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface ProductReviewsResponse {
  reviews: ReviewDTO[];
  stats: ReviewStatsDTO;
  userCanReview?: boolean;
}
