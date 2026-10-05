import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "@vyre/shared";
import { logger } from "../utils/logger.js";

export interface CustomError extends Error {
  statusCode?: number;
  status?: number;
  code?: string;
  details?: any;
}

export function errorHandler(
  err: CustomError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Determine status code
  let statusCode = err.statusCode || err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal server error";

  // Handle Prisma unique constraint violations
  if (err.code === "P2002") {
    statusCode = HTTP_STATUS.CONFLICT;
    message = "A resource with this identifier already exists.";
  } else if (err.code === "P2025") {
    statusCode = HTTP_STATUS.NOT_FOUND;
    message = "Requested resource not found.";
  }

  if (statusCode >= 500) {
    logger.error("Unhandled server error:", err.message, err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    code: err.code || (statusCode === 401 ? "UNAUTHORIZED" : statusCode === 403 ? "FORBIDDEN" : statusCode === 409 ? "CONFLICT" : "ERROR"),
    details: process.env.NODE_ENV === "development" ? err.details || err.stack : undefined,
  });
}
