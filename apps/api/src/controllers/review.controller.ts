// apps/api/src/controllers/review.controller.ts

import { Request, Response, NextFunction } from "express";
import { reviewService } from "../services/review.service.js";

export const reviewController = {
  createReview: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: "Authentication required." });
        return;
      }

      const review = await reviewService.createReview(req.user.id, req.body);
      res.status(201).json({
        success: true,
        message: "Review submitted successfully.",
        data: review,
      });
    } catch (error) {
      next(error);
    }
  },

  getProductReviews: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const productId = req.params.productId;
      const currentUserId = req.user?.id;
      const data = await reviewService.getProductReviews(productId, currentUserId);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  getAdminReviews: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await reviewService.getAdminReviews(req.query as any);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  toggleApproval: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const review = await reviewService.toggleApproval(req.params.id, req.user?.id);
      res.status(200).json({
        success: true,
        message: review.approved ? "Review approved." : "Review hidden from storefront.",
        data: review,
      });
    } catch (error) {
      next(error);
    }
  },

  deleteReview: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await reviewService.deleteReview(req.params.id, req.user?.id);
      res.status(200).json({
        success: true,
        message: "Review deleted successfully.",
      });
    } catch (error) {
      next(error);
    }
  },
};
