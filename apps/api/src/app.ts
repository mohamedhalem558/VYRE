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
    "https://api.vyree.shop",
  ];

  const localOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5000",
  ];

  const allowedOrigins = Array.from(
    new Set([...configuredOrigins, ...productionOrigins, ...localOrigins])
  );

  const corsOptions: cors.CorsOptions = {
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

      // Allow any vyree.shop domain or subdomain (with or without port)
      if (/^https?:\/\/([a-zA-Z0-9-]+\.)*vyree\.shop(:[0-9]+)?$/i.test(normalizedOrigin)) {
        return callback(null, true);
      }

      // Allow Vercel preview & production deployments (*.vercel.app)
      if (/^https:\/\/.*\.vercel\.app$/i.test(normalizedOrigin)) {
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
  };

  // CORS Configuration
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

  // Lightweight Cookie Parser Middleware
  app.use((req, _res, next) => {
    const cookieHeader = req.headers.cookie;
    (req as any).cookies = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const parts = cookie.split("=");
        const name = parts[0]?.trim();
        const val = parts.slice(1).join("=").trim();
        if (name) {
          (req as any).cookies[name] = decodeURIComponent(val);
        }
      });
    }
    next();
  });

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
