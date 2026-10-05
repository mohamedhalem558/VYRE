import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { verifyAccessToken } from "../utils/jwt.js";
import { prisma } from "../config/prisma.js";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Authentication Middleware: Validates Bearer JWT in Authorization header
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "Authentication required. Please provide a valid Bearer token.",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(401).json({
        success: false,
        error: "Malformed authorization token.",
      });
      return;
    }

    const decoded = verifyAccessToken(token);

    // Verify user exists and is active in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        active: true,
      },
    });

    if (!user || !user.active) {
      res.status(401).json({
        success: false,
        error: "User account does not exist or has been deactivated.",
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    next();
  } catch (error: any) {
    if (error?.name === "TokenExpiredError") {
      res.status(401).json({
        success: false,
        error: "Access token has expired. Please refresh your session.",
        code: "TOKEN_EXPIRED",
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: "Invalid access token.",
    });
  }
}

/**
 * Role Authorization Middleware: Enforces permissions based on user roles
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
        requiredRoles: allowedRoles,
      });
      return;
    }

    next();
  };
}
