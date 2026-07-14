import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware";
import {
    createPaymentUrlHandler,
    vnpayReturnHandler,
    vnpayIpnHandler,
    mockPayHandler,
    createPayOSPaymentUrlHandler,
    getPaymentStatusHandler,
    payosWebhookHandler
} from "../controllers/payment.controller";

const router = Router();

// VNPay routes
router.post("/create-url", verifyToken, createPaymentUrlHandler);
router.get("/vnpay-return", vnpayReturnHandler);
router.get("/vnpay-ipn", vnpayIpnHandler);

// Mock payment (dev only)
router.post("/mock-pay", verifyToken, mockPayHandler);

// PayOS routes
router.post("/payos", verifyToken, createPayOSPaymentUrlHandler);
router.get("/status/:orderCode", getPaymentStatusHandler);
router.post("/payos-webhook", payosWebhookHandler);

export default router;
