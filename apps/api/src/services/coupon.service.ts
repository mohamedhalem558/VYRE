// apps/api/src/services/coupon.service.ts

import { Prisma, CouponType } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import {
  CouponDTO,
  CreateCouponPayload,
  UpdateCouponPayload,
  ValidateCouponResult,
} from "@vyre/shared";

function formatCoupon(c: any): CouponDTO {
  return {
    id: c.id,
    code: c.code,
    description: c.description || null,
    type: c.type as CouponType,
    value: Number(c.value),
    minimumOrderAmount: c.minimumOrderAmount ? Number(c.minimumOrderAmount) : null,
    maximumDiscount: c.maximumDiscount ? Number(c.maximumDiscount) : null,
    usageLimit: c.usageLimit ?? null,
    usedCount: c.usedCount,
    startDate: c.startDate.toISOString(),
    expiryDate: c.expiryDate ? c.expiryDate.toISOString() : null,
    active: c.active,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export class CouponService {
  /**
   * Create a new promotional coupon (Admin / Marketing Manager)
   */
  async createCoupon(input: CreateCouponPayload, userId?: string): Promise<CouponDTO> {
    const existing = await prisma.coupon.findUnique({
      where: { code: input.code },
    });

    if (existing) {
      const err: any = new Error(`Coupon with code '${input.code}' already exists.`);
      err.status = 409;
      throw err;
    }

    const created = await prisma.coupon.create({
      data: {
        code: input.code,
        description: input.description,
        type: input.type as CouponType,
        value: new Prisma.Decimal(input.value),
        minimumOrderAmount: input.minimumOrderAmount
          ? new Prisma.Decimal(input.minimumOrderAmount)
          : null,
        maximumDiscount: input.maximumDiscount
          ? new Prisma.Decimal(input.maximumDiscount)
          : null,
        usageLimit: input.usageLimit,
        startDate: input.startDate ? new Date(input.startDate) : new Date(),
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
        active: input.active ?? true,
      },
    });

    // Record audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: userId || null,
          action: "COUPON_CREATED",
          entity: "Coupon",
          entityId: created.id,
          metadata: {
            code: created.code,
            type: created.type,
            value: Number(created.value),
          },
        },
      });
    } catch {
      // Non-fatal if audit table logging has issue
    }

    return formatCoupon(created);
  }

  /**
   * List coupons with filtering, search, and pagination
   */
  async getCoupons(params: {
    page?: number;
    limit?: number;
    search?: string;
    active?: boolean;
    type?: CouponType;
  }): Promise<{ coupons: CouponDTO[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.CouponWhereInput = {};

    if (params.search && params.search.trim()) {
      const s = params.search.trim();
      where.OR = [
        { code: { contains: s, mode: "insensitive" } },
        { description: { contains: s, mode: "insensitive" } },
      ];
    }

    if (params.active !== undefined) {
      where.active = params.active;
    }

    if (params.type) {
      where.type = params.type;
    }

    const [items, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.coupon.count({ where }),
    ]);

    return {
      coupons: items.map(formatCoupon),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single coupon by ID
   */
  async getCouponById(id: string): Promise<CouponDTO> {
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: { select: { usages: true } },
      },
    });

    if (!coupon) {
      const err: any = new Error("Coupon not found.");
      err.status = 404;
      throw err;
    }

    return formatCoupon(coupon);
  }

  /**
   * Update an existing coupon
   */
  async updateCoupon(
    id: string,
    input: UpdateCouponPayload,
    userId?: string
  ): Promise<CouponDTO> {
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      const err: any = new Error("Coupon not found.");
      err.status = 404;
      throw err;
    }

    if (input.code && input.code !== existing.code) {
      const codeTaken = await prisma.coupon.findUnique({
        where: { code: input.code },
      });
      if (codeTaken) {
        const err: any = new Error(`Coupon code '${input.code}' is already in use.`);
        err.status = 409;
        throw err;
      }
    }

    const updateData: Prisma.CouponUpdateInput = {};
    if (input.code !== undefined) updateData.code = input.code;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.type !== undefined) updateData.type = input.type as CouponType;
    if (input.value !== undefined) updateData.value = new Prisma.Decimal(input.value);
    if (input.minimumOrderAmount !== undefined) {
      updateData.minimumOrderAmount =
        input.minimumOrderAmount !== null
          ? new Prisma.Decimal(input.minimumOrderAmount)
          : null;
    }
    if (input.maximumDiscount !== undefined) {
      updateData.maximumDiscount =
        input.maximumDiscount !== null
          ? new Prisma.Decimal(input.maximumDiscount)
          : null;
    }
    if (input.usageLimit !== undefined) updateData.usageLimit = input.usageLimit;
    if (input.startDate !== undefined) updateData.startDate = new Date(input.startDate);
    if (input.expiryDate !== undefined) {
      updateData.expiryDate = input.expiryDate ? new Date(input.expiryDate) : null;
    }
    if (input.active !== undefined) updateData.active = input.active;

    const updated = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });

    // Record audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: userId || null,
          action: "COUPON_UPDATED",
          entity: "Coupon",
          entityId: updated.id,
          metadata: {
            changes: input,
          },
        },
      });
    } catch {
      // Non-fatal
    }

    return formatCoupon(updated);
  }

  /**
   * Delete a coupon
   */
  async deleteCoupon(id: string, userId?: string): Promise<void> {
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      const err: any = new Error("Coupon not found.");
      err.status = 404;
      throw err;
    }

    await prisma.coupon.delete({ where: { id } });

    try {
      await prisma.auditLog.create({
        data: {
          userId: userId || null,
          action: "COUPON_DELETED",
          entity: "Coupon",
          entityId: id,
          metadata: { code: existing.code },
        },
      });
    } catch {
      // Non-fatal
    }
  }

  /**
   * Authoritative backend discount calculation & validation
   * Frontend must NEVER directly decide discount amount.
   */
  async validateCoupon(code: string, subtotal: number): Promise<ValidateCouponResult> {
    const cleanCode = code.trim().toUpperCase();

    const coupon = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (!coupon || !coupon.active) {
      return {
        valid: false,
        code: cleanCode,
        type: "PERCENTAGE",
        value: 0,
        discountAmount: 0,
        finalSubtotal: subtotal,
        message: "Invalid or inactive promo code.",
      };
    }

    const now = new Date();

    if (coupon.startDate && now < coupon.startDate) {
      return {
        valid: false,
        code: cleanCode,
        type: coupon.type as CouponType,
        value: Number(coupon.value),
        discountAmount: 0,
        finalSubtotal: subtotal,
        message: "This promo code is not active yet.",
      };
    }

    if (coupon.expiryDate && now > coupon.expiryDate) {
      return {
        valid: false,
        code: cleanCode,
        type: coupon.type as CouponType,
        value: Number(coupon.value),
        discountAmount: 0,
        finalSubtotal: subtotal,
        message: "This promo code has expired.",
      };
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return {
        valid: false,
        code: cleanCode,
        type: coupon.type as CouponType,
        value: Number(coupon.value),
        discountAmount: 0,
        finalSubtotal: subtotal,
        message: "This promo code has reached its usage limit.",
      };
    }

    const minAmount = coupon.minimumOrderAmount ? Number(coupon.minimumOrderAmount) : 0;
    if (minAmount > 0 && subtotal < minAmount) {
      return {
        valid: false,
        code: cleanCode,
        type: coupon.type as CouponType,
        value: Number(coupon.value),
        discountAmount: 0,
        finalSubtotal: subtotal,
        message: `Order subtotal must be at least ${minAmount} EGP to use this promo code.`,
      };
    }

    // Authoritative calculation
    let calculatedDiscount = 0;
    const couponVal = Number(coupon.value);

    if (coupon.type === "PERCENTAGE") {
      const rawDiscount = (subtotal * couponVal) / 100;
      calculatedDiscount = coupon.maximumDiscount
        ? Math.min(rawDiscount, Number(coupon.maximumDiscount))
        : rawDiscount;
    } else {
      calculatedDiscount = Math.min(couponVal, subtotal);
    }

    calculatedDiscount = Math.round(calculatedDiscount * 100) / 100;
    const finalSubtotal = Math.max(0, Math.round((subtotal - calculatedDiscount) * 100) / 100);

    return {
      valid: true,
      couponId: coupon.id,
      code: coupon.code,
      type: coupon.type as CouponType,
      value: couponVal,
      discountAmount: calculatedDiscount,
      finalSubtotal,
      message:
        coupon.type === "PERCENTAGE"
          ? `${couponVal}% discount applied (-${calculatedDiscount} EGP)`
          : `${calculatedDiscount} EGP discount applied`,
    };
  }
}

export const couponService = new CouponService();
