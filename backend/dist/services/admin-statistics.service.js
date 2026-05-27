"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatistics = getStatistics;
const client_1 = __importDefault(require("../prisma/client"));
/**
 * Returns comprehensive admin dashboard statistics.
 */
async function getStatistics() {
    // Run all count queries in parallel
    const [totalUsers, totalDoctors, totalAppointments, statusCounts, specialtyCounts,] = await Promise.all([
        client_1.default.user.count(),
        client_1.default.doctor.count(),
        client_1.default.appointment.count(),
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
async function getAppointmentsByStatus() {
    const counts = await client_1.default.appointment.groupBy({
        by: ["status"],
        _count: { status: true },
    });
    const result = {
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
async function getAppointmentsBySpecialty() {
    const appointments = await client_1.default.appointment.findMany({
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
    const countMap = new Map();
    for (const appt of appointments) {
        const specialtyName = appt.doctor.specialty.name;
        countMap.set(specialtyName, (countMap.get(specialtyName) ?? 0) + 1);
    }
    return Array.from(countMap.entries())
        .map(([specialty, count]) => ({ specialty, count }))
        .sort((a, b) => b.count - a.count);
}
async function getAppointmentsByMonth() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    const appointments = await client_1.default.appointment.findMany({
        where: {
            appointmentDate: { gte: sixMonthsAgo },
        },
        select: {
            appointmentDate: true,
        },
        orderBy: { appointmentDate: "asc" },
    });
    const monthMap = new Map();
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
