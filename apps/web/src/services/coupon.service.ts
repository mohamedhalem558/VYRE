// apps/web/src/services/coupon.service.ts

import { apiClient } from "./apiClient.js";
import {
  CouponDTO,
  CreateCouponPayload,
  UpdateCouponPayload,
  ValidateCouponResult,
} from "@vyre/shared";

export const couponService = {
  /**
   * Validate a coupon code against current cart subtotal
   * Authoritative backend validation and discount calculation.
   */
  validateCoupon: async (code: string, subtotal: number): Promise<ValidateCouponResult> => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      data: ValidateCouponResult;
    }>("/coupons/validate", { code, subtotal });
    return res.data.data;
  },

  /**
   * List all coupons (Admin / Marketing Manager)
   */
  getCoupons: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    active?: boolean;
    type?: string;
  }): Promise<{ coupons: CouponDTO[]; total: number; page: number; totalPages: number }> => {
    const res = await apiClient.get<{
      success: boolean;
      data: { coupons: CouponDTO[]; total: number; page: number; totalPages: number };
    }>("/coupons", { params });
    return res.data.data;
  },

  /**
   * Get single coupon details
   */
  getCouponById: async (id: string): Promise<CouponDTO> => {
    const res = await apiClient.get<{ success: boolean; data: CouponDTO }>(`/coupons/${id}`);
    return res.data.data;
  },

  /**
   * Create a new coupon
   */
  createCoupon: async (payload: CreateCouponPayload): Promise<CouponDTO> => {
    const res = await apiClient.post<{ success: boolean; message: string; data: CouponDTO }>(
      "/coupons",
      payload
    );
    return res.data.data;
  },

  /**
   * Update an existing coupon
   */
  updateCoupon: async (id: string, payload: UpdateCouponPayload): Promise<CouponDTO> => {
    const res = await apiClient.patch<{ success: boolean; message: string; data: CouponDTO }>(
      `/coupons/${id}`,
      payload
    );
    return res.data.data;
  },

  /**
   * Delete a coupon
   */
  deleteCoupon: async (id: string): Promise<void> => {
    await apiClient.delete(`/coupons/${id}`);
  },
};
