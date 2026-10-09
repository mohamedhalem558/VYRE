import { Request, Response, NextFunction } from "express";
import { orderService } from "../services/order.service.js";
import {
  createOrderSchema,
  orderQuerySchema,
  updateOrderStatusSchema,
} from "../schemas/order.schema.js";
import { UserRole } from "@prisma/client";

export class OrderController {
  async getShippingRates(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rates = await orderService.getShippingRates();
      res.status(200).json({
        success: true,
        data: rates,
      });
    } catch (error) {
      next(error);
    }
  }

  async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user ? req.user.id : null;
      const validatedInput = createOrderSchema.parse(req.body);
      const order = await orderService.createOrder(userId, validatedInput);
      res.status(201).json({
        success: true,
        message: "Order placed successfully",
        data: order,
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
        error: error.message || "Failed to create order",
      });
    }
  }

  async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const query = orderQuerySchema.parse(req.query);

      if (user.role === UserRole.ADMIN) {
        const result = await orderService.getAllOrders(query);
        res.status(200).json({
          success: true,
          data: result,
        });
      } else {
        const result = await orderService.getUserOrders(user.id, query);
        res.status(200).json({
          success: true,
          data: result,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      const { id } = req.params;
      const isAdmin = user?.role === UserRole.ADMIN;
      const order = await orderService.getOrderById(id, user?.id || null, isAdmin);
      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      res.status(403).json({
        success: false,
        error: error.message || "Order not accessible",
      });
    }
  }

  async updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.id;
      const { id } = req.params;
      const validated = updateOrderStatusSchema.parse(req.body);
      const updated = await orderService.updateOrderStatus(id, validated, adminId);
      res.status(200).json({
        success: true,
        message: `Order status updated to ${validated.status}`,
        data: updated,
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
        error: error.message || "Failed to update order status",
      });
    }
  }
}

export const orderController = new OrderController();
