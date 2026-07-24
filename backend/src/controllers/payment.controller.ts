import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
    createVNPayUrl,
    verifyVNPaySignature,
    processPaymentSuccess,
    processPaymentFailed,
    processMockPayment,
    createPayOSPaymentLink,
    getPaymentStatusByOrderCode,
    processPayOSWebhook
} from "../services/payment.service";
import { ApiError } from "../utils/apiError";
import prisma from "../prisma/client";
import { PaymentStatus } from "@prisma/client";

/**
 * POST /api/payment/create-url
 * Generates VNPay payment URL for a given appointment.
 * Protected (USER/DOCTOR roles)
 */
export async function createPaymentUrlHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;
        const { appointmentId } = req.body;

        if (!userId) {
            throw new ApiError("Yêu cầu đăng nhập", 401);
        }

        if (!appointmentId) {
            throw new ApiError("Mã lịch hẹn (appointmentId) là bắt buộc", 400);
        }

        // Verify appointment ownership
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
        });

        if (!appointment) {
            throw new ApiError("Lịch hẹn không tồn tại", 404);
        }

        if (appointment.userId !== userId && req.user?.role !== "ADMIN") {
            throw new ApiError("Bạn không có quyền thanh toán cho lịch hẹn này", 403);
        }

        // Get client IP address
        let ipAddr =
            (req.headers["x-forwarded-for"] as string) ||
            req.socket.remoteAddress ||
            "127.0.0.1";
        if (ipAddr.includes(",")) {
            ipAddr = ipAddr.split(",")[0].trim();
        }

        const paymentUrl = await createVNPayUrl({ appointmentId, ipAddr });

        res.status(200).json({
            message: "Tạo link thanh toán thành công",
            paymentUrl,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/payment/vnpay-return
 * Redirect URL from VNPay after user completes the transaction.
 * Public endpoint.
 */
export async function vnpayReturnHandler(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const vnpParams = req.query;
        const isValid = verifyVNPaySignature(vnpParams);
        const frontendRedirectUrl =
            process.env.FRONTEND_PAYMENT_REDIRECT_URL || "http://localhost:3000/payment/success";

        if (!isValid) {
            console.error("VNPay signature verification failed");
            res.redirect(`${frontendRedirectUrl}?status=error&message=Ch%E1%BB%AF+k%C3%BD+kh%C3%B4ng+h%E1%BB%A3p+l%E1%BB%87`);
            return;
        }

        const responseCode = vnpParams["vnp_ResponseCode"] as string;
        const transactionNo = vnpParams["vnp_TransactionNo"] as string;
        const txnRef = vnpParams["vnp_TxnRef"] as string;
        
        // Extract appointmentId from txnRef (formatted as {appointmentId}__{timestamp})
        const appointmentId = txnRef.split("__")[0];

        if (responseCode === "00") {
            // Success
            await processPaymentSuccess(appointmentId, transactionNo);
            res.redirect(`${frontendRedirectUrl}?status=success&appointmentId=${appointmentId}&txnRef=${transactionNo}`);
        } else {
            // Failed/Cancelled
            await processPaymentFailed(appointmentId, transactionNo);
            res.redirect(`${frontendRedirectUrl}?status=failed&appointmentId=${appointmentId}&responseCode=${responseCode}`);
        }
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/payment/vnpay-ipn
 * Instant Payment Notification endpoint. Called asynchronously by VNPay servers.
 * Public endpoint.
 */
export async function vnpayIpnHandler(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const vnpParams = req.query;
        const isValid = verifyVNPaySignature(vnpParams);

        if (!isValid) {
            res.status(200).json({ RspCode: "97", Message: "Invalid checksum" });
            return;
        }

        const responseCode = vnpParams["vnp_ResponseCode"] as string;
        const transactionNo = vnpParams["vnp_TransactionNo"] as string;
        const txnRef = vnpParams["vnp_TxnRef"] as string;
        const amount = parseInt(vnpParams["vnp_Amount"] as string, 10) / 100;
        
        const appointmentId = txnRef.split("__")[0];

        // 1. Check if appointment exists
        const appointment = await prisma.appointment.findUnique({
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
        if (appointment.payment && appointment.payment.status !== PaymentStatus.PENDING) {
            res.status(200).json({ RspCode: "02", Message: "Order already confirmed" });
            return;
        }

        // 4. Update order status
        if (responseCode === "00") {
            await processPaymentSuccess(appointmentId, transactionNo);
        } else {
            await processPaymentFailed(appointmentId, transactionNo);
        }

        res.status(200).json({ RspCode: "00", Message: "Confirm success" });
    } catch (error) {
        console.error("Error in VNPay IPN handler:", error);
        res.status(200).json({ RspCode: "99", Message: "Unknown error" });
    }
}

/**
 * POST /api/payment/mock-pay
 * Simulates a direct payment bypass for development testing.
 * Protected (USER/DOCTOR roles)
 */
export async function mockPayHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (process.env.NODE_ENV === "production") {
            throw new ApiError("Tính năng thanh toán giả lập không được hỗ trợ trên môi trường production", 403);
        }

        const userId = req.user?.userId;
        const { appointmentId } = req.body;

        if (!userId) {
            throw new ApiError("Yêu cầu đăng nhập", 401);
        }

        if (!appointmentId) {
            throw new ApiError("Mã lịch hẹn (appointmentId) là bắt buộc", 400);
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
        });

        if (!appointment) {
            throw new ApiError("Lịch hẹn không tồn tại", 404);
        }

        if (appointment.userId !== userId && req.user?.role !== "ADMIN") {
            throw new ApiError("Bạn không có quyền thanh toán cho lịch hẹn này", 403);
        }

        if (appointment.status !== "PENDING_PAYMENT") {
            throw new ApiError("Lịch hẹn không ở trạng thái chờ thanh toán", 400);
        }

        const result = await processMockPayment(appointmentId);

        res.status(200).json({
            message: "Thanh toán giả lập thành công",
            ...result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/payment/payos
 * Creates a PayOS payment link
 */
export async function createPayOSPaymentUrlHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;
        const { appointmentId, voucherCode, discountAmount } = req.body;
        
        if (!userId) {
            throw new ApiError("Yêu cầu đăng nhập", 401);
        }

        if (!appointmentId) {
            throw new ApiError("Mã lịch hẹn (appointmentId) là bắt buộc", 400);
        }

        // Verify appointment ownership
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
        });

        if (!appointment) {
            throw new ApiError("Lịch hẹn không tồn tại", 404);
        }

        if (appointment.userId !== userId && req.user?.role !== "ADMIN") {
            throw new ApiError("Bạn không có quyền thanh toán cho lịch hẹn này", 403);
        }

        const result = await createPayOSPaymentLink(
            appointmentId,
            voucherCode,
            discountAmount ? Number(discountAmount) : undefined
        );

        res.status(200).json({
            message: "Tạo link thanh toán PayOS thành công",
            ...result
        });
    } catch (error) {
        console.error("PayOS Create Error:", error);
        next(error);
    }
}

/**
 * GET /api/payment/status/:orderCode
 * Polling payment status
 */
export async function getPaymentStatusHandler(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const orderCode = Number(req.params.orderCode);
        if (!orderCode) {
            res.status(200).json({ status: "PENDING", appointmentId: null });
            return;
        }

        const result = await getPaymentStatusByOrderCode(orderCode);
        res.status(200).json(result);
    } catch (error) {
        // Polling endpoint: always return 200 with PENDING to avoid frontend console errors
        console.error("Payment status polling error:", error);
        res.status(200).json({ status: "PENDING", appointmentId: null });
    }
}

/**
 * POST /api/payment/payos-webhook
 * PayOS Webhook Handler
 */
export async function payosWebhookHandler(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const result = await processPayOSWebhook(req.body);
        // PayOS requires webhook endpoints to always return 200 OK
        res.status(200).json(result);
    } catch (error) {
        console.error("PayOS Webhook Error:", error);
        // Still return 200 so PayOS stops retrying if it's our internal logic error
        res.status(200).json({ error: "Internal processing error" });
    }
}