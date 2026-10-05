import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().optional(),
  size: z.string().optional(),
  colorName: z.string().optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0, "Quantity must be non-negative"),
});

export const mergeCartSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1, "Product ID is required"),
      variantId: z.string().optional(),
      size: z.string().optional(),
      colorName: z.string().optional(),
      quantity: z.number().int().min(1, "Quantity must be at least 1"),
    })
  ),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type MergeCartInput = z.infer<typeof mergeCartSchema>;
