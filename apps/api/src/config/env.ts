import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  API_URL: z.string().default("http://localhost:5000/api/v1"),
  DATABASE_URL: z
    .string()
    .default("postgresql://vyre_admin:vyre_password_secure@localhost:5432/vyre_db?schema=public"),
  JWT_SECRET: z.string().min(16).default("vyre_super_secret_jwt_key_placeholder_min_16"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16)
    .default("vyre_super_secret_jwt_refresh_placeholder_min_16"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // ─── Email / SMTP ───────────────────────────────────────────────────────────
  SMTP_HOST: z.string().default(process.env.SMTP_HOST || ""),
  SMTP_PORT: z.coerce.number().default(Number(process.env.SMTP_PORT) || 587),
  SMTP_USER: z.string().default(process.env.SMTP_USER || ""),
  SMTP_PASS: z.string().default(process.env.SMTP_PASS || process.env.SMTP_PASSWORD || ""),
  SMTP_PASSWORD: z.string().default(process.env.SMTP_PASSWORD || process.env.SMTP_PASS || ""),
  EMAIL_FROM: z.string().default(process.env.EMAIL_FROM || process.env.FROM_EMAIL || "noreply@vyree.shop"),
  EMAIL_FROM_NAME: z.string().default(process.env.EMAIL_FROM_NAME || "VYRE."),
  RESET_PASSWORD_URL: z.string().default(process.env.RESET_PASSWORD_URL || ""),
  EXPOSE_DEV_OTP: z.string().default(process.env.EXPOSE_DEV_OTP || ""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

