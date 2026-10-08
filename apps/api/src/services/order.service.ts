import { Prisma, OrderStatus, PaymentStatus, PaymentMethod } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { CreateOrderInput, OrderQueryParams, UpdateOrderStatusInput } from "../schemas/order.schema.js";
import {
  OrderDTO,
  OrderItemDTO,
  OrderListResponse,
  ShippingRateDTO,
} from "@vyre/shared";
import {
  sendOrderPlacedEmail,
  sendOrderConfirmedEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
} from "../utils/email.js";

const FREE_SHIPPING_THRESHOLD = 1500; // in EGP

export class OrderService {
  /**
   * Helper to ensure default shipping rates exist in DB
   */
  async getShippingRates(): Promise<ShippingRateDTO[]> {
    let rates = await prisma.shippingRate.findMany({
      where: { active: true },
      orderBy: { fee: "asc" },
    });

    if (rates.length === 0) {
      // Seed initial Egyptian regional shipping rates
      await prisma.shippingRate.createMany({
        data: [
          {
            region: "Cairo",
            displayName: "Greater Cairo & New Cairo",
            fee: new Prisma.Decimal(60.0),
            estimatedDays: "1-2 Business Days",
            freeAbove: new Prisma.Decimal(FREE_SHIPPING_THRESHOLD),
            active: true,
          },
          {
            region: "Giza",
            displayName: "Giza & 6th of October",
            fee: new Prisma.Decimal(70.0),
            estimatedDays: "1-2 Business Days",
            freeAbove: new Prisma.Decimal(FREE_SHIPPING_THRESHOLD),
            active: true,
          },
          {
            region: "Other Egypt",
            displayName: "Alexandria, Delta & Other Governorates",
            fee: new Prisma.Decimal(90.0),
            estimatedDays: "2-4 Business Days",
            freeAbove: new Prisma.Decimal(FREE_SHIPPING_THRESHOLD),
            active: true,
          },
        ],
      });

      rates = await prisma.shippingRate.findMany({
        where: { active: true },
        orderBy: { fee: "asc" },
      });
    }

    return rates.map((r) => ({
      id: r.id,
      region: r.region,
      displayName: r.displayName,
      fee: Number(r.fee),
      estimatedDays: r.estimatedDays,
      freeAbove: r.freeAbove ? Number(r.freeAbove) : null,
      active: r.active,
    }));
  }

  /**
   * Format database Order into canonical OrderDTO
   */
  private formatOrder(order: any): OrderDTO {
    const items: OrderItemDTO[] = (order.items || []).map((it: any) => ({
      id: it.id,
      orderId: it.orderId,
      productId: it.productId,
      variantId: it.variantId,
      productName: it.productName,
      productSlug: it.productSlug,
      productImage: it.productImage,
      sizeName: it.sizeName,
      colorName: it.colorName,
      sku: it.sku,
      unitPrice: Number(it.unitPrice),
      quantity: it.quantity,
      totalPrice: Number(it.totalPrice),
    }));

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      items,
      shippingAddress: order.shippingSnapshot as any,
      billingAddress: order.billingAddress as any,
      orderStatus: order.orderStatus,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      couponCode: order.couponCode,
      shippingFee: Number(order.shippingFee),
      total: Number(order.total),
      currency: "EGP",
      notes: order.notes,
      trackingNumber: order.trackingNumber,
      estimatedDelivery: order.estimatedDelivery,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  /**
   * Resolve shipping fee based on destination governorate and subtotal
   */
  private resolveShippingFee(
    governorate: string,
    subtotal: number,
    rates: ShippingRateDTO[]
  ): { fee: number; estimatedDays: string } {
    if (subtotal >= FREE_SHIPPING_THRESHOLD) {
      return { fee: 0, estimatedDays: "1-3 Business Days (Express Free)" };
    }

    const govLower = governorate.toLowerCase().trim();
    let matchedRate: ShippingRateDTO | undefined;

    if (govLower.includes("cairo")) {
      matchedRate = rates.find((r) => r.region.toLowerCase() === "cairo");
    } else if (govLower.includes("giza") || govLower.includes("october") || govLower.includes("zayed")) {
      matchedRate = rates.find((r) => r.region.toLowerCase() === "giza");
    } else {
      matchedRate =
        rates.find((r) => r.region.toLowerCase() === "other egypt") || rates[rates.length - 1];
    }

    if (matchedRate) {
      return {
        fee: matchedRate.fee,
        estimatedDays: matchedRate.estimatedDays,
      };
    }

    // Default fallback
    return { fee: 65, estimatedDays: "2-3 Business Days" };
  }

  /**
   * CRITICAL ORDER CREATION WORKFLOW (Atomic Database Transaction)
   */
  async createOrder(userId: string, input: CreateOrderInput): Promise<OrderDTO> {
    const shippingRates = await this.getShippingRates();

    const createdOrder = await prisma.$transaction(async (tx) => {
      // 1. Load user's cart
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: { include: { images: true } },
              variant: { include: { color: true, size: true } },
            },
          },
        },
      });

      if (!cart || !cart.items || cart.items.length === 0) {
        throw new Error("Your shopping bag is empty. Please add items before checking out.");
      }

      // 2-5. Verify products, variants, active status, and stock
      let calculatedSubtotal = 0;
      const orderItemsData: any[] = [];

      for (const item of cart.items) {
        const product = item.product;
        const variant = item.variant;

        if (!product || !product.active) {
          throw new Error(`Product "${product?.name || item.productId}" is currently unavailable.`);
        }

        if (!variant || !variant.active) {
          throw new Error(
            `Product variant for "${product.name}" (${item.variantId}) is currently inactive.`
          );
        }

        // Check stock availability
        if (variant.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${product.name}" (${variant.size?.code} / ${variant.color?.name}). Requested: ${item.quantity}, Available: ${variant.stock}.`
          );
        }

        // 6. Retrieve authoritative current price from backend
        const unitPrice = variant.price !== null ? Number(variant.price) : Number(product.price);
        const itemTotal = unitPrice * item.quantity;
        calculatedSubtotal += itemTotal;

        const defaultImage =
          product.images?.[0]?.url ||
          "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop";

        orderItemsData.push({
          productId: product.id,
          variantId: variant.id,
          productName: product.name,
          productSlug: product.slug,
          productImage: defaultImage,
          sizeName: variant.size?.name || variant.size?.code || "M",
          colorName: variant.color?.name || "Standard",
          sku: variant.sku,
          unitPrice: new Prisma.Decimal(unitPrice),
          quantity: item.quantity,
          totalPrice: new Prisma.Decimal(itemTotal),
          currentVariantStock: variant.stock,
        });
      }

      // 7-9. Validate coupon if present
      let discountAmount = 0;
      let validCoupon: any = null;

      if (input.couponCode && input.couponCode.trim()) {
        const codeClean = input.couponCode.trim().toUpperCase();
        validCoupon = await tx.coupon.findUnique({
          where: { code: codeClean },
        });

        if (validCoupon && validCoupon.active) {
          const now = new Date();
          const isExpired = validCoupon.expiryDate && validCoupon.expiryDate < now;
          const isExceeded = validCoupon.usageLimit && validCoupon.usedCount >= validCoupon.usageLimit;
          const meetsMinOrder =
            !validCoupon.minimumOrderAmount ||
            calculatedSubtotal >= Number(validCoupon.minimumOrderAmount);

          if (!isExpired && !isExceeded && meetsMinOrder) {
            if (validCoupon.type === "PERCENTAGE") {
              const percDiscount = (calculatedSubtotal * Number(validCoupon.value)) / 100;
              discountAmount = validCoupon.maximumDiscount
                ? Math.min(percDiscount, Number(validCoupon.maximumDiscount))
                : percDiscount;
            } else {
              discountAmount = Math.min(Number(validCoupon.value), calculatedSubtotal);
            }
          }
        }
      }

      // 10. Calculate shipping
      const { fee: shippingFee, estimatedDays } = this.resolveShippingFee(
        input.shippingAddress.governorate,
        calculatedSubtotal,
        shippingRates
      );

      // 11. Calculate final total
      const finalTotal = Math.max(0, calculatedSubtotal - discountAmount + shippingFee);

      // Generate unique order number
      const orderNumber = `VYRE-${new Date().getFullYear()}-${Math.floor(
        100000 + Math.random() * 900000
      )}`;

      // 12. Create the order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          shippingSnapshot: input.shippingAddress as any,
          billingAddress: (input.billingAddress || input.shippingAddress) as any,
          orderStatus: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: input.paymentMethod as PaymentMethod,
          subtotal: new Prisma.Decimal(calculatedSubtotal),
          discount: new Prisma.Decimal(discountAmount),
          couponCode: validCoupon ? validCoupon.code : null,
          shippingFee: new Prisma.Decimal(shippingFee),
          total: new Prisma.Decimal(finalTotal),
          estimatedDelivery: estimatedDays,
          notes: input.notes || null,
        },
      });

      // 13. Create order items & 14-15. Deduct inventory and log transactions
      for (const itemData of orderItemsData) {
        // Create OrderItem
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: itemData.productId,
            variantId: itemData.variantId,
            productName: itemData.productName,
            productSlug: itemData.productSlug,
            productImage: itemData.productImage,
            sizeName: itemData.sizeName,
            colorName: itemData.colorName,
            sku: itemData.sku,
            unitPrice: itemData.unitPrice,
            quantity: itemData.quantity,
            totalPrice: itemData.totalPrice,
          },
        });

        // Deduct inventory
        const newStock = itemData.currentVariantStock - itemData.quantity;
        await tx.productVariant.update({
          where: { id: itemData.variantId },
          data: { stock: newStock },
        });

        // Create InventoryTransaction
        await tx.inventoryTransaction.create({
          data: {
            productId: itemData.productId,
            variantId: itemData.variantId,
            previousQuantity: itemData.currentVariantStock,
            changedQuantity: -itemData.quantity,
            newQuantity: newStock,
            reason: "SALE",
            userId,
            metadata: {
              orderNumber,
              orderId: order.id,
              customerEmail: input.customerEmail,
            },
          },
        });
      }

      // Record Payment
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: new Prisma.Decimal(finalTotal),
          method: input.paymentMethod as PaymentMethod,
          status: PaymentStatus.PENDING,
          referenceNumber: `COD-${order.orderNumber}`,
        },
      });

      // Update coupon usage if used
      if (validCoupon) {
        await tx.coupon.update({
          where: { id: validCoupon.id },
          data: { usedCount: { increment: 1 } },
        });

        await tx.couponUsage.create({
          data: {
            couponId: validCoupon.id,
            userId,
            orderId: order.id,
            discountAmount: new Prisma.Decimal(discountAmount),
          },
        });
      }

      // 16. Clear the cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: "ORDER_CREATED",
          entity: "Order",
          entityId: order.id,
          metadata: {
            orderNumber,
            total: finalTotal,
            itemCount: orderItemsData.length,
          },
        },
      });

      // Fetch complete created order
      const fullCreatedOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: {
          items: true,
          payment: true,
        },
      });

      return this.formatOrder(fullCreatedOrder);
    });

    // Automated Email: Order Placed / Pending Confirmation
    sendOrderPlacedEmail(createdOrder).catch((err) => {
      console.error(
        `[OrderService] Failed to send order placed email for #${createdOrder.orderNumber}:`,
        err
      );
    });

    return createdOrder;
  }

  /**
   * Get orders for a specific customer
   */
  async getUserOrders(userId: string, query: OrderQueryParams): Promise<OrderListResponse> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: { items: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return {
      orders: orders.map((o) => this.formatOrder(o)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get order by ID with ownership enforcement
   */
  async getOrderById(orderId: string, userId?: string, isAdmin = false): Promise<OrderDTO> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payment: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Customer can only view their own orders
    if (!isAdmin && order.userId !== userId) {
      throw new Error("Access denied. You are not authorized to view this order.");
    }

    return this.formatOrder(order);
  }

  /**
   * Admin: List all orders with filters
   */
  async getAllOrders(query: OrderQueryParams): Promise<OrderListResponse> {
    const { page, limit, status, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};

    if (status) {
      where.orderStatus = status as OrderStatus;
    }

    if (search) {
      const term = search.trim();
      where.OR = [
        { orderNumber: { contains: term, mode: "insensitive" } },
        { customerName: { contains: term, mode: "insensitive" } },
        { customerEmail: { contains: term, mode: "insensitive" } },
        { customerPhone: { contains: term, mode: "insensitive" } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true, payment: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((o) => this.formatOrder(o)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Admin: Update order status
   */
  async updateOrderStatus(
    orderId: string,
    input: UpdateOrderStatusInput,
    adminUserId?: string
  ): Promise<OrderDTO> {
    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!existing) {
      throw new Error("Order not found");
    }

    const data: Prisma.OrderUpdateInput = {
      orderStatus: input.status,
    };

    if (input.notes) data.notes = input.notes;
    if (input.trackingNumber) data.trackingNumber = input.trackingNumber;
    if (input.estimatedDelivery) data.estimatedDelivery = input.estimatedDelivery;

    // If order was delivered and payment was Cash On Delivery, mark payment PAID
    if (
      input.status === OrderStatus.DELIVERED &&
      existing.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
    ) {
      data.paymentStatus = PaymentStatus.PAID;
      await prisma.payment.updateMany({
        where: { orderId },
        data: { status: PaymentStatus.PAID },
      });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data,
      include: { items: true, payment: true },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: adminUserId || null,
        action: "ORDER_STATUS_UPDATED",
        entity: "Order",
        entityId: orderId,
        metadata: {
          previousStatus: existing.orderStatus,
          newStatus: input.status,
          trackingNumber: input.trackingNumber,
        },
      },
    });

    const formattedUpdated = this.formatOrder(updated);

    // Automated Email Notifications based on Order Stage
    if (input.status === OrderStatus.CONFIRMED && existing.orderStatus !== OrderStatus.CONFIRMED) {
      sendOrderConfirmedEmail(formattedUpdated).catch((err) =>
        console.error(
          `[OrderService] Failed to send order confirmed email for #${formattedUpdated.orderNumber}:`,
          err
        )
      );
    } else if (input.status === OrderStatus.SHIPPED && existing.orderStatus !== OrderStatus.SHIPPED) {
      sendOrderShippedEmail(formattedUpdated, input.trackingNumber).catch((err) =>
        console.error(
          `[OrderService] Failed to send order shipped email for #${formattedUpdated.orderNumber}:`,
          err
        )
      );
    } else if (input.status === OrderStatus.DELIVERED && existing.orderStatus !== OrderStatus.DELIVERED) {
      sendOrderDeliveredEmail(formattedUpdated).catch((err) =>
        console.error(
          `[OrderService] Failed to send order delivered email for #${formattedUpdated.orderNumber}:`,
          err
        )
      );
    }

    return formattedUpdated;
  }
}

export const orderService = new OrderService();
