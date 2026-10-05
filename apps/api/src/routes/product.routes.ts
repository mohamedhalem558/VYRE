import { Router } from "express";
import { UserRole } from "@prisma/client";
import { productController } from "../controllers/product.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { validateBody, validateQuery } from "../middleware/validate.middleware.js";
import {
  createProductSchema,
  productQuerySchema,
  updateProductSchema,
} from "../schemas/product.schema.js";

const router = Router();

// Public Read Endpoints
router.get("/", validateQuery(productQuerySchema), productController.getProducts);
router.get("/slug/:slug", productController.getProductBySlug);
router.get("/:id", productController.getProductById);

// Protected Admin / Inventory Manager Mutation Endpoints
router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.INVENTORY_MANAGER),
  validateBody(createProductSchema),
  productController.createProduct
);

router.patch(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.INVENTORY_MANAGER),
  validateBody(updateProductSchema),
  productController.updateProduct
);

router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.INVENTORY_MANAGER),
  productController.deleteProduct
);

export default router;
