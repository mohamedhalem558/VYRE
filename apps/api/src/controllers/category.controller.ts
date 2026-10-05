import { Request, Response, NextFunction } from "express";
import { categoryService } from "../services/category.service.js";

export class CategoryController {
  async getAllCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await categoryService.getAllCategories();
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const category = await categoryService.getCategoryByIdOrSlug(id);

      if (!category) {
        res.status(404).json({
          success: false,
          error: "Category not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await categoryService.createCategory(req.body);
      res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: created,
      });
    } catch (error: any) {
      if (error?.code === "P2002") {
        res.status(409).json({
          success: false,
          error: "A category with this slug already exists",
        });
        return;
      }
      next(error);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await categoryService.updateCategory(id, req.body);

      res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: updated,
      });
    } catch (error: any) {
      if (error?.code === "P2025") {
        res.status(404).json({
          success: false,
          error: "Category not found",
        });
        return;
      }
      next(error);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await categoryService.deleteCategory(id);

      res.status(200).json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error: any) {
      if (error?.code === "P2025") {
        res.status(404).json({
          success: false,
          error: "Category not found",
        });
        return;
      }
      next(error);
    }
  }
}

export const categoryController = new CategoryController();
