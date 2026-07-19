import prisma from "../prisma/client";
import { addMonths, isBefore, differenceInDays } from "date-fns";

const MAX_MONTHS_NORMAL = 2;
const MAX_MONTHS_FIRST_BOOKING = 3;
const MAX_PERCENT = 10;

interface ValidateVoucherInput {
    code: string;
    userId: string;
    depositAmount: number;
    specialtyId?: string;
    packageId?: string;
}

export const validateVoucher = async (input: ValidateVoucherInput) => {
    const { code, userId, depositAmount, specialtyId, packageId } = input;

    const voucher = await prisma.voucher.findUnique({
        where: { code: code.toUpperCase() },
    });

    if (!voucher) return { valid: false, message: "Mã giảm giá không tồn tại." };
    if (!voucher.isActive) return { valid: false, message: "Mã giảm giá đã bị vô hiệu hóa." };

    const now = new Date();
    if (isBefore(now, voucher.startDate)) return { valid: false, message: "Mã giảm giá chưa có hiệu lực." };
    if (isBefore(voucher.endDate, now)) return { valid: false, message: "Mã giảm giá đã hết hạn." };
    if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) {
        return { valid: false, message: "Mã giảm giá đã hết lượt sử dụng." };
    }

    // Check if user already used this voucher
    const existingUsage = await prisma.voucherUsage.findFirst({
        where: { voucherId: voucher.id, userId },
    });
    if (existingUsage) return { valid: false, message: "Bạn đã sử dụng mã giảm giá này rồi." };

    // Check first booking condition
    if (voucher.isFirstBooking) {
        const existingConfirmedAppointment = await prisma.appointment.findFirst({
            where: {
                userId,
                status: { in: ["CONFIRMED", "COMPLETED"] },
            },
        });
        if (existingConfirmedAppointment) {
            return { valid: false, message: "Mã giảm giá này chỉ dành cho lần đặt lịch đầu tiên." };
        }
    }

    // Check specialty restriction
    if (voucher.applyTo === "SPECIALTY") {
        if (!specialtyId || voucher.specialtyId !== specialtyId) {
            return { valid: false, message: "Mã giảm giá không áp dụng cho chuyên khoa này." };
        }
    }

    // Check applyTo: PACKAGE vouchers only valid with packageId
    if (voucher.applyTo === "PACKAGE" && !packageId) {
        return { valid: false, message: "Mã giảm giá này chỉ áp dụng khi đặt gói khám." };
    }

    // Check minimum deposit
    if (depositAmount < voucher.minDepositAmount) {
        return {
            valid: false,
            message: `Số tiền cọc tối thiểu để sử dụng mã này là ${voucher.minDepositAmount.toLocaleString("vi-VN")}đ.`,
        };
    }

    // Calculate discount
    let discountAmount = 0;
    if (voucher.type === "PERCENT") {
        discountAmount = Math.floor((depositAmount * voucher.discountValue) / 100);
    } else {
        discountAmount = voucher.discountValue;
    }

    let finalDeposit = depositAmount;
    if (packageId) {
        // Đặt gói khám: Voucher trừ vào tiền cọc, tối thiểu 0đ
        discountAmount = Math.min(discountAmount, depositAmount);
        finalDeposit = depositAmount - discountAmount;
    } else {
        // Khám chuyên khoa (Bác sĩ): Phí thanh toán trực tuyến là 5000đ (demo)
        // Voucher trừ trực tiếp vào 5000đ, tối thiểu 1000đ
        discountAmount = Math.min(discountAmount, depositAmount - 1000);
        if (discountAmount < 0) discountAmount = 0;
        finalDeposit = depositAmount - discountAmount;
    }

    return { valid: true, discountAmount, finalDeposit, voucher, message: "Áp dụng mã giảm giá thành công!" };
};

export const applyVoucher = async ({
    voucherId,
    userId,
    appointmentId,
    originalDeposit,
    discountAmount,
    finalDeposit,
}: {
    voucherId: string;
    userId: string;
    appointmentId: string;
    originalDeposit: number;
    discountAmount: number;
    finalDeposit: number;
}) => {
    // Create usage record and increment used_count transactionally
    const [usage] = await prisma.$transaction([
        prisma.voucherUsage.create({
            data: { voucherId, userId, appointmentId, originalDeposit, discountAmount, finalDeposit },
        }),
        prisma.voucher.update({
            where: { id: voucherId },
            data: { usedCount: { increment: 1 } },
        }),
    ]);
    return usage;
};

export const getUserVouchers = async (userId: string) => {
    const now = new Date();

    // All potentially usable vouchers
    const allVouchers = await prisma.voucher.findMany({
        where: {
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now },
        },
        include: { specialty: { select: { id: true, name: true } } },
    });

    // Vouchers user already used
    const usedByUser = await prisma.voucherUsage.findMany({
        where: { userId },
        include: {
            voucher: true,
            appointment: {
                include: {
                    doctor: { select: { name: true } },
                    medicalPackage: { select: { name: true } },
                },
            },
        },
    });
    const usedVoucherIds = new Set(usedByUser.map((u) => u.voucherId));

    // Vouchers exhausted by system
    const available: any[] = [];
    for (const v of allVouchers) {
        if (usedVoucherIds.has(v.id)) continue;
        if (v.maxUses !== null && v.usedCount >= v.maxUses) continue;

        const daysLeft = differenceInDays(v.endDate, now);
        available.push({
            ...v,
            daysLeft,
            isExpiringSoon: daysLeft < 7,
        });
    }

    const used = usedByUser.map((u) => ({
        ...u.voucher,
        usedAt: u.usedAt,
        discountAmount: u.discountAmount,
        finalDeposit: u.finalDeposit,
        appointmentInfo: {
            doctorName: u.appointment.doctor?.name || null,
            packageName: u.appointment.medicalPackage?.name || null,
        },
    }));

    return { available, used };
};

// ——— Admin CRUD ———
export const listVouchers = async () => {
    return prisma.voucher.findMany({
        include: { specialty: { select: { id: true, name: true } }, _count: { select: { usages: true } } },
        orderBy: { createdAt: "desc" },
    });
};

export const getVoucherStats = async () => {
    const now = new Date();
    const [active, usages, expiring] = await Promise.all([
        prisma.voucher.count({ where: { isActive: true, endDate: { gte: now } } }),
        prisma.voucherUsage.findMany({ select: { discountAmount: true } }),
        prisma.voucher.count({
            where: { isActive: true, endDate: { gte: now, lte: new Date(now.getTime() + 7 * 86400000) } },
        }),
    ]);
    const totalUsed = usages.length;
    const totalDiscounted = usages.reduce((sum: number, u: any) => sum + (u.discountAmount || 0), 0);
    return { active, totalUsed, totalDiscounted, expiring };
};

export const createVoucher = async (data: {
    code: string;
    type: "PERCENT" | "FIXED";
    discountValue: number;
    applyTo: "ALL" | "PACKAGE" | "SPECIALTY";
    specialtyId?: string;
    minDepositAmount?: number;
    maxUses?: number | null;
    isFirstBooking?: boolean;
    startDate: Date;
    endDate: Date;
}) => {
    // Enforce max percent
    if (data.type === "PERCENT" && data.discountValue > MAX_PERCENT) {
        data.discountValue = MAX_PERCENT;
    }

    // Cap endDate
    const maxMonths = data.isFirstBooking ? MAX_MONTHS_FIRST_BOOKING : MAX_MONTHS_NORMAL;
    const maxEnd = addMonths(data.startDate, maxMonths);
    let capped = false;
    if (isBefore(maxEnd, data.endDate)) {
        data.endDate = maxEnd;
        capped = true;
    }

    const voucher = await prisma.voucher.create({
        data: {
            code: data.code.toUpperCase(),
            type: data.type,
            discountValue: data.discountValue,
            applyTo: data.applyTo,
            specialtyId: data.specialtyId || null,
            minDepositAmount: data.minDepositAmount || 0,
            maxUses: data.maxUses ?? null,
            isFirstBooking: data.isFirstBooking || false,
            startDate: data.startDate,
            endDate: data.endDate,
        },
    });
    return { voucher, capped };
};

export const updateVoucher = async (
    id: string,
    data: Partial<{
        type: "PERCENT" | "FIXED";
        discountValue: number;
        applyTo: "ALL" | "PACKAGE" | "SPECIALTY";
        specialtyId: string | null;
        minDepositAmount: number;
        maxUses: number | null;
        isFirstBooking: boolean;
        startDate: Date;
        endDate: Date;
        isActive: boolean;
    }>
) => {
    if (data.type === "PERCENT" && data.discountValue && data.discountValue > MAX_PERCENT) {
        data.discountValue = MAX_PERCENT;
    }

    let capped = false;
    if (data.startDate && data.endDate) {
        const maxMonths = data.isFirstBooking ? MAX_MONTHS_FIRST_BOOKING : MAX_MONTHS_NORMAL;
        const maxEnd = addMonths(data.startDate, maxMonths);
        if (isBefore(maxEnd, data.endDate)) {
            data.endDate = maxEnd;
            capped = true;
        }
    }

    const voucher = await prisma.voucher.update({ where: { id }, data });
    return { voucher, capped };
};

export const deleteVoucher = async (id: string) => {
    return prisma.voucher.delete({ where: { id } });
};

export const getVoucherUsages = async (id: string) => {
    return prisma.voucherUsage.findMany({
        where: { voucherId: id },
        include: {
            user: { select: { id: true, fullName: true, email: true } },
            appointment: {
                include: {
                    doctor: { select: { name: true } },
                    medicalPackage: { select: { name: true } },
                },
            },
        },
        orderBy: { usedAt: "desc" },
    });
};

export const saveVoucher = async (userId: string, code: string) => {
    const voucher = await prisma.voucher.findUnique({ where: { code: code.toUpperCase() } });
    if (!voucher) throw new Error("Voucher không tồn tại.");
    if (!voucher.isActive) throw new Error("Voucher không còn hoạt động.");
    if (voucher.endDate < new Date()) throw new Error("Voucher đã hết hạn.");
    if (voucher.maxUses && voucher.usedCount >= voucher.maxUses) throw new Error("Voucher đã hết lượt sử dụng.");

    try {
        await prisma.savedVoucher.create({
            data: {
                userId,
                voucherId: voucher.id,
            },
        });
    } catch (e: any) {
        if (e.code === "P2002") throw new Error("Bạn đã lưu voucher này rồi.");
        throw e;
    }
    return voucher;
};

export const getSavedVouchers = async (userId: string) => {
    const saved = await prisma.savedVoucher.findMany({
        where: { userId },
        include: { voucher: true },
        orderBy: { createdAt: "desc" },
    });
    return saved.map(s => s.voucher);
};

export const getPublicVouchers = async () => {
    const now = new Date();
    return await prisma.voucher.findMany({
        where: {
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now },
            OR: [{ applyTo: 'ALL' }, { applyTo: 'PACKAGE' }]
        },
        select: { id: true, applyTo: true }
    });
};
