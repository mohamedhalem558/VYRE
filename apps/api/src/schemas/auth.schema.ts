import { z } from "zod";

export const registerSchema = z.object({
  firstName: z
    .string({ required_error: "First name is required" })
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name cannot exceed 50 characters"),
  lastName: z
    .string({ required_error: "Last name is required" })
    .trim()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name cannot exceed 50 characters"),
  email: z
    .string({ required_error: "Email address is required" })
    .trim()
    .email("Please provide a valid email address")
    .toLowerCase(),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter (A-Z)")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter (a-z)")
    .regex(/[\d\W_]/, "Password must contain at least one number (0-9) or symbol (!@#$%^&*)"),
  phoneNumber: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email address is required" })
    .trim()
    .email("Please provide a valid email address")
    .toLowerCase(),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email address is required" })
    .trim()
    .email("Please provide a valid email address")
    .toLowerCase(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().optional(),
    otp: z.string().trim().optional(),
    code: z.string().trim().optional(),
    email: z
      .string()
      .trim()
      .email("Please provide a valid email address")
      .toLowerCase()
      .optional()
      .or(z.literal("")),
    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password cannot exceed 128 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter (A-Z)")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter (a-z)")
      .regex(/[\d\W_]/, "Password must contain at least one number (0-9) or symbol (!@#$%^&*)"),
  })
  .refine((data) => !!(data.token || data.otp || data.code), {
    message: "A 6-digit OTP code or reset token is required",
    path: ["otp"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

