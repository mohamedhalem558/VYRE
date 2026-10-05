import { apiClient } from "./apiClient.js";
import {
  CartSummary,
  CouponDiscount,
  AddToCartDTO,
  UpdateCartItemDTO,
  MergeCartDTO,
} from "@vyre/shared";


export const cartService = {
  /**
   * Fetch authenticated user's cart from PostgreSQL
   */
  getCart: async (): Promise<CartSummary> => {
    const res = await apiClient.get<{ success: boolean; data: CartSummary }>("/cart");
    return res.data.data;
  },

  /**
   * Add item to authenticated user's cart
   */
  addItem: async (input: AddToCartDTO): Promise<CartSummary> => {
    const res = await apiClient.post<{ success: boolean; data: CartSummary }>("/cart/items", input);
    return res.data.data;
  },

  /**
   * Update quantity of a cart item
   */
  updateQuantity: async (itemId: string, quantity: number): Promise<CartSummary> => {
    const res = await apiClient.patch<{ success: boolean; data: CartSummary }>(
      `/cart/items/${itemId}`,
      { quantity } as UpdateCartItemDTO
    );
    return res.data.data;
  },

  /**
   * Remove item from cart
   */
  removeItem: async (itemId: string): Promise<CartSummary> => {
    const res = await apiClient.delete<{ success: boolean; data: CartSummary }>(
      `/cart/items/${itemId}`
    );
    return res.data.data;
  },

  /**
   * Clear entire cart
   */
  clearCart: async (): Promise<CartSummary> => {
    const res = await apiClient.delete<{ success: boolean; data: CartSummary }>("/cart");
    return res.data.data;
  },

  /**
   * Merge guest cart into user's database cart upon login
   */
  mergeCart: async (input: MergeCartDTO): Promise<CartSummary> => {
    const res = await apiClient.post<{ success: boolean; data: CartSummary }>("/cart/merge", input);
    return res.data.data;
  },

  /**
   * Validate coupon code against authoritative backend
   */
  validateCoupon: async (code: string, subtotal: number): Promise<CouponDiscount | null> => {
    try {
      const res = await apiClient.post<{
        success: boolean;
        message: string;
        data: {
          valid: boolean;
          code: string;
          type: "PERCENTAGE" | "FIXED_AMOUNT";
          value: number;
          discountAmount: number;
          finalSubtotal: number;
          message: string;
        };
      }>("/coupons/validate", {
        code: code.trim(),
        subtotal,
      });

      const data = res.data.data;
      if (!data.valid) {
        return null;
      }

      const percentage =
        data.type === "PERCENTAGE"
          ? data.value
          : Math.round((data.discountAmount / (subtotal || 1)) * 100);

      return {
        code: data.code,
        percentage,
        amount: data.discountAmount,
      };
    } catch {
      return null;
    }
  },
};
