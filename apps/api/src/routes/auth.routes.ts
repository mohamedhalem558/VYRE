import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { authRateLimiter } from "../middleware/rateLimiter.middleware.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../schemas/auth.schema.js";

const router = Router();

router.post(
  "/register",
  authRateLimiter,
  validateBody(registerSchema),
  authController.register
);

router.post(
  "/login",
  authRateLimiter,
  validateBody(loginSchema),
  authController.login
);

router.post(
  "/logout",
  authenticate,
  authController.logout
);

router.post(
  "/refresh",
  validateBody(refreshTokenSchema),
  authController.refresh
);

router.post(
  "/forgot-password",
  authRateLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  "/reset-password",
  authRateLimiter,
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

router.get(
  "/me",
  authenticate,
  authController.getMe
);

export default router;
