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

interface AppointmentsByMonth {
    month: string;
    count: number;
}

interface CancellationStats {
    reason: string;
    count: number;
}

interface AdminStatistics {
    totalUsers: number;
    totalDoctors: number;
    totalAppointments: number;
    appointmentsByStatus: AppointmentsByStatus;
    appointmentsBySpecialty: AppointmentsBySpecialty[];
    appointmentsByMonth: AppointmentsByMonth[];
    cancellationStats: CancellationStats[];
}

/**
 * Returns comprehensive admin dashboard statistics.
 */
export async function getStatistics(): Promise<AdminStatistics> {
    // Run all count queries in parallel
    const [
        totalUsers,
        totalDoctors,
        totalAppointments,
        statusCounts,
        specialtyCounts,
        cancellationStats,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.doctor.count(),
        prisma.appointment.count(),
        getAppointmentsByStatus(),
        getAppointmentsBySpecialty(),
        getCancellationStats(),
    ]);

    const appointmentsByMonth = await getAppointmentsByMonth();

    return {
        totalUsers,
        totalDoctors,
        totalAppointments,
        appointmentsByStatus: statusCounts,
        appointmentsBySpecialty: specialtyCounts,
        appointmentsByMonth,
        cancellationStats,
    };
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
        const specialtyName = appt.doctor.specialty.name;
        countMap.set(specialtyName, (countMap.get(specialtyName) ?? 0) + 1);
    }

    return Array.from(countMap.entries())
        .map(([specialty, count]) => ({ specialty, count }))
        .sort((a, b) => b.count - a.count);
}

async function getAppointmentsByMonth(): Promise<AppointmentsByMonth[]> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const appointments = await prisma.appointment.findMany({
        where: {
            appointmentDate: { gte: sixMonthsAgo },
        },
        select: {
            appointmentDate: true,
        },
        orderBy: { appointmentDate: "asc" },
    });

    const monthMap = new Map<string, number>();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthMap.set(key, 0);
    }

    for (const appt of appointments) {
        const date = new Date(appt.appointmentDate);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (monthMap.has(key)) {
            monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
        }
    }

    return Array.from(monthMap.entries()).map(([month, count]) => ({
        month,
        count,
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
        appt.doctor.name,
        appt.doctor.specialty.name,
    ]);

    const escapeCsv = (str: string) => `"${String(str).replace(/"/g, '""')}"`;

    const csvContent = [
        headers.map(escapeCsv).join(","),
        ...rows.map(row => row.map(escapeCsv).join(","))
    ].join("\n");

    return csvContent;
}
