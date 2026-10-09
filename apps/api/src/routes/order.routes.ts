import { Router } from "express";
import { orderController } from "../controllers/order.controller.js";
import { authenticate, optionalAuthenticate, authorize } from "../middleware/auth.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

// Shipping rates are available for checkout preview
router.get("/shipping-rates", (req, res, next) =>
  orderController.getShippingRates(req, res, next)
);

// Order creation supports both guests and authenticated users
router.post("/", optionalAuthenticate, (req, res, next) =>
  orderController.createOrder(req, res, next)
);

// Single order view supports both guests (by order ID) and authenticated account owners
router.get("/:id", optionalAuthenticate, (req, res, next) =>
  orderController.getOrderById(req, res, next)
);

// All subsequent customer order history & admin management operations require authentication
router.use(authenticate);

router.get("/", (req, res, next) => orderController.getOrders(req, res, next));

// Only ADMIN can change order statuses
router.patch("/:id/status", authorize(UserRole.ADMIN), (req, res, next) =>
  orderController.updateOrderStatus(req, res, next)
);

export default router;
