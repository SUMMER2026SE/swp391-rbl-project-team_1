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
                  <td style="padding: 6px 0; font-weight: bold; width: 120px; vertical-align: top;">Bác sĩ:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${details.doctorName} (${details.specialtyName})</td>
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
                  <td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Trạng thái:</td>
                  <td style="padding: 6px 0;">
                    <span style="background: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 9999px; font-size: 12px; font-weight: bold;">Chờ xác nhận</span>
                  </td>
                </tr>
              </table>
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
                  <td style="padding: 6px 0; font-weight: bold; width: 120px; vertical-align: top;">Bác sĩ:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${details.doctorName} (${details.specialtyName})</td>
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
            subject: "Nhắc nhở: Lịch khám bệnh của bạn vào ngày mai - MedBooking",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">MedBooking</h1>
            <p style="color: #ccfbf1; margin: 5px 0 0 0; font-size: 14px;">Nhắc Lịch Hẹn Khám Ngày Mai</p>
          </div>
          <div style="background: #ffffff; padding: 30px;">
            <p style="color: #334155; font-size: 16px; font-weight: bold; margin-top: 0;">Xin chào ${details.patientName},</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              Đây là email nhắc nhở bạn có một lịch hẹn khám sức khỏe đã được xác nhận vào **ngày mai**. Vui lòng sắp xếp thời gian đến đúng hẹn:
            </p>
            
            <div style="background: #f0fdfa; border-left: 4px solid #14b8a6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; width: 120px; vertical-align: top;">Bác sĩ:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${details.doctorName} (${details.specialtyName})</td>
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
                  <td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Trạng thái:</td>
                  <td style="padding: 6px 0;">
                    <span style="background: #dbeafe; color: #2563eb; padding: 2px 8px; border-radius: 9999px; font-size: 12px; font-weight: bold;">Đã xác nhận</span>
                  </td>
                </tr>
              </table>
            </div>

            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              Vui lòng mang theo căn cước công dân hoặc thẻ bảo hiểm (nếu có) khi đến khám. Hẹn gặp lại bạn ngày mai!
            </p>
          </div>
          <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">© 2026 MedBooking. All rights reserved.</p>
          </div>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Booking reminder email sent successfully to: ${email}`);
    } catch (error) {
        console.error("Failed to send booking reminder email:", error);
    }
}

// Global variable to keep track of the last date we ran the daily reminder check (e.g. "YYYY-MM-DD")
let lastSentReminderDate = "";

/**
 * Perform tomorrow appointment reminders check.
 * Quets database for CONFIRMED appointments happening tomorrow and sends reminder emails.
 */
async function checkAndSendReminders(): Promise<void> {
    try {
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

        // We run the check once a day, specifically during the 8:00 AM hour
        const currentHour = today.getHours();
        if (currentHour !== 8) {
            return; // Not 8 AM yet, skip
        }

        // If we already sent reminders for today's check, skip
        if (lastSentReminderDate === todayStr) {
            return;
        }

        console.log(`[Scheduler] Checking for tomorrow's appointments to send reminders...`);
        lastSentReminderDate = todayStr; // Update sentinel

        // Calculate time range for "tomorrow"
        const tomorrowStart = new Date();
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        tomorrowStart.setHours(0, 0, 0, 0);

        const tomorrowEnd = new Date();
        tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
        tomorrowEnd.setHours(23, 59, 59, 999);

        // Fetch all confirmed appointments for tomorrow
        const appointments = await prisma.appointment.findMany({
            where: {
                status: "CONFIRMED",
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

        console.log(`[Scheduler] Found ${appointments.length} appointments for tomorrow.`);

        for (const appt of appointments) {
            if (appt.user.email) {
                // Send reminder email
                await sendBookingReminderEmail(appt.user.email, {
                    patientName: appt.user.fullName || appt.user.email,
                    doctorName: appt.doctor.name,
                    specialtyName: appt.doctor.specialty.name,
                    clinicName: appt.doctor.clinic?.name || appt.doctor.hospital,
                    appointmentDate: appt.appointmentDate,
                });
            }
        }
    } catch (error) {
        console.error("[Scheduler] Error checking/sending reminders:", error);
    }
}

/**
 * Initialize background reminder check task (runs every hour)
 */
export function initReminderScheduler(): void {
    console.log("[Scheduler] Initializing tomorrow appointment reminder scheduler...");
    // Run the check immediately on startup
    checkAndSendReminders().catch((err) =>
        console.error("[Scheduler] Initial startup check failed:", err)
    );

    // Then run it every hour (3600000 milliseconds)
    setInterval(() => {
        checkAndSendReminders().catch((err) =>
            console.error("[Scheduler] Scheduled check failed:", err)
        );
    }, 60 * 60 * 1000);
}


