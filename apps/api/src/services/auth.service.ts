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
    const normalizedEmail = data.email.trim().toLowerCase();
    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingEmail) {
      const error: any = new Error("An account with this email address already exists.");
      error.statusCode = 409;
      throw error;
    }

    const rawPhone = data.phoneNumber || data.phone;
    const normalizedPhone = rawPhone && rawPhone.trim() ? rawPhone.trim() : null;

    if (normalizedPhone) {
      const existingPhone = await prisma.user.findFirst({
        where: { phoneNumber: normalizedPhone },
      });
      if (existingPhone) {
        const error: any = new Error("An account with this phone number already exists.");
        error.statusCode = 409;
        throw error;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    let user;
    try {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          phoneNumber: normalizedPhone,
          role: "CUSTOMER",
          active: true,
        },
        include: { addresses: true },
      });
    } catch (err: any) {
      if (err.code === "P2002") {
        const target = err.meta?.target;
        if (Array.isArray(target) && target.includes("phoneNumber")) {
          const error: any = new Error("An account with this phone number already exists.");
          error.statusCode = 409;
          throw error;
        }
        const error: any = new Error("An account with this email address already exists.");
        error.statusCode = 409;
        throw error;
      }
      throw err;
    }

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
    const normalizedEmail = data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { addresses: true },
    });

    if (!user) {
      const error: any = new Error("Invalid email address or password.");
      error.statusCode = 401;
      throw error;
    }

    if (!user.active) {
      const error: any = new Error("This account is currently deactivated. Please contact support.");
      error.statusCode = 403;
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

  async forgotPassword(email: string): Promise<{ message: string; devOtp?: string; devResetToken?: string }> {
    const GENERIC_MESSAGE =
      "If an account exists with this email, a 6-digit verification code has been dispatched.";

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // If account not found, log warning to console for Railway testing visibility while returning safe generic message
    if (!user || !user.active) {
      console.warn(`[Auth] Password reset requested for non-existent or inactive email: ${normalizedEmail}`);
      return { message: GENERIC_MESSAGE };
    }

    // Generate a secure 6-digit numeric OTP code (100000 to 999999)
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Hash the OTP with SHA-256 before storing in database for security
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // Code is valid for 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Save hashed token and expiration in Prisma User record
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedOtp,
        resetPasswordExpires: expiresAt,
      },
    });

    // Dispatch real email via Nodemailer (or fallback to console.log in email.ts)
    try {
      await sendPasswordResetEmail(user.email, otp);
    } catch (emailError: any) {
      console.error("[AuthService] Failed to send password reset email:", emailError?.message || emailError);
      console.log(`[AuthService] [FALLBACK LOG] OTP for ${user.email}: ${otp}`);
    }

    const response: { message: string; devOtp?: string; devResetToken?: string } = {
      message: "A 6-digit verification code has been sent to your email address.",
    };

    // Expose OTP in development, test environments, or if EXPOSE_DEV_OTP is enabled
    if (process.env.NODE_ENV !== "production" || process.env.EXPOSE_DEV_OTP === "true") {
      response.devOtp = otp;
      response.devResetToken = otp;
    }

    return response;
  }

  async resetPassword(data: ResetPasswordInput): Promise<{ message: string }> {
    const code = (data.otp || data.token || data.code || "").trim();

    if (!code) {
      const error: any = new Error("A 6-digit verification code or reset token is required.");
      error.statusCode = 400;
      throw error;
    }

    const hashedCode = crypto.createHash("sha256").update(code).digest("hex");
    let user;

    if (data.email && data.email.trim()) {
      const targetUser = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase().trim() },
      });

      if (
        targetUser &&
        targetUser.active &&
        targetUser.resetPasswordExpires &&
        targetUser.resetPasswordExpires > new Date() &&
        (targetUser.resetPasswordToken === hashedCode || targetUser.resetPasswordToken === code)
      ) {
        user = targetUser;
      }
    } else {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { resetPasswordToken: hashedCode },
            { resetPasswordToken: code },
          ],
          resetPasswordExpires: { gt: new Date() },
          active: true,
        },
      });
    }

    if (!user) {
      const error: any = new Error(
        "Invalid or expired verification code. Please request a new code and try again."
      );
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
