import prisma from "../prisma/client";
import { AppointmentStatus } from "@prisma/client";

interface AppointmentsByStatus {
    PENDING_PAYMENT: number;
    PENDING: number;
    CONFIRMED: number;
    COMPLETED: number;
    CANCELLED: number;
    EXPIRED: number;
}

interface AppointmentsBySpecialty {
    specialty: string;
    count: number;
}

interface TimeSeriesData {
    period: string;
    count?: number;
    revenue?: number;
}

interface CancellationStats {
    reason: string;
    count: number;
}

interface AdminStatistics {
    totalUsers: number;
    totalDoctors: number;
    totalAppointments: number;
    totalRevenue: number;
    appointmentsByStatus: AppointmentsByStatus;
    appointmentsBySpecialty: AppointmentsBySpecialty[];
    appointmentsOverTime: TimeSeriesData[];
    revenueOverTime: TimeSeriesData[];
    cancellationStats: CancellationStats[];
}

/**
 * Returns comprehensive admin dashboard statistics.
 */
export async function getStatistics(period: 'week' | 'month' | 'year' = 'month'): Promise<AdminStatistics> {
    const [
        totalUsers,
        totalDoctors,
        totalAppointments,
        statusCounts,
        specialtyCounts,
        cancellationStats,
        revenueData,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.doctor.count(),
        prisma.appointment.count(),
        getAppointmentsByStatus(),
        getAppointmentsBySpecialty(),
        getCancellationStats(),
        getRevenueTotal(),
    ]);

    const appointmentsOverTime = await getAppointmentsOverTime(period);
    const revenueOverTime = await getRevenueOverTime(period);

    return {
        totalUsers,
        totalDoctors,
        totalAppointments,
        totalRevenue: revenueData,
        appointmentsByStatus: statusCounts,
        appointmentsBySpecialty: specialtyCounts,
        appointmentsOverTime,
        revenueOverTime,
        cancellationStats,
    };
}

async function getRevenueTotal(): Promise<number> {
    const completedAppts = await prisma.appointment.findMany({
        where: { status: 'COMPLETED' },
        select: { amount: true, discountAmount: true }
    });
    return completedAppts.reduce((sum, appt) => sum + (appt.amount - (appt.discountAmount || 0)), 0);
}

async function getAppointmentsByStatus(): Promise<AppointmentsByStatus> {
    const counts = await prisma.appointment.groupBy({
        by: ["status"],
        _count: { status: true },
    });

    const result: AppointmentsByStatus = {
        PENDING_PAYMENT: 0,
        PENDING: 0,
        CONFIRMED: 0,
        COMPLETED: 0,
        CANCELLED: 0,
        EXPIRED: 0,
    };

    for (const item of counts) {
        result[item.status as keyof AppointmentsByStatus] = item._count.status;
    }

    return result;
}

async function getAppointmentsBySpecialty(): Promise<AppointmentsBySpecialty[]> {
    const appointments = await prisma.appointment.findMany({
        select: {
            doctor: {
                select: {
                    specialty: {
                        select: { name: true },
                    },
                },
            },
        },
    });

    const countMap = new Map<string, number>();

    for (const appt of appointments) {
        if (!appt.doctor) continue;
        const specialtyName = appt.doctor.specialty.name;
        countMap.set(specialtyName, (countMap.get(specialtyName) ?? 0) + 1);
    }

    return Array.from(countMap.entries())
        .map(([specialty, count]) => ({ specialty, count }))
        .sort((a, b) => b.count - a.count);
}

async function getAppointmentsOverTime(period: 'week' | 'month' | 'year'): Promise<TimeSeriesData[]> {
    const now = new Date();
    let startDate: Date;
    if (period === 'week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    } else {
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
    }

    const appointments = await prisma.appointment.findMany({
        where: { appointmentDate: { gte: startDate } },
        select: { appointmentDate: true },
        orderBy: { appointmentDate: "asc" },
    });

    const timeMap = new Map<string, number>();

    // Initialize map
    if (period === 'week') {
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            timeMap.set(`${d.getDate()}/${d.getMonth() + 1}`, 0);
        }
    } else if (period === 'month') {
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            timeMap.set(`${d.getDate()}/${d.getMonth() + 1}`, 0);
        }
    } else {
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            timeMap.set(`T${d.getMonth() + 1}/${d.getFullYear()}`, 0);
        }
    }

    for (const appt of appointments) {
        const d = new Date(appt.appointmentDate);
        let key = '';
        if (period === 'year') {
            key = `T${d.getMonth() + 1}/${d.getFullYear()}`;
        } else {
            key = `${d.getDate()}/${d.getMonth() + 1}`;
        }
        if (timeMap.has(key)) {
            timeMap.set(key, (timeMap.get(key) ?? 0) + 1);
        }
    }

    return Array.from(timeMap.entries()).map(([timeKey, count]) => ({
        period: timeKey,
        count,
    }));
}

async function getRevenueOverTime(period: 'week' | 'month' | 'year'): Promise<TimeSeriesData[]> {
    const now = new Date();
    let startDate: Date;
    if (period === 'week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    } else {
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
    }

    const completedAppts = await prisma.appointment.findMany({
        where: { status: 'COMPLETED', appointmentDate: { gte: startDate } },
        select: { appointmentDate: true, amount: true, discountAmount: true },
        orderBy: { appointmentDate: "asc" },
    });

    const timeMap = new Map<string, number>();

    // Initialize map
    if (period === 'week') {
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            timeMap.set(`${d.getDate()}/${d.getMonth() + 1}`, 0);
        }
    } else if (period === 'month') {
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            timeMap.set(`${d.getDate()}/${d.getMonth() + 1}`, 0);
        }
    } else {
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            timeMap.set(`T${d.getMonth() + 1}/${d.getFullYear()}`, 0);
        }
    }

    for (const appt of completedAppts) {
        const d = new Date(appt.appointmentDate);
        let key = '';
        if (period === 'year') {
            key = `T${d.getMonth() + 1}/${d.getFullYear()}`;
        } else {
            key = `${d.getDate()}/${d.getMonth() + 1}`;
        }
        if (timeMap.has(key)) {
            const revenue = appt.amount - (appt.discountAmount || 0);
            timeMap.set(key, (timeMap.get(key) ?? 0) + revenue);
        }
    }

    return Array.from(timeMap.entries()).map(([timeKey, revenue]) => ({
        period: timeKey,
        revenue,
    }));
}

async function getCancellationStats(): Promise<CancellationStats[]> {
    const cancelledAppointments = await prisma.appointment.findMany({
        where: {
            status: "CANCELLED",
        },
        select: {
            cancellationReason: true,
        },
    });

    const reasonMap = new Map<string, number>();

    for (const appt of cancelledAppointments) {
        const reason = appt.cancellationReason || "Không có lý do";
        reasonMap.set(reason, (reasonMap.get(reason) ?? 0) + 1);
    }

    return Array.from(reasonMap.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Export appointments statistics to CSV string.
 */
export async function exportStatisticsCsv(): Promise<string> {
    const appointments = await prisma.appointment.findMany({
        include: {
            doctor: {
                include: {
                    specialty: true,
                }
            },
            user: true,
        },
        orderBy: { appointmentDate: 'desc' }
    });

    const headers = [
        "Mã Lịch Hẹn",
        "Ngày Khám",
        "Trạng Thái",
        "Lý Do Hủy",
        "Bệnh Nhân",
        "Email Bệnh Nhân",
        "Bác Sĩ",
        "Chuyên Khoa",
    ];

    const rows = appointments.map(appt => [
        appt.id,
        appt.appointmentDate.toISOString(),
        appt.status,
        appt.cancellationReason || "",
        appt.user.fullName || "",
        appt.user.email || "",
        appt.doctor?.name || "N/A",
        appt.doctor?.specialty.name || "N/A",
    ]);

    const escapeCsv = (str: string) => `"${String(str).replace(/"/g, '""')}"`;

    const csvContent = [
        headers.map(escapeCsv).join(","),
        ...rows.map(row => row.map(escapeCsv).join(","))
    ].join("\n");

    return csvContent;
}
