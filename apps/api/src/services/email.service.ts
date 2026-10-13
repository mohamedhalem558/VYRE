import { Resend } from 'resend';

// تهيئة Resend باستخدام الـ API Key
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * دالة عامة لإرسال أي إيميل عبر Resend API
 */
export const sendEmail = async (to: string, subject: string, htmlContent: string) => {
    try {
        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'VYRE Store <onboarding@resend.dev>',
            to: [to],
            subject: subject,
            html: htmlContent,
        });

        if (error) {
            console.error('❌ Resend API Error:', error);
            return false;
        }

        console.log('✅ Email sent successfully via Resend: %s', data?.id);
        return true;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return false;
    }
};

/**
 * إيميل استعادة كلمة المرور (Forgot Password OTP)
 */
export const sendPasswordResetEmail = async (to: string, otpCode: string) => {
    const subject = 'VYRE // Password Reset OTP';
    const html = `
    <div style="background-color: #0a0a0a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif; border-radius: 8px;">
      <h2 style="color: #d4af37; text-transform: uppercase; letter-spacing: 2px;">VYRE. SECURITY</h2>
      <p style="color: #cccccc; font-size: 16px;">You requested a password reset for your VYRE account.</p>
      <p style="color: #cccccc; font-size: 16px;">Use the verification code below to reset your password. This code is valid for 10 minutes:</p>
      <div style="background: #1a1a1a; padding: 15px 25px; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #d4af37; text-align: center; margin: 25px 0; border: 1px solid #333;">
        ${otpCode}
      </div>
      <p style="color: #888888; font-size: 13px;">If you didn't request this, please ignore this email.</p>
    </div>
  `;
    return await sendEmail(to, subject, html);
};

/**
 * إيميل إشعار الاشتراك في كولكشن الشتاء (Winter Drop Subscription)
 */
export const sendWinterDropNotification = async (to: string) => {
    const subject = 'VYRE // You Are on the VIP List for Winter 2027';
    const html = `
    <div style="background-color: #0a0a0a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif; border-radius: 8px;">
      <h2 style="color: #d4af37; text-transform: uppercase; letter-spacing: 2px;">VYRE. WINTER 2027</h2>
      <p style="color: #cccccc; font-size: 16px;">Welcome to the inner circle.</p>
      <p style="color: #cccccc; font-size: 16px;">You have successfully secured your spot for the upcoming <strong>Winter 2027 Capsule Drop</strong>. You will receive early access links before the public release.</p>
      <hr style="border: 0; border-top: 1px solid #333; margin: 20px 0;" />
      <p style="color: #888888; font-size: 13px;">Cairo, Egypt • Engineered for Luxury Streetwear.</p>
    </div>
  `;
    return await sendEmail(to, subject, html);
};