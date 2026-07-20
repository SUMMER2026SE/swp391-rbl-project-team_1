import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware";
import {
    validateVoucher,
    applyVoucher,
    getMyVouchers,
    adminListVouchers,
    adminGetVoucherChartData,
    adminCreateVoucher,
    adminUpdateVoucher,
    adminDeleteVoucher,
    adminGetVoucherUsages,
    saveVoucher,
    getSavedVouchers,
    getPublicVouchers
} from "../controllers/voucher.controller";

const router = Router();

// Patient-facing routes (require auth)
router.post("/validate", verifyToken, validateVoucher);
router.post("/apply", verifyToken, applyVoucher);
router.get("/my-vouchers", verifyToken, getMyVouchers);
router.post("/save", verifyToken, saveVoucher);
router.get("/saved", verifyToken, getSavedVouchers);

// Public route
router.get("/public", getPublicVouchers);

// Admin routes
router.get("/admin", verifyToken, adminListVouchers);
router.get("/admin/chart-data", verifyToken, adminGetVoucherChartData);
router.post("/admin", verifyToken, adminCreateVoucher);
router.put("/admin/:id", verifyToken, adminUpdateVoucher);
router.delete("/admin/:id", verifyToken, adminDeleteVoucher);
router.get("/admin/:id/usages", verifyToken, adminGetVoucherUsages);

export default router;
