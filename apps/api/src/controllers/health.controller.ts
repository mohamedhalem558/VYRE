import { Request, Response } from "express";
import { HealthService } from "../services/health.service.js";

export class HealthController {
  public static getHealth(_req: Request, res: Response): void {
    const health = HealthService.getBasicHealth();
    res.status(200).json(health);
  }

  public static async getDetailedHealth(_req: Request, res: Response): Promise<void> {
    const health = await HealthService.getDetailedHealth();
    res.status(200).json(health);
  }
}
