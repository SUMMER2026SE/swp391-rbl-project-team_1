import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import * as voucherService from "../services/voucher.service";

export const validateVoucher = async (req: Request, res: Response) => {
    try {
        const { code, depositAmount, specialtyId, packageId } = req.body;
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        if (!code || !depositAmount) {
            return res.status(400).json({ message: "Thiếu thông tin mã giảm giá hoặc số tiền cọc." });
        }
        const result = await voucherService.validateVoucher({ code, userId, depositAmount: Number(depositAmount), specialtyId, packageId });
        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

export const applyVoucher = async (req: Request, res: Response) => {
    try {
        const { voucherId, appointmentId, originalDeposit, discountAmount, finalDeposit } = req.body;
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        const usage = await voucherService.applyVoucher({ voucherId, userId, appointmentId, originalDeposit, discountAmount, finalDeposit });
        return res.json({ success: true, usage });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

export const getMyVouchers = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        const { available, used } = await voucherService.getUserVouchers(userId);
        return res.json({ available, used });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

// ---- Admin controllers ----
export const adminListVouchers = async (req: Request, res: Response) => {
    try {
        const vouchers = await voucherService.listVouchers();
        const stats = await voucherService.getVoucherStats();
        return res.json({ vouchers, stats });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

export const adminCreateVoucher = async (req: Request, res: Response) => {
    try {
        const { code, type, discountValue, applyTo, specialtyId, minDepositAmount, maxUses, isFirstBooking, startDate, endDate } = req.body;
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
        });
        return res.status(201).json({ voucher, capped, message: capped ? "Ngày kết thúc đã được tự động điều chỉnh theo giới hạn cho phép." : "Tạo voucher thành công." });
    } catch (error: any) {
        if (error.code === "P2002") return res.status(409).json({ message: "Mã voucher này đã tồn tại." });
        return res.status(500).json({ message: error.message });
    }
};

export const adminUpdateVoucher = async (req: Request, res: Response) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const updateData = req.body;
        if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
        if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
        if (updateData.discountValue) updateData.discountValue = Number(updateData.discountValue);
        if (updateData.minDepositAmount !== undefined) updateData.minDepositAmount = Number(updateData.minDepositAmount);
        if (updateData.maxUses !== undefined) updateData.maxUses = updateData.maxUses ? Number(updateData.maxUses) : null;
        const { voucher, capped } = await voucherService.updateVoucher(id, updateData);
        return res.json({ voucher, capped });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

export const adminDeleteVoucher = async (req: Request, res: Response) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await voucherService.deleteVoucher(id);
        return res.json({ message: "Đã xóa voucher." });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

export const adminGetVoucherUsages = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const usages = await voucherService.getVoucherUsages(id);
        return res.json({ usages });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

export const saveVoucher = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { code } = req.body;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        if (!code) return res.status(400).json({ message: "Thiếu mã voucher." });

        const voucher = await voucherService.saveVoucher(userId, code);
        return res.json({ voucher, message: "Lưu voucher thành công." });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getSavedVouchers = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        
        const saved = await voucherService.getSavedVouchers(userId);
        return res.json({ saved });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

export const getPublicVouchers = async (req: Request, res: Response) => {
    try {
        const vouchers = await voucherService.getPublicVouchers();
        return res.json({ vouchers });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};
