import { Router } from "express";
import { cartController } from "../controllers/cart.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// All cart endpoints require user authentication
router.use(authenticate);

// Cart routes
router.get("/", (req, res, next) => cartController.getCart(req, res, next));
router.delete("/", (req, res, next) => cartController.clearCart(req, res, next));
router.post("/items", (req, res, next) => cartController.addItem(req, res, next));
router.patch("/items/:id", (req, res, next) => cartController.updateItem(req, res, next));
router.delete("/items/:id", (req, res, next) => cartController.removeItem(req, res, next));
router.post("/merge", (req, res, next) => cartController.mergeCart(req, res, next));

export default router;
