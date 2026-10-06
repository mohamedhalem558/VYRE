import { Request, Response, NextFunction } from "express";
import { heroService } from "../services/hero.service.js";

export class HeroController {
  async getHero(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hero = await heroService.getHero();
      res.status(200).json({
        success: true,
        data: hero,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateHero(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hero = await heroService.updateHero(req.body);
      res.status(200).json({
        success: true,
        data: hero,
        message: "Homepage Hero configuration updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const heroController = new HeroController();
