import { Request, Response, NextFunction } from "express";
import { productService } from "../services/product.service.js";

export class ProductController {
  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await productService.getProducts(req.query as any);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const product = await productService.getProductByIdOrSlug(id);

      if (!product) {
        res.status(404).json({
          success: false,
          error: "Product not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const product = await productService.getProductByIdOrSlug(slug);

      if (!product) {
        res.status(404).json({
          success: false,
          error: `Product with slug '${slug}' not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.createProduct(req.body);
      res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product,
      });
    } catch (error: any) {
      if (error?.code === "P2002") {
        res.status(409).json({
          success: false,
          error: "A product with this slug or variant SKU already exists",
        });
        return;
      }
      next(error);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await productService.updateProduct(id, req.body);

      res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: updated,
      });
    } catch (error: any) {
      if (error?.code === "P2025") {
        res.status(404).json({
          success: false,
          error: "Product not found",
        });
        return;
      }
      next(error);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await productService.deleteProduct(id);

      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error: any) {
      if (error?.code === "P2025") {
        res.status(404).json({
          success: false,
          error: "Product not found",
        });
        return;
      }
      next(error);
    }
  }
}

export const productController = new ProductController();
