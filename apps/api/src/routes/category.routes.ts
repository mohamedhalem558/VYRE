import { Router } from "express";
import { UserRole } from "@prisma/client";
import { categoryController } from "../controllers/category.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { createCategorySchema, updateCategorySchema } from "../schemas/category.schema.js";

const router = Router();

// Public Read Endpoints
router.get("/", categoryController.getAllCategories);
router.get("/:id", categoryController.getCategoryById);

// Protected Admin / Inventory / Marketing Manager Mutation Endpoints
router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.MARKETING_MANAGER),
  validateBody(createCategorySchema),
  categoryController.createCategory
);

router.patch(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.MARKETING_MANAGER),
  validateBody(updateCategorySchema),
  categoryController.updateCategory
);

router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MARKETING_MANAGER),
  categoryController.deleteCategory
);

export default router;
