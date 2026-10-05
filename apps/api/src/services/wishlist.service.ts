import { prisma } from "../config/prisma.js";
import { Product, ProductColor, ProductSize, WishlistSummary } from "@vyre/shared";

export class WishlistService {
  /**
   * Helper to format a database product into a canonical Product DTO
   */
  private formatProduct(raw: any): Product {
    const images: string[] = raw.images?.map((img: any) => img.url) || [];
    const primaryImage =
      images[0] ||
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop";
    const secondaryImage = images[1] || images[0];

    const sizesSet = new Set<string>();
    const colorsMap = new Map<string, ProductColor>();
    let totalStock = 0;

    raw.variants?.forEach((v: any) => {
      if (v.active) {
        totalStock += v.stock;
        if (v.size?.code) sizesSet.add(v.size.code);
        if (v.color?.name && !colorsMap.has(v.color.code)) {
          colorsMap.set(v.color.code, {
            id: v.color.id,
            name: v.color.name,
            code: v.color.code,
            hex: v.color.hexCode,
          });
        }
      }
    });

    const standardSizeOrder = ["XS", "S", "M", "L", "XL", "XXL"];
    const sizes = Array.from(sizesSet).sort(
      (a, b) => standardSizeOrder.indexOf(a) - standardSizeOrder.indexOf(b)
    ) as ProductSize[];

    const priceNum = Number(raw.price);
    const comparePriceNum = raw.compareAtPrice ? Number(raw.compareAtPrice) : undefined;
    const discountPercentage =
      comparePriceNum && comparePriceNum > priceNum
        ? Math.round(((comparePriceNum - priceNum) / comparePriceNum) * 100)
        : undefined;

    return {
      id: raw.id,
      slug: raw.slug,
      name: raw.name,
      description: raw.description,
      shortDescription: raw.shortDescription || "",
      price: priceNum,
      compareAtPrice: comparePriceNum,
      discountPercentage,
      category: raw.category?.name || "General",
      categorySlug: raw.category?.slug || "all",
      categoryId: raw.categoryId,
      brand: raw.brand || "VYRE",
      tags: raw.tags || [],
      isNewArrival: raw.newArrival,
      isBestSeller: raw.bestseller,
      isFeatured: raw.featured,
      active: raw.active,
      inStock: totalStock > 0,
      stockCount: totalStock,
      sizes: sizes.length > 0 ? sizes : (["S", "M", "L", "XL"] as ProductSize[]),
      colors: Array.from(colorsMap.values()),
      images: images.length > 0 ? images : [primaryImage],
      primaryImage,
      secondaryImage,
      rating: 5.0,
      reviewCount: 0,
      sku: raw.slug,
      createdAt: raw.createdAt.toISOString(),
      updatedAt: raw.updatedAt.toISOString(),
    };
  }

  /**
   * Get user's wishlist
   */
  async getWishlist(userId: string): Promise<WishlistSummary> {
    const items = await prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: true,
            images: { orderBy: { displayOrder: "asc" } },
            variants: {
              include: {
                color: true,
                size: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = items.map((item) => ({
      id: item.id,
      userId: item.userId,
      productId: item.productId,
      product: this.formatProduct(item.product),
      createdAt: item.createdAt.toISOString(),
    }));

    return {
      items: formatted,
      count: formatted.length,
    };
  }

  /**
   * Add product to wishlist
   */
  async addToWishlist(userId: string, productId: string): Promise<WishlistSummary> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    if (!product.active) {
      throw new Error("Product is currently unavailable");
    }

    // Upsert wishlist item
    await prisma.wishlistItem.upsert({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      update: {},
      create: {
        userId,
        productId,
      },
    });

    return this.getWishlist(userId);
  }

  /**
   * Remove product from wishlist
   */
  async removeFromWishlist(userId: string, productId: string): Promise<WishlistSummary> {
    await prisma.wishlistItem.deleteMany({
      where: {
        userId,
        productId,
      },
    });

    return this.getWishlist(userId);
  }
}

export const wishlistService = new WishlistService();
