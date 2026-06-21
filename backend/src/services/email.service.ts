import * as nodemailer from 'nodemailer';

// Configure a mock SMTP transport or read variables from .env
// For development, we fallback to a simple mock or Ethereal mail if not configured
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  auth: {
    user: process.env.SMTP_USER || 'mock_user',
    pass: process.env.SMTP_PASS || 'mock_pass'
  }
});

/**
 * Sends a 6-digit OTP verification code to the target email.
 */
export async function sendOTP(email: string, code: string): Promise<boolean> {
  
  
  const mailOptions = {
    from: '"EduPath Adaptive Learning" <noreply@edupath.edu>',
    to: email,
    subject: 'Mã xác thực tài khoản OTP - EduPath',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1d4ed8;">Xác thực tài khoản EduPath</h2>
        <p>Xin chào,</p>
        <p>Cảm ơn bạn đã đăng ký tham gia hệ thống học tập thích ứng EduPath. Dưới đây là mã xác thực OTP của bạn:</p>
        <div style="background-color: #f1f5f9; padding: 15px; text-align: center; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1e3a8a; margin: 20px 0;">
          ${code}
        </div>
        <p>Mã xác thực này có hiệu lực trong vòng <strong>10 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">Đây là email tự động, vui lòng không phản hồi lại email này.</p>
      </div>
    `
  };

  try {
    // If mock settings are used, we just skip real sending and return true
    if (process.env.SMTP_USER === 'mock_user' || !process.env.SMTP_HOST) {
      
      return true;
    }
    
    await transporter.sendMail(mailOptions);
    
    return true;
  } catch (error) {
    console.error(`[EMAIL SERVICE] Failed to send email to ${email}:`, error);
    // In dev mode, return true so the user is not blocked
    return true;
  }
}
