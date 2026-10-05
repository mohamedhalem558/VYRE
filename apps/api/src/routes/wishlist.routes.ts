import { Router } from "express";
import { wishlistController } from "../controllers/wishlist.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// All wishlist endpoints require authentication
router.use(authenticate);

router.get("/", (req, res, next) => wishlistController.getWishlist(req, res, next));
router.post("/:productId", (req, res, next) => wishlistController.addToWishlist(req, res, next));
router.delete("/:productId", (req, res, next) => wishlistController.removeFromWishlist(req, res, next));

export default router;
