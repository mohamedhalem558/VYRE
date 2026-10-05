import { Request, Response, NextFunction } from "express";
import { cartService } from "../services/cart.service.js";
import {
  addToCartSchema,
  updateCartItemSchema,
  mergeCartSchema,
} from "../schemas/cart.schema.js";

export class CartController {
  async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const cart = await cartService.getCart(userId);
      res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const validated = addToCartSchema.parse(req.body);
      const cart = await cartService.addItem(userId, validated);
      res.status(201).json({
        success: true,
        message: "Item added to cart",
        data: cart,
      });
    } catch (error: any) {
      if (error?.name === "ZodError") {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors,
        });
        return;
      }
      res.status(400).json({
        success: false,
        error: error.message || "Failed to add item to cart",
      });
    }
  }

  async updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const validated = updateCartItemSchema.parse(req.body);
      const cart = await cartService.updateItemQuantity(userId, id, validated.quantity);
      res.status(200).json({
        success: true,
        message: "Cart item updated",
        data: cart,
      });
    } catch (error: any) {
      if (error?.name === "ZodError") {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors,
        });
        return;
      }
      res.status(400).json({
        success: false,
        error: error.message || "Failed to update cart item",
      });
    }
  }

  async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const cart = await cartService.removeItem(userId, id);
      res.status(200).json({
        success: true,
        message: "Item removed from cart",
        data: cart,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || "Failed to remove cart item",
      });
    }
  }

  async clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const cart = await cartService.clearCart(userId);
      res.status(200).json({
        success: true,
        message: "Cart cleared successfully",
        data: cart,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || "Failed to clear cart",
      });
    }
  }

  async mergeCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const validated = mergeCartSchema.parse(req.body);
      const cart = await cartService.mergeGuestCart(userId, validated);
      res.status(200).json({
        success: true,
        message: "Guest cart merged successfully",
        data: cart,
      });
    } catch (error: any) {
      if (error?.name === "ZodError") {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors,
        });
        return;
      }
      res.status(400).json({
        success: false,
        error: error.message || "Failed to merge cart",
      });
    }
  }
}

export const cartController = new CartController();
