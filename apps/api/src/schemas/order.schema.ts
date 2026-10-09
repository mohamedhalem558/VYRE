import { z } from "zod";

export const shippingAddressSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  phoneNumber: z.string().min(8, "Phone number must be at least 8 characters").max(25),
  streetAddress: z.string().min(3, "Street address is required").max(200),
  buildingNumber: z.string().max(50).optional().or(z.literal("")),
  apartmentNumber: z.string().max(50).optional().or(z.literal("")),
  city: z.string().min(2, "City is required").max(100),
  governorate: z.string().min(2, "Governorate / Region is required").max(100),
  postalCode: z.string().max(20).optional().or(z.literal("")),
});

export const orderItemInputSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().optional().nullable(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const createOrderSchema = z.object({
  customerName: z.string().min(2, "Customer name is required").max(100),
  customerEmail: z.string().email("Valid customer email is required"),
  customerPhone: z.string().min(8, "Customer phone number is required").max(25),
  shippingAddress: shippingAddressSchema,
  billingAddress: shippingAddressSchema.optional(),
  paymentMethod: z
    .enum(["CASH_ON_DELIVERY", "CREDIT_CARD", "FAWRY", "VODAFONE_CASH", "INSTAPAY"])
    .default("CASH_ON_DELIVERY"),
  couponCode: z.string().max(50).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
  items: z.array(orderItemInputSchema).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "RETURNED",
    "REFUNDED",
  ]),
  notes: z.string().max(500).optional(),
  trackingNumber: z.string().max(100).optional(),
  estimatedDelivery: z.string().max(100).optional(),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(15),
  status: z
    .enum([
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "RETURNED",
      "REFUNDED",
    ])
    .optional(),
  search: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderQueryParams = z.infer<typeof orderQuerySchema>;
