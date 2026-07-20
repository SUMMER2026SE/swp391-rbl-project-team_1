"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAppointment = createAppointment;
exports.uploadPaymentProof = uploadPaymentProof;
exports.autoCancelExpiredAppointments = autoCancelExpiredAppointments;
exports.getAppointmentsByUser = getAppointmentsByUser;
exports.getAllAppointments = getAllAppointments;
exports.getAppointmentById = getAppointmentById;
exports.getDoctorAppointments = getDoctorAppointments;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const client_1 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
const emailService_1 = require("../utils/emailService");
const generateBookingCode_1 = require("../utils/generateBookingCode");
const supabase_1 = require("../config/supabase");
async function saveFileLocally(appointmentId, fileName, fileBuffer) {
    const uploadDir = path_1.default.join(__dirname, "../../public/payment-proofs", `appointment-${appointmentId}`);
    // Ensure directory exists
    if (!fs_1.default.existsSync(uploadDir)) {
        fs_1.default.mkdirSync(uploadDir, { recursive: true });
    }
    const baseName = path_1.default.basename(fileName);
    const filePath = path_1.default.join(uploadDir, baseName);
    fs_1.default.writeFileSync(filePath, fileBuffer);
    // Return relative URL served by Express static middleware
    const port = process.env.PORT || 5000;
    return `http://localhost:${port}/public/payment-proofs/appointment-${appointmentId}/${baseName}`;
}
function generateTransactionCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "MB-";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
async function createAppointment(params) {
    const { userId, patientInfo, doctorId, packageId, appointmentDate, notes } = params;
    if (doctorId) {
        const doctor = await client_1.default.doctor.findUnique({ where: { id: doctorId } });
        if (!doctor)
            throw new apiError_1.ApiError("Doctor not found", 404);
        const doctorUser = await client_1.default.user.findUnique({ where: { doctorId } });
        if (doctorUser?.id === userId) {
            throw new apiError_1.ApiError("Bạn không thể tự đặt lịch khám với chính mình.", 400);
        }
        const count = await client_1.default.appointment.count({
            where: {
                doctorId,
                appointmentDate,
                status: { in: ["PENDING_PAYMENT", "PENDING", "CONFIRMED"] },
            },
        });
        if (count >= 20) {
            throw new apiError_1.ApiError("Khung giờ này đã hết chỗ (20/20). Vui lòng chọn thời gian khác.", 409);
        }
    }
    else if (!packageId) {
        throw new apiError_1.ApiError("Doctor ID or Package ID is required", 400);
    }
    // Transaction to update user profile and create appointment
    return client_1.default.$transaction(async (tx) => {
        // 1. Update user profile
        await tx.user.update({
            where: { id: userId },
            data: {
                fullName: patientInfo.fullName,
                gender: patientInfo.gender,
                dateOfBirth: patientInfo.dateOfBirth,
                province: patientInfo.province,
                district: patientInfo.district,
                ward: patientInfo.ward,
                street: patientInfo.street,
                address: `${patientInfo.street}, ${patientInfo.ward}, ${patientInfo.district}, ${patientInfo.province}`,
                bloodType: patientInfo.bloodType,
                allergies: patientInfo.allergies,
                chronicDiseases: patientInfo.chronicDiseases,
                personalHistory: patientInfo.personalHistory,
                familyHistory: patientInfo.familyHistory,
            },
        });
        // 2. Create appointment
        let transactionCode = generateTransactionCode();
        let codeConflict = await tx.appointment.findFirst({ where: { transactionCode } });
        while (codeConflict) {
            transactionCode = generateTransactionCode();
            codeConflict = await tx.appointment.findFirst({ where: { transactionCode } });
        }
        let bookingCode = (0, generateBookingCode_1.generateBookingCode)();
        let bookingCodeConflict = await tx.appointment.findFirst({ where: { bookingCode } });
        while (bookingCodeConflict) {
            bookingCode = (0, generateBookingCode_1.generateBookingCode)();
            bookingCodeConflict = await tx.appointment.findFirst({ where: { bookingCode } });
        }
        let amount = 5000;
        if (doctorId) {
            const doc = await tx.doctor.findUnique({ where: { id: doctorId } });
            if (doc?.price)
                amount = doc.price;
        }
        else if (packageId) {
            const pkg = await tx.medicalPackage.findUnique({ where: { id: packageId } });
            if (pkg)
                amount = pkg.depositAmount || (pkg.price * (pkg.depositPercentage || 100)) / 100;
        }
        const createdAppointment = await tx.appointment.create({
            data: {
                userId,
                patientProfileType: "SELF",
                patientInfo: patientInfo, // Store snapshot
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
    });
}
async function uploadPaymentProof(appointmentId, fileBuffer, mimetype) {
    const appointment = await client_1.default.appointment.findUnique({
        where: { id: appointmentId },
        include: { user: true, doctor: true, medicalPackage: true }
    });
    if (!appointment) {
        throw new apiError_1.ApiError("Lịch hẹn không tồn tại", 404);
    }
    if (appointment.status !== "PENDING_PAYMENT") {
        throw new apiError_1.ApiError("Lịch hẹn này không ở trạng thái cần thanh toán", 400);
    }
    // Upload to Supabase bucket 'payment-proofs' or fallback to local
    const extension = mimetype.split("/")[1] || "jpg";
    const fileName = `appointment-${appointmentId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
    let publicUrl = "";
    const isSupabaseConfigured = process.env.SUPABASE_ANON_KEY &&
        !process.env.SUPABASE_ANON_KEY.includes("YOUR_") &&
        process.env.SUPABASE_URL &&
        !process.env.SUPABASE_URL.includes("YOUR_");
    if (isSupabaseConfigured) {
        try {
            const { data, error } = await supabase_1.supabase.storage
                .from("payment-proofs")
                .upload(fileName, fileBuffer, {
                contentType: mimetype,
                upsert: false,
            });
            if (error) {
                console.error("Supabase Payment Proof upload error, falling back to local storage:", error);
                publicUrl = await saveFileLocally(appointmentId, fileName, fileBuffer);
            }
            else {
                const { data: publicUrlData } = supabase_1.supabase.storage
                    .from("payment-proofs")
                    .getPublicUrl(fileName);
                publicUrl = publicUrlData.publicUrl;
            }
        }
        catch (uploadErr) {
            console.error("Supabase upload exception, falling back to local storage:", uploadErr);
            publicUrl = await saveFileLocally(appointmentId, fileName, fileBuffer);
        }
    }
    else {
        console.log("ℹ️ Supabase not configured with real credentials. Storing payment proof locally.");
        publicUrl = await saveFileLocally(appointmentId, fileName, fileBuffer);
    }
    const updated = await client_1.default.appointment.update({
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
        const patientInfo = updated.patientInfo;
        const patientName = patientInfo?.fullName || updated.user?.fullName || "Bệnh nhân";
        (0, emailService_1.sendBookingConfirmationEmail)(updated.user.email, {
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
async function autoCancelExpiredAppointments() {
    const timeLimit = new Date(Date.now() - 5 * 60 * 1000); // 5 mins ago
    // Find all expired appointments
    const expired = await client_1.default.appointment.findMany({
        where: {
            status: "PENDING_PAYMENT",
            createdAt: {
                lt: timeLimit,
            },
        },
    });
    if (expired.length > 0) {
        console.log(`[Scheduler] Found ${expired.length} expired pending-payment appointments. Marking as EXPIRED.`);
        await client_1.default.appointment.updateMany({
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
async function getAppointmentsByUser(userId) {
    return client_1.default.appointment.findMany({
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
async function getAllAppointments() {
    return client_1.default.appointment.findMany({
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
async function getAppointmentById(id) {
    return client_1.default.appointment.findUnique({
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
async function getDoctorAppointments(doctorId) {
    return client_1.default.appointment.findMany({
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
