"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const voucher_controller_1 = require("../controllers/voucher.controller");
const router = (0, express_1.Router)();
// Patient-facing routes (require auth)
router.post("/validate", auth_middleware_1.verifyToken, voucher_controller_1.validateVoucher);
router.post("/apply", auth_middleware_1.verifyToken, voucher_controller_1.applyVoucher);
router.get("/my-vouchers", auth_middleware_1.verifyToken, voucher_controller_1.getMyVouchers);
router.post("/save", auth_middleware_1.verifyToken, voucher_controller_1.saveVoucher);
router.get("/saved", auth_middleware_1.verifyToken, voucher_controller_1.getSavedVouchers);
// Public route
router.get("/public", voucher_controller_1.getPublicVouchers);
// Admin routes
router.get("/admin", auth_middleware_1.verifyToken, voucher_controller_1.adminListVouchers);
router.post("/admin", auth_middleware_1.verifyToken, voucher_controller_1.adminCreateVoucher);
router.put("/admin/:id", auth_middleware_1.verifyToken, voucher_controller_1.adminUpdateVoucher);
router.delete("/admin/:id", auth_middleware_1.verifyToken, voucher_controller_1.adminDeleteVoucher);
router.get("/admin/:id/usages", auth_middleware_1.verifyToken, voucher_controller_1.adminGetVoucherUsages);
exports.default = router;
