import { z } from "zod";

export const adjustStockSchema = z
  .object({
    changedQuantity: z.number().int().optional(),
    newQuantity: z.number().int().min(0, "Stock cannot be negative").optional(),
    reason: z.enum([
      "INITIAL_STOCK",
      "SALE",
      "RESTOCK",
      "MANUAL_ADJUSTMENT",
      "RETURN",
      "DAMAGED",
      "CANCELLED_ORDER",
    ]),
    note: z.string().max(500).optional(),
  })
  .refine(
    (data) => data.changedQuantity !== undefined || data.newQuantity !== undefined,
    {
      message: "Either changedQuantity or newQuantity must be provided",
      path: ["changedQuantity"],
    }
  );

export const inventoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]).optional(),
  sortBy: z.enum(["stock", "productName", "sku", "updatedAt"]).default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type InventoryQueryParams = z.infer<typeof inventoryQuerySchema>;
