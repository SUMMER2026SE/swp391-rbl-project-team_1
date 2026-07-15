import nodemailer from "nodemailer";
import prisma from "../prisma/client";

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

/**
 * Send Booking Confirmation Email
 */
export async function sendBookingConfirmationEmail(
    email: string,
    details: {
        patientName: string;
        doctorName: string;
        specialtyName: string;
        clinicName: string;
        appointmentDate: Date;
        notes?: string | null;
        status: string;
        amount?: number;
        paymentMethod?: string;
        transactionCode?: string;
        paymentAt?: Date | null;
        appointmentId?: string;
        bookingCode?: string | null;
        packageName?: string | null;
    }
): Promise<void> {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASSWORD) return;

    try {
        const dateStr = details.appointmentDate.toLocaleDateString("vi-VN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        const timeStr = details.appointmentDate.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });

        const mailOptions = {
            from: process.env.MAIL_USER,
            to: email,
            subject: "Đăng ký lịch hẹn khám thành công - MedBooking",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">MedBooking</h1>
            <p style="color: #ccfbf1; margin: 5px 0 0 0; font-size: 14px;">Xác Nhận Yêu Cầu Đặt Lịch Hẹn</p>
          </div>
          <div style="background: #ffffff; padding: 30px;">
            <p style="color: #334155; font-size: 16px; font-weight: bold; margin-top: 0;">Xin chào ${details.patientName},</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              Yêu cầu đặt lịch khám bệnh của bạn đã được ghi nhận trên hệ thống MedBooking và đang chờ bác sĩ xác nhận. Dưới đây là thông tin chi tiết:
            </p>
            
            <div style="background: #f8fafc; border-left: 4px solid #14b8a6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; width: 120px; vertical-align: top;">${details.packageName ? 'Gói khám:' : 'Bác sĩ:'}</td>
                  <td style="padding: 6px 0; color: #0f172a;">${details.packageName ? details.packageName : `${details.doctorName} (${details.specialtyName})`}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Thời gian:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${timeStr} - ${dateStr}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Địa điểm:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${details.clinicName}</td>
                </tr>
                ${details.notes ? `
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Triệu chứng:</td>
                  <td style="padding: 6px 0; color: #64748b; font-style: italic;">${details.notes}</td>
                </tr>
                ` : ""}
                <tr>
                  <td colspan="2" style="padding: 15px 0;">
                    <div style="background: #f0fdfa; border: 2px solid #0d9488; text-align: center; padding: 15px; border-radius: 8px;">
                      <p style="margin: 0; color: #0d9488; font-size: 14px; font-weight: bold;">MÃ ĐẶT LỊCH</p>
                      <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #0f172a; letter-spacing: 2px;">${details.bookingCode || "N/A"}</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Trạng thái:</td>
                  <td style="padding: 6px 0;">
                    <span style="background: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 9999px; font-size: 12px; font-weight: bold;">Chờ xác nhận</span>
                  </td>
                </tr>
              </table>
            </div>

            ${details.amount ? `
            <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="margin-top: 0; color: #166534; font-weight: bold; margin-bottom: 10px;">Thông tin thanh toán (Đặt cọc)</p>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; width: 150px;">Số tiền đã thanh toán:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${details.amount.toLocaleString("vi-VN")} VND</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold;">Phương thức:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${details.paymentMethod || "Chuyển khoản / Upload minh chứng"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold;">Mã giao dịch (Appt ID):</td>
                  <td style="padding: 6px 0; color: #0f172a;">${details.transactionCode || "N/A"}</td>
                </tr>
                ${details.paymentAt ? `
                <tr>
                  <td style="padding: 6px 0; font-weight: bold;">Thời gian thanh toán:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${details.paymentAt.toLocaleTimeString("vi-VN")} - ${details.paymentAt.toLocaleDateString("vi-VN")}</td>
                </tr>
                ` : ""}
              </table>
            </div>
            ` : ""}

            <div style="margin: 20px 0; padding: 15px; border: 1px dashed #cbd5e1; border-radius: 8px; font-size: 13px; color: #475569;">
              <strong>Lưu ý / Hướng dẫn:</strong>
              <ul style="margin-top: 5px; margin-bottom: 0; padding-left: 20px;">
                <li>Vui lòng đến đúng giờ khám. Nếu đến muộn quá 15 phút, lịch hẹn có thể bị hủy.</li>
                <li>Nhớ mang theo CCCD và thẻ BHYT (nếu áp dụng) để làm thủ tục.</li>
                <li>Nếu cần đổi/hủy lịch hẹn, xin liên hệ với chúng tôi ít nhất trước 2 tiếng qua mục hỗ trợ hoặc hotline.</li>
                <li>Tiền cọc sẽ được hoàn lại theo chính sách của bệnh viện nếu quý khách hủy lịch hợp lệ.</li>
              </ul>
            </div>

            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              Hệ thống sẽ gửi email thông báo ngay sau khi bác sĩ phê duyệt yêu cầu này. Cảm ơn bạn đã tin tưởng dịch vụ MedBooking.
            </p>
          </div>
          <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">Mọi thắc mắc vui lòng phản hồi qua email này hoặc liên hệ hotline 1900-xxxx.</p>
            <p style="margin: 5px 0 0 0;">© 2026 MedBooking. All rights reserved.</p>
          </div>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Booking confirmation email sent to: ${email}`);
    } catch (error) {
        console.error("Failed to send booking confirmation email:", error);
    }
}

/**
 * Send Booking Status Update Email
 */
export async function sendBookingStatusUpdateEmail(
    email: string,
    details: {
        patientName: string;
        doctorName: string;
        specialtyName: string;
        clinicName: string;
        appointmentDate: Date;
        status: "CONFIRMED" | "CANCELLED" | "COMPLETED" | string;
        cancellationReason?: string | null;
        notes?: string | null;
        packageName?: string | null;
    }
): Promise<void> {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASSWORD) return;

    try {
        const dateStr = details.appointmentDate.toLocaleDateString("vi-VN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        const timeStr = details.appointmentDate.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });

        let statusText = "";
        let statusBg = "";
        let statusColor = "";
        let customMessage = "";
        let subject = "";

        switch (details.status) {
            case "CONFIRMED":
                subject = "Lịch khám bệnh của bạn đã được XÁC NHẬN - MedBooking";
                statusText = "Đã xác nhận";
                statusBg = "#dbeafe";
                statusColor = "#2563eb";
                customMessage = `Lịch hẹn của bạn đã được Bác sĩ <strong>xác nhận thành công</strong>. Vui lòng có mặt tại địa điểm khám trước giờ hẹn 10-15 phút để làm thủ tục khám bệnh.`;
                break;
            case "CANCELLED":
                subject = "Thông báo HỦY lịch khám bệnh - MedBooking";
                statusText = "Đã hủy";
                statusBg = "#fee2e2";
                statusColor = "#dc2626";
                customMessage = `Rất tiếc, lịch hẹn của bạn đã bị hủy.<br/>` + 
                    (details.cancellationReason ? `<strong>Lý do hủy từ bác sĩ:</strong> <span style="color: #b91c1c;">${details.cancellationReason}</span>` : `Vui lòng liên hệ lại với chúng tôi để biết thêm chi tiết.`);
                break;
            case "COMPLETED":
                subject = "Lịch khám bệnh của bạn đã HOÀN THÀNH - MedBooking";
                statusText = "Đã hoàn thành";
                statusBg = "#d1fae5";
                statusColor = "#059669";
                customMessage = `Chúc mừng bạn đã hoàn thành ca khám bệnh. Bạn có thể đăng nhập vào ứng dụng MedBooking để xem chi tiết bệnh án và đơn thuốc điện tử do bác sĩ kê trong mục "Lịch Hẹn Của Tôi".`;
                break;
            default:
                subject = "Cập nhật trạng thái lịch hẹn - MedBooking";
                statusText = details.status;
                statusBg = "#f1f5f9";
                statusColor = "#475569";
                customMessage = `Lịch khám của bạn đã được cập nhật sang trạng thái mới.`;
        }

        const mailOptions = {
            from: process.env.MAIL_USER,
            to: email,
            subject: subject,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">MedBooking</h1>
            <p style="color: #ccfbf1; margin: 5px 0 0 0; font-size: 14px;">Cập Nhật Trạng Thái Lịch Hẹn</p>
          </div>
          <div style="background: #ffffff; padding: 30px;">
            <p style="color: #334155; font-size: 16px; font-weight: bold; margin-top: 0;">Xin chào ${details.patientName},</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              ${customMessage}
            </p>
            
            <div style="background: #f8fafc; border-left: 4px solid #14b8a6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; width: 120px; vertical-align: top;">${details.packageName ? 'Gói khám:' : 'Bác sĩ:'}</td>
                  <td style="padding: 6px 0; color: #0f172a;">${details.packageName ? details.packageName : `${details.doctorName} (${details.specialtyName})`}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Thời gian:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${timeStr} - ${dateStr}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Địa điểm:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${details.clinicName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Trạng thái:</td>
                  <td style="padding: 6px 0;">
                    <span style="background: ${statusBg}; color: ${statusColor}; padding: 2px 8px; border-radius: 9999px; font-size: 12px; font-weight: bold;">${statusText}</span>
                  </td>
                </tr>
              </table>
            </div>

            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              Cảm ơn bạn đã đồng hành cùng MedBooking vì một cuộc sống khỏe mạnh hơn.
            </p>
          </div>
          <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">Nếu cần thêm thông tin hỗ trợ, vui lòng phản hồi qua email này.</p>
            <p style="margin: 5px 0 0 0;">© 2026 MedBooking. All rights reserved.</p>
          </div>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Booking status update email (${details.status}) sent to: ${email}`);
    } catch (error) {
        console.error("Failed to send booking status update email:", error);
    }
}

/**
 * Send Booking Reminder Email
 */
export async function sendBookingReminderEmail(
    email: string,
    details: {
        patientName: string;
        doctorName: string;
        specialtyName: string;
        clinicName: string;
        appointmentDate: Date;
        bookingCode?: string | null;
        packageName?: string | null;
    }
): Promise<void> {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASSWORD) return;

    try {
        const dateStr = details.appointmentDate.toLocaleDateString("vi-VN", {
            weekday: "long",
            year: "numeric",
            month: "numeric",
            day: "numeric",
        });
        const timeStr = details.appointmentDate.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
        const frontEndUrl = process.env.FRONTEND_URL || "http://localhost:3000";

        const mailOptions = {
            from: process.env.MAIL_USER,
            to: email,
            subject: "[MedBooking] Nhắc nhở: Lịch khám của bạn vào ngày mai ⏰",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="background: #0d9488; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Đừng quên lịch khám ngày mai!</h1>
          </div>
          <div style="background: #ffffff; padding: 30px;">
            <p style="color: #334155; font-size: 16px; font-weight: bold; margin-top: 0;">Xin chào ${details.patientName},</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              Đây là email nhắc nhở bạn có một lịch hẹn khám sức khỏe đã được xác nhận vào ngày mai. Vui lòng sắp xếp thời gian đến đúng hẹn.
            </p>
            
            <div style="background: #f0fdfa; border-left: 4px solid #0d9488; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; width: 120px; vertical-align: top;">${details.packageName ? 'Gói khám:' : 'Bác sĩ:'}</td>
                  <td style="padding: 6px 0; color: #0f172a;">${details.packageName ? details.packageName : `${details.doctorName} (${details.specialtyName})`}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Thời gian:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${timeStr} - ${dateStr}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Địa điểm:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${details.clinicName}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 15px 0;">
                    <div style="background: #e6fffa; border: 2px solid #0d9488; text-align: center; padding: 15px; border-radius: 8px;">
                      <p style="margin: 0; color: #0d9488; font-size: 14px; font-weight: bold;">MÃ ĐẶT LỊCH</p>
                      <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #0f172a; letter-spacing: 2px;">${details.bookingCode || "N/A"}</p>
                    </div>
                  </td>
                </tr>
              </table>
            </div>
            
            <div style="background: #fef9c3; border-left: 4px solid #eab308; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #854d0e; font-weight: bold;">⚠️ Nếu bạn không thể đến, vui lòng hủy lịch TRƯỚC 24 giờ để được hoàn tiền cọc 100%</p>
            </div>

            <div style="margin: 20px 0; padding: 15px; border: 1px dashed #cbd5e1; border-radius: 8px; font-size: 13px; color: #475569;">
              <strong>Hướng dẫn tham gia:</strong>
              <ul style="margin-top: 5px; margin-bottom: 0; padding-left: 20px;">
                <li>Khám trực tiếp: Vui lòng đến trước 15 phút, mang theo CCCD.</li>
                <li>Khám trực tuyến: Chuẩn bị camera, microphone và đăng nhập đúng giờ để tham gia phòng khám.</li>
              </ul>
            </div>

            <div style="text-align: center; margin-top: 30px; display: flex; justify-content: center; gap: 15px;">
              <a href="${frontEndUrl}/my-appointments" style="display: inline-block; background-color: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">Xem lịch hẹn</a>
              <a href="${frontEndUrl}/my-appointments" style="display: inline-block; background-color: #f1f5f9; color: #475569; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">Hủy lịch hẹn</a>
            </div>
          </div>
          <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">© 2026 MedBooking. All rights reserved. Hotline: 1900-xxxx</p>
          </div>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Booking reminder email sent successfully to: ${email}`);
    } catch (error) {
        console.error("Failed to send booking reminder email:", error);
        throw error;
    }
}

/**
 * Send Booking Notification to Doctor Email
 */
export async function sendBookingNotificationToDoctorEmail(
    email: string,
    details: {
        patientName: string;
        doctorName: string;
        appointmentDate: Date;
        notes?: string | null;
        appointmentId: string;
    }
): Promise<void> {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASSWORD) return;

    try {
        const dateStr = details.appointmentDate.toLocaleDateString("vi-VN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        const timeStr = details.appointmentDate.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });

        const mailOptions = {
            from: process.env.MAIL_USER,
            to: email,
            subject: "Bạn có lịch khám mới đã được duyệt - MedBooking",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">MedBooking</h1>
            <p style="color: #ccfbf1; margin: 5px 0 0 0; font-size: 14px;">Thông Báo Lịch Khám Mới</p>
          </div>
          <div style="background: #ffffff; padding: 30px;">
            <p style="color: #334155; font-size: 16px; font-weight: bold; margin-top: 0;">Xin chào Bác sĩ ${details.doctorName},</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              Hệ thống MedBooking vừa duyệt thành công một lịch khám bệnh mới của bạn. Dưới đây là thông tin chi tiết:
            </p>
            
            <div style="background: #f0fdfa; border-left: 4px solid #14b8a6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; width: 120px; vertical-align: top;">Bệnh nhân:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${details.patientName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Thời gian:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${timeStr} - ${dateStr}</td>
                </tr>
                ${details.notes ? `
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Triệu chứng:</td>
                  <td style="padding: 6px 0; color: #64748b; font-style: italic;">${details.notes}</td>
                </tr>
                ` : ""}
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Mã lịch hẹn:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${details.appointmentId}</td>
                </tr>
              </table>
            </div>

            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              Vui lòng đăng nhập vào ứng dụng dành cho Bác sĩ để xem thêm thông tin bệnh án và chuẩn bị cho ca khám này.
            </p>
          </div>
          <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">© 2026 MedBooking. All rights reserved.</p>
          </div>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Booking notification sent to doctor email: ${email}`);
    } catch (error) {
        console.error("Failed to send booking notification to doctor:", error);
    }
}

// Global variable to keep track of the last date we ran the daily reminder check (e.g. "YYYY-MM-DD")
let lastSentReminderDate = "";

/**
 * Send Cancellation Email
 */
export async function sendCancellationEmail(
    email: string,
    details: {
        patientName: string;
        bookingCode?: string | null;
        appointmentDate: Date;
        isRefundable: boolean;
        amount: number;
    }
): Promise<void> {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASSWORD) return;

    try {
        const dateStr = details.appointmentDate.toLocaleDateString("vi-VN", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
        });
        const timeStr = details.appointmentDate.toLocaleTimeString("vi-VN", {
            hour: "2-digit", minute: "2-digit", hour12: false,
        });

        const subject = details.isRefundable 
            ? "Đã hủy lịch khám - Hoàn tiền cọc đang xử lý" 
            : "Đã hủy lịch khám - Tiền cọc không được hoàn";
            
        const refundBox = details.isRefundable
            ? `<div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #166534; font-weight: bold;">Hoàn tiền cọc đang được xử lý</p>
                <p style="margin: 5px 0 0 0; color: #15803d; font-size: 14px;">Tiền cọc ${details.amount.toLocaleString("vi-VN")} VNĐ sẽ được hoàn về tài khoản của bạn trong vòng 3-5 ngày làm việc.</p>
               </div>`
            : `<div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #991b1b; font-weight: bold;">Không hỗ trợ hoàn cọc</p>
                <p style="margin: 5px 0 0 0; color: #b91c1c; font-size: 14px;">Do hủy trong vòng 24 giờ trước giờ khám, tiền cọc ${details.amount.toLocaleString("vi-VN")} VNĐ sẽ không được hoàn lại theo chính sách của chúng tôi.</p>
               </div>`;

        const mailOptions = {
            from: process.env.MAIL_USER,
            to: email,
            subject: `[MedBooking] ${subject}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #64748b 0%, #475569 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">MedBooking</h1>
            <p style="color: #e2e8f0; margin: 5px 0 0 0;">Thông Báo Hủy Lịch Khám</p>
          </div>
          <div style="background: #ffffff; padding: 30px;">
            <p>Xin chào <strong>${details.patientName}</strong>,</p>
            <p>Bạn đã hủy thành công lịch khám vào lúc <strong>${timeStr} - ${dateStr}</strong>.</p>
            
            ${details.bookingCode ? `<p>Mã đặt lịch: <strong>${details.bookingCode}</strong></p>` : ''}
            
            ${refundBox}
            
            <p style="margin-top: 30px;">Bạn có thể đặt lại lịch khám mới bất cứ lúc nào qua hệ thống của chúng tôi.</p>
          </div>
        </div>`
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Failed to send cancellation email:", error);
    }
}

/**
 * Send Absence Email (Missed Appointment)
 */
export async function sendAbsenceEmail(
    email: string,
    details: {
        patientName: string;
        bookingCode?: string | null;
        appointmentDate: Date;
        amount: number;
    }
): Promise<void> {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASSWORD) return;

    try {
        const dateStr = details.appointmentDate.toLocaleDateString("vi-VN", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
        });
        const timeStr = details.appointmentDate.toLocaleTimeString("vi-VN", {
            hour: "2-digit", minute: "2-digit", hour12: false,
        });

        const mailOptions = {
            from: process.env.MAIL_USER,
            to: email,
            subject: `[MedBooking] Thông báo: Bạn đã vắng mặt buổi khám`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">MedBooking</h1>
            <p style="color: #fecaca; margin: 5px 0 0 0;">Thông Báo Vắng Mặt</p>
          </div>
          <div style="background: #ffffff; padding: 30px;">
            <p>Xin chào <strong>${details.patientName}</strong>,</p>
            <p>Hệ thống ghi nhận bạn đã không đến buổi khám vào lúc <strong>${timeStr} - ${dateStr}</strong>.</p>
            
            ${details.bookingCode ? `<p>Mã đặt lịch: <strong>${details.bookingCode}</strong></p>` : ''}
            
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #991b1b; font-weight: bold;">Tiền cọc ${details.amount.toLocaleString("vi-VN")} VNĐ đã bị giữ lại</p>
                <p style="margin: 5px 0 0 0; color: #b91c1c; font-size: 14px;">Theo chính sách của MedBooking, tiền cọc sẽ không được hoàn nếu bệnh nhân vắng mặt mà không thông báo hoặc hủy lịch trước.</p>
            </div>
            
            <p>Nếu bạn có lý do chính đáng hoặc sự cố bất khả kháng, vui lòng liên hệ bộ phận CSKH để được hỗ trợ xem xét.</p>
          </div>
        </div>`
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Failed to send absence email:", error);
    }
}

export async function checkAndSendReminders(): Promise<void> {
    try {
        console.log(`[Scheduler] Checking for tomorrow's appointments to send reminders...`);

        // Fetch ALL confirmed appointments for tomorrow
        const tomorrowStart = new Date();
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        tomorrowStart.setHours(0, 0, 0, 0);

        const tomorrowEnd = new Date();
        tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
        tomorrowEnd.setHours(23, 59, 59, 999);

        const appointments = await prisma.appointment.findMany({
            where: {
                status: "CONFIRMED",
                reminderSent: false,
                appointmentDate: {
                    gte: tomorrowStart,
                    lte: tomorrowEnd,
                },
            },
            include: {
                user: true,
                doctor: {
                    include: {
                        specialty: true,
                        clinic: true,
                    },
                },
            },
        });

        let remindersSent = 0;

        for (const appt of appointments) {
            // Check condition: appointment_datetime - created_at >= 48 hours
            const diffHours = (appt.appointmentDate.getTime() - appt.createdAt.getTime()) / (1000 * 60 * 60);
            
            if (diffHours >= 48 && appt.user.email) {
                try {
                    await sendBookingReminderEmail(appt.user.email, {
                        patientName: appt.user.fullName || appt.user.email,
                        doctorName: appt.doctor?.name || "Hệ thống",
                        specialtyName: appt.doctor?.specialty?.name || "",
                        clinicName: appt.doctor?.clinic?.name || appt.doctor?.hospital || "Bệnh viện",
                        appointmentDate: appt.appointmentDate,
                        bookingCode: appt.bookingCode
                    });
                    
                    // Mark as sent immediately after successful email send
                    await prisma.appointment.update({
                        where: { id: appt.id },
                        data: { reminderSent: true }
                    });
                    remindersSent++;
                } catch (emailError) {
                    // Log error, don't update reminderSent so it can retry later
                    console.error(`[Scheduler] Failed to send reminder for appointment ${appt.id}:`, emailError);
                }
            } else if (diffHours < 48) {
                // If it was created within 48h of the appointment, we just mark it as sent so we don't process it again
                await prisma.appointment.update({
                    where: { id: appt.id },
                    data: { reminderSent: true }
                });
            }
        }
        console.log(`[Scheduler] Finished sending ${remindersSent} reminders.`);
    } catch (error) {
        console.error("[Scheduler] Error checking/sending reminders:", error);
    }
}

/**
 * Initialize background reminder check task (runs every hour)
 */
export function initReminderScheduler(): void {
    // We will use node-cron for the reminder check instead
    // But we still need to run absence checks via interval here
    
    checkAndProcessAbsences().catch((err) =>
        console.error("[Scheduler] Initial startup absence check failed:", err)
    );

    // And run absence check every 30 minutes (1800000 milliseconds)
    setInterval(() => {
        checkAndProcessAbsences().catch((err) =>
            console.error("[Scheduler] Scheduled absence check failed:", err)
        );
    }, 30 * 60 * 1000);
}

/**
 * Perform absence check.
 * Queries database for CONFIRMED appointments that have passed and marks them as EXPIRED and forfeits deposit.
 */
async function checkAndProcessAbsences(): Promise<void> {
    try {
        const now = new Date();
        
        // Find appointments that are past due and not processed
        // We consider an appointment "missed" if 60 minutes have passed since the appointment time
        const cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);

        const missedAppointments = await prisma.appointment.findMany({
            where: {
                status: "CONFIRMED",
                absenceProcessed: false,
                appointmentDate: {
                    lt: cutoffTime
                }
            },
            include: { user: true }
        });

        if (missedAppointments.length > 0) {
            console.log(`[Scheduler] Found ${missedAppointments.length} missed appointments.`);
            
            for (const appt of missedAppointments) {
                // Update to EXPIRED and mark deposit forfeited
                await prisma.appointment.update({
                    where: { id: appt.id },
                    data: {
                        status: "EXPIRED",
                        absenceProcessed: true,
                        depositForfeited: true,
                    }
                });

                if (appt.user.email) {
                    await sendAbsenceEmail(appt.user.email, {
                        patientName: appt.user.fullName || appt.user.email,
                        bookingCode: appt.bookingCode,
                        appointmentDate: appt.appointmentDate,
                        amount: appt.amount
                    });
                }
            }
        }
    } catch (error) {
        console.error("[Scheduler] Error processing absences:", error);
    }
}

/**
 * Send completed examination email with prescription PDF
 */
export async function sendPrescriptionEmail(
    email: string,
    details: {
        patientName: string;
        doctorName: string;
        appointmentDate: Date;
    },
    pdfBase64?: string
): Promise<void> {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASSWORD) return;

    try {
        const dateStr = details.appointmentDate.toLocaleDateString("vi-VN");
        
        const mailOptions: any = {
            from: process.env.MAIL_USER,
            to: email,
            subject: "Kết quả khám bệnh & Đơn thuốc - MedBooking",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">MedBooking</h1>
            <p style="color: #ccfbf1; margin: 5px 0 0 0;">Kết quả khám bệnh</p>
          </div>
          <div style="background: #ffffff; padding: 30px;">
            <p>Xin chào ${details.patientName},</p>
            <p>Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ khám bệnh của hệ thống MedBooking.</p>
            <p>Bác sĩ <strong>${details.doctorName}</strong> đã hoàn thành việc khám bệnh cho bạn vào ngày <strong>${dateStr}</strong>.</p>
            <p>Bạn có thể xem thông tin đơn thuốc và kết luận khám ở file đính kèm (nếu có) hoặc đăng nhập vào hệ thống để xem chi tiết bệnh án.</p>
            <p>Chúc bạn thật nhiều sức khỏe!</p>
          </div>
        </div>
      `,
        };

        if (pdfBase64) {
            // Remove data:application/pdf;base64, if present
            const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
            mailOptions.attachments = [
                {
                    filename: 'DonThuoc.pdf',
                    content: base64Data,
                    encoding: 'base64'
                }
            ];
        }

        await transporter.sendMail(mailOptions);
        console.log(`Prescription email sent successfully to: ${email}`);
    } catch (error) {
        console.error("Failed to send prescription email:", error);
    }
}

/**
 * Send certificate verification result email to doctor
 */
export async function sendCertificateVerificationEmail(
    email: string,
    doctorName: string,
    certTitle: string,
    status: 'VERIFIED' | 'REJECTED',
    reason?: string
): Promise<void> {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASSWORD) {
        console.log(`[DEV] Certificate ${status} email would be sent to: ${email} for cert: "${certTitle}"`);
        return;
    }

    const isVerified = status === 'VERIFIED';
    const subject = isVerified
        ? `✅ Chứng chỉ của bạn đã được xác minh - MedBooking`
        : `❌ Chứng chỉ của bạn chưa được xác minh - MedBooking`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">MedBooking</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Hệ thống Y tế Số Hàng đầu Việt Nam</p>
      </div>
      <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
        <p style="color: #334155; font-size: 16px; margin-top: 0;">Kính gửi <strong>BS. ${doctorName}</strong>,</p>
        
        <div style="background: ${isVerified ? '#f0fdf4' : '#fff1f2'}; border: 1px solid ${isVerified ? '#bbf7d0' : '#fecdd3'}; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 32px;">${isVerified ? '✅' : '❌'}</span>
            <div>
              <p style="font-weight: bold; color: ${isVerified ? '#166534' : '#991b1b'}; font-size: 18px; margin: 0;">
                ${isVerified ? 'Chứng chỉ đã được XÁC MINH' : 'Chứng chỉ chưa được xác minh'}
              </p>
              <p style="color: #64748b; font-size: 14px; margin: 4px 0 0;">Chứng chỉ: <strong>${certTitle}</strong></p>
            </div>
          </div>
        </div>

        ${!isVerified && reason ? `
        <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 16px; border-radius: 0 8px 8px 0; margin: 16px 0;">
          <p style="color: #9a3412; font-weight: bold; margin: 0 0 6px;">Lý do từ chối:</p>
          <p style="color: #7c2d12; margin: 0; font-size: 14px;">${reason}</p>
        </div>
        <p style="color: #475569; font-size: 14px;">Bạn có thể cập nhật lại thông tin và tải lại ảnh chứng chỉ trên cổng thông tin bác sĩ, sau đó hệ thống sẽ xem xét lại.</p>
        ` : ''}

        ${isVerified ? `
        <p style="color: #475569; font-size: 14px;">Chứng chỉ này sẽ được hiển thị với badge <strong style="color: #059669;">✓ Đã xác minh</strong> trên trang hồ sơ công khai của bạn, giúp tăng độ tin cậy với bệnh nhân.</p>
        ` : ''}

        <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 16px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/doctor/certificates" 
             style="display: inline-block; background: #0d9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
            Xem quản lý chứng chỉ →
          </a>
        </div>

        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
          Email này được gửi tự động từ hệ thống MedBooking. Vui lòng không trả lời email này.
        </p>
      </div>
    </div>`;

    try {
        await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: email,
            subject,
            html,
        });
        console.log(`Certificate ${status} email sent to: ${email}`);
    } catch (error) {
        console.error('Failed to send certificate verification email:', error);
    }
}
