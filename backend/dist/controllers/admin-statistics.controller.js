"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatisticsHandler = getStatisticsHandler;
const admin_statistics_service_1 = require("../services/admin-statistics.service");
/**
 * GET /api/admin/statistics
 * Returns comprehensive admin dashboard statistics.
 */
async function getStatisticsHandler(_req, res, next) {
    try {
        const statistics = await (0, admin_statistics_service_1.getStatistics)();
        res.json({
            message: "Statistics retrieved successfully",
            data: statistics,
        });
    }
    catch (error) {
        next(error);
    }
}
