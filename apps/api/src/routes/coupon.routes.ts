// apps/api/src/routes/coupon.routes.ts

import { Router } from "express";
import { UserRole } from "@prisma/client";
import { couponController } from "../controllers/coupon.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { validateBody, validateQuery } from "../middleware/validate.middleware.js";
import {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
  couponQuerySchema,
} from "../schemas/coupon.schema.js";

const router = Router();

// Public validation endpoint (for customer checkout / cart drawer)
router.post(
  "/validate",
  validateBody(validateCouponSchema),
  couponController.validateCoupon
);

// Admin & Marketing Manager Management Endpoints
router.use(authenticate);
router.use(authorize(UserRole.ADMIN, UserRole.MARKETING_MANAGER));

router.get("/", validateQuery(couponQuerySchema), couponController.getCoupons);
router.get("/:id", couponController.getCouponById);
router.post("/", validateBody(createCouponSchema), couponController.createCoupon);
router.patch("/:id", validateBody(updateCouponSchema), couponController.updateCoupon);
router.delete("/:id", couponController.deleteCoupon);

export default router;
