import { Response } from "express";
import { ApiResponse, HTTP_STATUS, HttpStatusCode } from "@vyre/shared";

export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: HttpStatusCode = HTTP_STATUS.OK
): Response {
  const payload: ApiResponse<T> = {
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data }),
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  message: string,
  code: string = "INTERNAL_ERROR",
  statusCode: HttpStatusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  details?: unknown
): Response {
  const payload: ApiResponse = {
    success: false,
    message,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(payload);
}
