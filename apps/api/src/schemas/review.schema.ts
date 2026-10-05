// apps/api/src/schemas/review.schema.ts

import { z } from "zod";

export const createReviewSchema = z.object({
  productId: z.string().uuid("Invalid productId UUID"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  comment: z
    .string()
    .min(3, "Review comment must be at least 3 characters")
    .max(2000, "Review comment cannot exceed 2000 characters"),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().min(3).max(2000).optional(),
  approved: z.boolean().optional(),
});

export const reviewQuerySchema = z.object({
  productId: z.string().uuid().optional(),
  approved: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
