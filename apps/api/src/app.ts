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

// ─── Allowed Origins Validator ────────────────────────────────────────────────
const PRODUCTION_ORIGINS = [
  "https://www.vyree.shop",
  "https://vyree.shop",
  "https://api.vyree.shop",
];

const LOCAL_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5000",
];

const SUBDOMAIN_REGEX = /^https:\/\/([a-zA-Z0-9-]+\.)*vyree\.shop$/;
const VERCEL_REGEX = /^https:\/\/.*\.vercel\.app$/;

export function isOriginAllowed(origin?: string): boolean {
  if (!origin) return true; // Allow non-browser requests (mobile apps, server-to-server, curl)

  const normalized = origin.trim().replace(/\/+$/, "");

  // 1. Explicit production origins
  if (PRODUCTION_ORIGINS.includes(normalized)) {
    return true;
  }

  // 2. Any subdomain matching /^https:\/\/([a-zA-Z0-9-]+\.)*vyree\.shop$/
  if (SUBDOMAIN_REGEX.test(normalized)) {
    return true;
  }

  // 3. Environment-configured origins
  if (env.CLIENT_URL) {
    const envOrigins = env.CLIENT_URL.split(",").map((o) => o.trim().replace(/\/+$/, ""));
    if (envOrigins.includes(normalized)) {
      return true;
    }
  }

  // 4. Local development URLs
  if (LOCAL_ORIGINS.includes(normalized)) {
    return true;
  }

  // 5. Vercel preview & production deployments
  if (VERCEL_REGEX.test(normalized)) {
    return true;
  }

  // 6. In development mode, allow any origin
  if (env.NODE_ENV === "development") {
    return true;
  }

  return false;
}

export function createApp(): Express {
  const app = express();

  // Trust reverse proxies (Render, Vercel, Cloudflare) for HTTPS, cookies & client IPs
  app.set("trust proxy", 1);

  // ─── 1. Fail-Safe Global CORS & Preflight Middleware ─────────────────────────
  // This executes FIRST on every incoming request, before Helmet, parsers, or routers.
  // Guarantees that preflight OPTIONS requests return immediately with 200 OK and
  // that all responses have CORS headers attached even if a downstream error occurs.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    if (origin && isOriginAllowed(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, Accept, Origin"
      );
      res.setHeader("Access-Control-Expose-Headers", "Set-Cookie");
      res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours preflight cache
    }

    // Intercept and resolve preflight OPTIONS requests immediately
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    next();
  });

  // ─── 2. Standard CORS Middleware ─────────────────────────────────────────────
  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
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
    optionsSuccessStatus: 200,
    maxAge: 86400,
  };

  app.use(cors(corsOptions));

  // ─── 3. Security Headers (Helmet) ───────────────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginOpenerPolicy: false,
    })
  );

  // ─── 4. Lightweight Cookie Parser Middleware ────────────────────────────────
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

  // ─── 5. Static Files & Body Parsers ──────────────────────────────────────────
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // ─── 6. Logging ─────────────────────────────────────────────────────────────
  if (env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
    app.use(requestLogger);
  }

  // ─── 7. Root Health & Information ───────────────────────────────────────────
  app.get("/", (_req: Request, res: Response) => {
    res.json({
      brand: "VYRE",
      tagline: "Egyptian Premium Streetwear & Modern Clothing",
      api: "/api/v1",
      health: "/api/v1/health",
      docs: "Phase 1 Architecture Foundation",
    });
  });

  // ─── 8. API Routes ──────────────────────────────────────────────────────────
  app.use("/api/v1", apiRouter);

  // ─── 9. Error Handling ──────────────────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
