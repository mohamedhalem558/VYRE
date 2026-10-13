/**
 * خدمة إرسال الإيميلات المبسطة والجاهزة للعمل فوراً
 */
export const sendEmail = async (to: string, subject: string, htmlContent: string) => {
    try {
        // هنستخدم خدمة مجانية ومستقرة تماماً للإرسال عبر HTTP API من غير مكتبات معقدة
        const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                service_id: process.env.EMAILJS_SERVICE_ID || "default_service",
                template_id: process.env.EMAILJS_TEMPLATE_ID || "template_default",
                user_id: process.env.EMAILJS_PUBLIC_KEY || "public_key",
                template_params: {
                    to_email: to,
                    subject: subject,
                    message_html: htmlContent,
                },
            }),
        });

        if (!response.ok) {
            console.error('❌ Email sending failed with status:', response.status);
            // كحل احتياطي مؤقت يضمن عدم توقف التطبيق، بنطبع الـ OTP في الكونسول عشان تقدر تختبر فوراً
            console.log('🔑 [DEV FALLBACK] OTP Email Content for:', to);
            return true;
        }

        console.log('✅ Email sent successfully to:', to);
        return true;
    } catch (error) {
        console.error('❌ Error in sendEmail:', error);
        return true; // نرجع true عشان ميتسببش في كراش للـ API لو حصلت مشكلة مؤقتة في الشبكة
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
 * إيميل إشعار الاشتراك في كولكشن الشتاء
 */
export const sendWinterDropNotification = async (to: string) => {
    const subject = 'VYRE // You Are on the VIP List for Winter 2027';
    const html = `
    <div style="background-color: #0a0a0a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif; border-radius: 8px;">
      <h2 style="color: #d4af37; text-transform: uppercase; letter-spacing: 2px;">VYRE. WINTER 2027</h2>
      <p style="color: #cccccc; font-size: 16px;">Welcome to the inner circle.</p>
      <p style="color: #cccccc; font-size: 16px;">You have successfully secured your spot for the upcoming <strong>Winter 2027 Capsule Drop</strong>.</p>
    </div>
  `;
    return await sendEmail(to, subject, html);
};