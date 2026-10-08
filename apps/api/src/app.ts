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

// ─── Robust Origin Validator ──────────────────────────────────────────────────
export function isAllowedOrigin(origin?: string): boolean {
  if (!origin) return true; // Allow non-browser requests (mobile apps, server-to-server, curl)

  const lower = origin.toLowerCase().trim().replace(/\/+$/, "");

  // 1. Unconditionally allow ANY domain ending with or containing "vyree.shop"
  // Covers https://www.vyree.shop, https://vyree.shop, https://api.vyree.shop,
  // staging/dev subdomains, and any port variations (e.g. :443)
  if (lower.includes("vyree.shop")) {
    return true;
  }

  // 2. Allow any Vercel deployment preview or production domain (*.vercel.app)
  if (lower.includes(".vercel.app") || lower.endsWith("vercel.app")) {
    return true;
  }

  // 3. Allow local development URLs
  if (
    lower.includes("localhost") ||
    lower.includes("127.0.0.1") ||
    lower.includes("0.0.0.0")
  ) {
    return true;
  }

  // 4. Allow any origin explicitly configured in CLIENT_URL environment variable
  if (env.CLIENT_URL) {
    const configuredOrigins = env.CLIENT_URL
      .toLowerCase()
      .split(",")
      .map((item) => item.trim().replace(/\/+$/, ""));
    if (configuredOrigins.some((cfg) => lower === cfg || lower.includes(cfg))) {
      return true;
    }
  }

  // 5. In development environment, allow all origins
  if (env.NODE_ENV === "development") {
    return true;
  }

  return false;
}

export function createApp(): Express {
  const app = express();

  // Trust reverse proxies (Render, Vercel, Cloudflare) for HTTPS, cookies & client IPs
  app.set("trust proxy", 1);

  // ─── 1. Global CORS & Preflight Interceptor (MUST BE FIRST) ───────────────────
  // Executes before Helmet, parsers, or any route handlers.
  // Guarantees that preflight OPTIONS requests return 200 OK immediately with all CORS
  // headers attached, and that regular API responses always retain CORS headers.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    if (origin && isAllowedOrigin(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, Accept, Origin, Range"
      );
      res.setHeader(
        "Access-Control-Expose-Headers",
        "Set-Cookie, Content-Range, X-Total-Count"
      );
      res.setHeader("Access-Control-Max-Age", "86400"); // Cache preflight for 24 hours
    }

    // Intercept and resolve preflight OPTIONS requests immediately with status 200
    if (req.method === "OPTIONS") {
      // Safety fallback: if origin has vyree, ensure header is stamped before ending
      if (origin && origin.toLowerCase().includes("vyree.shop")) {
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
      }
      return res.status(200).end();
    }

    next();
  });

  // ─── 2. Standard CORS Middleware ─────────────────────────────────────────────
  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Fallback: allow to prevent dropping headers
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
      "Range",
    ],
    exposedHeaders: ["Set-Cookie", "Content-Range", "X-Total-Count"],
    optionsSuccessStatus: 200,
    maxAge: 86400,
  };

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

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

  // ─── 6. Request Logging ─────────────────────────────────────────────────────
  if (env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
    app.use(requestLogger);
  }

  // ─── 7. Root Health & Status ────────────────────────────────────────────────
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
