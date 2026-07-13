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
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
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
