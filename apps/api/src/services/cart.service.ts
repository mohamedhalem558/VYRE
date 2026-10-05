import { prisma } from "../config/prisma.js";
import { AddToCartInput, MergeCartInput } from "../schemas/cart.schema.js";
import { CartItem, CartSummary, Product, ProductColor, ProductSize } from "@vyre/shared";

const FREE_SHIPPING_THRESHOLD = 1500;
const STANDARD_SHIPPING_FEE = 65;

export class CartService {
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
   * Helper to format a raw Cart into CartSummary
   */
  private formatCart(cart: any): CartSummary {
    const rawItems = cart.items || [];
    const formattedItems: CartItem[] = rawItems.map((item: any) => {
      const formattedProd = this.formatProduct(item.product);
      const variant = item.variant;
      const currentPrice = variant?.price !== null && variant?.price !== undefined
        ? Number(variant.price)
        : Number(item.product.price);

      const selectedSize = (variant?.size?.code || variant?.size?.name || "M") as ProductSize;
      const selectedColor: ProductColor = {
        id: variant?.color?.id,
        name: variant?.color?.name || "Standard",
        code: variant?.color?.code || "STD",
        hex: variant?.color?.hexCode || "#000000",
      };

      return {
        id: item.id,
        cartId: item.cartId,
        productId: item.productId,
        variantId: item.variantId,
        product: formattedProd,
        variant: variant
          ? {
              id: variant.id,
              productId: variant.productId,
              sku: variant.sku,
              colorId: variant.colorId,
              color: variant.color
                ? {
                    id: variant.color.id,
                    name: variant.color.name,
                    code: variant.color.code,
                    hexCode: variant.color.hexCode,
                    active: variant.color.active,
                  }
                : undefined,
              sizeId: variant.sizeId,
              size: variant.size
                ? {
                    id: variant.size.id,
                    name: variant.size.name,
                    code: variant.size.code,
                    displayOrder: variant.size.displayOrder,
                    active: variant.size.active,
                  }
                : undefined,
              stock: variant.stock,
              lowStockThreshold: variant.lowStockThreshold,
              price: variant.price ? Number(variant.price) : null,
              compareAtPrice: variant.compareAtPrice ? Number(variant.compareAtPrice) : null,
              active: variant.active,
            }
          : undefined,
        selectedSize,
        selectedColor,
        quantity: item.quantity,
        unitPrice: currentPrice,
        priceSnapshot: Number(item.priceSnapshot),
        totalPrice: currentPrice * item.quantity,
        maxStock: variant?.stock ?? 0,
      };
    });

    const itemCount = formattedItems.reduce((acc, it) => acc + it.quantity, 0);
    const subtotal = formattedItems.reduce((acc, it) => acc + it.totalPrice, 0);
    const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || formattedItems.length === 0;
    const shippingFee = formattedItems.length === 0 ? 0 : isFreeShipping ? 0 : STANDARD_SHIPPING_FEE;
    const total = subtotal + shippingFee;

    return {
      id: cart.id,
      items: formattedItems,
      itemCount,
      subtotal,
      discount: 0,
      appliedCoupon: null,
      shippingFee,
      isFreeShipping,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      total,
      currency: "EGP",
    };
  }

  /**
   * Get or initialize a cart for an authenticated user
   */
  async getOrCreateCart(userId: string): Promise<any> {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
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
            variant: {
              include: {
                color: true,
                size: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
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
              variant: {
                include: {
                  color: true,
                  size: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }

    return cart;
  }

  /**
   * Get user's cart summary
   */
  async getCart(userId: string): Promise<CartSummary> {
    const cart = await this.getOrCreateCart(userId);
    return this.formatCart(cart);
  }

  /**
   * Helper to resolve variant for product
   */
  private async resolveVariant(
    productId: string,
    variantId?: string,
    size?: string,
    colorName?: string
  ) {
    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        include: { color: true, size: true },
      });
      if (variant && variant.productId === productId) {
        return variant;
      }
    }

    // Attempt to match by size code/name and color name/code
    const variants = await prisma.productVariant.findMany({
      where: { productId, active: true },
      include: { color: true, size: true },
    });

    if (variants.length === 0) {
      return null;
    }

    if (size || colorName) {
      const matched = variants.find((v) => {
        const matchesSize = size
          ? v.size.code.toLowerCase() === size.toLowerCase() ||
            v.size.name.toLowerCase() === size.toLowerCase()
          : true;
        const matchesColor = colorName
          ? v.color.name.toLowerCase() === colorName.toLowerCase() ||
            v.color.code.toLowerCase() === colorName.toLowerCase()
          : true;
        return matchesSize && matchesColor;
      });

      if (matched) return matched;
    }

    // Default fallback to first active in-stock variant, or first active variant
    const inStockVariant = variants.find((v) => v.stock > 0);
    return inStockVariant || variants[0];
  }

  /**
   * Add item to cart with full business rule enforcement
   */
  async addItem(userId: string, input: AddToCartInput): Promise<CartSummary> {
    const { productId, variantId, size, colorName, quantity } = input;

    if (quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    // 1. Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new Error("Product not found");
    }

    // 2. Verify product is active
    if (!product.active) {
      throw new Error("Product is not currently available for purchase");
    }

    // 3. Verify variant exists and is active
    const variant = await this.resolveVariant(productId, variantId, size, colorName);
    if (!variant) {
      throw new Error("Specified product variant does not exist");
    }

    if (!variant.active) {
      throw new Error("Selected product variant is inactive");
    }

    // 4. Verify stock
    if (variant.stock <= 0) {
      throw new Error("Selected variant is currently out of stock");
    }

    // 5. Get or initialize user's cart
    const cart = await this.getOrCreateCart(userId);

    // 6. Check if variant already exists in user's cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId: variant.id,
        },
      },
    });

    const currentQtyInCart = existingItem ? existingItem.quantity : 0;
    const requestedTotalQty = currentQtyInCart + quantity;

    // 7. Prevent quantity above available stock
    if (requestedTotalQty > variant.stock) {
      throw new Error(
        `Cannot add ${quantity} more. You have ${currentQtyInCart} in cart, and available stock is ${variant.stock}.`
      );
    }

    // 8. Determine price snapshot from backend (NEVER trust frontend price)
    const backendPrice = variant.price !== null ? variant.price : product.price;

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: requestedTotalQty,
          priceSnapshot: backendPrice,
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          variantId: variant.id,
          quantity,
          priceSnapshot: backendPrice,
        },
      });
    }

    return this.getCart(userId);
  }

  /**
   * Update cart item quantity
   */
  async updateItemQuantity(
    userId: string,
    itemId: string,
    quantity: number
  ): Promise<CartSummary> {
    const cart = await this.getOrCreateCart(userId);

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: {
        product: true,
        variant: true,
      },
    });

    if (!item) {
      throw new Error("Cart item not found");
    }

    // If quantity is 0 or less, remove item
    if (quantity <= 0) {
      await prisma.cartItem.delete({
        where: { id: item.id },
      });
      return this.getCart(userId);
    }

    // Verify product and variant are active
    if (!item.product.active) {
      throw new Error("Product is no longer available");
    }
    if (!item.variant.active) {
      throw new Error("Product variant is no longer available");
    }

    // Verify stock
    if (quantity > item.variant.stock) {
      throw new Error(
        `Requested quantity (${quantity}) exceeds available stock (${item.variant.stock})`
      );
    }

    // Update item
    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity },
    });

    return this.getCart(userId);
  }

  /**
   * Remove item from cart
   */
  async removeItem(userId: string, itemId: string): Promise<CartSummary> {
    const cart = await this.getOrCreateCart(userId);

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      throw new Error("Cart item not found");
    }

    await prisma.cartItem.delete({
      where: { id: item.id },
    });

    return this.getCart(userId);
  }

  /**
   * Clear entire cart for user
   */
  async clearCart(userId: string): Promise<CartSummary> {
    const cart = await this.getOrCreateCart(userId);

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return this.getCart(userId);
  }

  /**
   * Merge guest cart into user's authenticated cart
   */
  async mergeGuestCart(userId: string, input: MergeCartInput): Promise<CartSummary> {
    const cart = await this.getOrCreateCart(userId);

    for (const guestItem of input.items) {
      try {
        if (!guestItem.productId || guestItem.quantity <= 0) continue;

        const product = await prisma.product.findUnique({
          where: { id: guestItem.productId },
        });
        if (!product || !product.active) continue;

        const variant = await this.resolveVariant(
          guestItem.productId,
          guestItem.variantId,
          guestItem.size,
          guestItem.colorName
        );
        if (!variant || !variant.active || variant.stock <= 0) continue;

        const existingItem = await prisma.cartItem.findUnique({
          where: {
            cartId_variantId: {
              cartId: cart.id,
              variantId: variant.id,
            },
          },
        });

        const backendPrice = variant.price !== null ? variant.price : product.price;

        if (existingItem) {
          // Merge quantities, capping at available stock
          const newQty = Math.min(existingItem.quantity + guestItem.quantity, variant.stock);
          await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: newQty,
              priceSnapshot: backendPrice,
            },
          });
        } else {
          const qty = Math.min(guestItem.quantity, variant.stock);
          if (qty > 0) {
            await prisma.cartItem.create({
              data: {
                cartId: cart.id,
                productId: product.id,
                variantId: variant.id,
                quantity: qty,
                priceSnapshot: backendPrice,
              },
            });
          }
        }
      } catch {
        // Skip invalid items gracefully during merge
      }
    }

    return this.getCart(userId);
  }
}

export const cartService = new CartService();
