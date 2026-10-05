import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import apiRouter from "./routes/index.js";
import { requestLogger } from "./middleware/requestLogger.middleware.js";
import { notFoundHandler } from "./middleware/notFound.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";

export function createApp(): Express {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS Configuration
  app.use(
    cors({
      origin: [env.CLIENT_URL, "http://localhost:5173", "http://localhost:3000"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logging
  if (env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
    app.use(requestLogger);
  }

  // Root redirect/status
  app.get("/", (_req, res) => {
    res.json({
      brand: "VYRE",
      tagline: "Egyptian Premium Streetwear & Modern Clothing",
      api: "/api/v1",
      health: "/api/v1/health",
      docs: "Phase 1 Architecture Foundation",
    });
  });

  // Mount API v1 Routes
  app.use("/api/v1", apiRouter);

  // 404 Route handler
  app.use(notFoundHandler);

  // Centralized Error handler
  app.use(errorHandler);

  return app;
}
