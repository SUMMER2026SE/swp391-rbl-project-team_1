"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortObject = sortObject;
exports.createVNPayUrl = createVNPayUrl;
exports.verifyVNPaySignature = verifyVNPaySignature;
exports.processPaymentSuccess = processPaymentSuccess;
exports.processPaymentFailed = processPaymentFailed;
exports.processMockPayment = processMockPayment;
exports.createPayOSPaymentLink = createPayOSPaymentLink;
exports.getPaymentStatusByOrderCode = getPaymentStatusByOrderCode;
exports.processPayOSWebhook = processPayOSWebhook;
exports.cancelExpiredPayOSPayments = cancelExpiredPayOSPayments;
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
const socket_1 = require("../utils/socket");
const emailService_1 = require("../utils/emailService");
const PayOS = require("@payos/node");
const payos = new PayOS(process.env.PAYOS_CLIENT_ID || "", process.env.PAYOS_API_KEY || "", process.env.PAYOS_CHECKSUM_KEY || "");
// Helper to format Date to yyyyMMddHHmmss
function getFormattedDate(date) {
    const pad = (n) => n.toString().padStart(2, "0");
    return (date.getFullYear() +
        pad(date.getMonth() + 1) +
        pad(date.getDate()) +
        pad(date.getHours()) +
        pad(date.getMinutes()) +
        pad(date.getSeconds()));
}
// Helper to sort object keys alphabetically
function sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
        sorted[key] = obj[key];
    }
    return sorted;
}
/**
 * Service to generate VNPay Payment URL
 */
async function createVNPayUrl(params) {
    const { appointmentId, ipAddr } = params;
    // 1. Fetch Appointment and Doctor's Price
    const appointment = await client_2.default.appointment.findUnique({
        where: { id: appointmentId },
        include: { doctor: true, user: true },
    });
    if (!appointment) {
        throw new apiError_1.ApiError("Lịch hẹn không tồn tại", 404);
    }
    // Default to 150,000 VND if doctor price is not set
    const amount = appointment.doctor?.price || 150000;
    const tmnCode = process.env.VNP_TMNCODE || "2QXUIBJZ";
    const secretKey = process.env.VNP_HASHSECRET || "GETPNO2UY8Z239634TDUO2B86E88U11Y";
    let vnpUrl = process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    const returnUrl = process.env.VNP_RETURNURL || "http://localhost:5000/api/payment/vnpay-return";
    const date = new Date();
    const createDate = getFormattedDate(date);
    // Append timestamp to txnRef to avoid duplicate transaction code errors in sandbox
    const txnRef = `${appointmentId}__${date.getTime()}`;
    // 2. Prepare VNPay Parameters
    const vnpParams = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: tmnCode,
        vnp_Locale: "vn",
        vnp_CurrCode: "VND",
        vnp_TxnRef: txnRef,
        vnp_OrderInfo: `Thanh toan dat lich kham bac si ${appointment.doctor?.name || ""}`,
        vnp_OrderType: "250000", // Medical services
        vnp_Amount: amount * 100, // VNPay requires amount * 100
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr || "127.0.0.1",
        vnp_CreateDate: createDate,
    };
    // Sort params
    const sortedParams = sortObject(vnpParams);
    // 3. Build signData query string
    const signData = Object.keys(sortedParams)
        .map((key) => {
        const val = sortedParams[key];
        if (val !== undefined && val !== null && val !== "") {
            return `${encodeURIComponent(key)}=${encodeURIComponent(val.toString()).replace(/%20/g, "+")}`;
        }
        return "";
    })
        .filter(Boolean)
        .join("&");
    // 4. Generate HMAC SHA512 signature
    const hmac = crypto_1.default.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    // 5. Append secure hash to query parameters
    const queryParams = Object.keys(sortedParams)
        .map((key) => {
        const val = sortedParams[key];
        if (val !== undefined && val !== null && val !== "") {
            return `${encodeURIComponent(key)}=${encodeURIComponent(val.toString()).replace(/%20/g, "+")}`;
        }
        return "";
    })
        .filter(Boolean)
        .join("&");
    vnpUrl += `?${queryParams}&vnp_SecureHash=${signed}`;
    // 6. Upsert Payment record as PENDING
    await client_2.default.payment.upsert({
        where: { appointmentId },
        update: {
            amount,
            method: client_1.PaymentMethod.VNPAY,
            status: client_1.PaymentStatus.PENDING,
            paymentGateway: "VNPAY",
        },
        create: {
            appointmentId,
            amount,
            method: client_1.PaymentMethod.VNPAY,
            status: client_1.PaymentStatus.PENDING,
            paymentGateway: "VNPAY",
        },
    });
    return vnpUrl;
}
/**
 * Verify signature from VNPay redirect/IPN
 */
function verifyVNPaySignature(vnpParams) {
    const secureHash = vnpParams["vnp_SecureHash"];
    // Copy and clean params
    const cleanParams = { ...vnpParams };
    delete cleanParams["vnp_SecureHash"];
    delete cleanParams["vnp_SecureHashType"];
    const sortedParams = sortObject(cleanParams);
    const secretKey = process.env.VNP_HASHSECRET || "GETPNO2UY8Z239634TDUO2B86E88U11Y";
    // Build signData query string
    const signData = Object.keys(sortedParams)
        .map((key) => {
        const val = sortedParams[key];
        if (val !== undefined && val !== null && val !== "") {
            return `${encodeURIComponent(key)}=${encodeURIComponent(val.toString()).replace(/%20/g, "+")}`;
        }
        return "";
    })
        .filter(Boolean)
        .join("&");
    const hmac = crypto_1.default.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    return secureHash === signed;
}
/**
 * Handle successful payment transaction
 */
async function processPaymentSuccess(appointmentId, transactionId) {
    // Start database transaction to make sure both models are updated atomically
    await client_2.default.$transaction([
        client_2.default.payment.update({
            where: { appointmentId },
            data: {
                status: client_1.PaymentStatus.PAID,
                transactionId,
                payDate: new Date(),
            },
        }),
        client_2.default.appointment.update({
            where: { id: appointmentId },
            data: {
                status: client_1.AppointmentStatus.CONFIRMED,
            },
        }),
    ]);
}
/**
 * Handle failed payment transaction
 */
async function processPaymentFailed(appointmentId, transactionId) {
    await client_2.default.payment.update({
        where: { appointmentId },
        data: {
            status: client_1.PaymentStatus.FAILED,
            transactionId,
        },
    });
}
/**
 * Direct Mock Payment service (for test/local development)
 */
async function processMockPayment(appointmentId) {
    const appointment = await client_2.default.appointment.findUnique({
        where: { id: appointmentId },
        include: { doctor: true },
    });
    if (!appointment) {
        throw new apiError_1.ApiError("Lịch hẹn không tồn tại", 404);
    }
    const amount = appointment.doctor?.price || 150000;
    const mockTxnNo = `MOCK_TXN_${Date.now()}`;
    await client_2.default.$transaction([
        client_2.default.payment.upsert({
            where: { appointmentId },
            update: {
                amount,
                status: client_1.PaymentStatus.PAID,
                method: client_1.PaymentMethod.MOCK,
                transactionId: mockTxnNo,
                paymentGateway: "MOCK",
                payDate: new Date(),
            },
            create: {
                appointmentId,
                amount,
                status: client_1.PaymentStatus.PAID,
                method: client_1.PaymentMethod.MOCK,
                transactionId: mockTxnNo,
                paymentGateway: "MOCK",
                payDate: new Date(),
            },
        }),
        client_2.default.appointment.update({
            where: { id: appointmentId },
            data: {
                status: client_1.AppointmentStatus.CONFIRMED,
            },
        }),
    ]);
    return {
        success: true,
        appointmentId,
        transactionId: mockTxnNo,
    };
}
/**
 * PayOS: Create Payment Link
 */
async function createPayOSPaymentLink(appointmentId) {
    const appointment = await client_2.default.appointment.findUnique({
        where: { id: appointmentId },
        include: { doctor: true },
    });
    if (!appointment) {
        throw new apiError_1.ApiError("Lịch hẹn không tồn tại", 404);
    }
    if (appointment.status !== "PENDING_PAYMENT") {
        throw new apiError_1.ApiError("Lịch hẹn không ở trạng thái chờ thanh toán", 400);
    }
    // Generate a numeric order code < 9007199254740991
    const orderCode = Number(String(Date.now()).slice(-6) + String(Math.floor(Math.random() * 1000)));
    // Sử dụng giá tiền của bác sỹ, fallback sang appointment.amount
    const amount = appointment.doctor?.price || appointment.amount || 5000;
    const description = `MEDBOOKING ${appointment.transactionCode}`.substring(0, 25);
    // Set expired time = now + 5 minutes
    const expiredAt = Math.floor(Date.now() / 1000) + 5 * 60;
    const expiredAtDate = new Date(Date.now() + 5 * 60 * 1000);
    const returnUrl = process.env.FRONTEND_PAYMENT_REDIRECT_URL || "http://localhost:3000/my-appointments";
    const cancelUrl = process.env.FRONTEND_PAYMENT_REDIRECT_URL || "http://localhost:3000/my-appointments";
    const requestData = {
        orderCode,
        amount,
        description,
        cancelUrl,
        returnUrl,
        expiredAt
    };
    const paymentLink = await payos.createPaymentLink(requestData);
    // Save to DB
    await client_2.default.payment.upsert({
        where: { appointmentId },
        create: {
            appointmentId,
            amount,
            status: client_1.PaymentStatus.PENDING,
            method: client_1.PaymentMethod.PAYOS,
            paymentGateway: "PAYOS",
            orderCode: BigInt(orderCode),
            expiredAt: expiredAtDate,
        },
        update: {
            amount,
            status: client_1.PaymentStatus.PENDING,
            method: client_1.PaymentMethod.PAYOS,
            paymentGateway: "PAYOS",
            orderCode: BigInt(orderCode),
            expiredAt: expiredAtDate,
        }
    });
    return {
        checkoutUrl: paymentLink.checkoutUrl,
        qrCode: paymentLink.qrCode,
        accountNumber: paymentLink.accountNumber,
        accountName: paymentLink.accountName,
        bin: paymentLink.bin,
        amount: paymentLink.amount,
        description: paymentLink.description,
        orderCode: paymentLink.orderCode,
        expiredAt: expiredAtDate.toISOString(),
    };
}
/**
 * PayOS: Get Payment Status for Polling
 */
async function getPaymentStatusByOrderCode(orderCode) {
    const payment = await client_2.default.payment.findFirst({
        where: { orderCode: BigInt(orderCode) },
        include: { appointment: true }
    });
    if (!payment) {
        // Polling endpoint: return PENDING instead of throwing 404
        // Payment record may not exist yet due to timing/race conditions
        return {
            status: "PENDING",
            appointmentId: null,
        };
    }
    // Try to sync with PayOS if local status is still PENDING (useful for localhost without webhook)
    if (payment.status === client_1.PaymentStatus.PENDING) {
        try {
            const payosInfo = await payos.getPaymentLinkInformation(orderCode);
            if (payosInfo.status === "PAID" || payosInfo.status === "Success") {
                await client_2.default.$transaction([
                    client_2.default.payment.update({
                        where: { id: payment.id, status: client_1.PaymentStatus.PENDING },
                        data: {
                            status: client_1.PaymentStatus.PAID,
                            payDate: new Date(),
                            transactionId: "PAYOS-SYNC-" + Date.now(),
                        }
                    }),
                    client_2.default.appointment.update({
                        where: { id: payment.appointmentId },
                        data: {
                            status: client_1.AppointmentStatus.CONFIRMED,
                            paymentAt: new Date(),
                        }
                    })
                ]);
                payment.status = client_1.PaymentStatus.PAID;
                // Send booking confirmation email after polling sync
                const fullAppointment = await client_2.default.appointment.findUnique({
                    where: { id: payment.appointmentId },
                    include: {
                        user: true,
                        doctor: { include: { specialty: true, clinic: true } },
                        medicalPackage: true,
                        patientProfile: true,
                    }
                });
                if (fullAppointment?.user?.email) {
                    (0, emailService_1.sendBookingConfirmationEmail)(fullAppointment.user.email, {
                        patientName: fullAppointment.user.fullName || fullAppointment.user.email,
                        doctorName: fullAppointment.doctor?.name || "Hệ thống",
                        specialtyName: fullAppointment.doctor?.specialty?.name || "",
                        clinicName: fullAppointment.doctor?.clinic?.name || fullAppointment.doctor?.hospital || "Bệnh viện",
                        appointmentDate: fullAppointment.appointmentDate,
                        amount: fullAppointment.amount,
                        paymentMethod: "PAYOS",
                        transactionCode: fullAppointment.transactionCode || undefined,
                        appointmentId: fullAppointment.id,
                        bookingCode: fullAppointment.bookingCode,
                        packageName: fullAppointment.medicalPackage?.name || null,
                        status: "CONFIRMED",
                    }).catch(console.error);
                }
            }
        }
        catch (e) {
            console.error("PayOS status sync error:", e);
        }
    }
    return {
        status: payment.status,
        appointmentId: payment.appointmentId,
    };
}
/**
 * PayOS: Process Webhook
 */
async function processPayOSWebhook(body) {
    const webhookData = payos.verifyPaymentWebhookData(body);
    const { orderCode, amount, code } = webhookData;
    if (code !== "00") {
        console.log(`[PayOS Webhook] Giao dịch ${orderCode} thất bại (code=${code}). Bỏ qua.`);
        return { message: "Ignored: Payment failed" };
    }
    // Use prisma.$transaction to prevent race condition (idempotent)
    const payment = await client_2.default.payment.findFirst({
        where: { orderCode: BigInt(orderCode) },
        include: { appointment: true }
    });
    if (!payment) {
        return { message: "Ignored: Payment not found" };
    }
    if (payment.status !== client_1.PaymentStatus.PENDING) {
        return { message: "Ignored: Payment already processed" };
    }
    // Atomic update
    const [updatedPayment, updatedAppointment] = await client_2.default.$transaction([
        client_2.default.payment.update({
            where: { id: payment.id, status: client_1.PaymentStatus.PENDING },
            data: {
                status: client_1.PaymentStatus.PAID,
                payDate: new Date(),
                transactionId: String(webhookData.reference || `PAYOS-${Date.now()}`),
            }
        }),
        client_2.default.appointment.update({
            where: { id: payment.appointmentId },
            data: {
                status: client_1.AppointmentStatus.CONFIRMED,
                paymentAt: new Date(),
            },
            include: { user: true, doctor: true }
        })
    ]);
    // Socket.io Notifications
    try {
        const io = (0, socket_1.getIO)();
        const userId = updatedAppointment.userId;
        const doctorId = updatedAppointment.doctorId;
        // Notify User
        io.to(`user_${userId}`).emit("payment_confirmed", {
            appointmentId: updatedAppointment.id,
            transactionCode: updatedAppointment.transactionCode
        });
        // Notify Doctor
        if (doctorId) {
            io.to(`doctor_${doctorId}`).emit("new_appointment", {
                appointmentId: updatedAppointment.id,
                message: "Bạn có lịch hẹn mới đã thanh toán."
            });
        }
        // Notify Admin
        io.to("admin").emit("payment_updated", {
            appointmentId: updatedAppointment.id,
            status: "PAID"
        });
    }
    catch (error) {
        console.error("Socket notification error:", error);
    }
    // Send booking confirmation email — wrapped in .catch so it never crashes the webhook
    if (updatedAppointment.user?.email) {
        // Reload appointment with full relations for email
        client_2.default.appointment.findUnique({
            where: { id: updatedAppointment.id },
            include: {
                doctor: { include: { specialty: true, clinic: true } },
                medicalPackage: true,
                patientProfile: true,
            }
        }).then((fullAppt) => {
            if (!fullAppt)
                return;
            (0, emailService_1.sendBookingConfirmationEmail)(updatedAppointment.user.email, {
                patientName: updatedAppointment.user.fullName || updatedAppointment.user.email || "Bệnh nhân",
                doctorName: fullAppt.doctor?.name || "Hệ thống",
                specialtyName: fullAppt.doctor?.specialty?.name || "",
                clinicName: fullAppt.doctor?.clinic?.name || fullAppt.doctor?.hospital || "Bệnh viện",
                appointmentDate: updatedAppointment.appointmentDate,
                amount: updatedPayment.amount,
                paymentMethod: "PayOS",
                transactionCode: updatedPayment.transactionId || undefined,
                paymentAt: updatedPayment.payDate || undefined,
                appointmentId: updatedAppointment.id,
                bookingCode: updatedAppointment.bookingCode,
                packageName: fullAppt.medicalPackage?.name || null,
                status: "CONFIRMED",
            });
        }).catch(console.error);
    }
    return { message: "Webhook processed successfully" };
}
/**
 * Cron Job: Cancel Expired PayOS Payments
 */
async function cancelExpiredPayOSPayments() {
    const now = new Date();
    const expiredPayments = await client_2.default.payment.findMany({
        where: {
            method: client_1.PaymentMethod.PAYOS,
            status: client_1.PaymentStatus.PENDING,
            expiredAt: { lt: now }
        },
        include: { appointment: true }
    });
    if (expiredPayments.length === 0)
        return 0;
    for (const p of expiredPayments) {
        await client_2.default.$transaction([
            client_2.default.payment.update({
                where: { id: p.id },
                data: { status: client_1.PaymentStatus.EXPIRED }
            }),
            client_2.default.appointment.update({
                where: { id: p.appointmentId },
                data: { status: client_1.AppointmentStatus.CANCELLED, cancellationReason: "Quá hạn thanh toán PayOS" }
            })
        ]);
        // Socket.io Notify User
        try {
            const io = (0, socket_1.getIO)();
            io.to(`user_${p.appointment.userId}`).emit("payment_expired", {
                appointmentId: p.appointmentId,
                message: "Link thanh toán đã hết hạn."
            });
            io.to("admin").emit("payment_updated", {
                appointmentId: p.appointmentId,
                status: "EXPIRED"
            });
        }
        catch (error) {
            console.error("Socket emit expired error:", error);
        }
    }
    console.log(`[Cron] Hủy ${expiredPayments.length} giao dịch PayOS quá hạn.`);
    return expiredPayments.length;
}
