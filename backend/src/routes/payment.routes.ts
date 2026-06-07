import { Router } from "express";
import {
    createPaymentUrlHandler,
    vnpayReturnHandler,
    vnpayIpnHandler,
    mockPayHandler,
} from "../controllers/payment.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

// Create payment URL (Requires authentication)
router.post("/payment/create-url", verifyToken, createPaymentUrlHandler);

// Create mock payment directly (Requires authentication)
router.post("/payment/mock-pay", verifyToken, mockPayHandler);

// VNPay return endpoint (Public)
router.get("/payment/vnpay-return", vnpayReturnHandler);

// VNPay IPN endpoint (Public)
router.get("/payment/vnpay-ipn", vnpayIpnHandler);

export default router;
