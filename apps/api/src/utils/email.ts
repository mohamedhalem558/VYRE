import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env.js";

// ─── Transporter ──────────────────────────────────────────────────────────────
// In development without SMTP config we fall back to Ethereal (fake SMTP).
// In production, all SMTP_* variables must be set.

let transporter: Transporter | null = null;

async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter;

  if (env.SMTP_HOST) {
    // Real SMTP (Gmail, SendGrid relay, Mailtrap, etc.)
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465, // true for 465, false for 587/25
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    });
  } else {
    // Development fallback — Ethereal fake SMTP
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(
      "\n📬 [Email] No SMTP_HOST configured. Using Ethereal test account:",
      testAccount.user,
    );
  }

  return transporter;
}

// ─── Password Reset Email ─────────────────────────────────────────────────────
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
): Promise<void> {
  const clientUrl = env.CLIENT_URL || "http://localhost:5173";
  const resetBaseUrl = env.RESET_PASSWORD_URL || `${clientUrl}/reset-password`;
  const resetUrl = `${resetBaseUrl}?token=${encodeURIComponent(resetToken)}`;
  const expiryMinutes = 60;

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your VYRE Password</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;">

          <!-- Logo / Brand -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:30px;font-weight:900;letter-spacing:0.2em;color:#111111;text-transform:uppercase;font-family:'Georgia',serif;">
                VYRE.
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border:1px solid #e5e5e5;border-radius:4px;padding:40px 36px 36px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">

              <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111111;text-transform:uppercase;letter-spacing:0.06em;">
                Password Reset
              </h1>
              <p style="margin:0 0 24px;font-size:14px;color:#444444;line-height:1.6;">
                Someone requested a password reset for your VYRE account. If this was you, please click the button below to set a new password.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px;">
                <tr>
                  <td align="center" style="border-radius:2px;background-color:#000000;">
                    <a href="${resetUrl}"
                       target="_blank"
                       style="display:inline-block;padding:14px 36px;font-size:13px;font-weight:700;color:#ffffff;text-decoration:none;text-transform:uppercase;letter-spacing:0.12em;background-color:#000000;border:1px solid #000000;">
                      RESET PASSWORD
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:12px;color:#777777;">
                If the button above does not work, copy and paste this plain-text URL into your browser:
              </p>
              <p style="margin:0 0 24px;font-size:11px;color:#111111;word-break:break-all;background:#f9f9f9;padding:12px;border:1px solid #e5e5e5;border-radius:2px;font-family:monospace;">
                ${resetUrl}
              </p>

              <hr style="border:none;border-top:1px solid #eeeeee;margin:24px 0;" />

              <p style="margin:0;font-size:12px;color:#888888;line-height:1.6;">
                <strong>Expiration Notice:</strong> This password reset link is valid for <strong>${expiryMinutes} minutes</strong> and can only be used once. If you did not request a password reset, you can safely ignore this email — your account remains completely secure.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:11px;color:#999999;letter-spacing:0.04em;">
                © ${new Date().getFullYear()} VYRE. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const textBody = `
VYRE.
Password Reset

Someone requested a password reset for your VYRE account.

To reset your password, visit the following link:
${resetUrl}

Expiration Notice: This link expires in ${expiryMinutes} minutes and can only be used once.

If you did not make this request, please safely ignore this email — your password will remain unchanged.

— VYRE. Team
`;

  const transport = await getTransporter();

  const info = await transport.sendMail({
    from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
    to,
    subject: "Reset Your VYRE Password",
    text: textBody.trim(),
    html: htmlBody,
  });

  // In development with Ethereal, log the preview URL
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log("\n📬 [Email] Password reset email preview:", previewUrl);
  }

  console.log(`[Email] Sent password-reset to ${to} — messageId: ${info.messageId}`);
}
