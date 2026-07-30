"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatistics = getStatistics;
exports.exportStatisticsCsv = exportStatisticsCsv;
const client_1 = __importDefault(require("../prisma/client"));
/**
 * Returns comprehensive admin dashboard statistics.
 */
async function getStatistics(period = 'month') {
    const [totalUsers, totalDoctors, totalAppointments, statusCounts, specialtyCounts, cancellationStats, revenueData,] = await Promise.all([
        client_1.default.user.count(),
        client_1.default.doctor.count(),
        client_1.default.appointment.count(),
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
async function getRevenueTotal() {
    const completedAppts = await client_1.default.appointment.findMany({
        where: { status: 'COMPLETED' },
        select: { amount: true }
    });
    return completedAppts.reduce((sum, appt) => sum + appt.amount, 0);
}
async function getAppointmentsByStatus() {
    const counts = await client_1.default.appointment.groupBy({
        by: ["status"],
        _count: { status: true },
    });
    const result = {
        PENDING_PAYMENT: 0,
        PENDING: 0,
        CONFIRMED: 0,
        COMPLETED: 0,
        CANCELLED: 0,
        EXPIRED: 0,
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
        if (!appt.doctor)
            continue;
        const specialtyName = appt.doctor.specialty.name;
        countMap.set(specialtyName, (countMap.get(specialtyName) ?? 0) + 1);
    }
    return Array.from(countMap.entries())
        .map(([specialty, count]) => ({ specialty, count }))
        .sort((a, b) => b.count - a.count);
}
async function getAppointmentsOverTime(period) {
    const now = new Date();
    let startDate;
    if (period === 'week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    }
    else if (period === 'month') {
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    }
    else {
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
    }
    const appointments = await client_1.default.appointment.findMany({
        where: { appointmentDate: { gte: startDate } },
        select: { appointmentDate: true },
        orderBy: { appointmentDate: "asc" },
    });
    const timeMap = new Map();
    // Initialize map using UTC+7 local time
    const localNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
    if (period === 'week') {
        for (let i = 6; i >= 0; i--) {
            const d = new Date(localNow.getTime());
            d.setUTCDate(d.getUTCDate() - i);
            timeMap.set(`${d.getUTCDate()}/${d.getUTCMonth() + 1}`, 0);
        }
    }
    else if (period === 'month') {
        for (let i = 29; i >= 0; i--) {
            const d = new Date(localNow.getTime());
            d.setUTCDate(d.getUTCDate() - i);
            timeMap.set(`${d.getUTCDate()}/${d.getUTCMonth() + 1}`, 0);
        }
    }
    else {
        for (let i = 11; i >= 0; i--) {
            const d = new Date(localNow.getTime());
            d.setUTCMonth(d.getUTCMonth() - i);
            timeMap.set(`T${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`, 0);
        }
    }
    // Grouping by local/UTC+7 time to avoid off-by-one day timezone shifts (e.g. UTC date vs local date)
    for (const appt of appointments) {
        const d = new Date(appt.appointmentDate);
        // Shift to local time if we want to group by user/local date. Since the system runs in UTC+7 (Asia/Saigon),
        // let's adjust the date components.
        // We can do this by using the local timezone representation or directly formatted values.
        // Let's get the date string in Asia/Saigon timezone
        const localDate = new Date(d.getTime() + 7 * 60 * 60 * 1000);
        let key = '';
        if (period === 'year') {
            key = `T${localDate.getUTCMonth() + 1}/${localDate.getUTCFullYear()}`;
        }
        else {
            key = `${localDate.getUTCDate()}/${localDate.getUTCMonth() + 1}`;
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
async function getRevenueOverTime(period) {
    const now = new Date();
    let startDate;
    if (period === 'week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    }
    else if (period === 'month') {
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    }
    else {
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
    }
    const completedAppts = await client_1.default.appointment.findMany({
        where: { status: 'COMPLETED', appointmentDate: { gte: startDate } },
        select: { appointmentDate: true, amount: true },
        orderBy: { appointmentDate: "asc" },
    });
    const timeMap = new Map();
    // Initialize map using UTC+7 local time
    const localNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
    if (period === 'week') {
        for (let i = 6; i >= 0; i--) {
            const d = new Date(localNow.getTime());
            d.setUTCDate(d.getUTCDate() - i);
            timeMap.set(`${d.getUTCDate()}/${d.getUTCMonth() + 1}`, 0);
        }
    }
    else if (period === 'month') {
        for (let i = 29; i >= 0; i--) {
            const d = new Date(localNow.getTime());
            d.setUTCDate(d.getUTCDate() - i);
            timeMap.set(`${d.getUTCDate()}/${d.getUTCMonth() + 1}`, 0);
        }
    }
    else {
        for (let i = 11; i >= 0; i--) {
            const d = new Date(localNow.getTime());
            d.setUTCMonth(d.getUTCMonth() - i);
            timeMap.set(`T${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`, 0);
        }
    }
    // Grouping by local/UTC+7 time to avoid off-by-one day timezone shifts
    for (const appt of completedAppts) {
        const d = new Date(appt.appointmentDate);
        const localDate = new Date(d.getTime() + 7 * 60 * 60 * 1000);
        let key = '';
        if (period === 'year') {
            key = `T${localDate.getUTCMonth() + 1}/${localDate.getUTCFullYear()}`;
        }
        else {
            key = `${localDate.getUTCDate()}/${localDate.getUTCMonth() + 1}`;
        }
        if (timeMap.has(key)) {
            const revenue = appt.amount;
            timeMap.set(key, (timeMap.get(key) ?? 0) + revenue);
        }
    }
    return Array.from(timeMap.entries()).map(([timeKey, revenue]) => ({
        period: timeKey,
        revenue,
    }));
}
async function getCancellationStats() {
    const cancelledAppointments = await client_1.default.appointment.findMany({
        where: {
            status: "CANCELLED",
        },
        select: {
            cancellationReason: true,
        },
    });
    const reasonMap = new Map();
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
async function exportStatisticsCsv() {
    const appointments = await client_1.default.appointment.findMany({
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
    const escapeCsv = (str) => `"${String(str).replace(/"/g, '""')}"`;
    const csvContent = [
        headers.map(escapeCsv).join(","),
        ...rows.map(row => row.map(escapeCsv).join(","))
    ].join("\n");
    return csvContent;
}
