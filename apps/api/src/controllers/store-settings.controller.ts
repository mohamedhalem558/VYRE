import { Request, Response, NextFunction } from "express";
import { storeSettingsService } from "../services/store-settings.service.js";

export class StoreSettingsController {
  async getSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await storeSettingsService.getSettings();
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userEmail = (req as any).user?.email || "Admin";
      const updated = await storeSettingsService.updateSettings(req.body, userEmail);
      res.status(200).json({
        success: true,
        data: updated,
        message: "Storefront mode and seasonal theme settings updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async subscribeDrop(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, source } = req.body;
      const result = await storeSettingsService.subscribeToWaitlist(email, source);
      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async getWaitlistSubscribers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subscribers = await storeSettingsService.getWaitlistSubscribers();
      res.status(200).json({
        success: true,
        data: {
          subscribers,
          count: subscribers.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const storeSettingsController = new StoreSettingsController();
