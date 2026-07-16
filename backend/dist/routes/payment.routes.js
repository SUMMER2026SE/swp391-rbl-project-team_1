"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const payment_controller_1 = require("../controllers/payment.controller");
const router = (0, express_1.Router)();
// VNPay routes
router.post("/create-url", auth_middleware_1.verifyToken, payment_controller_1.createPaymentUrlHandler);
router.get("/vnpay-return", payment_controller_1.vnpayReturnHandler);
router.get("/vnpay-ipn", payment_controller_1.vnpayIpnHandler);
// Mock payment (dev only)
router.post("/mock-pay", auth_middleware_1.verifyToken, payment_controller_1.mockPayHandler);
// PayOS routes
router.post("/payos", auth_middleware_1.verifyToken, payment_controller_1.createPayOSPaymentUrlHandler);
router.get("/status/:orderCode", payment_controller_1.getPaymentStatusHandler);
router.post("/payos-webhook", payment_controller_1.payosWebhookHandler);
exports.default = router;
