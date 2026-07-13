"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Create payment URL (Requires authentication)
router.post("/payment/create-url", auth_middleware_1.verifyToken, payment_controller_1.createPaymentUrlHandler);
// Create mock payment directly (Requires authentication)
router.post("/payment/mock-pay", auth_middleware_1.verifyToken, payment_controller_1.mockPayHandler);
// VNPay return endpoint (Public)
router.get("/payment/vnpay-return", payment_controller_1.vnpayReturnHandler);
// VNPay IPN endpoint (Public)
router.get("/payment/vnpay-ipn", payment_controller_1.vnpayIpnHandler);
exports.default = router;
