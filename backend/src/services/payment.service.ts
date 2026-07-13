import crypto from "crypto";
import { PaymentStatus, PaymentMethod, AppointmentStatus } from "@prisma/client";
import prisma from "../prisma/client";
import { ApiError } from "../utils/apiError";
import { getIO } from "../utils/socket";
const PayOS = require("@payos/node");

const payos = new PayOS(
    process.env.PAYOS_CLIENT_ID || "",
    process.env.PAYOS_API_KEY || "",
    process.env.PAYOS_CHECKSUM_KEY || ""
);

// Helper to format Date to yyyyMMddHHmmss
function getFormattedDate(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return (
        date.getFullYear() +
        pad(date.getMonth() + 1) +
        pad(date.getDate()) +
        pad(date.getHours()) +
        pad(date.getMinutes()) +
        pad(date.getSeconds())
    );
}

// Helper to sort object keys alphabetically
export function sortObject(obj: any): any {
    const sorted: any = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
        sorted[key] = obj[key];
    }
    return sorted;
}

export interface VNPayUrlParams {
    appointmentId: string;
    ipAddr: string;
}

/**
 * Service to generate VNPay Payment URL
 */
export async function createVNPayUrl(params: VNPayUrlParams): Promise<string> {
    const { appointmentId, ipAddr } = params;

    // 1. Fetch Appointment and Doctor's Price
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { doctor: true, user: true },
    });

    if (!appointment) {
        throw new ApiError("Lịch hẹn không tồn tại", 404);
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
    const vnpParams: any = {
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
    const hmac = crypto.createHmac("sha512", secretKey);
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
    await prisma.payment.upsert({
        where: { appointmentId },
        update: {
            amount,
            method: PaymentMethod.VNPAY,
            status: PaymentStatus.PENDING,
            paymentGateway: "VNPAY",
        },
        create: {
            appointmentId,
            amount,
            method: PaymentMethod.VNPAY,
            status: PaymentStatus.PENDING,
            paymentGateway: "VNPAY",
        },
    });

    return vnpUrl;
}

/**
 * Verify signature from VNPay redirect/IPN
 */
export function verifyVNPaySignature(vnpParams: any): boolean {
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

    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    return secureHash === signed;
}

/**
 * Handle successful payment transaction
 */
export async function processPaymentSuccess(appointmentId: string, transactionId: string) {
    // Start database transaction to make sure both models are updated atomically
    await prisma.$transaction([
        prisma.payment.update({
            where: { appointmentId },
            data: {
                status: PaymentStatus.PAID,
                transactionId,
                payDate: new Date(),
            },
        }),
        prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                status: AppointmentStatus.CONFIRMED,
            },
        }),
    ]);
}

/**
 * Handle failed payment transaction
 */
export async function processPaymentFailed(appointmentId: string, transactionId: string) {
    await prisma.payment.update({
        where: { appointmentId },
        data: {
            status: PaymentStatus.FAILED,
            transactionId,
        },
    });
}

/**
 * Direct Mock Payment service (for test/local development)
 */
export async function processMockPayment(appointmentId: string) {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { doctor: true },
    });

    if (!appointment) {
        throw new ApiError("Lịch hẹn không tồn tại", 404);
    }

    const amount = appointment.doctor?.price || 150000;
    const mockTxnNo = `MOCK_TXN_${Date.now()}`;

    await prisma.$transaction([
        prisma.payment.upsert({
            where: { appointmentId },
            update: {
                amount,
                status: PaymentStatus.PAID,
                method: PaymentMethod.MOCK,
                transactionId: mockTxnNo,
                paymentGateway: "MOCK",
                payDate: new Date(),
            },
            create: {
                appointmentId,
                amount,
                status: PaymentStatus.PAID,
                method: PaymentMethod.MOCK,
                transactionId: mockTxnNo,
                paymentGateway: "MOCK",
                payDate: new Date(),
            },
        }),
        prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                status: AppointmentStatus.CONFIRMED,
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
export async function createPayOSPaymentLink(appointmentId: string) {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
    });

    if (!appointment) {
        throw new ApiError("Lịch hẹn không tồn tại", 404);
    }

    if (appointment.status !== "PENDING_PAYMENT") {
        throw new ApiError("Lịch hẹn không ở trạng thái chờ thanh toán", 400);
    }

    // Generate a numeric order code < 9007199254740991
    const orderCode = Number(String(Date.now()).slice(-6) + String(Math.floor(Math.random() * 1000)));
    const amount = appointment.amount || 50000;
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
    await prisma.payment.upsert({
        where: { appointmentId },
        create: {
            appointmentId,
            amount,
            status: PaymentStatus.PENDING,
            method: PaymentMethod.PAYOS,
            paymentGateway: "PAYOS",
            orderCode: BigInt(orderCode),
            expiredAt: expiredAtDate,
        },
        update: {
            amount,
            status: PaymentStatus.PENDING,
            method: PaymentMethod.PAYOS,
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
export async function getPaymentStatusByOrderCode(orderCode: number) {
    const payment = await prisma.payment.findFirst({
        where: { orderCode: BigInt(orderCode) },
        include: { appointment: true }
    });

    if (!payment) {
        throw new ApiError("Không tìm thấy giao dịch", 404);
    }

    return {
        status: payment.status,
        appointmentId: payment.appointmentId,
    };
}

/**
 * PayOS: Process Webhook
 */
export async function processPayOSWebhook(body: any) {
    const webhookData = payos.verifyPaymentWebhookData(body);
    
    const { orderCode, amount, code } = webhookData;

    if (code !== "00") {
        console.log(`[PayOS Webhook] Giao dịch ${orderCode} thất bại (code=${code}). Bỏ qua.`);
        return { message: "Ignored: Payment failed" };
    }

    // Use prisma.$transaction to prevent race condition (idempotent)
    const payment = await prisma.payment.findFirst({
        where: { orderCode: BigInt(orderCode) },
        include: { appointment: true }
    });

    if (!payment) {
        return { message: "Ignored: Payment not found" };
    }

    if (payment.status !== PaymentStatus.PENDING) {
        return { message: "Ignored: Payment already processed" };
    }

    // Atomic update
    const [updatedPayment, updatedAppointment] = await prisma.$transaction([
        prisma.payment.update({
            where: { id: payment.id, status: PaymentStatus.PENDING },
            data: {
                status: PaymentStatus.PAID,
                payDate: new Date(),
                transactionId: String(webhookData.reference || `PAYOS-${Date.now()}`),
            }
        }),
        prisma.appointment.update({
            where: { id: payment.appointmentId },
            data: {
                status: AppointmentStatus.CONFIRMED,
                paymentAt: new Date(),
            },
            include: { user: true, doctor: true }
        })
    ]);

    // Socket.io Notifications
    try {
        const io = getIO();
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
    } catch (error) {
        console.error("Socket notification error:", error);
    }

    return { message: "Webhook processed successfully" };
}

/**
 * Cron Job: Cancel Expired PayOS Payments
 */
export async function cancelExpiredPayOSPayments() {
    const now = new Date();
    
    const expiredPayments = await prisma.payment.findMany({
        where: {
            method: PaymentMethod.PAYOS,
            status: PaymentStatus.PENDING,
            expiredAt: { lt: now }
        },
        include: { appointment: true }
    });

    if (expiredPayments.length === 0) return 0;

    for (const p of expiredPayments) {
        await prisma.$transaction([
            prisma.payment.update({
                where: { id: p.id },
                data: { status: PaymentStatus.EXPIRED }
            }),
            prisma.appointment.update({
                where: { id: p.appointmentId },
                data: { status: AppointmentStatus.CANCELLED, cancellationReason: "Quá hạn thanh toán PayOS" }
            })
        ]);

        // Socket.io Notify User
        try {
            const io = getIO();
            io.to(`user_${p.appointment.userId}`).emit("payment_expired", {
                appointmentId: p.appointmentId,
                message: "Link thanh toán đã hết hạn."
            });
            io.to("admin").emit("payment_updated", {
                appointmentId: p.appointmentId,
                status: "EXPIRED"
            });
        } catch (error) {
            console.error("Socket emit expired error:", error);
        }
    }

    console.log(`[Cron] Hủy ${expiredPayments.length} giao dịch PayOS quá hạn.`);
    return expiredPayments.length;
}
