import { apiClient } from "./apiClient.js";
import { WishlistSummary } from "@vyre/shared";

export const wishlistService = {
  /**
   * Fetch authenticated user's wishlist from PostgreSQL
   */
  getWishlist: async (): Promise<WishlistSummary> => {
    const res = await apiClient.get<{ success: boolean; data: WishlistSummary }>("/wishlist");
    return res.data.data;
  },

  /**
   * Add a product to the user's wishlist
   */
  addToWishlist: async (productId: string): Promise<WishlistSummary> => {
    const res = await apiClient.post<{ success: boolean; data: WishlistSummary }>(
      `/wishlist/${productId}`
    );
    return res.data.data;
  },

  /**
   * Remove a product from the user's wishlist
   */
  removeFromWishlist: async (productId: string): Promise<WishlistSummary> => {
    const res = await apiClient.delete<{ success: boolean; data: WishlistSummary }>(
      `/wishlist/${productId}`
    );
    return res.data.data;
  },
};
