"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAppointmentHandler = createAppointmentHandler;
exports.getMyAppointments = getMyAppointments;
exports.getAppointmentByIdHandler = getAppointmentByIdHandler;
exports.getPublicPrescriptionHandler = getPublicPrescriptionHandler;
exports.uploadPaymentProofHandler = uploadPaymentProofHandler;
exports.cancelAppointmentHandler = cancelAppointmentHandler;
const appointment_service_1 = require("../services/appointment.service");
const emailService_1 = require("../utils/emailService");
const apiError_1 = require("../utils/apiError");
const client_1 = __importDefault(require("../prisma/client"));
const notificationService_1 = require("../services/notificationService");
/**
 * POST /api/appointments
 * Protected (USER role): Books a new appointment.
 */
async function createAppointmentHandler(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new apiError_1.ApiError("Authentication required", 401);
        }
        const { doctorId, appointmentDate, notes, packageId, patientInfo, patientProfileType } = req.body;
        if (!patientInfo || !patientInfo.fullName) {
            throw new apiError_1.ApiError("Vui lòng điền đầy đủ thông tin người khám", 400);
        }
        if (!doctorId && !packageId) {
            throw new apiError_1.ApiError("Doctor ID or Package ID is required", 400);
        }
        if (!appointmentDate) {
            throw new apiError_1.ApiError("Appointment date is required", 400);
        }
        const date = new Date(appointmentDate);
        if (Number.isNaN(date.getTime())) {
            throw new apiError_1.ApiError("Invalid appointment date format", 400);
        }
        const nowPlus2Hours = new Date();
        nowPlus2Hours.setHours(nowPlus2Hours.getHours() + 2);
        if (date < nowPlus2Hours) {
            throw new apiError_1.ApiError("Appointment date must be at least 2 hours from now", 400);
        }
        const appointment = await (0, appointment_service_1.createAppointment)({
            userId,
            patientInfo: patientInfo,
            patientProfileType: patientProfileType === 'OTHER' ? 'OTHER' : 'SELF',
            doctorId,
            appointmentDate: date,
            notes,
            packageId,
        });
        res.status(201).json({
            message: "Appointment created successfully",
            appointment,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/my-appointments
 * Protected (USER role): Returns the authenticated user's appointments.
 */
async function getMyAppointments(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new apiError_1.ApiError("Authentication required", 401);
        }
        const appointments = await (0, appointment_service_1.getAppointmentsByUser)(userId);
        res.json({
            message: "Appointments fetched successfully",
            count: appointments.length,
            appointments,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/appointments/:id
 * Protected: Returns appointment details.
 */
async function getAppointmentByIdHandler(req, res, next) {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!userId) {
            throw new apiError_1.ApiError("Authentication required", 401);
        }
        const { id } = req.params;
        if (!id) {
            throw new apiError_1.ApiError("Appointment ID is required", 400);
        }
        const appointment = await (0, appointment_service_1.getAppointmentById)(id);
        if (!appointment) {
            throw new apiError_1.ApiError("Appointment not found", 404);
        }
        let isAuthorized = false;
        if (appointment.userId === userId) {
            isAuthorized = true;
        }
        else if (userRole === "DOCTOR") {
            const doctorUser = await client_1.default.user.findUnique({
                where: { id: userId },
                select: { doctorId: true }
            });
            if (doctorUser && doctorUser.doctorId === appointment.doctorId) {
                isAuthorized = true;
            }
        }
        else if (userRole === "ADMIN") {
            isAuthorized = true;
        }
        if (!isAuthorized) {
            throw new apiError_1.ApiError("You are not authorized to view this appointment", 403);
        }
        const responseData = {
            message: "Appointment fetched successfully",
            appointment,
        };
        if (appointment.status === "PENDING_PAYMENT") {
            responseData.bankDetails = {
                bankName: "BIDV",
                bankAccount: "5624715454",
                bankOwner: "NGUYEN DAC DUNG",
            };
        }
        res.json(responseData);
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/appointments/:id/prescription/public
 * Public endpoint to verify a prescription. No auth token required.
 */
async function getPublicPrescriptionHandler(req, res, next) {
    try {
        const { id } = req.params;
        if (!id) {
            throw new apiError_1.ApiError("Appointment ID is required", 400);
        }
        const appointment = await client_1.default.appointment.findUnique({
            where: { id: id },
            select: {
                id: true,
                appointmentDate: true,
                status: true,
                user: {
                    select: {
                        fullName: true,
                        gender: true,
                        dateOfBirth: true,
                    },
                },
                doctor: {
                    select: {
                        name: true,
                        hospital: true,
                        specialty: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                medicalRecord: {
                    select: {
                        diagnosis: true,
                        notes: true,
                        prescriptions: {
                            select: {
                                id: true,
                                medicationName: true,
                                dosage: true,
                                frequency: true,
                                duration: true,
                            },
                        },
                        createdAt: true,
                    },
                },
            },
        });
        if (!appointment) {
            throw new apiError_1.ApiError("Appointment not found", 404);
        }
        if (appointment.status !== "COMPLETED" || !appointment.medicalRecord) {
            throw new apiError_1.ApiError("No completed prescription found for this appointment", 404);
        }
        res.json({
            message: "Prescription verified successfully",
            verified: true,
            prescription: appointment,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/appointments/:id/pay-proof
 * Bệnh nhân upload ảnh biên lai. Cập nhật status thành PENDING.
 */
async function uploadPaymentProofHandler(req, res, next) {
    try {
        const userId = req.user?.userId;
        const id = req.params.id;
        if (!userId) {
            throw new apiError_1.ApiError("Yêu cầu đăng nhập", 401);
        }
        if (!id) {
            throw new apiError_1.ApiError("Mã lịch hẹn (appointmentId) là bắt buộc", 400);
        }
        if (!req.file) {
            throw new apiError_1.ApiError("Vui lòng tải lên ảnh biên lai thanh toán", 400);
        }
        // Check ownership
        const appointment = await client_1.default.appointment.findUnique({
            where: { id },
        });
        if (!appointment) {
            throw new apiError_1.ApiError("Lịch hẹn không tồn tại", 404);
        }
        if (appointment.userId !== userId) {
            throw new apiError_1.ApiError("Bạn không có quyền cập nhật lịch hẹn này", 403);
        }
        const updated = await (0, appointment_service_1.uploadPaymentProof)(id, req.file.buffer, req.file.mimetype);
        res.status(200).json({
            message: "Đã nhận biên lai thanh toán. Vui lòng chờ xác nhận.",
            appointment: updated,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/appointments/:id/cancel
 * Protected (USER role): Cancels an appointment if it's > 24h before appointmentDate.
 */
async function cancelAppointmentHandler(req, res, next) {
    try {
        const userId = req.user?.userId;
        const id = req.params.id;
        const { reason } = req.body;
        if (!userId) {
            throw new apiError_1.ApiError("Authentication required", 401);
        }
        if (!id) {
            throw new apiError_1.ApiError("Appointment ID is required", 400);
        }
        const appointment = await client_1.default.appointment.findUnique({
            where: { id },
            include: { payment: true }
        });
        if (!appointment) {
            throw new apiError_1.ApiError("Appointment not found", 404);
        }
        if (appointment.userId !== userId) {
            throw new apiError_1.ApiError("You are not authorized to cancel this appointment", 403);
        }
        if (appointment.status === "CANCELLED" || appointment.status === "EXPIRED" || appointment.status === "COMPLETED") {
            throw new apiError_1.ApiError(`Cannot cancel an appointment with status ${appointment.status}`, 400);
        }
        const now = new Date();
        const appointmentDate = new Date(appointment.appointmentDate);
        // Calculate diff in hours
        const diffMs = appointmentDate.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        const isRefundable = diffHours >= 24;
        // Handle refund if payment was already PAID
        let finalReason = reason || "Người bệnh yêu cầu huỷ";
        if (appointment.payment && appointment.payment.status === "PAID" && isRefundable) {
            // Update Payment status to REFUNDED
            await client_1.default.payment.update({
                where: { id: appointment.payment.id },
                data: { status: "REFUNDED" }
            });
            finalReason += " (Hệ thống đang xử lý hoàn tiền về tài khoản ngân hàng gốc)";
        }
        else if (appointment.payment && appointment.payment.status === "PENDING") {
            // If it was just pending, cancel the payment record as well
            await client_1.default.payment.update({
                where: { id: appointment.payment.id },
                data: { status: "FAILED" } // Or CANCELLED if enum existed
            });
        }
        else if (!isRefundable) {
            finalReason += " (Hủy trong vòng 24h, không hoàn cọc)";
        }
        const updatedAppointment = await client_1.default.appointment.update({
            where: { id },
            data: {
                status: "CANCELLED",
                cancellationReason: finalReason,
                depositForfeited: !isRefundable
            },
            include: { user: true }
        });
        if (updatedAppointment.user?.email) {
            (0, emailService_1.sendCancellationEmail)(updatedAppointment.user.email, {
                patientName: updatedAppointment.user.fullName || updatedAppointment.user.email,
                bookingCode: updatedAppointment.bookingCode,
                appointmentDate: updatedAppointment.appointmentDate,
                isRefundable: isRefundable,
                amount: updatedAppointment.amount
            }).catch(console.error);
        }
        // Create in-app notification for the user
        (0, notificationService_1.createNotification)({
            userId,
            type: "APPOINTMENT_CANCELLED_BY_PATIENT",
            title: "Lịch hẹn đã bị huỷ ❌",
            message: isRefundable
                ? `Lịch hẹn #${updatedAppointment.bookingCode} đã huỷ thành công. Tiền đặt cọc sẽ được hoàn trả trong vòng 3-5 ngày làm việc.`
                : `Lịch hẹn #${updatedAppointment.bookingCode} đã huỷ thành công. Lưu ý: huỷ trong vòng 24h trước giờ khám nên không hoàn cọc.`,
            data: { appointmentId: updatedAppointment.id }
        }).catch(console.error);
        res.json({
            message: "Huỷ lịch hẹn thành công",
            appointment: updatedAppointment
        });
    }
    catch (error) {
        next(error);
    }
}
