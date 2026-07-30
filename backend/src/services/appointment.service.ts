import { Appointment } from "@prisma/client";
import fs from "fs";
import path from "path";

import prisma from "../prisma/client";
import { ApiError } from "../utils/apiError";
import { sendBookingConfirmationEmail, sendCancellationEmail } from "../utils/emailService";
import { generateBookingCode } from "../utils/generateBookingCode";
import { supabase } from "../config/supabase";
import { createNotification } from "./notificationService";

async function saveFileLocally(appointmentId: string, fileName: string, fileBuffer: Buffer): Promise<string> {
    const uploadDir = path.join(__dirname, "../../public/payment-proofs", `appointment-${appointmentId}`);

    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const baseName = path.basename(fileName);
    const filePath = path.join(uploadDir, baseName);

    fs.writeFileSync(filePath, fileBuffer);

    // Return relative URL served by Express static middleware
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    return `${backendUrl}/public/payment-proofs/appointment-${appointmentId}/${baseName}`;
}

export interface PatientInfo {
    fullName: string;
    phoneNumber?: string;
    gender?: string;
    dateOfBirth?: Date | string;
    province?: string;
    district?: string;
    ward?: string;
    street?: string;
    address?: string;
    bloodType?: string;
    allergies?: string;
    chronicDiseases?: string;
    personalHistory?: string;
    familyHistory?: string;
    // For OTHER type
    yearOfBirth?: number;
    relationship?: string;
}

export interface CreateAppointmentParams {
    userId: string;
    patientInfo: PatientInfo;
    patientProfileType?: 'SELF' | 'OTHER';
    doctorId?: string;
    appointmentDate: Date;
    notes?: string;
    packageId?: string;
    voucherCode?: string;
}

function generateTransactionCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "MB-";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export async function createAppointment(
    params: CreateAppointmentParams
): Promise<Appointment> {
    const { userId, patientInfo, patientProfileType = 'SELF', doctorId, packageId, appointmentDate, notes } = params;

    return await prisma.$transaction(async (tx) => {
        if (doctorId) {
            const doctor = await tx.doctor.findUnique({ where: { id: doctorId } });
            if (!doctor) throw new ApiError("Doctor not found", 404);

            const doctorUser = await tx.user.findUnique({ where: { doctorId } });
            if (doctorUser?.id === userId) {
                throw new ApiError("Bạn không thể tự đặt lịch khám với chính mình.", 400);
            }

            const count = await tx.appointment.count({
                where: {
                    doctorId,
                    appointmentDate,
                    status: { in: ["PENDING_PAYMENT", "PENDING", "CONFIRMED"] },
                },
            });
            if (count >= 20) {
                throw new ApiError("Khung giờ này đã hết chỗ (20/20). Vui lòng chọn thời gian khác.", 409);
            }
        } else if (!packageId) {
            throw new ApiError("Doctor ID or Package ID is required", 400);
        }

        // 1. Only update user profile fields if booking for SELF
        if (patientProfileType === 'SELF') {
            const updateData: Record<string, unknown> = {};
            if (patientInfo.fullName) updateData.fullName = patientInfo.fullName;
            if (patientInfo.gender) updateData.gender = patientInfo.gender;
            if (patientInfo.dateOfBirth) updateData.dateOfBirth = new Date(patientInfo.dateOfBirth);
            if (patientInfo.bloodType) updateData.bloodType = patientInfo.bloodType;
            if (patientInfo.allergies) updateData.allergies = patientInfo.allergies;
            if (patientInfo.chronicDiseases) updateData.chronicDiseases = patientInfo.chronicDiseases;
            if (patientInfo.personalHistory) updateData.personalHistory = patientInfo.personalHistory;
            if (patientInfo.familyHistory) updateData.familyHistory = patientInfo.familyHistory;
            if (patientInfo.province) updateData.province = patientInfo.province;
            if (patientInfo.district) updateData.district = patientInfo.district;
            if (patientInfo.ward) updateData.ward = patientInfo.ward;
            if (patientInfo.street) updateData.street = patientInfo.street;

            if (Object.keys(updateData).length > 0) {
                await tx.user.update({
                    where: { id: userId },
                    data: updateData,
                });
            }
        }

        // 2. Create appointment - generate unique codes with max retry limit
        const MAX_CODE_RETRIES = 10;

        let transactionCode = generateTransactionCode();
        let codeConflict = await tx.appointment.findFirst({ where: { transactionCode } });
        let txnRetries = 0;
        while (codeConflict) {
            if (++txnRetries > MAX_CODE_RETRIES) {
                throw new ApiError("Không thể tạo mã giao dịch duy nhất. Vui lòng thử lại.", 500);
            }
            transactionCode = generateTransactionCode();
            codeConflict = await tx.appointment.findFirst({ where: { transactionCode } });
        }

        let bookingCode = generateBookingCode();
        let bookingCodeConflict = await tx.appointment.findFirst({ where: { bookingCode } });
        let bookingRetries = 0;
        while (bookingCodeConflict) {
            if (++bookingRetries > MAX_CODE_RETRIES) {
                throw new ApiError("Không thể tạo mã đặt lịch duy nhất. Vui lòng thử lại.", 500);
            }
            bookingCode = generateBookingCode();
            bookingCodeConflict = await tx.appointment.findFirst({ where: { bookingCode } });
        }

        let amount = 5000;
        let specialtyId: string | undefined;
        if (doctorId) {
            const doc = await tx.doctor.findUnique({ where: { id: doctorId } });
            if (!doc) throw new ApiError("Doctor not found", 404);
            if (doc.price) amount = doc.price;
            specialtyId = doc.specialtyId || undefined;
        } else if (packageId) {
            const pkg = await tx.medicalPackage.findUnique({ where: { id: packageId } });
            if (pkg) amount = pkg.depositAmount || (pkg.price * (pkg.depositPercentage || 100)) / 100;
        }

        // If voucherCode is supplied, perform validation (including minDepositAmount check)
        const voucherCode = params.voucherCode;
        if (voucherCode) {
            const voucher = await tx.voucher.findUnique({
                where: { code: voucherCode.toUpperCase() },
            });
            if (!voucher) {
                throw new ApiError("Mã giảm giá không tồn tại.", 400);
            }
            if (!voucher.isActive) {
                throw new ApiError("Mã giảm giá đã bị vô hiệu hóa.", 400);
            }
            const now = new Date();
            if (now < voucher.startDate) {
                throw new ApiError("Mã giảm giá chưa có hiệu lực.", 400);
            }
            if (voucher.endDate < now) {
                throw new ApiError("Mã giảm giá đã hết hạn.", 400);
            }
            if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) {
                throw new ApiError("Mã giảm giá đã hết lượt sử dụng.", 400);
            }

            // Check if user already used this voucher
            const existingUsage = await tx.voucherUsage.findFirst({
                where: { voucherId: voucher.id, userId },
            });
            if (existingUsage) {
                throw new ApiError("Bạn đã sử dụng mã giảm giá này rồi.", 400);
            }

            // Check first booking condition
            if (voucher.isFirstBooking) {
                const existingConfirmedAppointment = await tx.appointment.findFirst({
                    where: {
                        userId,
                        status: { in: ["CONFIRMED", "COMPLETED"] },
                    },
                });
                if (existingConfirmedAppointment) {
                    throw new ApiError("Mã giảm giá này chỉ dành cho lần đặt lịch đầu tiên.", 400);
                }
            }

            // Check specialty restriction
            if (voucher.applyTo === "SPECIALTY") {
                if (!specialtyId || voucher.specialtyId !== specialtyId) {
                    throw new ApiError("Mã giảm giá không áp dụng cho chuyên khoa này.", 400);
                }
            }

            // Check applyTo: PACKAGE vouchers only valid with packageId
            if (voucher.applyTo === "PACKAGE" && !packageId) {
                throw new ApiError("Mã giảm giá này chỉ áp dụng khi đặt gói khám.", 400);
            }

            // Check minimum deposit
            if (amount < voucher.minDepositAmount) {
                throw new ApiError(
                    `Số tiền cọc tối thiểu để sử dụng mã này là ${voucher.minDepositAmount.toLocaleString("vi-VN")}đ.`,
                    400
                );
            }
        }

        const createdAppointment = await tx.appointment.create({
            data: {
                userId,
                patientProfileType: patientProfileType as any,
                patientInfo: patientInfo as any, // Store snapshot
                doctorId,
                packageId,
                appointmentDate,
                status: "PENDING_PAYMENT",
                notes,
                amount,
                transactionCode,
                bookingCode,
            },
            include: {
                doctor: { include: { userAccount: true } },
                medicalPackage: true,
                user: true,
            },
        });

        return createdAppointment;
    }, {
        isolationLevel: "Serializable"
    });
}

export async function uploadPaymentProof(
    appointmentId: string,
    fileBuffer: Buffer,
    mimetype: string
): Promise<Appointment> {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { user: true, doctor: true, medicalPackage: true }
    });

    if (!appointment) {
        throw new ApiError("Lịch hẹn không tồn tại", 404);
    }

    if (appointment.status !== "PENDING_PAYMENT") {
        throw new ApiError("Lịch hẹn này không ở trạng thái cần thanh toán", 400);
    }

    // Upload to Supabase bucket 'payment-proofs' or fallback to local
    const extension = mimetype.split("/")[1] || "jpg";
    const fileName = `appointment-${appointmentId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

    let publicUrl = "";
    const isSupabaseConfigured =
        process.env.SUPABASE_ANON_KEY &&
        !process.env.SUPABASE_ANON_KEY.includes("YOUR_") &&
        process.env.SUPABASE_URL &&
        !process.env.SUPABASE_URL.includes("YOUR_");

    if (isSupabaseConfigured) {
        try {
            const { data, error } = await supabase.storage
                .from("payment-proofs")
                .upload(fileName, fileBuffer, {
                    contentType: mimetype,
                    upsert: false,
                });

            if (error) {
                console.error("Supabase Payment Proof upload error, falling back to local storage:", error);
                publicUrl = await saveFileLocally(appointmentId, fileName, fileBuffer);
            } else {
                const { data: publicUrlData } = supabase.storage
                    .from("payment-proofs")
                    .getPublicUrl(fileName);
                publicUrl = publicUrlData.publicUrl;
            }
        } catch (uploadErr) {
            console.error("Supabase upload exception, falling back to local storage:", uploadErr);
            publicUrl = await saveFileLocally(appointmentId, fileName, fileBuffer);
        }
    } else {
        console.log("ℹ️ Supabase not configured with real credentials. Storing payment proof locally.");
        publicUrl = await saveFileLocally(appointmentId, fileName, fileBuffer);
    }

    const updated = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
            paymentProof: publicUrl,
            paymentAt: new Date(),
            status: "PENDING",
        },
        include: {
            user: true,
            doctor: {
                include: {
                    specialty: true,
                    clinic: true,
                },
            },
            medicalPackage: true,
        },
    });

    // Send confirmation email asynchronously
    if (updated.user?.email) {
        const patientInfo = updated.patientInfo as PatientInfo | null;
        const patientName = patientInfo?.fullName || updated.user?.fullName || "Bệnh nhân";

        sendBookingConfirmationEmail(updated.user.email, {
            patientName: patientName,
            doctorName: updated.doctor?.name || "Hệ thống",
            specialtyName: updated.doctor?.specialty?.name || "",
            clinicName: updated.doctor?.clinic?.name || updated.doctor?.hospital || updated.medicalPackage?.hospital || "Bệnh viện",
            appointmentDate: updated.appointmentDate,
            notes: updated.notes,
            status: "PENDING",
            amount: updated.amount,
            transactionCode: updated.transactionCode || undefined,
            paymentAt: updated.paymentAt,
            appointmentId: updated.id,
            bookingCode: updated.bookingCode || "N/A",
            paymentMethod: "Chuyển khoản ngân hàng",
            packageName: updated.medicalPackage?.name
        }).catch((err) => console.error("Error sending confirmation email:", err));
    }

    return updated;
}

export async function autoCancelExpiredAppointments(): Promise<void> {
    const timeLimit = new Date(Date.now() - 15 * 60 * 1000); // 15 mins ago

    // Find all expired appointments
    const expired = await prisma.appointment.findMany({
        where: {
            status: "PENDING_PAYMENT",
            createdAt: {
                lt: timeLimit,
            },
        },
        include: {
            user: true,
        },
    });

    if (expired.length > 0) {
        console.log(`[Scheduler] Found ${expired.length} expired pending-payment appointments. Processing cancellation safely.`);
        for (const appt of expired) {
            try {
                await prisma.$transaction(async (tx) => {
                    const current = await tx.appointment.findUnique({
                        where: { id: appt.id },
                        select: { status: true },
                    });

                    if (current && current.status === "PENDING_PAYMENT") {
                        await tx.appointment.update({
                            where: { id: appt.id },
                            data: {
                                status: "EXPIRED",
                                cancellationReason: "Hủy tự động do quá hạn 15 phút không hoàn tất chuyển khoản.",
                            },
                        });

                        // Send email notification
                        if (appt.user?.email) {
                            const patientInfo = appt.patientInfo as PatientInfo | null;
                            const patientName = patientInfo?.fullName || appt.user?.fullName || "Bệnh nhân";

                            sendCancellationEmail(appt.user.email, {
                                patientName,
                                bookingCode: appt.bookingCode,
                                appointmentDate: appt.appointmentDate,
                                isRefundable: false,
                                amount: 0,
                            }).catch((err) => console.error(`Error sending cancellation email for appointment ${appt.id}:`, err));

                            // Send in-app notification
                            createNotification({
                                userId: appt.userId,
                                type: "APPOINTMENT_CANCELLED_BY_PATIENT",
                                title: "Lịch hẹn đã bị huỷ tự động ❌",
                                message: `Lịch hẹn #${appt.bookingCode} đã bị huỷ tự động do quá 15 phút chưa hoàn tất thanh toán.`,
                                data: { appointmentId: appt.id }
                            }).catch((err) => console.error(`Error sending notification for appointment ${appt.id}:`, err));
                        }
                    }
                });
            } catch (err) {
                console.error(`[Scheduler] Error auto-cancelling appointment ${appt.id}:`, err);
            }
        }
    }
}

export async function getAppointmentsByUser(userId: string): Promise<Appointment[]> {
    return prisma.appointment.findMany({
        where: { userId },
        include: {
            doctor: {
                include: {
                    specialty: true,
                }
            },
            medicalPackage: true,
            payment: true,
            review: true,
            medicalRecord: {
                include: {
                    prescriptions: true,
                },
            },
            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    gender: true,
                    dateOfBirth: true,
                    avatar: true,
                },
            },
        },
        orderBy: {
            appointmentDate: "desc",
        },
    });
}

export async function getAllAppointments(): Promise<Appointment[]> {
    return prisma.appointment.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                },
            },
            doctor: true,
            medicalPackage: true,
        },
        orderBy: {
            appointmentDate: "desc",
        },
    });
}

export async function getAppointmentById(id: string): Promise<Appointment | null> {
    return prisma.appointment.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                    fullName: true,
                    avatar: true,
                    gender: true,
                    dateOfBirth: true,
                    bloodType: true,
                    allergies: true,
                    chronicDiseases: true,
                    personalHistory: true,
                    familyHistory: true,
                },
            },
            doctor: {
                include: {
                    specialty: true,
                }
            },
            medicalPackage: true,
            payment: true,
            review: true,
            medicalRecord: {
                include: {
                    prescriptions: true,
                },
            },
        },
    });
}

export async function getDoctorAppointments(doctorId: string): Promise<Appointment[]> {
    return prisma.appointment.findMany({
        where: { doctorId },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                    fullName: true,
                    gender: true,
                    dateOfBirth: true,
                    avatar: true,
                },
            },
            doctor: true,
            medicalRecord: {
                include: {
                    prescriptions: true,
                },
            },
        },
        orderBy: {
            appointmentDate: "asc",
        },
    });
}

