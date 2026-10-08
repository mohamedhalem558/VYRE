import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env.js";

// ─── Transporter ──────────────────────────────────────────────────────────────
let transporter: Transporter | null = null;

export async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter;

  if (env.SMTP_HOST && env.SMTP_USER) {
    const isGmail = env.SMTP_HOST.toLowerCase().includes("gmail");
    const port = Number(env.SMTP_PORT) || 587;
    const isSecure = port === 465;

    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port,
      secure: isSecure,
      service: isGmail ? "gmail" : undefined,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });

    console.log(`[Email] Configured SMTP transporter (${env.SMTP_HOST}:${port}) for ${env.SMTP_USER}`);
  } else {
    // Development fallback — Ethereal fake SMTP
    try {
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
        "\n📬 [Email] No SMTP_HOST/SMTP_USER configured. Using Ethereal test inbox:",
        testAccount.user
      );
    } catch (etherealErr) {
      console.warn("[Email] Could not create Ethereal account, using json transport fallback:", etherealErr);
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  return transporter;
}

export function getSenderAddress(): string {
  const fromName = env.EMAIL_FROM_NAME || "VYRE.";
  let fromEmail = env.EMAIL_FROM || env.SMTP_USER || "noreply@vyree.shop";

  // Sanitize: extract pure email if format is "Name <email@domain.com>" or has broken brackets
  const match = fromEmail.match(/<([^>]+)>/);
  if (match) {
    fromEmail = match[1];
  }
  fromEmail = fromEmail.replace(/[<>]/g, "").trim();

  return `"${fromName}" <${fromEmail}>`;
}

// ─── Email Template Wrapper ───────────────────────────────────────────────────
function buildEmailHtml(title: string, preheader: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f7f7f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #111111; }
    table { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; display: block; }
    .content-box { background: #ffffff; border: 1px solid #eaeaea; border-radius: 4px; padding: 40px 32px; }
    @media only screen and (max-width: 600px) {
      .content-box { padding: 24px 16px !important; }
      .brand-title { font-size: 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f7f7f7;">
  <!-- Preheader text for inbox preview -->
  <span style="display:none;font-size:1px;color:#f7f7f7;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader}
  </span>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7;">
    <tr>
      <td align="center" style="padding: 40px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px;">

          <!-- Brand Logo Header -->
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <span class="brand-title" style="font-size: 32px; font-weight: 900; letter-spacing: 0.22em; color: #000000; text-transform: uppercase; font-family: 'Georgia', serif;">
                VYRE.
              </span>
              <div style="font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #888888; margin-top: 4px;">
                EGYPTIAN STREETWEAR
              </div>
            </td>
          </tr>

          <!-- Main Email Card -->
          <tr>
            <td class="content-box" style="background:#ffffff;border:1px solid #eaeaea;border-radius:4px;padding:36px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 24px;">
              <p style="margin: 0 0 8px; font-size: 11px; color: #888888; letter-spacing: 0.05em; text-transform: uppercase;">
                VYRE Clothing Co. • Cairo, Egypt
              </p>
              <p style="margin: 0; font-size: 11px; color: #aaaaaa;">
                © ${new Date().getFullYear()} VYRE. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── 1. Password Reset OTP Email ──────────────────────────────────────────────
export async function sendPasswordResetEmail(
  to: string,
  otpCode: string,
  directToken?: string
): Promise<void> {
  const clientUrl = env.CLIENT_URL || "https://www.vyree.shop";
  const resetBaseUrl = env.RESET_PASSWORD_URL || `${clientUrl}/reset-password`;
  const tokenForUrl = directToken || otpCode;
  const resetUrl = `${resetBaseUrl}?token=${encodeURIComponent(tokenForUrl)}&email=${encodeURIComponent(to)}`;
  const expiryMinutes = 15;

  const contentHtml = `
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111111;text-transform:uppercase;letter-spacing:0.04em;">
      Password Reset Verification
    </h1>
    <p style="margin:0 0 20px;font-size:14px;color:#444444;line-height:1.6;">
      We received a request to reset your password for your VYRE account (<strong>${to}</strong>). Use the secure 6-digit verification code below to proceed:
    </p>

    <!-- 6-Digit OTP Box -->
    <div style="text-align:center;margin:28px 0;">
      <div style="display:inline-block;background:#000000;color:#ffffff;font-size:36px;font-weight:900;letter-spacing:10px;padding:18px 36px;border-radius:4px;font-family:monospace;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
        ${otpCode}
      </div>
      <div style="margin-top:10px;font-size:12px;color:#777777;font-weight:500;">
        ⏱️ This code expires in <strong>${expiryMinutes} minutes</strong>
      </div>
    </div>

    <p style="margin:0 0 24px;font-size:13px;color:#555555;line-height:1.6;text-align:center;">
      Enter this code on the password reset screen, or click the direct button below:
    </p>

    <!-- Direct Action Button -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 28px;">
      <tr>
        <td align="center" style="border-radius:2px;background-color:#000000;">
          <a href="${resetUrl}"
             target="_blank"
             style="display:inline-block;padding:14px 36px;font-size:12px;font-weight:700;color:#ffffff;text-decoration:none;text-transform:uppercase;letter-spacing:0.12em;background-color:#000000;border:1px solid #000000;border-radius:2px;">
            RESET PASSWORD DIRECTLY
          </a>
        </td>
      </tr>
    </table>

    <hr style="border:none;border-top:1px solid #eeeeee;margin:24px 0;" />

    <p style="margin:0;font-size:12px;color:#888888;line-height:1.6;">
      <strong>Security Notice:</strong> If you did not make this request, you can safely ignore this email. Your password will remain unchanged and your account is completely secure.
    </p>
  `;

  const html = buildEmailHtml(
    "Reset Your VYRE Password",
    `Your VYRE verification code is ${otpCode}. Valid for 15 minutes.`,
    contentHtml
  );

  const textBody = `
VYRE. — PASSWORD RESET VERIFICATION

Your 6-digit verification code is: ${otpCode}

This code expires in ${expiryMinutes} minutes.

To reset your password directly, visit:
${resetUrl}

If you did not request this, please safely ignore this email.
`;

  try {
    const transport = await getTransporter();
    const info = await transport.sendMail({
      from: getSenderAddress(),
      to,
      subject: `Your VYRE Password Reset Code: ${otpCode}`,
      text: textBody.trim(),
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`\n📬 [Email] Preview URL: ${previewUrl}`);
    }
    console.log(`[Email] Password reset OTP sent to ${to} (Message ID: ${info.messageId})`);
  } catch (error) {
    console.error(`[Email] Failed to send password reset email to ${to}:`, error);
  }
}

// ─── Format Currency Helper ──────────────────────────────────────────────────
function formatEgp(amount: number | string): string {
  const num = typeof amount === "number" ? amount : Number(amount) || 0;
  return `${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP`;
}

// ─── Build Order Items Table HTML ─────────────────────────────────────────────
function buildOrderItemsTable(items: any[]): string {
  if (!items || items.length === 0) return "<p style='color:#777;'>No items listed.</p>";

  const rows = items
    .map((item) => {
      const name = item.productName || item.product?.name || "Product";
      const size = item.sizeName || item.size || "-";
      const color = item.colorName || item.color || "-";
      const qty = item.quantity || 1;
      const price = formatEgp(Number(item.unitPrice || item.price || 0) * qty);
      const img = item.productImage || item.image || "";

      return `
      <tr style="border-bottom:1px solid #eeeeee;">
        <td style="padding:12px 8px 12px 0;width:56px;vertical-align:middle;">
          ${
            img
              ? `<img src="${img}" alt="${name}" width="48" height="48" style="width:48px;height:48px;object-fit:cover;border-radius:2px;background:#f3f3f3;" />`
              : `<div style="width:48px;height:48px;background:#eeeeee;border-radius:2px;text-align:center;line-height:48px;font-size:10px;color:#888;">VYRE</div>`
          }
        </td>
        <td style="padding:12px 8px;vertical-align:middle;">
          <div style="font-weight:700;font-size:13px;color:#111111;">${name}</div>
          <div style="font-size:11px;color:#666666;margin-top:2px;">
            Size: <strong>${size}</strong> &nbsp;|&nbsp; Color: <strong>${color}</strong> &nbsp;|&nbsp; Qty: <strong>${qty}</strong>
          </div>
        </td>
        <td align="right" style="padding:12px 0 12px 8px;vertical-align:middle;font-weight:700;font-size:13px;color:#111111;white-space:nowrap;">
          ${price}
        </td>
      </tr>
      `;
    })
    .join("");

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:16px 0 20px;">
      ${rows}
    </table>
  `;
}

// ─── Build Order Summary Breakdown ───────────────────────────────────────────
function buildOrderFinancialSummary(order: any): string {
  const subtotal = Number(order.subtotal || 0);
  const discount = Number(order.discount || 0);
  const shipping = Number(order.shippingFee || 0);
  const total = Number(order.total || 0);

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fcfcfc;border:1px solid #eeeeee;border-radius:3px;padding:16px;margin:20px 0;">
      <tr>
        <td style="padding:4px 0;font-size:13px;color:#666666;">Subtotal</td>
        <td align="right" style="padding:4px 0;font-size:13px;color:#111111;">${formatEgp(subtotal)}</td>
      </tr>
      ${
        discount > 0
          ? `
      <tr>
        <td style="padding:4px 0;font-size:13px;color:#10b981;">Discount (${order.couponCode || "Coupon"})</td>
        <td align="right" style="padding:4px 0;font-size:13px;color:#10b981;">-${formatEgp(discount)}</td>
      </tr>
      `
          : ""
      }
      <tr>
        <td style="padding:4px 0;font-size:13px;color:#666666;">Shipping Fee</td>
        <td align="right" style="padding:4px 0;font-size:13px;color:#111111;">${shipping === 0 ? "Free" : formatEgp(shipping)}</td>
      </tr>
      <tr style="border-top:1px solid #e5e5e5;">
        <td style="padding:10px 0 4px;font-size:15px;font-weight:800;color:#000000;text-transform:uppercase;">Total</td>
        <td align="right" style="padding:10px 0 4px;font-size:16px;font-weight:900;color:#000000;">${formatEgp(total)}</td>
      </tr>
    </table>
  `;
}

// ─── Build Address Details ───────────────────────────────────────────────────
function buildShippingInfo(order: any): string {
  const addr = order.shippingSnapshot || order.shippingAddress || {};
  const recipient = addr.fullName || order.customerName || "Customer";
  const phone = addr.phoneNumber || order.customerPhone || "-";
  const street = addr.streetAddress || "-";
  const city = addr.city || "-";
  const gov = addr.governorate || "Egypt";
  const method = (order.paymentMethod || "CASH_ON_DELIVERY").replace(/_/g, " ");

  return `
    <div style="background:#f9f9f9;border:1px solid #eeeeee;border-radius:3px;padding:16px;font-size:12px;color:#444;line-height:1.6;margin-bottom:24px;">
      <div style="font-weight:700;text-transform:uppercase;color:#111;margin-bottom:6px;font-size:11px;letter-spacing:0.05em;">
        Shipping Destination & Payment
      </div>
      <div><strong>Recipient:</strong> ${recipient} (${phone})</div>
      <div><strong>Address:</strong> ${street}, ${city}, ${gov}</div>
      <div><strong>Payment Method:</strong> ${method}</div>
    </div>
  `;
}

// ─── 2. Order Placed / Pending Email ──────────────────────────────────────────
export async function sendOrderPlacedEmail(order: any): Promise<void> {
  const to = order.customerEmail;
  if (!to) return;

  const clientUrl = env.CLIENT_URL || "https://www.vyree.shop";
  const orderUrl = `${clientUrl}/account/orders`;

  const contentHtml = `
    <div style="margin-bottom:8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#f59e0b;">
      ● Status: Pending Approval
    </div>
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111111;text-transform:uppercase;letter-spacing:0.04em;">
      Order Placed Successfully
    </h1>
    <p style="margin:0 0 20px;font-size:14px;color:#444444;line-height:1.6;">
      Hello <strong>${order.customerName || "Valued Customer"}</strong>,<br />
      Thank you for shopping with VYRE! We have received your order <strong>#${order.orderNumber}</strong> and our team is currently reviewing and verifying it before preparation.
    </p>

    ${buildShippingInfo(order)}

    <div style="font-weight:700;text-transform:uppercase;font-size:12px;color:#111;letter-spacing:0.05em;margin-bottom:8px;">
      Order Items
    </div>
    ${buildOrderItemsTable(order.items)}
    ${buildOrderFinancialSummary(order)}

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px auto;">
      <tr>
        <td align="center" style="border-radius:2px;background-color:#000000;">
          <a href="${orderUrl}"
             target="_blank"
             style="display:inline-block;padding:14px 32px;font-size:12px;font-weight:700;color:#ffffff;text-decoration:none;text-transform:uppercase;letter-spacing:0.1em;background-color:#000000;border:1px solid #000000;">
            VIEW ORDER DETAILS
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:12px;color:#888888;line-height:1.6;text-align:center;">
      Need to make changes to your order? Contact our support team immediately at <a href="mailto:support@vyree.shop" style="color:#111;text-decoration:underline;">support@vyree.shop</a> or via WhatsApp.
    </p>
  `;

  const html = buildEmailHtml(
    `Order Placed: #${order.orderNumber}`,
    `Thank you! Your order #${order.orderNumber} has been received and is pending approval.`,
    contentHtml
  );

  try {
    const transport = await getTransporter();
    await transport.sendMail({
      from: getSenderAddress(),
      to,
      subject: `Order Placed: #${order.orderNumber} - VYRE`,
      text: `Order #${order.orderNumber} received. Total: ${formatEgp(order.total)}. View details at: ${orderUrl}`,
      html,
    });
    console.log(`[Email] Order Placed email dispatched to ${to} (#${order.orderNumber})`);
  } catch (error) {
    console.error(`[Email] Failed to send order placed email for #${order.orderNumber}:`, error);
  }
}

// ─── 3. Order Confirmed Email ─────────────────────────────────────────────────
export async function sendOrderConfirmedEmail(order: any): Promise<void> {
  const to = order.customerEmail;
  if (!to) return;

  const clientUrl = env.CLIENT_URL || "https://www.vyree.shop";
  const orderUrl = `${clientUrl}/account/orders`;

  const contentHtml = `
    <div style="margin-bottom:8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#10b981;">
      ● Status: Confirmed by Store
    </div>
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111111;text-transform:uppercase;letter-spacing:0.04em;">
      Your Order is Confirmed!
    </h1>
    <p style="margin:0 0 20px;font-size:14px;color:#444444;line-height:1.6;">
      Hello <strong>${order.customerName || "Customer"}</strong>,<br />
      Great news! Your order <strong>#${order.orderNumber}</strong> has been officially confirmed by our team and is now being packaged for dispatch.
    </p>

    <div style="background:#f4fbf7;border:1px solid #c7eed8;border-radius:4px;padding:14px;margin-bottom:20px;font-size:13px;color:#065f46;">
      📦 <strong>Estimated Delivery:</strong> ${order.estimatedDelivery || "1-3 Business Days"}
    </div>

    ${buildShippingInfo(order)}

    <div style="font-weight:700;text-transform:uppercase;font-size:12px;color:#111;letter-spacing:0.05em;margin-bottom:8px;">
      Confirmed Items
    </div>
    ${buildOrderItemsTable(order.items)}
    ${buildOrderFinancialSummary(order)}

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px auto;">
      <tr>
        <td align="center" style="border-radius:2px;background-color:#000000;">
          <a href="${orderUrl}"
             target="_blank"
             style="display:inline-block;padding:14px 32px;font-size:12px;font-weight:700;color:#ffffff;text-decoration:none;text-transform:uppercase;letter-spacing:0.1em;background-color:#000000;border:1px solid #000000;">
            TRACK ORDER STATUS
          </a>
        </td>
      </tr>
    </table>
  `;

  const html = buildEmailHtml(
    `Order Confirmed: #${order.orderNumber}`,
    `Great news! Your VYRE order #${order.orderNumber} is confirmed and in preparation.`,
    contentHtml
  );

  try {
    const transport = await getTransporter();
    await transport.sendMail({
      from: getSenderAddress(),
      to,
      subject: `Order Confirmed: #${order.orderNumber} - VYRE`,
      text: `Your order #${order.orderNumber} has been confirmed. Estimated delivery: ${order.estimatedDelivery || "1-3 business days"}.`,
      html,
    });
    console.log(`[Email] Order Confirmed email dispatched to ${to} (#${order.orderNumber})`);
  } catch (error) {
    console.error(`[Email] Failed to send order confirmed email for #${order.orderNumber}:`, error);
  }
}

// ─── 4. Order Shipped Email ───────────────────────────────────────────────────
export async function sendOrderShippedEmail(order: any, trackingNumber?: string): Promise<void> {
  const to = order.customerEmail;
  if (!to) return;

  const tracking = trackingNumber || order.trackingNumber || "Courier Delivery";
  const clientUrl = env.CLIENT_URL || "https://www.vyree.shop";
  const orderUrl = `${clientUrl}/account/orders`;

  const contentHtml = `
    <div style="margin-bottom:8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#3b82f6;">
      ● Status: Shipped / On The Way
    </div>
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111111;text-transform:uppercase;letter-spacing:0.04em;">
      Your Order Has Shipped!
    </h1>
    <p style="margin:0 0 20px;font-size:14px;color:#444444;line-height:1.6;">
      Hello <strong>${order.customerName || "Customer"}</strong>,<br />
      Your package for order <strong>#${order.orderNumber}</strong> is officially on its way! Our delivery courier will contact you by phone prior to arrival.
    </p>

    <!-- Tracking Card -->
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:4px;padding:16px;margin-bottom:24px;text-align:center;">
      <div style="font-size:11px;text-transform:uppercase;font-weight:700;color:#1e40af;letter-spacing:0.05em;margin-bottom:4px;">
        Tracking Reference / Courier
      </div>
      <div style="font-size:18px;font-weight:800;color:#1e3a8a;font-family:monospace;">
        ${tracking}
      </div>
      <div style="font-size:12px;color:#3b82f6;margin-top:6px;">
        Expected arrival: <strong>${order.estimatedDelivery || "1-2 business days"}</strong>
      </div>
    </div>

    ${buildShippingInfo(order)}

    <div style="font-weight:700;text-transform:uppercase;font-size:12px;color:#111;letter-spacing:0.05em;margin-bottom:8px;">
      Package Contents
    </div>
    ${buildOrderItemsTable(order.items)}
    ${buildOrderFinancialSummary(order)}

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px auto;">
      <tr>
        <td align="center" style="border-radius:2px;background-color:#000000;">
          <a href="${orderUrl}"
             target="_blank"
             style="display:inline-block;padding:14px 32px;font-size:12px;font-weight:700;color:#ffffff;text-decoration:none;text-transform:uppercase;letter-spacing:0.1em;background-color:#000000;border:1px solid #000000;">
            VIEW SHIPMENT DETAILS
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:12px;color:#888888;line-height:1.6;text-align:center;">
      Please ensure your phone is reachable so the courier can coordinate your doorstep delivery.
    </p>
  `;

  const html = buildEmailHtml(
    `Order Shipped: #${order.orderNumber}`,
    `Your VYRE order #${order.orderNumber} is on the way!`,
    contentHtml
  );

  try {
    const transport = await getTransporter();
    await transport.sendMail({
      from: getSenderAddress(),
      to,
      subject: `Your Order is On The Way: #${order.orderNumber} - VYRE`,
      text: `Your VYRE order #${order.orderNumber} has shipped! Tracking: ${tracking}. Expected arrival: ${order.estimatedDelivery || "1-2 business days"}.`,
      html,
    });
    console.log(`[Email] Order Shipped email dispatched to ${to} (#${order.orderNumber})`);
  } catch (error) {
    console.error(`[Email] Failed to send order shipped email for #${order.orderNumber}:`, error);
  }
}

// ─── 5. Order Delivered Email ─────────────────────────────────────────────────
export async function sendOrderDeliveredEmail(order: any): Promise<void> {
  const to = order.customerEmail;
  if (!to) return;

  const clientUrl = env.CLIENT_URL || "https://www.vyree.shop";

  const contentHtml = `
    <div style="margin-bottom:8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#10b981;">
      ● Status: Successfully Delivered
    </div>
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111111;text-transform:uppercase;letter-spacing:0.04em;">
      Your Order Has Been Delivered!
    </h1>
    <p style="margin:0 0 20px;font-size:14px;color:#444444;line-height:1.6;">
      Hello <strong>${order.customerName || "Customer"}</strong>,<br />
      Your VYRE order <strong>#${order.orderNumber}</strong> has been successfully delivered. We hope you enjoy your new streetwear pieces!
    </p>

    <div style="background:#f9f9f9;border:1px solid #eeeeee;border-radius:4px;padding:18px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#111;">How was your fit?</p>
      <p style="margin:0;font-size:12px;color:#666;line-height:1.5;">
        Tag us on Instagram <a href="https://instagram.com" style="color:#000;font-weight:700;">@vyre.eg</a> with your best outfit for a chance to get featured on our brand page.
      </p>
    </div>

    <div style="font-weight:700;text-transform:uppercase;font-size:12px;color:#111;letter-spacing:0.05em;margin-bottom:8px;">
      Delivered Items
    </div>
    ${buildOrderItemsTable(order.items)}
    ${buildOrderFinancialSummary(order)}

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px auto;">
      <tr>
        <td align="center" style="border-radius:2px;background-color:#000000;">
          <a href="${clientUrl}/shop"
             target="_blank"
             style="display:inline-block;padding:14px 32px;font-size:12px;font-weight:700;color:#ffffff;text-decoration:none;text-transform:uppercase;letter-spacing:0.1em;background-color:#000000;border:1px solid #000000;">
            DISCOVER NEW DROPS
          </a>
        </td>
      </tr>
    </table>

    <hr style="border:none;border-top:1px solid #eeeeee;margin:24px 0;" />

    <p style="margin:0;font-size:11px;color:#888888;line-height:1.6;text-align:center;">
      Questions or exchange requests? Read our <a href="${clientUrl}/terms" style="color:#555;text-decoration:underline;">Exchange & Return Policy</a> or contact us directly.
    </p>
  `;

  const html = buildEmailHtml(
    `Order Delivered: #${order.orderNumber}`,
    `Your VYRE order #${order.orderNumber} has been delivered. Enjoy your new fit!`,
    contentHtml
  );

  try {
    const transport = await getTransporter();
    await transport.sendMail({
      from: getSenderAddress(),
      to,
      subject: `Order Delivered: #${order.orderNumber} - VYRE`,
      text: `Your VYRE order #${order.orderNumber} has been delivered. Thank you for choosing VYRE!`,
      html,
    });
    console.log(`[Email] Order Delivered email dispatched to ${to} (#${order.orderNumber})`);
  } catch (error) {
    console.error(`[Email] Failed to send order delivered email for #${order.orderNumber}:`, error);
  }
}
