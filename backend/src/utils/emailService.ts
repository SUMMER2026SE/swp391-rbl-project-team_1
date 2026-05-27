import nodemailer from "nodemailer";

// Configure your email service here
// For Gmail: you need to use App Password, not regular password
// For other services, adjust accordingly

const transporter = nodemailer.createTransport({
    service: process.env.MAIL_SERVICE || "gmail",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
    },
});

/**
 * Generate a random 6-digit OTP code
 */
export function generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP via email
 */
export async function sendOtpEmail(
    email: string,
    otp: string,
    recipientName?: string
): Promise<void> {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASSWORD) {
        console.error("Email configuration missing. OTP would be: " + otp);
        // For development, just log the OTP
        return;
    }

    try {
        const mailOptions = {
            from: process.env.MAIL_USER,
            to: email,
            subject: "Mã xác nhận OTP - MedBooking",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">MedBooking</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="color: #334155; font-size: 16px;">
              ${recipientName ? `Xin chào ${recipientName},` : "Xin chào,"}
            </p>
            <p style="color: #334155; font-size: 14px;">
              Bạn đã yêu cầu mã xác nhận để đăng ký tài khoản MedBooking. 
              Mã OTP của bạn là:
            </p>
            <div style="background: white; border: 2px dashed #14b8a6; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px;">
              <p style="font-size: 32px; font-weight: bold; color: #14b8a6; margin: 0; letter-spacing: 5px;">
                ${otp}
              </p>
            </div>
            <p style="color: #64748b; font-size: 12px;">
              Mã này có hiệu lực trong 5 phút. Không chia sẻ mã này cho bất kỳ ai.
            </p>
            <p style="color: #64748b; font-size: 12px; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
              Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.
            </p>
          </div>
          <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
            <p>© 2026 MedBooking. All rights reserved.</p>
          </div>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        console.log("OTP sent successfully to: " + email);
    } catch (error) {
        console.error("Failed to send OTP email:", error);
        throw new Error("Failed to send OTP email");
    }
}

/**
 * Send Reset Password OTP via email
 */
export async function sendResetPasswordOtpEmail(
    email: string,
    otp: string,
    recipientName?: string
): Promise<void> {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASSWORD) {
        console.error("Email configuration missing. Reset Password OTP would be: " + otp);
        // For development, just log the OTP
        return;
    }

    try {
        const mailOptions = {
            from: process.env.MAIL_USER,
            to: email,
            subject: "Mã xác nhận khôi phục mật khẩu - MedBooking",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">MedBooking</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="color: #334155; font-size: 16px;">
              ${recipientName ? `Xin chào ${recipientName},` : "Xin chào,"}
            </p>
            <p style="color: #334155; font-size: 14px;">
              Bạn đã yêu cầu khôi phục mật khẩu cho tài khoản MedBooking. 
              Mã xác nhận OTP của bạn là:
            </p>
            <div style="background: white; border: 2px dashed #14b8a6; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px;">
              <p style="font-size: 32px; font-weight: bold; color: #14b8a6; margin: 0; letter-spacing: 5px;">
                ${otp}
              </p>
            </div>
            <p style="color: #64748b; font-size: 12px;">
              Mã này có hiệu lực trong 5 phút. Không chia sẻ mã này cho bất kỳ ai.
            </p>
            <p style="color: #64748b; font-size: 12px; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
              Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.
            </p>
          </div>
          <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
            <p>© 2026 MedBooking. All rights reserved.</p>
          </div>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        console.log("Reset Password OTP sent successfully to: " + email);
    } catch (error) {
        console.error("Failed to send Reset Password OTP email:", error);
        throw new Error("Failed to send Reset Password OTP email");
    }
}

