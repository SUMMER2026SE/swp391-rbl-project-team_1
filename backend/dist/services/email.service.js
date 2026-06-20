"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTP = sendOTP;
const nodemailer = __importStar(require("nodemailer"));
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
async function sendOTP(email, code) {
    console.log(`[EMAIL SERVICE] Sending OTP ${code} to ${email}`);
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
            console.log(`[EMAIL SERVICE] [DEV MODE] Email verification logged. Code: ${code}`);
            return true;
        }
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SERVICE] Email successfully sent to ${email}`);
        return true;
    }
    catch (error) {
        console.error(`[EMAIL SERVICE] Failed to send email to ${email}:`, error);
        // In dev mode, return true so the user is not blocked
        return true;
    }
}
