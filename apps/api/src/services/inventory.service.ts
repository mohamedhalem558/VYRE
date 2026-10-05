import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AdjustStockInput, InventoryQueryParams } from "../schemas/inventory.schema.js";
import {
  InventoryItemDTO,
  InventoryListResponse,
  InventoryMetrics,
  InventoryTransactionDTO,
  StockStatus,
} from "@vyre/shared";

export class InventoryService {
  /**
   * Helper to derive stock status
   */
  private getStockStatus(stock: number, lowStockThreshold: number): StockStatus {
    if (stock <= 0) return "OUT_OF_STOCK";
    if (stock <= lowStockThreshold) return "LOW_STOCK";
    return "IN_STOCK";
  }

  /**
   * Format variant into canonical InventoryItemDTO
   */
  private formatInventoryItem(v: any): InventoryItemDTO {
    const images = v.product.images?.map((img: any) => img.url) || [];
    const defaultImage =
      images[0] ||
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop";

    const status = this.getStockStatus(v.stock, v.lowStockThreshold);
    const priceNum = v.price !== null && v.price !== undefined ? Number(v.price) : Number(v.product.price);

    return {
      variantId: v.id,
      productId: v.productId,
      productName: v.product.name,
      productSlug: v.product.slug,
      productImage: defaultImage,
      category: v.product.category?.name || "General",
      sku: v.sku,
      color: {
        name: v.color?.name || "Standard",
        hexCode: v.color?.hexCode || "#000000",
        code: v.color?.code || "STD",
      },
      size: {
        name: v.size?.name || "One Size",
        code: v.size?.code || "OS",
      },
      stock: v.stock,
      lowStockThreshold: v.lowStockThreshold,
      status,
      price: priceNum,
      updatedAt: v.updatedAt.toISOString(),
    };
  }

  /**
   * Get global inventory metrics
   */
  async getMetrics(): Promise<InventoryMetrics> {
    const [totalProducts, totalVariants, allVariants] = await Promise.all([
      prisma.product.count({ where: { active: true } }),
      prisma.productVariant.count(),
      prisma.productVariant.findMany({
        select: {
          stock: true,
          lowStockThreshold: true,
        },
      }),
    ]);

    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalStockUnits = 0;

    for (const v of allVariants) {
      totalStockUnits += v.stock;
      if (v.stock <= 0) {
        outOfStockCount++;
      } else if (v.stock <= v.lowStockThreshold) {
        lowStockCount++;
      }
    }

    return {
      totalProducts,
      totalVariants,
      lowStockCount,
      outOfStockCount,
      totalStockUnits,
    };
  }

  /**
   * List inventory items with search, filters, pagination, and sorting
   */
  async getInventory(params: InventoryQueryParams): Promise<InventoryListResponse> {
    const { page, limit, search, category, status, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductVariantWhereInput = {};

    if (search) {
      const term = search.trim();
      where.OR = [
        { sku: { contains: term, mode: "insensitive" } },
        { product: { name: { contains: term, mode: "insensitive" } } },
      ];
    }

    if (category) {
      where.product = {
        ...((where.product as Prisma.ProductWhereInput) || {}),
        category: {
          slug: category,
        },
      };
    }

    if (status === "OUT_OF_STOCK") {
      where.stock = { lte: 0 };
    } else if (status === "LOW_STOCK") {
      where.AND = [
        { stock: { gt: 0 } },
        { stock: { lte: 5 } }, // default standard threshold check in SQL
      ];
    } else if (status === "IN_STOCK") {
      where.stock = { gt: 5 };
    }

    let orderBy: Prisma.ProductVariantOrderByWithRelationInput = { updatedAt: sortOrder };
    if (sortBy === "stock") {
      orderBy = { stock: sortOrder };
    } else if (sortBy === "sku") {
      orderBy = { sku: sortOrder };
    } else if (sortBy === "productName") {
      orderBy = { product: { name: sortOrder } };
    }

    const [variants, totalCount, metrics] = await Promise.all([
      prisma.productVariant.findMany({
        where,
        include: {
          color: true,
          size: true,
          product: {
            include: {
              category: true,
              images: { orderBy: { displayOrder: "asc" }, take: 1 },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.productVariant.count({ where }),
      this.getMetrics(),
    ]);

    const items = variants.map((v) => this.formatInventoryItem(v));

    return {
      items,
      metrics,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  /**
   * Get Low Stock variants
   */
  async getLowStock(): Promise<InventoryItemDTO[]> {
    const variants = await prisma.productVariant.findMany({
      where: {
        stock: { gt: 0, lte: 5 },
      },
      include: {
        color: true,
        size: true,
        product: {
          include: {
            category: true,
            images: { orderBy: { displayOrder: "asc" }, take: 1 },
          },
        },
      },
      orderBy: { stock: "asc" },
    });

    return variants.map((v) => this.formatInventoryItem(v));
  }

  /**
   * Get Out of Stock variants
   */
  async getOutOfStock(): Promise<InventoryItemDTO[]> {
    const variants = await prisma.productVariant.findMany({
      where: {
        stock: { lte: 0 },
      },
      include: {
        color: true,
        size: true,
        product: {
          include: {
            category: true,
            images: { orderBy: { displayOrder: "asc" }, take: 1 },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return variants.map((v) => this.formatInventoryItem(v));
  }

  /**
   * Get transaction history for a specific variant
   */
  async getVariantHistory(variantId: string): Promise<InventoryTransactionDTO[]> {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) {
      throw new Error("Product variant not found");
    }

    const transactions = await prisma.inventoryTransaction.findMany({
      where: { variantId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        product: { select: { name: true } },
        variant: { select: { sku: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return transactions.map((t) => ({
      id: t.id,
      productId: t.productId,
      variantId: t.variantId,
      productName: t.product.name,
      sku: t.variant.sku,
      previousQuantity: t.previousQuantity,
      changedQuantity: t.changedQuantity,
      newQuantity: t.newQuantity,
      reason: t.reason,
      userId: t.userId,
      userName: t.user ? `${t.user.firstName} ${t.user.lastName}` : "System / Guest",
      metadata: t.metadata,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  /**
   * Adjust stock for a variant with validation and atomic transaction logging
   */
  async adjustStock(
    variantId: string,
    input: AdjustStockInput,
    userId?: string
  ): Promise<{ variant: InventoryItemDTO; transaction: InventoryTransactionDTO }> {
    return await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
        include: {
          product: {
            include: {
              category: true,
              images: { orderBy: { displayOrder: "asc" }, take: 1 },
            },
          },
          color: true,
          size: true,
        },
      });

      if (!variant) {
        throw new Error("Variant not found");
      }

      const previousQuantity = variant.stock;
      let newQuantity: number;
      let changedQuantity: number;

      if (input.newQuantity !== undefined) {
        newQuantity = input.newQuantity;
        changedQuantity = newQuantity - previousQuantity;
      } else if (input.changedQuantity !== undefined) {
        changedQuantity = input.changedQuantity;
        newQuantity = previousQuantity + changedQuantity;
      } else {
        throw new Error("Either newQuantity or changedQuantity must be provided");
      }

      // Business Rule: Stock can never be negative
      if (newQuantity < 0) {
        throw new Error(
          `Stock cannot be negative. Current stock is ${previousQuantity}, adjustment of ${changedQuantity} would result in ${newQuantity}.`
        );
      }

      // Update variant stock
      const updatedVariant = await tx.productVariant.update({
        where: { id: variantId },
        data: {
          stock: newQuantity,
        },
        include: {
          color: true,
          size: true,
          product: {
            include: {
              category: true,
              images: { orderBy: { displayOrder: "asc" }, take: 1 },
            },
          },
        },
      });

      // Create Inventory Transaction record
      const transaction = await tx.inventoryTransaction.create({
        data: {
          productId: variant.productId,
          variantId: variant.id,
          previousQuantity,
          changedQuantity,
          newQuantity,
          reason: input.reason,
          userId: userId || null,
          metadata: {
            note: input.note || null,
            adjustedAt: new Date().toISOString(),
          },
        },
        include: {
          user: { select: { firstName: true, lastName: true } },
          product: { select: { name: true } },
          variant: { select: { sku: true } },
        },
      });

      // Create Audit Log (Phase 12 integration)
      await tx.auditLog.create({
        data: {
          userId: userId || null,
          action: "INVENTORY_ADJUSTED",
          entity: "ProductVariant",
          entityId: variant.id,
          metadata: {
            sku: variant.sku,
            previousQuantity,
            changedQuantity,
            newQuantity,
            reason: input.reason,
            note: input.note,
          },
        },
      });

      return {
        variant: this.formatInventoryItem(updatedVariant),
        transaction: {
          id: transaction.id,
          productId: transaction.productId,
          variantId: transaction.variantId,
          productName: transaction.product.name,
          sku: transaction.variant.sku,
          previousQuantity: transaction.previousQuantity,
          changedQuantity: transaction.changedQuantity,
          newQuantity: transaction.newQuantity,
          reason: transaction.reason,
          userId: transaction.userId,
          userName: transaction.user
            ? `${transaction.user.firstName} ${transaction.user.lastName}`
            : "Admin",
          metadata: transaction.metadata,
          createdAt: transaction.createdAt.toISOString(),
        },
      };
    });
  }
}

export const inventoryService = new InventoryService();
