import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import {
  RegisterInput,
  LoginInput,
  ResetPasswordInput,
} from "../schemas/auth.schema.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { User, AuthResponse } from "@vyre/shared";
import { sendPasswordResetEmail } from "../utils/email.js";

export class AuthService {
  private formatUser(user: any): User {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName} ${user.lastName}`,
      phoneNumber: user.phoneNumber || undefined,
      phone: user.phoneNumber || undefined,
      role: user.role,
      active: user.active,
      addresses: user.addresses?.map((addr: any) => ({
        id: addr.id,
        fullName: addr.fullName,
        phoneNumber: addr.phoneNumber,
        streetAddress: addr.streetAddress,
        buildingNumber: addr.buildingNumber || undefined,
        apartmentNumber: addr.apartmentNumber || undefined,
        city: addr.city,
        governorate: addr.governorate,
        postalCode: addr.postalCode || undefined,
        isDefault: addr.isDefault,
        createdAt: addr.createdAt.toISOString(),
      })) || [],
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt?.toISOString(),
    };
  }

  async register(data: RegisterInput): Promise<AuthResponse> {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      const error: any = new Error("An account with this email already exists.");
      error.statusCode = 409;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber || null,
        role: "CUSTOMER",
        active: true,
      },
      include: { addresses: true },
    });

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = signRefreshToken({ userId: user.id });

    // Store refresh token for session tracking
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    const formatted = this.formatUser(user);

    return {
      user: formatted,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: "15m",
      },
      token: accessToken,
    };
  }

  async login(data: LoginInput): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      include: { addresses: true },
    });

    if (!user || !user.active) {
      const error: any = new Error("Invalid email address or password.");
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      const error: any = new Error("Invalid email address or password.");
      error.statusCode = 401;
      throw error;
    }

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = signRefreshToken({ userId: user.id });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    const formatted = this.formatUser(user);

    return {
      user: formatted,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: "15m",
      },
      token: accessToken,
    };
  }

  async logout(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async refreshToken(token: string): Promise<AuthResponse> {
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      const error: any = new Error("Invalid or expired refresh token.");
      error.statusCode = 401;
      throw error;
    }

    const user = await prisma.user.findFirst({
      where: {
        id: decoded.userId,
        refreshToken: token,
        active: true,
      },
      include: { addresses: true },
    });

    if (!user) {
      const error: any = new Error("Invalid refresh session. Please login again.");
      error.statusCode = 401;
      throw error;
    }

    const newAccessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = signRefreshToken({ userId: user.id });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    const formatted = this.formatUser(user);

    return {
      user: formatted,
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: "15m",
      },
      token: newAccessToken,
    };
  }

  async forgotPassword(email: string): Promise<{ message: string; devResetToken?: string }> {
    const GENERIC_MESSAGE =
      "If an account exists with this email, a password reset link has been dispatched.";

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always respond generically to prevent email enumeration
    if (!user || !user.active) {
      return { message: GENERIC_MESSAGE };
    }

    // Generate a cryptographically secure random token (64 hex chars)
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Hash the token before storing — only the hash lives in the DB
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: expiresAt,
      },
    });

    // Send the real reset email — the raw (unhashed) token goes to the user
    try {
      await sendPasswordResetEmail(user.email, rawToken);
    } catch (emailError) {
      // Log but don't expose email errors to the caller
      console.error("[AuthService] Failed to send password reset email:", emailError);
    }

    const response: { message: string; devResetToken?: string } = {
      message: GENERIC_MESSAGE,
    };

    // Expose the raw token only in development (for end-to-end testing without a real inbox)
    if (process.env.NODE_ENV === "development") {
      response.devResetToken = rawToken;
    }

    return response;
  }

  async resetPassword(data: ResetPasswordInput): Promise<{ message: string }> {
    // Hash the incoming token to match what's stored in the DB
    const trimmedToken = data.token.trim();
    const hashedToken = crypto.createHash("sha256").update(trimmedToken).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { gt: new Date() },
        active: true,
      },
    });

    if (!user) {
      const error: any = new Error("Password reset token is invalid or has expired.");
      error.statusCode = 400;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        refreshToken: null, // Revoke active sessions for security
      },
    });

    return {
      message: "Password reset successfully. You may now login with your new credentials.",
    };
  }

  async getCurrentUser(userId: string): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { addresses: true },
    });

    if (!user || !user.active) {
      const error: any = new Error("User account not found.");
      error.statusCode = 404;
      throw error;
    }

    return this.formatUser(user);
  }
}

export const authService = new AuthService();
