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
