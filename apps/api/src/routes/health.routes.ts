import { Router } from "express";
import { HealthController } from "../controllers/health.controller.js";

const router = Router();

// GET /api/v1/health - Basic health endpoint
router.get("/", HealthController.getHealth);

// GET /api/v1/health/detailed - Detailed health endpoint with DB verification
router.get("/detailed", HealthController.getDetailedHealth);

export default router;
