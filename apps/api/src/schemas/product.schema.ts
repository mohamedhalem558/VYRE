import { z } from "zod";

export const createProductVariantSchema = z.object({
  sku: z.string().min(3).max(100),
  colorId: z.string().uuid("Invalid colorId UUID"),
  sizeId: z.string().uuid("Invalid sizeId UUID"),
  stock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  price: z.number().positive().optional(),
  compareAtPrice: z.number().positive().optional(),
  active: z.boolean().default(true),
});

export const createProductImageSchema = z.object({
  url: z.string().url("Valid image URL required"),
  altText: z.string().max(255).optional(),
  displayOrder: z.number().int().default(0),
});

export const createProductSchema = z.object({
  name: z.string().min(2, "Product name is required").max(200),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  shortDescription: z.string().max(500).optional(),
  price: z.number().positive("Price must be greater than 0"),
  compareAtPrice: z.number().positive().optional(),
  categoryId: z.string().uuid("Valid categoryId UUID required"),
  brand: z.string().default("VYRE"),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  bestseller: z.boolean().default(false),
  newArrival: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  images: z.array(createProductImageSchema).optional(),
  variants: z.array(createProductVariantSchema).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
  search: z.string().optional(),
  category: z.string().optional(), // can be categoryId or slug
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  size: z.string().optional(), // size code or id (e.g., M, L, XL)
  color: z.string().optional(), // color code or id (e.g., BLK, WHT)
  inStock: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  featured: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  bestseller: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  newArrival: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  sort: z
    .enum(["newest", "price_asc", "price_desc", "featured", "best_seller", "price-asc", "price-desc"])
    .default("newest"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryParams = z.infer<typeof productQuerySchema>;
