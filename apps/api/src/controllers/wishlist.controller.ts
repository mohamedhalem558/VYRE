import { Request, Response, NextFunction } from "express";
import { wishlistService } from "../services/wishlist.service.js";

export class WishlistController {
  async getWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const wishlist = await wishlistService.getWishlist(userId);
      res.status(200).json({
        success: true,
        data: wishlist,
      });
    } catch (error) {
      next(error);
    }
  }

  async addToWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { productId } = req.params;
      const wishlist = await wishlistService.addToWishlist(userId, productId);
      res.status(200).json({
        success: true,
        message: "Product added to wishlist",
        data: wishlist,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || "Failed to add to wishlist",
      });
    }
  }

  async removeFromWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { productId } = req.params;
      const wishlist = await wishlistService.removeFromWishlist(userId, productId);
      res.status(200).json({
        success: true,
        message: "Product removed from wishlist",
        data: wishlist,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || "Failed to remove from wishlist",
      });
    }
  }
}

export const wishlistController = new WishlistController();
