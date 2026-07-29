"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicVouchers = exports.getSavedVouchers = exports.saveVoucher = exports.adminGetVoucherUsages = exports.adminDeleteVoucher = exports.adminUpdateVoucher = exports.adminCreateVoucher = exports.adminGetVoucherChartData = exports.adminListVouchers = exports.getMyVouchers = exports.applyVoucher = exports.validateVoucher = void 0;
const voucherService = __importStar(require("../services/voucher.service"));
const validateVoucher = async (req, res) => {
    try {
        const { code, depositAmount, specialtyId, packageId } = req.body;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        if (!code || !depositAmount) {
            return res.status(400).json({ message: "Thiếu thông tin mã giảm giá hoặc số tiền cọc." });
        }
        const result = await voucherService.validateVoucher({ code, userId, depositAmount: Number(depositAmount), specialtyId, packageId });
        return res.json(result);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.validateVoucher = validateVoucher;
const applyVoucher = async (req, res) => {
    try {
        const { voucherId, appointmentId, originalDeposit, discountAmount, finalDeposit } = req.body;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const usage = await voucherService.applyVoucher({ voucherId, userId, appointmentId, originalDeposit, discountAmount, finalDeposit });
        return res.json({ success: true, usage });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.applyVoucher = applyVoucher;
const getMyVouchers = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const { available, used } = await voucherService.getUserVouchers(userId);
        return res.json({ available, used });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.getMyVouchers = getMyVouchers;
// ---- Admin controllers ----
const adminListVouchers = async (req, res) => {
    try {
        const vouchers = await voucherService.listVouchers();
        const stats = await voucherService.getVoucherStats();
        return res.json({ vouchers, stats });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.adminListVouchers = adminListVouchers;
const adminGetVoucherChartData = async (req, res) => {
    try {
        const period = req.query.period || 'month';
        if (!['week', 'month', 'year'].includes(period)) {
            return res.status(400).json({ message: "Invalid period. Use: week, month, year" });
        }
        const data = await voucherService.getVoucherChartData(period);
        return res.json(data);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.adminGetVoucherChartData = adminGetVoucherChartData;
const adminCreateVoucher = async (req, res) => {
    try {
        const { code, type, discountValue, applyTo, specialtyId, minDepositAmount, maxUses, isFirstBooking, startDate, endDate, category, description, avatarColor, avatarIcon } = req.body;
        const { voucher, capped } = await voucherService.createVoucher({
            code,
            type,
            discountValue: Number(discountValue),
            applyTo,
            specialtyId,
            minDepositAmount: Number(minDepositAmount || 0),
            maxUses: maxUses ? Number(maxUses) : null,
            isFirstBooking: Boolean(isFirstBooking),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            category,
            description,
            avatarColor,
            avatarIcon,
        });
        return res.status(201).json({ voucher, capped, message: capped ? "Ngày kết thúc đã được tự động điều chỉnh theo giới hạn cho phép." : "Tạo voucher thành công." });
    }
    catch (error) {
        if (error.code === "P2002")
            return res.status(409).json({ message: "Mã voucher này đã tồn tại." });
        return res.status(500).json({ message: error.message });
    }
};
exports.adminCreateVoucher = adminCreateVoucher;
const adminUpdateVoucher = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const updateData = req.body;
        if (updateData.startDate)
            updateData.startDate = new Date(updateData.startDate);
        if (updateData.endDate)
            updateData.endDate = new Date(updateData.endDate);
        if (updateData.discountValue)
            updateData.discountValue = Number(updateData.discountValue);
        if (updateData.minDepositAmount !== undefined)
            updateData.minDepositAmount = Number(updateData.minDepositAmount);
        if (updateData.maxUses !== undefined)
            updateData.maxUses = updateData.maxUses ? Number(updateData.maxUses) : null;
        const { voucher, capped } = await voucherService.updateVoucher(id, updateData);
        return res.json({ voucher, capped });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.adminUpdateVoucher = adminUpdateVoucher;
const adminDeleteVoucher = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await voucherService.deleteVoucher(id);
        return res.json({ message: "Đã xóa voucher." });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.adminDeleteVoucher = adminDeleteVoucher;
const adminGetVoucherUsages = async (req, res) => {
    try {
        const id = req.params.id;
        const usages = await voucherService.getVoucherUsages(id);
        return res.json({ usages });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.adminGetVoucherUsages = adminGetVoucherUsages;
const saveVoucher = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { code } = req.body;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        if (!code)
            return res.status(400).json({ message: "Thiếu mã voucher." });
        const voucher = await voucherService.saveVoucher(userId, code);
        return res.json({ voucher, message: "Lưu voucher thành công." });
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
};
exports.saveVoucher = saveVoucher;
const getSavedVouchers = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const saved = await voucherService.getSavedVouchers(userId);
        return res.json({ saved });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.getSavedVouchers = getSavedVouchers;
const getPublicVouchers = async (req, res) => {
    try {
        const vouchers = await voucherService.getPublicVouchers();
        return res.json({ vouchers });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.getPublicVouchers = getPublicVouchers;
