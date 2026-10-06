import { Router } from "express";
import { UserRole } from "@prisma/client";
import { heroController } from "../controllers/hero.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { updateHeroSchema } from "../schemas/hero.schema.js";

const router = Router();

// Public Read Endpoint for Homepage Hero
router.get("/", heroController.getHero);

// Protected Admin / Marketing Manager Update Endpoint
router.put(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MARKETING_MANAGER),
  validateBody(updateHeroSchema),
  heroController.updateHero
);

router.patch(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MARKETING_MANAGER),
  validateBody(updateHeroSchema),
  heroController.updateHero
);

export default router;
