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
  // Leave SMTP_HOST empty in development to fall back to Ethereal (fake SMTP).
  // Set all variables below for production.
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASSWORD: z.string().optional().default(""),
  EMAIL_FROM: z.string().optional().default("noreply@vyre.store"),
  EMAIL_FROM_NAME: z.string().optional().default("VYRE."),
  RESET_PASSWORD_URL: z.string().optional().default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
