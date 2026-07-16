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
    if (params.doctorId) {
        const doctor = await client_1.default.doctor.findUnique({ where: { id: params.doctorId } });
        if (!doctor) {
            throw new apiError_1.ApiError("Doctor not found", 404);
        }
        // prevent self-booking
        const doctorUser = await client_1.default.user.findUnique({
            where: { doctorId: params.doctorId }
        });
        if (doctorUser && doctorUser.id === params.userId) {
            throw new apiError_1.ApiError("Bạn không thể tự đặt lịch khám với chính mình.", 400);
        }
        const count = await client_1.default.appointment.count({
            where: {
                doctorId: params.doctorId,
                appointmentDate: params.appointmentDate,
                status: {
                    in: ["PENDING_PAYMENT", "PENDING", "CONFIRMED"]
                }
            },
        });
        if (count >= 20) {
            throw new apiError_1.ApiError("Khung giờ này đã hết chỗ (20/20). Vui lòng chọn thời gian khác.", 409);
        }
    }
    else if (params.packageId) {
        const count = await client_1.default.appointment.count({
            where: {
                packageId: params.packageId,
                appointmentDate: params.appointmentDate,
                status: {
                    in: ["PENDING_PAYMENT", "PENDING", "CONFIRMED"]
                }
            },
        });
        if (count >= 20) {
            throw new apiError_1.ApiError("Khung giờ này đã hết chỗ (20/20). Vui lòng chọn thời gian khác.", 409);
        }
    }
    else {
        throw new apiError_1.ApiError("Doctor ID or Package ID is required", 400);
    }
    // Generate unique transaction code
    let transactionCode = generateTransactionCode();
    let codeConflict = await client_1.default.appointment.findFirst({ where: { transactionCode } });
    let attempts = 0;
    while (codeConflict && attempts < 10) {
        transactionCode = generateTransactionCode();
        codeConflict = await client_1.default.appointment.findFirst({ where: { transactionCode } });
        attempts++;
    }
    // Lấy giá tiền từ bác sỹ hoặc gói khám
    let amount = 5000;
    if (params.doctorId) {
        const doc = await client_1.default.doctor.findUnique({ where: { id: params.doctorId } });
        if (doc?.price) {
            amount = doc.price;
        }
    }
    else if (params.packageId) {
        const pkg = await client_1.default.medicalPackage.findUnique({ where: { id: params.packageId } });
        if (pkg) {
            amount = pkg.depositAmount || (pkg.price * (pkg.depositPercentage || 100)) / 100;
        }
    }
    // Generate unique booking code
    let bookingCode = (0, generateBookingCode_1.generateBookingCode)();
    let bookingCodeConflict = await client_1.default.appointment.findFirst({ where: { bookingCode } });
    let bcAttempts = 0;
    while (bookingCodeConflict && bcAttempts < 10) {
        bookingCode = (0, generateBookingCode_1.generateBookingCode)();
        bookingCodeConflict = await client_1.default.appointment.findFirst({ where: { bookingCode } });
        bcAttempts++;
    }
    const created = await client_1.default.appointment.create({
        data: {
            userId: params.userId,
            patientProfileId: params.patientProfileId,
            doctorId: params.doctorId,
            appointmentDate: params.appointmentDate,
            status: "PENDING_PAYMENT",
            notes: params.notes,
            amount,
            transactionCode,
            bookingCode,
            packageId: params.packageId,
        },
    });
    return created;
}
async function uploadPaymentProof(appointmentId, fileBuffer, mimetype) {
    const appointment = await client_1.default.appointment.findUnique({
        where: { id: appointmentId },
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
        (0, emailService_1.sendBookingConfirmationEmail)(updated.user.email, {
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
            bookingCode: updated.bookingCode,
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
            patientProfile: true,
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
