"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatisticsHandler = getStatisticsHandler;
exports.getExportStatisticsHandler = getExportStatisticsHandler;
const admin_statistics_service_1 = require("../services/admin-statistics.service");
/**
 * GET /api/admin/statistics
 * Returns comprehensive admin dashboard statistics.
 */
async function getStatisticsHandler(_req, res, next) {
    try {
        const period = _req.query.period || 'month';
        if (!['week', 'month', 'year'].includes(period)) {
            res.status(400).json({ message: "Invalid period. Use: week, month, year" });
            return;
        }
        const statistics = await (0, admin_statistics_service_1.getStatistics)(period);
        res.json({
            message: "Statistics retrieved successfully",
            data: statistics,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/admin/statistics/export
 * Exports comprehensive statistics as CSV.
 */
async function getExportStatisticsHandler(_req, res, next) {
    try {
        const csvData = await (0, admin_statistics_service_1.exportStatisticsCsv)();
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=booking_statistics.csv");
        res.send(csvData);
    }
    catch (error) {
        next(error);
    }
}
