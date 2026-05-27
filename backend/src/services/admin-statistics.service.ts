import prisma from "../prisma/client";
import { AppointmentStatus } from "@prisma/client";

interface AppointmentsByStatus {
    PENDING: number;
    CONFIRMED: number;
    COMPLETED: number;
    CANCELLED: number;
}

interface AppointmentsBySpecialty {
    specialty: string;
    count: number;
}

interface AppointmentsByMonth {
    month: string;
    count: number;
}

interface AdminStatistics {
    totalUsers: number;
    totalDoctors: number;
    totalAppointments: number;
    appointmentsByStatus: AppointmentsByStatus;
    appointmentsBySpecialty: AppointmentsBySpecialty[];
    appointmentsByMonth: AppointmentsByMonth[];
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
    ] = await Promise.all([
        prisma.user.count(),
        prisma.doctor.count(),
        prisma.appointment.count(),
        getAppointmentsByStatus(),
        getAppointmentsBySpecialty(),
    ]);

    const appointmentsByMonth = await getAppointmentsByMonth();

    return {
        totalUsers,
        totalDoctors,
        totalAppointments,
        appointmentsByStatus: statusCounts,
        appointmentsBySpecialty: specialtyCounts,
        appointmentsByMonth,
    };
}

async function getAppointmentsByStatus(): Promise<AppointmentsByStatus> {
    const counts = await prisma.appointment.groupBy({
        by: ["status"],
        _count: { status: true },
    });

    const result: AppointmentsByStatus = {
        PENDING: 0,
        CONFIRMED: 0,
        COMPLETED: 0,
        CANCELLED: 0,
    };

    for (const item of counts) {
        result[item.status] = item._count.status;
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
