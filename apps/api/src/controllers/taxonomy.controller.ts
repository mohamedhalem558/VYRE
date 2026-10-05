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
}

export const taxonomyController = new TaxonomyController();
