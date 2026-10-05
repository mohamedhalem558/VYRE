import { Request, Response, NextFunction } from "express";
import { inventoryService } from "../services/inventory.service.js";
import { adjustStockSchema, inventoryQuerySchema } from "../schemas/inventory.schema.js";

export class InventoryController {
  async getInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedQuery = inventoryQuerySchema.parse(req.query);
      const result = await inventoryService.getInventory(validatedQuery);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLowStock(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await inventoryService.getLowStock();
      res.status(200).json({
        success: true,
        data: {
          items,
          count: items.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getOutOfStock(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await inventoryService.getOutOfStock();
      res.status(200).json({
        success: true,
        data: {
          items,
          count: items.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getVariantHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { variantId } = req.params;
      const history = await inventoryService.getVariantHistory(variantId);
      res.status(200).json({
        success: true,
        data: {
          history,
          count: history.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { variantId } = req.params;
      const userId = req.user?.id;
      const validatedInput = adjustStockSchema.parse(req.body);
      const result = await inventoryService.adjustStock(variantId, validatedInput, userId);
      res.status(200).json({
        success: true,
        message: "Stock successfully updated",
        data: result,
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
        error: error.message || "Failed to adjust stock",
      });
    }
  }
}

export const inventoryController = new InventoryController();
