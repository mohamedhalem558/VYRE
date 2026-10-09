import { Request, Response, NextFunction } from "express";
import { taxonomyService } from "../services/taxonomy.service.js";

export class TaxonomyController {
  async getSizes(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sizes = await taxonomyService.getSizes();
      res.status(200).json({
        success: true,
        data: sizes,
      });
    } catch (error) {
      next(error);
    }
  }

  async getColors(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const colors = await taxonomyService.getColors();
      res.status(200).json({
        success: true,
        data: colors,
      });
    } catch (error) {
      next(error);
    }
  }

  async createColor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, hexCode, code } = req.body;
      if (!name || !hexCode) {
        res.status(400).json({
          success: false,
          error: "Color name and hexCode are required.",
        });
        return;
      }
      const color = await taxonomyService.createColor(name, hexCode, code);
      res.status(201).json({
        success: true,
        data: color,
      });
    } catch (error) {
      next(error);
    }
  }

  async createSize(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, code, displayOrder } = req.body;
      if (!name || !code) {
        res.status(400).json({
          success: false,
          error: "Size name and code (e.g. 'M', 'XL') are required.",
        });
        return;
      }
      const size = await taxonomyService.createSize(name, code, displayOrder);
      res.status(201).json({
        success: true,
        data: size,
      });
    } catch (error) {
      next(error);
    }
  }

  async seedSizes(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await taxonomyService.seedDefaultSizes();
      const sizes = await taxonomyService.getSizes();
      res.status(200).json({
        success: true,
        message: "Default sizes initialized successfully",
        data: sizes,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteColor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await taxonomyService.deleteColor(id);
      res.status(200).json({
        success: true,
        message: "Color deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const taxonomyController = new TaxonomyController();
