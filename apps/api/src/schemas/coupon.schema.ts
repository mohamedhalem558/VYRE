// apps/api/src/schemas/coupon.schema.ts

import { z } from "zod";

export const createCouponSchema = z.object({
  code: z
    .string()
    .min(3, "Coupon code must be at least 3 characters")
    .max(50, "Coupon code cannot exceed 50 characters")
    .regex(/^[A-Za-z0-9_-]+$/, "Coupon code can only contain letters, numbers, hyphens, and underscores")
    .transform((val) => val.trim().toUpperCase()),
  description: z.string().max(255).optional(),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).default("PERCENTAGE"),
  value: z.number().positive("Coupon value must be greater than 0"),
  minimumOrderAmount: z.number().nonnegative().optional(),
  maximumDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional().nullable(),
  active: z.boolean().default(true),
});

export const updateCouponSchema = createCouponSchema.partial();

export const validateCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required").transform((val) => val.trim().toUpperCase()),
  subtotal: z.number().nonnegative("Subtotal must be a positive number"),
});

export const couponQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  active: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).optional(),
});
