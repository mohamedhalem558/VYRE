import { Router } from "express";
import { uploadController, uploadMiddleware } from "../controllers/upload.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

// Allow authenticated staff/admins to upload images
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "INVENTORY_MANAGER", "MARKETING_MANAGER"),
  uploadMiddleware.array("images", 10),
  uploadController.uploadImages
);

export default router;
