import { NextFunction, Response, Request } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { createAppointment, getAppointmentsByUser, getAppointmentById, uploadPaymentProof } from "../services/appointment.service";
import { sendBookingStatusUpdateEmail, sendCancellationEmail } from "../utils/emailService";
import { ApiError } from "../utils/apiError";
import prisma from "../prisma/client";

interface CreateAppointmentRequestBody {
    doctorId?: string;
    appointmentDate: string;
    notes?: string;
    packageId?: string;
    patientProfileId: string;
}

/**
 * POST /api/appointments
 * Protected (USER role): Books a new appointment.
 */
export async function createAppointmentHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiError("Authentication required", 401);
        }

        const { doctorId, appointmentDate, notes, packageId, patientProfileId, newPatientProfile } = req.body as any;

        let finalProfileId = patientProfileId;

        if (!finalProfileId && newPatientProfile) {
            const fullAddress = [newPatientProfile.address, newPatientProfile.ward, newPatientProfile.province]
                .filter(Boolean)
                .join(", ");

            const profile = await prisma.patientProfile.create({
                data: {
                    userId,
                    fullName: newPatientProfile.fullName,
                    phoneNumber: newPatientProfile.phoneNumber,
                    gender: newPatientProfile.gender,
                    dateOfBirth: new Date(newPatientProfile.dateOfBirth),
                    cccd: newPatientProfile.cccd || "",
                    address: fullAddress || "",
                    isPrimary: false,
                    isTemporary: newPatientProfile.isTemporary || false
                }
            });
            finalProfileId = profile.id;
        }

        if (!finalProfileId) {
            throw new ApiError("Vui lòng chọn hồ sơ người khám", 400);
        }
        if (!doctorId && !packageId) {
            throw new ApiError("Doctor ID or Package ID is required", 400);
        }
        if (!appointmentDate) {
            throw new ApiError("Appointment date is required", 400);
        }

        const date = new Date(appointmentDate);

        if (Number.isNaN(date.getTime())) {
            throw new ApiError("Invalid appointment date format", 400);
        }

        const nowPlus2Hours = new Date();
        nowPlus2Hours.setHours(nowPlus2Hours.getHours() + 2);

        if (date < nowPlus2Hours) {
            throw new ApiError("Appointment date must be at least 2 hours from now", 400);
        }

        const appointment = await createAppointment({
            userId,
            patientProfileId: finalProfileId,
            doctorId,
            appointmentDate: date,
            notes,
            packageId,
        });


        res.status(201).json({
            message: "Appointment created successfully",
            appointment,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/my-appointments
 * Protected (USER role): Returns the authenticated user's appointments.
 */
export async function getMyAppointments(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiError("Authentication required", 401);
        }

        const appointments = await getAppointmentsByUser(userId);
        res.json({
            message: "Appointments fetched successfully",
            count: appointments.length,
            appointments,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/appointments/:id
 * Protected: Returns appointment details.
 */
export async function getAppointmentByIdHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        if (!userId) {
            throw new ApiError("Authentication required", 401);
        }

        const { id } = req.params;

        if (!id) {
            throw new ApiError("Appointment ID is required", 400);
        }

        const appointment = await getAppointmentById(id as string);

        if (!appointment) {
            throw new ApiError("Appointment not found", 404);
        }

        let isAuthorized = false;

        if (appointment.userId === userId) {
            isAuthorized = true;
        } else if (userRole === "DOCTOR") {
            const doctorUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { doctorId: true }
            });
            if (doctorUser && doctorUser.doctorId === appointment.doctorId) {
                isAuthorized = true;
            }
        } else if (userRole === "ADMIN") {
            isAuthorized = true;
        }

        if (!isAuthorized) {
            throw new ApiError("You are not authorized to view this appointment", 403);
        }

        const responseData: any = {
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
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/appointments/:id/prescription/public
 * Public endpoint to verify a prescription. No auth token required.
 */
export async function getPublicPrescriptionHandler(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;

        if (!id) {
            throw new ApiError("Appointment ID is required", 400);
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id: id as string },
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
            throw new ApiError("Appointment not found", 404);
        }

        if (appointment.status !== "COMPLETED" || !appointment.medicalRecord) {
            throw new ApiError("No completed prescription found for this appointment", 404);
        }

        res.json({
            message: "Prescription verified successfully",
            verified: true,
            prescription: appointment,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/appointments/:id/pay-proof
 * Bệnh nhân upload ảnh biên lai. Cập nhật status thành PENDING.
 */
export async function uploadPaymentProofHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;
        const id = req.params.id as string;

        if (!userId) {
            throw new ApiError("Yêu cầu đăng nhập", 401);
        }

        if (!id) {
            throw new ApiError("Mã lịch hẹn (appointmentId) là bắt buộc", 400);
        }

        if (!req.file) {
            throw new ApiError("Vui lòng tải lên ảnh biên lai thanh toán", 400);
        }

        // Check ownership
        const appointment = await prisma.appointment.findUnique({
            where: { id },
        });

        if (!appointment) {
            throw new ApiError("Lịch hẹn không tồn tại", 404);
        }

        if (appointment.userId !== userId) {
            throw new ApiError("Bạn không có quyền cập nhật lịch hẹn này", 403);
        }

        const updated = await uploadPaymentProof(
            id,
            req.file.buffer,
            req.file.mimetype
        );

        res.status(200).json({
            message: "Đã nhận biên lai thanh toán. Vui lòng chờ xác nhận.",
            appointment: updated,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/appointments/:id/cancel
 * Protected (USER role): Cancels an appointment if it's > 24h before appointmentDate.
 */
export async function cancelAppointmentHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;
        const id = req.params.id as string;
        const { reason } = req.body;

        if (!userId) {
            throw new ApiError("Authentication required", 401);
        }

        if (!id) {
            throw new ApiError("Appointment ID is required", 400);
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id },
            include: { payment: true }
        });

        if (!appointment) {
            throw new ApiError("Appointment not found", 404);
        }

        if (appointment.userId !== userId) {
            throw new ApiError("You are not authorized to cancel this appointment", 403);
        }

        if (appointment.status === "CANCELLED" || appointment.status === "EXPIRED" || appointment.status === "COMPLETED") {
            throw new ApiError(`Cannot cancel an appointment with status ${appointment.status}`, 400);
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
            await prisma.payment.update({
                where: { id: appointment.payment.id },
                data: { status: "REFUNDED" }
            });
            finalReason += " (Hệ thống đang xử lý hoàn tiền về tài khoản ngân hàng gốc)";
        } else if (appointment.payment && appointment.payment.status === "PENDING") {
            // If it was just pending, cancel the payment record as well
            await prisma.payment.update({
                where: { id: appointment.payment.id },
                data: { status: "FAILED" } // Or CANCELLED if enum existed
            });
        } else if (!isRefundable) {
            finalReason += " (Hủy trong vòng 24h, không hoàn cọc)";
        }

        const updatedAppointment = await prisma.appointment.update({
            where: { id },
            data: {
                status: "CANCELLED",
                cancellationReason: finalReason,
                depositForfeited: !isRefundable
            },
            include: { user: true }
        });

        if (updatedAppointment.user?.email) {
            sendCancellationEmail(updatedAppointment.user.email, {
                patientName: updatedAppointment.user.fullName || updatedAppointment.user.email,
                bookingCode: updatedAppointment.bookingCode,
                appointmentDate: updatedAppointment.appointmentDate,
                isRefundable: isRefundable,
                amount: updatedAppointment.amount
            }).catch(console.error);
        }

        res.json({
            message: "Huỷ lịch hẹn thành công",
            appointment: updatedAppointment
        });
    } catch (error) {
        next(error);
    }
}
