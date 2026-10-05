export type ProductSize = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export interface ProductColor {
  id?: string;
  name: string;
  code?: string;
  hex: string;
  image?: string;
}

export interface SizeDTO {
  id: string;
  name: string;
  code: ProductSize | string;
  displayOrder: number;
  active: boolean;
}

export interface ColorDTO {
  id: string;
  name: string;
  code: string;
  hexCode: string;
  active: boolean;
}

export interface ProductImageDTO {
  id: string;
  url: string;
  altText?: string | null;
  displayOrder: number;
}

export interface ProductVariantDTO {
  id: string;
  productId: string;
  sku: string;
  colorId: string;
  color?: ColorDTO;
  sizeId: string;
  size?: SizeDTO;
  stock: number;
  lowStockThreshold: number;
  price?: number | null;
  compareAtPrice?: number | null;
  active: boolean;
}

export interface ProductReview {
  id: string;
  userName: string;
  userCity?: string;
  rating: number; // 1 to 5
  title?: string;
  comment: string;
  date: string;
  verifiedPurchase: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  description: string;
  shortDescription?: string;
  details?: string[];
  fabricCare?: string[];
  price: number; // in EGP
  compareAtPrice?: number; // in EGP
  discountPercentage?: number;
  category: string;
  categorySlug: string;
  categoryId?: string;
  brand?: string;
  tags: string[];
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  active?: boolean;
  inStock: boolean;
  stockCount: number;
  sizes: ProductSize[];
  colors: ProductColor[];
  images: string[];
  primaryImage: string;
  secondaryImage?: string;
  imageObjects?: ProductImageDTO[];
  variants?: ProductVariantDTO[];
  rating: number;
  reviewCount: number;
  reviews?: ProductReview[];
  sku: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  itemCount: number;
  displayOrder?: number;
  active?: boolean;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductFilterParams {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: ProductSize[];
  colors?: string[];
  inStockOnly?: boolean;
  sortBy?: "featured" | "newest" | "price-asc" | "price-desc" | "rating" | "price_asc" | "price_desc" | "best_seller";
  page?: number;
  limit?: number;
}

export interface CreateCategoryDTO {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  displayOrder?: number;
  active?: boolean;
}

export interface UpdateCategoryDTO {
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  displayOrder?: number;
  active?: boolean;
}

export interface CreateVariantInput {
  sku: string;
  colorId: string;
  sizeId: string;
  stock: number;
  lowStockThreshold?: number;
  price?: number;
  compareAtPrice?: number;
  active?: boolean;
}

export interface CreateProductImageInput {
  url: string;
  altText?: string;
  displayOrder?: number;
}

export interface CreateProductDTO {
  name: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  categoryId: string;
  brand?: string;
  active?: boolean;
  featured?: boolean;
  bestseller?: boolean;
  newArrival?: boolean;
  tags?: string[];
  images?: CreateProductImageInput[];
  variants?: CreateVariantInput[];
}

export interface UpdateProductDTO {
  name?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  price?: number;
  compareAtPrice?: number;
  categoryId?: string;
  brand?: string;
  active?: boolean;
  featured?: boolean;
  bestseller?: boolean;
  newArrival?: boolean;
  tags?: string[];
  images?: CreateProductImageInput[];
  variants?: CreateVariantInput[];
}
