import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware";
import { verifyAdmin } from "../middleware/authorization.middleware";
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

// Admin routes — require ADMIN role
router.get("/admin", verifyToken, verifyAdmin, adminListVouchers);
router.get("/admin/chart-data", verifyToken, verifyAdmin, adminGetVoucherChartData);
router.post("/admin", verifyToken, verifyAdmin, adminCreateVoucher);
router.put("/admin/:id", verifyToken, verifyAdmin, adminUpdateVoucher);
router.delete("/admin/:id", verifyToken, verifyAdmin, adminDeleteVoucher);
router.get("/admin/:id/usages", verifyToken, verifyAdmin, adminGetVoucherUsages);

export default router;
