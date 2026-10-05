import { Router } from "express";
import { inventoryController } from "../controllers/inventory.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

// Inventory management is strictly protected for ADMIN and INVENTORY_MANAGER
router.use(authenticate);
router.use(authorize(UserRole.ADMIN, UserRole.INVENTORY_MANAGER));

router.get("/", (req, res, next) => inventoryController.getInventory(req, res, next));
router.get("/low-stock", (req, res, next) => inventoryController.getLowStock(req, res, next));
router.get("/out-of-stock", (req, res, next) => inventoryController.getOutOfStock(req, res, next));
router.get("/:variantId/history", (req, res, next) =>
  inventoryController.getVariantHistory(req, res, next)
);
router.post("/:variantId/adjust", (req, res, next) =>
  inventoryController.adjustStock(req, res, next)
);

export default router;
