import { NextFunction, Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { getStatistics } from "../services/admin-statistics.service";

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
