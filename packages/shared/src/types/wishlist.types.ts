import { Product } from "./product.types.js";

export interface WishlistItemDTO {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  createdAt: string;
}

export interface WishlistSummary {
  items: WishlistItemDTO[];
  count: number;
}
