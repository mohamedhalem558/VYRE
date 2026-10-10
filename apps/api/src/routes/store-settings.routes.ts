import { Router } from "express";
import { UserRole } from "@prisma/client";
import { storeSettingsController } from "../controllers/store-settings.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  updateStoreSettingsSchema,
  dropWaitlistSubscribeSchema,
} from "../schemas/store-settings.schema.js";

const router = Router();

// Public Read Endpoint for Storefront Mode and Themes
router.get("/", storeSettingsController.getSettings);

// Public Email Waitlist Subscription for Drop Coming Soon
router.post(
  "/subscribe",
  validateBody(dropWaitlistSubscribeSchema),
  storeSettingsController.subscribeDrop
);

// Protected Admin / Staff Update Endpoint
router.put(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MARKETING_MANAGER),
  validateBody(updateStoreSettingsSchema),
  storeSettingsController.updateSettings
);

router.patch(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MARKETING_MANAGER),
  validateBody(updateStoreSettingsSchema),
  storeSettingsController.updateSettings
);

// Protected Admin Read Endpoint for VIP Drop Waitlist Subscribers
router.get(
  "/subscribers",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MARKETING_MANAGER),
  storeSettingsController.getWaitlistSubscribers
);

export default router;
