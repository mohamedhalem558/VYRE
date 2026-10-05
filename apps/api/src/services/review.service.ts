// apps/api/src/services/review.service.ts

import { Prisma, OrderStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import {
  ReviewDTO,
  CreateReviewPayload,
  ReviewStatsDTO,
  ProductReviewsResponse,
} from "@vyre/shared";

function formatReview(r: any): ReviewDTO {
  return {
    id: r.id,
    productId: r.productId,
    productName: r.product?.name,
    productImage: r.product?.images?.[0]?.url || null,
    userId: r.userId,
    authorName: r.authorName,
    rating: r.rating,
    comment: r.comment,
    verified: r.verified,
    approved: r.approved,
    orderId: r.orderId,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export class ReviewService {
  /**
   * Submit a verified customer review
   * Rule: ONLY customers who purchased the product can submit a verified review.
   */
  async createReview(userId: string, input: CreateReviewPayload): Promise<ReviewDTO> {
    // 1. Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: input.productId },
      select: { id: true, name: true, active: true },
    });

    if (!product) {
      const err: any = new Error("Product not found.");
      err.status = 404;
      throw err;
    }

    // 2. Authoritative Verified Purchaser Verification
    const purchase = await prisma.orderItem.findFirst({
      where: {
        productId: input.productId,
        order: {
          userId,
          orderStatus: { not: OrderStatus.CANCELLED },
        },
      },
      select: { orderId: true },
    });

    if (!purchase) {
      const err: any = new Error(
        "Only customers who have purchased this product can submit a verified review."
      );
      err.status = 403;
      throw err;
    }

    // 3. Prevent duplicate spam reviews for the same order/product
    const existingReview = await prisma.review.findFirst({
      where: {
        productId: input.productId,
        userId,
      },
    });

    if (existingReview) {
      const err: any = new Error("You have already submitted a review for this product.");
      err.status = 409;
      throw err;
    }

    // 4. Retrieve author's name
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    const authorName = user
      ? `${user.firstName} ${user.lastName ? user.lastName.charAt(0) + "." : ""}`.trim()
      : "Verified Buyer";

    // 5. Create Review
    const review = await prisma.review.create({
      data: {
        productId: input.productId,
        userId,
        orderId: purchase.orderId,
        authorName,
        rating: input.rating,
        comment: input.comment.trim(),
        verified: true,
        approved: true, // auto-approved or can be moderated
      },
      include: {
        product: {
          select: { name: true, images: { take: 1, orderBy: { displayOrder: "asc" } } },
        },
      },
    });

    return formatReview(review);
  }

  /**
   * Public Product Reviews & Aggregate Rating Metrics
   */
  async getProductReviews(
    productId: string,
    currentUserId?: string
  ): Promise<ProductReviewsResponse> {
    const reviews = await prisma.review.findMany({
      where: {
        productId,
        approved: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute distribution and average
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalScore = 0;

    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, r.rating));
      distribution[star] = (distribution[star] || 0) + 1;
      totalScore += r.rating;
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0 ? Math.round((totalScore / totalReviews) * 10) / 10 : 5.0;

    // Check if the current user can leave a review
    let userCanReview = false;
    if (currentUserId) {
      const [hasPurchased, hasReviewed] = await Promise.all([
        prisma.orderItem.findFirst({
          where: {
            productId,
            order: {
              userId: currentUserId,
              orderStatus: { not: OrderStatus.CANCELLED },
            },
          },
          select: { id: true },
        }),
        prisma.review.findFirst({
          where: {
            productId,
            userId: currentUserId,
          },
          select: { id: true },
        }),
      ]);

      userCanReview = Boolean(hasPurchased && !hasReviewed);
    }

    return {
      reviews: reviews.map(formatReview),
      stats: {
        averageRating,
        totalReviews,
        ratingDistribution: distribution as any,
      },
      userCanReview,
    };
  }

  /**
   * Admin: List all reviews with filters, search, and pagination
   */
  async getAdminReviews(params: {
    productId?: string;
    approved?: boolean;
    rating?: number;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ reviews: ReviewDTO[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {};

    if (params.productId) {
      where.productId = params.productId;
    }

    if (params.approved !== undefined) {
      where.approved = params.approved;
    }

    if (params.rating) {
      where.rating = params.rating;
    }

    if (params.search && params.search.trim()) {
      const s = params.search.trim();
      where.OR = [
        { comment: { contains: s, mode: "insensitive" } },
        { authorName: { contains: s, mode: "insensitive" } },
        { product: { name: { contains: s, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: { name: true, images: { take: 1, orderBy: { displayOrder: "asc" } } },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return {
      reviews: items.map(formatReview),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Admin: Toggle review approval (approve / hide)
   */
  async toggleApproval(id: string, adminUserId?: string): Promise<ReviewDTO> {
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        product: {
          select: { name: true, images: { take: 1, orderBy: { displayOrder: "asc" } } },
        },
      },
    });

    if (!review) {
      const err: any = new Error("Review not found.");
      err.status = 404;
      throw err;
    }

    const updated = await prisma.review.update({
      where: { id },
      data: { approved: !review.approved },
      include: {
        product: {
          select: { name: true, images: { take: 1, orderBy: { displayOrder: "asc" } } },
        },
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: adminUserId || null,
          action: updated.approved ? "REVIEW_APPROVED" : "REVIEW_HIDDEN",
          entity: "Review",
          entityId: id,
          metadata: { rating: updated.rating, productId: updated.productId },
        },
      });
    } catch {
      // Non-fatal
    }

    return formatReview(updated);
  }

  /**
   * Admin: Delete review
   */
  async deleteReview(id: string, adminUserId?: string): Promise<void> {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      const err: any = new Error("Review not found.");
      err.status = 404;
      throw err;
    }

    await prisma.review.delete({ where: { id } });

    try {
      await prisma.auditLog.create({
        data: {
          userId: adminUserId || null,
          action: "REVIEW_DELETED",
          entity: "Review",
          entityId: id,
        },
      });
    } catch {
      // Non-fatal
    }
  }
}

export const reviewService = new ReviewService();
