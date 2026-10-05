// apps/api/src/controllers/coupon.controller.ts

import { Request, Response, NextFunction } from "express";
import { couponService } from "../services/coupon.service.js";

export const couponController = {
  createCoupon: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const coupon = await couponService.createCoupon(req.body, req.user?.id);
      res.status(201).json({
        success: true,
        message: "Coupon created successfully.",
        data: coupon,
      });
    } catch (error) {
      next(error);
    }
  },

  getCoupons: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await couponService.getCoupons(req.query as any);
      res.status(200).json({
        success: true,
        message: "Coupons retrieved successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  getCouponById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const coupon = await couponService.getCouponById(req.params.id);
      res.status(200).json({
        success: true,
        data: coupon,
      });
    } catch (error) {
      next(error);
    }
  },

  updateCoupon: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const coupon = await couponService.updateCoupon(req.params.id, req.body, req.user?.id);
      res.status(200).json({
        success: true,
        message: "Coupon updated successfully.",
        data: coupon,
      });
    } catch (error) {
      next(error);
    }
  },

  deleteCoupon: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await couponService.deleteCoupon(req.params.id, req.user?.id);
      res.status(200).json({
        success: true,
        message: "Coupon deleted successfully.",
      });
    } catch (error) {
      next(error);
    }
  },

  validateCoupon: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, subtotal } = req.body;
      const result = await couponService.validateCoupon(code, Number(subtotal));
      res.status(200).json({
        success: result.valid,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
