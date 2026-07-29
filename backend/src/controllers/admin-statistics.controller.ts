import { NextFunction, Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { getStatistics, exportStatisticsCsv } from "../services/admin-statistics.service";

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
        const period = (_req.query.period as string) || 'month';
        if (!['week', 'month', 'year'].includes(period)) {
            res.status(400).json({ message: "Invalid period. Use: week, month, year" });
            return;
        }

        const statistics = await getStatistics(period as 'week' | 'month' | 'year');
        res.json({
            message: "Statistics retrieved successfully",
            data: statistics,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/admin/statistics/export
 * Exports comprehensive statistics as CSV.
 */
export async function getExportStatisticsHandler(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const csvData = await exportStatisticsCsv();
        
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=booking_statistics.csv");
        
        res.send(csvData);
    } catch (error) {
        next(error);
    }
}
