import { Appointment } from "@prisma/client";
import fs from "fs";
import path from "path";

import prisma from "../prisma/client";
import { ApiError } from "../utils/apiError";
import { sendBookingConfirmationEmail } from "../utils/emailService";
import { supabase } from "../config/supabase";

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
    const port = process.env.PORT || 5000;
    return `http://localhost:${port}/public/payment-proofs/appointment-${appointmentId}/${baseName}`;
}

export interface CreateAppointmentParams {
    userId: string;
    patientProfileId: string;
    doctorId?: string;
    appointmentDate: Date;
    notes?: string;
    packageId?: string;
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
    if (params.doctorId) {
        const doctor = await prisma.doctor.findUnique({ where: { id: params.doctorId } });

        if (!doctor) {
            throw new ApiError("Doctor not found", 404);
        }

        // prevent self-booking
        const doctorUser = await prisma.user.findUnique({
            where: { doctorId: params.doctorId }
        });
        if (doctorUser && doctorUser.id === params.userId) {
            throw new ApiError("Bạn không thể tự đặt lịch khám với chính mình.", 400);
        }

        const count = await prisma.appointment.count({
            where: {
                doctorId: params.doctorId,
                appointmentDate: params.appointmentDate,
                status: {
                    in: ["PENDING_PAYMENT", "PENDING", "CONFIRMED"]
                }
            },
        });

        if (count >= 20) {
            throw new ApiError("Khung giờ này đã hết chỗ (20/20). Vui lòng chọn thời gian khác.", 409);
        }
    } else if (params.packageId) {
        const count = await prisma.appointment.count({
            where: {
                packageId: params.packageId,
                appointmentDate: params.appointmentDate,
                status: {
                    in: ["PENDING_PAYMENT", "PENDING", "CONFIRMED"]
                }
            },
        });

        if (count >= 20) {
            throw new ApiError("Khung giờ này đã hết chỗ (20/20). Vui lòng chọn thời gian khác.", 409);
        }
    } else {
        throw new ApiError("Doctor ID or Package ID is required", 400);
    }

    // Generate unique transaction code
    let transactionCode = generateTransactionCode();
    let codeConflict = await prisma.appointment.findFirst({ where: { transactionCode } });
    let attempts = 0;
    while (codeConflict && attempts < 10) {
        transactionCode = generateTransactionCode();
        codeConflict = await prisma.appointment.findFirst({ where: { transactionCode } });
        attempts++;
    }

    let amount = 50000;
    if (params.packageId) {
        const pkg = await prisma.medicalPackage.findUnique({ where: { id: params.packageId } });
        if (pkg) {
            amount = pkg.depositAmount || (pkg.price * (pkg.depositPercentage || 100)) / 100;
        }
    }

    const created = await prisma.appointment.create({
        data: {
            userId: params.userId,
            patientProfileId: params.patientProfileId,
            doctorId: params.doctorId,
            appointmentDate: params.appointmentDate,
            status: "PENDING_PAYMENT",
            notes: params.notes,
            amount,
            transactionCode,
            packageId: params.packageId,
        },
    });

    return created;
}

export async function uploadPaymentProof(
    appointmentId: string,
    fileBuffer: Buffer,
    mimetype: string
): Promise<Appointment> {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
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
        sendBookingConfirmationEmail(updated.user.email, {
            patientName: updated.user.fullName || updated.user.email,
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
            paymentMethod: "Chuyển khoản ngân hàng",
            packageName: updated.medicalPackage?.name
        }).catch((err) => console.error("Error sending confirmation email:", err));
    }

    return updated;
}

export async function autoCancelExpiredAppointments(): Promise<void> {
    const timeLimit = new Date(Date.now() - 5 * 60 * 1000); // 5 mins ago
    
    // Find all expired appointments
    const expired = await prisma.appointment.findMany({
        where: {
            status: "PENDING_PAYMENT",
            createdAt: {
                lt: timeLimit,
            },
        },
    });

    if (expired.length > 0) {
        console.log(`[Scheduler] Found ${expired.length} expired pending-payment appointments. Marking as EXPIRED.`);
        await prisma.appointment.updateMany({
            where: {
                status: "PENDING_PAYMENT",
                createdAt: {
                    lt: timeLimit,
                },
            },
            data: {
                status: "EXPIRED",
                cancellationReason: "Hủy tự động do quá hạn 5 phút không hoàn tất chuyển khoản.",
            },
        });
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
            patientProfile: true,
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
            patientProfile: true,
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
            patientProfile: true,
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

