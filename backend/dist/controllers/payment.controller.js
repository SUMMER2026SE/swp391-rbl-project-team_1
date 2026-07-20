"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentUrlHandler = createPaymentUrlHandler;
exports.vnpayReturnHandler = vnpayReturnHandler;
exports.vnpayIpnHandler = vnpayIpnHandler;
exports.mockPayHandler = mockPayHandler;
exports.createPayOSPaymentUrlHandler = createPayOSPaymentUrlHandler;
exports.getPaymentStatusHandler = getPaymentStatusHandler;
exports.payosWebhookHandler = payosWebhookHandler;
const payment_service_1 = require("../services/payment.service");
const apiError_1 = require("../utils/apiError");
const client_1 = __importDefault(require("../prisma/client"));
const client_2 = require("@prisma/client");
/**
 * POST /api/payment/create-url
 * Generates VNPay payment URL for a given appointment.
 * Protected (USER/DOCTOR roles)
 */
async function createPaymentUrlHandler(req, res, next) {
    try {
        const userId = req.user?.userId;
        const { appointmentId } = req.body;
        if (!userId) {
            throw new apiError_1.ApiError("Yêu cầu đăng nhập", 401);
        }
        if (!appointmentId) {
            throw new apiError_1.ApiError("Mã lịch hẹn (appointmentId) là bắt buộc", 400);
        }
        // Verify appointment ownership
        const appointment = await client_1.default.appointment.findUnique({
            where: { id: appointmentId },
        });
        if (!appointment) {
            throw new apiError_1.ApiError("Lịch hẹn không tồn tại", 404);
        }
        if (appointment.userId !== userId && req.user?.role !== "ADMIN") {
            throw new apiError_1.ApiError("Bạn không có quyền thanh toán cho lịch hẹn này", 403);
        }
        // Get client IP address
        let ipAddr = req.headers["x-forwarded-for"] ||
            req.socket.remoteAddress ||
            "127.0.0.1";
        if (ipAddr.includes(",")) {
            ipAddr = ipAddr.split(",")[0].trim();
        }
        const paymentUrl = await (0, payment_service_1.createVNPayUrl)({ appointmentId, ipAddr });
        res.status(200).json({
            message: "Tạo link thanh toán thành công",
            paymentUrl,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/payment/vnpay-return
 * Redirect URL from VNPay after user completes the transaction.
 * Public endpoint.
 */
async function vnpayReturnHandler(req, res, next) {
    try {
        const vnpParams = req.query;
        const isValid = (0, payment_service_1.verifyVNPaySignature)(vnpParams);
        const frontendRedirectUrl = process.env.FRONTEND_PAYMENT_REDIRECT_URL || "http://localhost:3000/payment/success";
        if (!isValid) {
            console.error("VNPay signature verification failed");
            res.redirect(`${frontendRedirectUrl}?status=error&message=Ch%E1%BB%AF+k%C3%BD+kh%C3%B4ng+h%E1%BB%A3p+l%E1%BB%87`);
            return;
        }
        const responseCode = vnpParams["vnp_ResponseCode"];
        const transactionNo = vnpParams["vnp_TransactionNo"];
        const txnRef = vnpParams["vnp_TxnRef"];
        // Extract appointmentId from txnRef (formatted as {appointmentId}__{timestamp})
        const appointmentId = txnRef.split("__")[0];
        if (responseCode === "00") {
            // Success
            await (0, payment_service_1.processPaymentSuccess)(appointmentId, transactionNo);
            res.redirect(`${frontendRedirectUrl}?status=success&appointmentId=${appointmentId}&txnRef=${transactionNo}`);
        }
        else {
            // Failed/Cancelled
            await (0, payment_service_1.processPaymentFailed)(appointmentId, transactionNo);
            res.redirect(`${frontendRedirectUrl}?status=failed&appointmentId=${appointmentId}&responseCode=${responseCode}`);
        }
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/payment/vnpay-ipn
 * Instant Payment Notification endpoint. Called asynchronously by VNPay servers.
 * Public endpoint.
 */
async function vnpayIpnHandler(req, res, next) {
    try {
        const vnpParams = req.query;
        const isValid = (0, payment_service_1.verifyVNPaySignature)(vnpParams);
        if (!isValid) {
            res.status(200).json({ RspCode: "97", Message: "Invalid checksum" });
            return;
        }
        const responseCode = vnpParams["vnp_ResponseCode"];
        const transactionNo = vnpParams["vnp_TransactionNo"];
        const txnRef = vnpParams["vnp_TxnRef"];
        const amount = parseInt(vnpParams["vnp_Amount"], 10) / 100;
        const appointmentId = txnRef.split("__")[0];
        // 1. Check if appointment exists
        const appointment = await client_1.default.appointment.findUnique({
            where: { id: appointmentId },
            include: { payment: true },
        });
        if (!appointment) {
            res.status(200).json({ RspCode: "01", Message: "Order not found" });
            return;
        }
        // 2. Check amount validity (optional but recommended)
        const expectedAmount = appointment.payment?.amount || 150000;
        if (amount !== expectedAmount) {
            res.status(200).json({ RspCode: "04", Message: "Invalid amount" });
            return;
        }
        // 3. Check if transaction was already processed
        if (appointment.payment && appointment.payment.status !== client_2.PaymentStatus.PENDING) {
            res.status(200).json({ RspCode: "02", Message: "Order already confirmed" });
            return;
        }
        // 4. Update order status
        if (responseCode === "00") {
            await (0, payment_service_1.processPaymentSuccess)(appointmentId, transactionNo);
        }
        else {
            await (0, payment_service_1.processPaymentFailed)(appointmentId, transactionNo);
        }
        res.status(200).json({ RspCode: "00", Message: "Confirm success" });
    }
    catch (error) {
        console.error("Error in VNPay IPN handler:", error);
        res.status(200).json({ RspCode: "99", Message: "Unknown error" });
    }
}
/**
 * POST /api/payment/mock-pay
 * Simulates a direct payment bypass for development testing.
 * Protected (USER/DOCTOR roles)
 */
async function mockPayHandler(req, res, next) {
    try {
        const userId = req.user?.userId;
        const { appointmentId } = req.body;
        if (!userId) {
            throw new apiError_1.ApiError("Yêu cầu đăng nhập", 401);
        }
        if (!appointmentId) {
            throw new apiError_1.ApiError("Mã lịch hẹn (appointmentId) là bắt buộc", 400);
        }
        const appointment = await client_1.default.appointment.findUnique({
            where: { id: appointmentId },
        });
        if (!appointment) {
            throw new apiError_1.ApiError("Lịch hẹn không tồn tại", 404);
        }
        if (appointment.userId !== userId && req.user?.role !== "ADMIN") {
            throw new apiError_1.ApiError("Bạn không có quyền thanh toán cho lịch hẹn này", 403);
        }
        const result = await (0, payment_service_1.processMockPayment)(appointmentId);
        res.status(200).json({
            message: "Thanh toán giả lập thành công",
            ...result,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/payment/payos
 * Creates a PayOS payment link
 */
async function createPayOSPaymentUrlHandler(req, res, next) {
    try {
        const userId = req.user?.userId;
        const { appointmentId, voucherCode, discountAmount } = req.body;
        if (!userId) {
            throw new apiError_1.ApiError("Yêu cầu đăng nhập", 401);
        }
        if (!appointmentId) {
            throw new apiError_1.ApiError("Mã lịch hẹn (appointmentId) là bắt buộc", 400);
        }
        const result = await (0, payment_service_1.createPayOSPaymentLink)(appointmentId, voucherCode, discountAmount ? Number(discountAmount) : undefined);
        res.status(200).json({
            message: "Tạo link thanh toán PayOS thành công",
            ...result
        });
    }
    catch (error) {
        console.error("PayOS Create Error:", error);
        next(error);
    }
}
/**
 * GET /api/payment/status/:orderCode
 * Polling payment status
 */
async function getPaymentStatusHandler(req, res, next) {
    try {
        const orderCode = Number(req.params.orderCode);
        if (!orderCode) {
            res.status(200).json({ status: "PENDING", appointmentId: null });
            return;
        }
        const result = await (0, payment_service_1.getPaymentStatusByOrderCode)(orderCode);
        res.status(200).json(result);
    }
    catch (error) {
        // Polling endpoint: always return 200 with PENDING to avoid frontend console errors
        console.error("Payment status polling error:", error);
        res.status(200).json({ status: "PENDING", appointmentId: null });
    }
}
/**
 * POST /api/payment/payos-webhook
 * PayOS Webhook Handler
 */
async function payosWebhookHandler(req, res, next) {
    try {
        const result = await (0, payment_service_1.processPayOSWebhook)(req.body);
        // PayOS requires webhook endpoints to always return 200 OK
        res.status(200).json(result);
    }
    catch (error) {
        console.error("PayOS Webhook Error:", error);
        // Still return 200 so PayOS stops retrying if it's our internal logic error
        res.status(200).json({ error: "Internal processing error" });
    }
}
