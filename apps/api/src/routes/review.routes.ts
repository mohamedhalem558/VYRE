// apps/api/src/routes/review.routes.ts

import { Router } from "express";
import { UserRole } from "@prisma/client";
import { reviewController } from "../controllers/review.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { validateBody, validateQuery } from "../middleware/validate.middleware.js";
import {
  createReviewSchema,
  reviewQuerySchema,
} from "../schemas/review.schema.js";

const router = Router();

// Public: Get reviews for a product
router.get("/product/:productId", reviewController.getProductReviews);

// Customer: Submit verified review
router.post(
  "/",
  authenticate,
  validateBody(createReviewSchema),
  reviewController.createReview
);

// Admin: Review Moderation Endpoints
router.get(
  "/admin",
  authenticate,
  authorize(UserRole.ADMIN),
  validateQuery(reviewQuerySchema),
  reviewController.getAdminReviews
);

router.patch(
  "/:id/toggle",
  authenticate,
  authorize(UserRole.ADMIN),
  reviewController.toggleApproval
);

router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  reviewController.deleteReview
);

export default router;
