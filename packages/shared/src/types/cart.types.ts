import { Product, ProductSize, ProductColor, ProductVariantDTO } from "./product.types.js";

export interface CartItem {
  id: string;
  cartId?: string;
  productId: string;
  variantId?: string;
  product: Product;
  variant?: ProductVariantDTO;
  selectedSize: ProductSize;
  selectedColor: ProductColor;
  quantity: number;
  unitPrice: number;
  priceSnapshot?: number;
  totalPrice: number;
  maxStock?: number;
}

export interface CouponDiscount {
  code: string;
  percentage: number;
  amount: number;
}

export interface CartSummary {
  id?: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  appliedCoupon?: CouponDiscount | null;
  shippingFee: number;
  isFreeShipping: boolean;
  freeShippingThreshold: number;
  total: number;
  currency: string;
}

export interface AddToCartDTO {
  productId: string;
  variantId?: string;
  size?: ProductSize | string;
  colorName?: string;
  quantity: number;
}

export interface UpdateCartItemDTO {
  quantity: number;
}

export interface MergeCartItemDTO {
  productId: string;
  variantId?: string;
  size?: ProductSize | string;
  colorName?: string;
  quantity: number;
}

export interface MergeCartDTO {
  items: MergeCartItemDTO[];
}
