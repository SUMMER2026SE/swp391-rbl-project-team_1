"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRiskScore = getRiskScore;
exports.getRiskHistory = getRiskHistory;
exports.triggerRecalculate = triggerRecalculate;
const client_1 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
const risk_service_1 = require("../services/risk.service");
const socket_service_1 = require("../services/socket.service");
/**
 * Get current student risk score and risk level classification.
 */
async function getRiskScore(req, res, next) {
    try {
        const studentId = req.user?.studentId;
        if (!studentId) {
            throw new apiError_1.ApiError(400, 'Không tìm thấy thông tin Student.');
        }
        const student = await client_1.default.student.findUnique({
            where: { id: studentId }
        });
        if (!student) {
            throw new apiError_1.ApiError(404, 'Không tìm thấy học viên.');
        }
        const score = student.currentRiskScore;
        let level = 'LOW';
        if (score >= 40 && score <= 70) {
            level = 'MEDIUM';
        }
        else if (score > 70) {
            level = 'HIGH';
        }
        res.status(200).json({
            success: true,
            riskScore: score,
            level
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Get historical risk logs for drawing trend charts.
 */
async function getRiskHistory(req, res, next) {
    try {
        const studentId = req.user?.studentId;
        if (!studentId) {
            throw new apiError_1.ApiError(400, 'Không tìm thấy thông tin Student.');
        }
        const history = await client_1.default.riskHistory.findMany({
            where: { studentId },
            orderBy: {
                createdAt: 'asc'
            }
        });
        res.status(200).json({
            success: true,
            history
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Manually trigger risk score recalculation.
 */
async function triggerRecalculate(req, res, next) {
    try {
        const studentId = req.user?.studentId;
        if (!studentId) {
            throw new apiError_1.ApiError(400, 'Không tìm thấy thông tin Student.');
        }
        const score = await (0, risk_service_1.recalculate)(studentId);
        if (score > 70) {
            await (0, socket_service_1.emitRedFlag)(studentId, score);
        }
        let level = 'LOW';
        if (score >= 40 && score <= 70) {
            level = 'MEDIUM';
        }
        else if (score > 70) {
            level = 'HIGH';
        }
        res.status(200).json({
            success: true,
            riskScore: score,
            level
        });
    }
    catch (error) {
        next(error);
    }
}
