// packages/shared/src/types/coupon.types.ts

export type CouponType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface CouponDTO {
  id: string;
  code: string;
  description?: string | null;
  type: CouponType;
  value: number;
  minimumOrderAmount?: number | null;
  maximumDiscount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  startDate: string;
  expiryDate?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponPayload {
  code: string;
  description?: string;
  type: CouponType;
  value: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  startDate?: string;
  expiryDate?: string;
  active?: boolean;
}

export type UpdateCouponPayload = Partial<CreateCouponPayload>;

export interface ValidateCouponPayload {
  code: string;
  subtotal: number;
}

export interface ValidateCouponResult {
  valid: boolean;
  couponId?: string;
  code: string;
  type: CouponType;
  value: number;
  discountAmount: number;
  finalSubtotal: number;
  message: string;
}

export interface CouponUsageDTO {
  id: string;
  couponId: string;
  userId: string;
  orderId?: string | null;
  discountAmount: number;
  usedAt: string;
}
