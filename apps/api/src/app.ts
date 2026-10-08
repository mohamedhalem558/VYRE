import path from "node:path";
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

  // Security headers with crossOriginResourcePolicy allowing frontend to load uploaded media
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // Parse allowed origins from environment (supports comma-separated URLs)
  const configuredOrigins = env.CLIENT_URL
    ? env.CLIENT_URL.split(",").map((o) => o.trim().replace(/\/+$/, ""))
    : [];

  const productionOrigins = [
    "https://www.vyree.shop",
    "https://vyree.shop",
  ];

  const localOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
  ];

  const allowedOrigins = Array.from(
    new Set([...configuredOrigins, ...productionOrigins, ...localOrigins])
  );

  // CORS Configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server health checks)
        if (!origin) {
          return callback(null, true);
        }

        const normalizedOrigin = origin.replace(/\/+$/, "");

        // Allow explicitly configured origins or localhost or production domains
        if (allowedOrigins.includes(normalizedOrigin)) {
          return callback(null, true);
        }

        // Allow any vyree.shop subdomain
        if (/^https:\/\/([a-zA-Z0-9-]+\.)*vyree\.shop$/.test(normalizedOrigin)) {
          return callback(null, true);
        }

        // Allow Vercel preview & production deployments (*.vercel.app)
        if (/^https:\/\/.*\.vercel\.app$/.test(normalizedOrigin)) {
          return callback(null, true);
        }

        // In development, allow all origins
        if (env.NODE_ENV === "development") {
          return callback(null, true);
        }

        return callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
      exposedHeaders: ["Set-Cookie"],
    })
  );

  // Static files for uploaded product images
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Body parsers (support large base64 image uploads)
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

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
