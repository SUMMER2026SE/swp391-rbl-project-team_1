import api from "./api";

export interface Voucher {
    id: string;
    code: string;
    type: "PERCENT" | "FIXED";
    discountValue: number;
    applyTo: "ALL" | "PACKAGE" | "SPECIALTY";
    specialtyId?: string | null;
    specialty?: { id: string; name: string } | null;
    minDepositAmount: number;
    maxUses?: number | null;
    usedCount: number;
    isFirstBooking: boolean;
    isActive: boolean;
    startDate: string;
    endDate: string;
    createdAt: string;
    daysLeft?: number;
    isExpiringSoon?: boolean;
}

export interface VoucherUsage {
    voucher: Voucher;
    usedAt: string;
    discountAmount: number;
    finalDeposit: number;
    appointmentInfo: {
        doctorName?: string | null;
        packageName?: string | null;
    };
}

export interface ValidateVoucherResult {
    valid: boolean;
    message: string;
    discountAmount?: number;
    finalDeposit?: number;
    voucher?: Voucher;
}

export const voucherService = {
    validateVoucher: async (code: string, depositAmount: number, specialtyId?: string, packageId?: string): Promise<ValidateVoucherResult> => {
        const response = await api.post("/vouchers/validate", { code, depositAmount, specialtyId, packageId });
        return response.data;
    },

    getPublicVouchers: async (): Promise<{ id: string; applyTo: string }[]> => {
        const response = await api.get("/vouchers/public");
        return response.data.vouchers;
    },

    getMyVouchers: async (): Promise<{ available: Voucher[]; used: VoucherUsage[] }> => {
        const response = await api.get("/vouchers/my-vouchers");
        return response.data;
    },

    // Admin
    adminGetVouchers: async () => {
        const response = await api.get("/vouchers/admin");
        return response.data;
    },

    adminCreateVoucher: async (data: any) => {
        const response = await api.post("/vouchers/admin", data);
        return response.data;
    },

    adminUpdateVoucher: async (id: string, data: any) => {
        const response = await api.put(`/vouchers/admin/${id}`, data);
        return response.data;
    },

    adminDeleteVoucher: async (id: string) => {
        const response = await api.delete(`/vouchers/admin/${id}`);
        return response.data;
    },

    adminGetVoucherUsages: async (id: string) => {
        const response = await api.get(`/vouchers/admin/${id}/usages`);
        return response.data;
    },

    saveVoucher: async (code: string) => {
        const response = await api.post("/vouchers/save", { code });
        return response.data;
    },

    getSavedVouchers: async (): Promise<{ saved: Voucher[] }> => {
        const response = await api.get("/vouchers/saved");
        return response.data;
    }
};
