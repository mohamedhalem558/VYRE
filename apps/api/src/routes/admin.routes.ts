import { Router } from "express";
import { UserRole } from "@prisma/client";
import { adminController } from "../controllers/admin.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

// Require authentication for all admin routes
router.use(authenticate);

// 1. Dashboard Analytics & Stats (Admin & Marketing Manager)
router.get(
  "/stats",
  authorize(UserRole.ADMIN, UserRole.MARKETING_MANAGER),
  adminController.getDashboardStats
);

// 2. Customer Management (Admin Only)
router.get(
  "/customers",
  authorize(UserRole.ADMIN),
  adminController.getCustomers
);

router.patch(
  "/customers/:id/toggle",
  authorize(UserRole.ADMIN),
  adminController.toggleCustomerStatus
);

router.get(
  "/customers/:id/orders",
  authorize(UserRole.ADMIN),
  adminController.getCustomerOrders
);

// 3. User & Role Management (Admin Only)
router.get(
  "/users",
  authorize(UserRole.ADMIN),
  adminController.getUsers
);

router.patch(
  "/users/:id/role",
  authorize(UserRole.ADMIN),
  adminController.updateUserRole
);

router.patch(
  "/users/:id/toggle",
  authorize(UserRole.ADMIN),
  adminController.toggleUserStatus
);

export default router;
