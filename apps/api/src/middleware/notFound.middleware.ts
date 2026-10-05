import { Request, Response } from "express";
import { HTTP_STATUS } from "@vyre/shared";
import { sendError } from "../utils/response.js";

export function notFoundHandler(req: Request, res: Response): void {
  sendError(
    res,
    `Route ${req.method} ${req.originalUrl} not found`,
    "NOT_FOUND",
    HTTP_STATUS.NOT_FOUND
  );
}
