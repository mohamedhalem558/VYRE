export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export type InventoryReason =
  | "INITIAL_STOCK"
  | "SALE"
  | "RESTOCK"
  | "MANUAL_ADJUSTMENT"
  | "RETURN"
  | "DAMAGED"
  | "CANCELLED_ORDER";

export interface InventoryItemDTO {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  category: string;
  sku: string;
  color: {
    name: string;
    hexCode: string;
    code: string;
  };
  size: {
    name: string;
    code: string;
  };
  stock: number;
  lowStockThreshold: number;
  status: StockStatus;
  price: number;
  updatedAt: string;
}

export interface InventoryTransactionDTO {
  id: string;
  productId: string;
  variantId: string;
  productName?: string;
  sku?: string;
  previousQuantity: number;
  changedQuantity: number;
  newQuantity: number;
  reason: InventoryReason;
  userId?: string | null;
  userName?: string | null;
  metadata?: any;
  createdAt: string;
}

export interface InventoryMetrics {
  totalProducts: number;
  totalVariants: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalStockUnits: number;
}

export interface InventoryListResponse {
  items: InventoryItemDTO[];
  metrics: InventoryMetrics;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AdjustStockDTO {
  changedQuantity?: number;
  newQuantity?: number;
  reason: InventoryReason;
  note?: string;
}

export interface InventoryFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: StockStatus;
  sortBy?: "stock" | "productName" | "sku" | "updatedAt";
  sortOrder?: "asc" | "desc";
}
