import { Router } from "express";
import { taxonomyController } from "../controllers/taxonomy.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/sizes", taxonomyController.getSizes);
router.post(
  "/sizes",
  authenticate,
  authorize("ADMIN", "INVENTORY_MANAGER"),
  taxonomyController.createSize
);
router.post(
  "/sizes/seed",
  authenticate,
  authorize("ADMIN", "INVENTORY_MANAGER"),
  taxonomyController.seedSizes
);
router.get("/colors", taxonomyController.getColors);
router.post(
  "/colors",
  authenticate,
  authorize("ADMIN", "INVENTORY_MANAGER"),
  taxonomyController.createColor
);
router.delete(
  "/colors/:id",
  authenticate,
  authorize("ADMIN", "INVENTORY_MANAGER"),
  taxonomyController.deleteColor
);

export default router;
