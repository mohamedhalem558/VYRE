import { Address } from "./user.types.js";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"
  | "REFUNDED";

export type PaymentMethod =
  | "CASH_ON_DELIVERY"
  | "CREDIT_CARD"
  | "FAWRY"
  | "VODAFONE_CASH"
  | "INSTAPAY";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface OrderItemDTO {
  id: string;
  orderId?: string;
  productId: string;
  variantId?: string | null;
  productName: string;
  productSlug: string;
  productImage?: string | null;
  sizeName: string;
  colorName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface ShippingRateDTO {
  id: string;
  region: string; // "Cairo", "Giza", "Other Egypt"
  displayName: string;
  fee: number;
  estimatedDays: string;
  freeAbove?: number | null;
  active: boolean;
}

export interface ShippingAddressInput {
  fullName: string;
  phoneNumber: string;
  streetAddress: string;
  buildingNumber?: string;
  apartmentNumber?: string;
  city: string;
  governorate: string; // "Cairo", "Giza", "Other Egypt"
  postalCode?: string;
}

export interface CreateOrderDTO {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddressInput;
  billingAddress?: ShippingAddressInput;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  notes?: string;
}

export interface UpdateOrderStatusDTO {
  status: OrderStatus;
  notes?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export interface OrderDTO {
  id: string;
  orderNumber: string;
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItemDTO[];
  shippingAddress: Address | ShippingAddressInput;
  billingAddress?: Address | ShippingAddressInput | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  subtotal: number;
  discount: number;
  couponCode?: string | null;
  shippingFee: number;
  total: number;
  currency: string;
  notes?: string | null;
  trackingNumber?: string | null;
  estimatedDelivery?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListResponse {
  orders: OrderDTO[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  search?: string;
}
