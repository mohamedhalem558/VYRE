import { Router } from "express";
import { taxonomyController } from "../controllers/taxonomy.controller.js";

const router = Router();

router.get("/sizes", taxonomyController.getSizes);
router.get("/colors", taxonomyController.getColors);

export default router;
