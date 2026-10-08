import path from "node:path";
import express, { Express, Request, Response, NextFunction } from "express";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import apiRouter from "./routes/index.js";
import { requestLogger } from "./middleware/requestLogger.middleware.js";
import { notFoundHandler } from "./middleware/notFound.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";

// ─── Unified Origin Validator ────────────────────────────────────────────────
export function isAllowedOrigin(origin?: string): boolean {
  // Allow requests with no origin (mobile apps, server-to-server, curl, Postman)
  if (!origin) return true;

  const lower = origin.toLowerCase().trim().replace(/\/+$/, "");

  // 1. Any domain ending with or containing "vyree.shop"
  // Covers https://www.vyree.shop, https://vyree.shop, https://api.vyree.shop,
  // preview/dev subdomains, and any port variations (e.g. :443)
  if (lower.includes("vyree.shop")) {
    return true;
  }

  // 2. Any Vercel deployment preview or production domain (*.vercel.app)
  if (lower.includes(".vercel.app") || lower.endsWith("vercel.app")) {
    return true;
  }

  // 3. Local development URLs
  if (
    lower.includes("localhost") ||
    lower.includes("127.0.0.1") ||
    lower.includes("0.0.0.0")
  ) {
    return true;
  }

  // 4. Any origin explicitly configured in CLIENT_URL environment variable
  if (env.CLIENT_URL) {
    const configuredOrigins = env.CLIENT_URL
      .toLowerCase()
      .split(",")
      .map((item) => item.trim().replace(/\/+$/, ""));
    if (configuredOrigins.some((cfg) => lower === cfg || lower.includes(cfg))) {
      return true;
    }
  }

  // 5. In development mode, allow all origins
  if (env.NODE_ENV === "development") {
    return true;
  }

  return false;
}

export function createApp(): Express {
  const app = express();

  // Trust reverse proxies (Render, Vercel, Cloudflare, Railway) for HTTPS, cookies & client IPs
  app.set("trust proxy", 1);

  // ─── Single, Unified Standard CORS Middleware ────────────────────────────────
  // The 'cors' package natively handles both preflight OPTIONS requests and
  // standard cross-origin headers without conflicting middleware or 502 socket drops.
  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Set-Cookie"],
    optionsSuccessStatus: 200, // Respond with 200 to preflight OPTIONS for proxy & browser compatibility
  };

  // Mount standard CORS at the very top of the middleware pipeline
  app.use(cors(corsOptions));

  // ─── Security Headers (Helmet) ───────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // ─── Lightweight Cookie Parser Middleware ────────────────────────────────────
  app.use((req: Request, _res: Response, next: NextFunction) => {
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

  // ─── Static Files & Body Parsers ─────────────────────────────────────────────
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // ─── Request Logging ─────────────────────────────────────────────────────────
  if (env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
    app.use(requestLogger);
  }

  // ─── Root Health & Status ────────────────────────────────────────────────────
  app.get("/", (_req: Request, res: Response) => {
    res.json({
      brand: "VYRE",
      tagline: "Egyptian Premium Streetwear & Modern Clothing",
      api: "/api/v1",
      health: "/api/v1/health",
      docs: "Phase 1 Architecture Foundation",
    });
  });

  // ─── API Routes ──────────────────────────────────────────────────────────────
  app.use("/api/v1", apiRouter);

  // ─── Error Handling ──────────────────────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
