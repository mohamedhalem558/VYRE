import rateLimit from "express-rate-limit";

/**
 * Strict rate limiter for sensitive authentication endpoints (Login, Register, Password Reset)
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 100 : 30, // Generous in development, strict in production
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many authentication attempts from this IP. Please try again after 15 minutes.",
  },
  skip: () => process.env.NODE_ENV === "test" || process.env.SKIP_RATE_LIMIT === "true",
});

/**
 * General API rate limiter
 */
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests. Please slow down.",
  },
  skip: () => process.env.NODE_ENV === "test",
});
