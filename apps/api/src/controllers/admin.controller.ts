import { Request, Response, NextFunction } from "express";
import { adminService } from "../services/admin.service.js";
import { UserRole } from "@prisma/client";

export class AdminController {
  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminService.getDashboardStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = req.query.search as string;

      const result = await adminService.getCustomers({ page, limit, search });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleCustomerStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminUserId = req.user!.id;
      const newStatus = await adminService.toggleCustomerStatus(id, adminUserId);
      res.status(200).json({
        success: true,
        message: `Customer account ${newStatus ? "activated" : "deactivated"} successfully.`,
        data: { active: newStatus },
      });
    } catch (error) {
      next(error);
    }
  }

  async getCustomerOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const orders = await adminService.getCustomerOrders(id);
      res.status(200).json({
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = req.query.search as string;
      const role = req.query.role as UserRole | undefined;

      const result = await adminService.getUsers({ page, limit, search, role });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const adminUserId = req.user!.id;

      if (!role || !Object.values(UserRole).includes(role)) {
        res.status(400).json({
          success: false,
          error: "Invalid or missing user role.",
        });
        return;
      }

      const updated = await adminService.updateUserRole(id, role, adminUserId);
      res.status(200).json({
        success: true,
        message: `User role updated to ${role}.`,
        data: updated,
      });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message || "Failed to update user role.",
      });
    }
  }

  async toggleUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminUserId = req.user!.id;
      const newStatus = await adminService.toggleUserStatus(id, adminUserId);
      res.status(200).json({
        success: true,
        message: `User account ${newStatus ? "activated" : "deactivated"} successfully.`,
        data: { active: newStatus },
      });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message || "Failed to toggle user status.",
      });
    }
  }
}

export const adminController = new AdminController();
