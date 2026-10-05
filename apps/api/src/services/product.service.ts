import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { CreateProductInput, ProductQueryParams, UpdateProductInput } from "../schemas/product.schema.js";
import { ProductSize, ProductColor, Product } from "@vyre/shared";

export class ProductService {
  /**
   * Helper to format a raw database product into the canonical Product DTO
   */
  private formatProduct(raw: any): Product {
    const images: string[] = raw.images?.map((img: any) => img.url) || [];
    const primaryImage = images[0] || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop";
    const secondaryImage = images[1] || images[0];

    // Extract unique sizes from variants
    const sizesSet = new Set<string>();
    const colorsMap = new Map<string, ProductColor>();
    let totalStock = 0;

    raw.variants?.forEach((v: any) => {
      if (v.active) {
        totalStock += v.stock;
        if (v.size?.code) {
          sizesSet.add(v.size.code);
        }
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

    const colors = Array.from(colorsMap.values());

    // Calculate rating and review counts
    const reviews = raw.reviews || [];
    const reviewCount = reviews.length;
    const avgRating =
      reviewCount > 0
        ? Number((reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviewCount).toFixed(1))
        : 5.0;

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
      colors: colors.length > 0 ? colors : [{ name: "Obsidian Black", hex: "#0a0a0a" }],
      images: images.length > 0 ? images : [primaryImage],
      primaryImage,
      secondaryImage,
      imageObjects: raw.images?.map((img: any) => ({
        id: img.id,
        url: img.url,
        altText: img.altText,
        displayOrder: img.displayOrder,
      })),
      variants: raw.variants?.map((v: any) => ({
        id: v.id,
        productId: v.productId,
        sku: v.sku,
        colorId: v.colorId,
        color: v.color ? {
          id: v.color.id,
          name: v.color.name,
          code: v.color.code,
          hexCode: v.color.hexCode,
          active: v.color.active,
        } : undefined,
        sizeId: v.sizeId,
        size: v.size ? {
          id: v.size.id,
          name: v.size.name,
          code: v.size.code,
          displayOrder: v.size.displayOrder,
          active: v.size.active,
        } : undefined,
        stock: v.stock,
        lowStockThreshold: v.lowStockThreshold,
        price: v.price ? Number(v.price) : null,
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
        active: v.active,
      })),
      rating: avgRating,
      reviewCount,
      reviews: reviews.map((r: any) => ({
        id: r.id,
        userName: r.authorName,
        rating: r.rating,
        comment: r.comment,
        date: r.createdAt.toISOString(),
        verifiedPurchase: r.verified,
      })),
      sku: raw.variants?.[0]?.sku || `VYRE-${raw.slug.toUpperCase()}`,
      createdAt: raw.createdAt.toISOString(),
      updatedAt: raw.updatedAt?.toISOString(),
    };
  }

  /**
   * Get filtered, sorted, paginated products
   */
  async getProducts(params: ProductQueryParams) {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      minPrice,
      maxPrice,
      size,
      color,
      inStock,
      featured,
      bestseller,
      newArrival,
      sort = "newest",
    } = params;

    const where: Prisma.ProductWhereInput = {
      active: true,
    };

    // Category filter (supports slug or ID)
    if (category && category !== "all") {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
      if (isUuid) {
        where.categoryId = category;
      } else {
        where.category = { slug: category };
      }
    }

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    // Boolean flags
    if (featured !== undefined) where.featured = featured;
    if (bestseller !== undefined) where.bestseller = bestseller;
    if (newArrival !== undefined) where.newArrival = newArrival;

    // Variant filters (size, color, inStock)
    const variantFilter: Prisma.ProductVariantWhereInput = { active: true };
    let hasVariantFilter = false;

    if (size) {
      hasVariantFilter = true;
      variantFilter.size = { code: size };
    }

    if (color) {
      hasVariantFilter = true;
      variantFilter.color = {
        OR: [{ code: color }, { name: { contains: color, mode: "insensitive" } }],
      };
    }

    if (inStock === true) {
      hasVariantFilter = true;
      variantFilter.stock = { gt: 0 };
    }

    if (hasVariantFilter) {
      where.variants = { some: variantFilter };
    }

    // Search query (search name, description, tags, SKU, category name)
    if (search && search.trim().length > 0) {
      const query = search.trim();
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { shortDescription: { contains: query, mode: "insensitive" } },
        { tags: { hasSome: [query.toLowerCase()] } },
        { category: { name: { contains: query, mode: "insensitive" } } },
        { variants: { some: { sku: { contains: query, mode: "insensitive" } } } },
      ];
    }

    // Sorting
    let orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] = {
      createdAt: "desc",
    };

    switch (sort) {
      case "price_asc":
      case "price-asc":
        orderBy = { price: "asc" };
        break;
      case "price_desc":
      case "price-desc":
        orderBy = { price: "desc" };
        break;
      case "featured":
        orderBy = [{ featured: "desc" }, { createdAt: "desc" }];
        break;
      case "best_seller":
        orderBy = [{ bestseller: "desc" }, { createdAt: "desc" }];
        break;
      case "newest":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    const skip = (page - 1) * limit;

    const [total, rawProducts] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: true,
          images: { orderBy: { displayOrder: "asc" } },
          variants: {
            where: { active: true },
            include: { color: true, size: true },
          },
          reviews: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      }),
    ]);

    const items = rawProducts.map((p) => this.formatProduct(p));
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Get product by ID or Slug
   */
  async getProductByIdOrSlug(idOrSlug: string): Promise<Product | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const raw = await prisma.product.findFirst({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        category: true,
        images: { orderBy: { displayOrder: "asc" } },
        variants: {
          include: { color: true, size: true },
        },
        reviews: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!raw) return null;
    return this.formatProduct(raw);
  }

  /**
   * Create a new product with images & variants in a transaction
   */
  async createProduct(data: CreateProductInput): Promise<Product> {
    const slug =
      data.slug ||
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const created = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          shortDescription: data.shortDescription,
          price: data.price,
          compareAtPrice: data.compareAtPrice,
          categoryId: data.categoryId,
          brand: data.brand || "VYRE",
          active: data.active,
          featured: data.featured,
          bestseller: data.bestseller,
          newArrival: data.newArrival,
          tags: data.tags || [],
          images: data.images?.length
            ? {
                create: data.images.map((img) => ({
                  url: img.url,
                  altText: img.altText,
                  displayOrder: img.displayOrder,
                })),
              }
            : undefined,
        },
      });

      if (data.variants && data.variants.length > 0) {
        await tx.productVariant.createMany({
          data: data.variants.map((v) => ({
            productId: product.id,
            sku: v.sku,
            colorId: v.colorId,
            sizeId: v.sizeId,
            stock: v.stock,
            lowStockThreshold: v.lowStockThreshold || 5,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            active: v.active ?? true,
          })),
        });
      }

      return tx.product.findUniqueOrThrow({
        where: { id: product.id },
        include: {
          category: true,
          images: { orderBy: { displayOrder: "asc" } },
          variants: { include: { color: true, size: true } },
          reviews: true,
        },
      });
    });

    return this.formatProduct(created);
  }

  /**
   * Update product with transactional variant & image updates
   */
  async updateProduct(id: string, data: UpdateProductInput): Promise<Product> {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          shortDescription: data.shortDescription,
          price: data.price,
          compareAtPrice: data.compareAtPrice,
          categoryId: data.categoryId,
          brand: data.brand,
          active: data.active,
          featured: data.featured,
          bestseller: data.bestseller,
          newArrival: data.newArrival,
          tags: data.tags,
        },
      });

      if (data.images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (data.images.length > 0) {
          await tx.productImage.createMany({
            data: data.images.map((img) => ({
              productId: id,
              url: img.url,
              altText: img.altText,
              displayOrder: img.displayOrder || 0,
            })),
          });
        }
      }

      if (data.variants) {
        for (const v of data.variants) {
          await tx.productVariant.upsert({
            where: { sku: v.sku },
            create: {
              productId: id,
              sku: v.sku,
              colorId: v.colorId,
              sizeId: v.sizeId,
              stock: v.stock,
              lowStockThreshold: v.lowStockThreshold || 5,
              price: v.price,
              compareAtPrice: v.compareAtPrice,
              active: v.active ?? true,
            },
            update: {
              stock: v.stock,
              lowStockThreshold: v.lowStockThreshold || 5,
              price: v.price,
              compareAtPrice: v.compareAtPrice,
              active: v.active ?? true,
            },
          });
        }
      }

      return tx.product.findUniqueOrThrow({
        where: { id },
        include: {
          category: true,
          images: { orderBy: { displayOrder: "asc" } },
          variants: { include: { color: true, size: true } },
          reviews: true,
        },
      });
    });

    return this.formatProduct(updated);
  }

  /**
   * Delete product (cascades variants and images)
   */
  async deleteProduct(id: string) {
    return prisma.product.delete({
      where: { id },
    });
  }
}

export const productService = new ProductService();
