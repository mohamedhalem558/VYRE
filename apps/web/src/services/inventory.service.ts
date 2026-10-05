import { apiClient } from "./apiClient.js";
import {
  InventoryFilterParams,
  InventoryItemDTO,
  InventoryListResponse,
  InventoryTransactionDTO,
  AdjustStockDTO,
} from "@vyre/shared";

export const inventoryService = {
  /**
   * Get paginated inventory items with metrics
   */
  getInventory: async (params?: InventoryFilterParams): Promise<InventoryListResponse> => {
    const res = await apiClient.get<{ success: boolean; data: InventoryListResponse }>(
      "/inventory",
      { params }
    );
    return res.data.data;
  },

  /**
   * Get low-stock items
   */
  getLowStock: async (): Promise<InventoryItemDTO[]> => {
    const res = await apiClient.get<{ success: boolean; data: { items: InventoryItemDTO[]; count: number } }>(
      "/inventory/low-stock"
    );
    return res.data.data.items;
  },

  /**
   * Get out-of-stock items
   */
  getOutOfStock: async (): Promise<InventoryItemDTO[]> => {
    const res = await apiClient.get<{ success: boolean; data: { items: InventoryItemDTO[]; count: number } }>(
      "/inventory/out-of-stock"
    );
    return res.data.data.items;
  },

  /**
   * Get audit history for a specific variant
   */
  getVariantHistory: async (variantId: string): Promise<InventoryTransactionDTO[]> => {
    const res = await apiClient.get<{
      success: boolean;
      data: { history: InventoryTransactionDTO[]; count: number };
    }>(`/inventory/${variantId}/history`);
    return res.data.data.history;
  },

  /**
   * Adjust variant stock
   */
  adjustStock: async (
    variantId: string,
    data: AdjustStockDTO
  ): Promise<{ variant: InventoryItemDTO; transaction: InventoryTransactionDTO }> => {
    const res = await apiClient.post<{
      success: boolean;
      data: { variant: InventoryItemDTO; transaction: InventoryTransactionDTO };
    }>(`/inventory/${variantId}/adjust`, data);
    return res.data.data;
  },
};
