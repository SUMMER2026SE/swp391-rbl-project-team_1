import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { getStatistics } from "../services/admin-statistics.service";
import prisma from "../prisma/client";

/**
 * GET /api/admin/statistics
 * Returns comprehensive admin dashboard statistics.
 */
export async function getStatisticsHandler(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const statistics = await getStatistics();
        res.json({
            message: "Statistics retrieved successfully",
            data: statistics,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/admin/statistics/overview
 * Returns dashboard overview numbers.
 */
export async function getOverviewHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (req.user?.role !== "ADMIN") {
            res.status(403).json({ success: false, message: "Forbidden" });
            return;
        }

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const [totalAppointments, totalDoctors, totalUsers, cancelledToday] = await Promise.all([
            prisma.appointment.count({ where: { createdAt: { gte: startOfDay } } }),
            prisma.doctor.count({ where: { status: "APPROVED", isLocked: false } }),
            prisma.user.count({ where: { role: "USER" } }),
            prisma.appointment.count({ where: { status: "CANCELLED", createdAt: { gte: startOfDay } } })
        ]);

        res.json({
            success: true,
            data: { totalAppointments, totalDoctors, totalUsers, cancelledToday }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/admin/statistics/chart?days=30
 * Returns appointment booking vs cancellation data for chart.
 */
export async function getChartHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (req.user?.role !== "ADMIN") {
            res.status(403).json({ success: false, message: "Forbidden" });
            return;
        }

        const days = parseInt(req.query.days as string) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        // Fetch all appointments in the date range to process in memory
        const appointments = await prisma.appointment.findMany({
            where: {
                createdAt: { gte: startDate }
            },
            select: {
                createdAt: true,
                status: true
            }
        });

        // Initialize map with days
        const dateMap = new Map<string, { date: string; bookings: number; cancelled: number }>();
        
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
            dateMap.set(key, { date: key, bookings: 0, cancelled: 0 });
        }

        for (const appt of appointments) {
            const date = new Date(appt.createdAt);
            const key = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
            if (dateMap.has(key)) {
                const item = dateMap.get(key)!;
                if (appt.status === "CANCELLED") {
                    item.cancelled += 1;
                } else {
                    item.bookings += 1; // Assuming any non-cancelled is a booking for chart purpose? Actually the prompt says "số lịch hẹn + hủy", so maybe total bookings vs cancelled.
                    // Let's count all as bookings, and cancelled as cancelled.
                }
                dateMap.set(key, item);
            }
        }
        
        // Let's refine bookings: The prompt says "số lịch hẹn + hủy". This probably means total bookings (all statuses) and cancelled.
        // Wait, if an appointment is created, it's a booking. If it's cancelled, it's cancelled. 
        // I will count ALL as bookings, and CANCELLED as cancelled. Or bookings = total created that day, cancelled = total cancelled that day.
        
        // Recalculate correctly
        const chartData = Array.from(dateMap.values());
        
        // Reset and recount correctly
        for (const item of chartData) { item.bookings = 0; item.cancelled = 0; }
        for (const appt of appointments) {
            const date = new Date(appt.createdAt);
            const key = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
            if (dateMap.has(key)) {
                const item = dateMap.get(key)!;
                item.bookings += 1; // Total appointments created this day
                if (appt.status === "CANCELLED") {
                    item.cancelled += 1; // Of those, how many were cancelled
                }
            }
        }

        res.json({
            success: true,
            data: chartData
        });
    } catch (error) {
        next(error);
    }
}
