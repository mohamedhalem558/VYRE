import { Router } from "express";
import { UserRole } from "@prisma/client";
import { adminController } from "../controllers/admin.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

// Require authentication for all user management routes
router.use(authenticate);

// 1. Get all users (Admin only)
router.get(
  "/",
  authorize(UserRole.ADMIN),
  adminController.getUsers
);

// 2. Change user role: PATCH /api/v1/users/:id/role (Admin only)
router.patch(
  "/:id/role",
  authorize(UserRole.ADMIN),
  adminController.updateUserRole
);

// 3. Toggle user active status: PATCH /api/v1/users/:id/toggle (Admin only)
router.patch(
  "/:id/toggle",
  authorize(UserRole.ADMIN),
  adminController.toggleUserStatus
);

export default router;
