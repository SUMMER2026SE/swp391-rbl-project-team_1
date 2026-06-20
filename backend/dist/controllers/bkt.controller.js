"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMasteries = getMasteries;
exports.getMasteryBySkill = getMasteryBySkill;
exports.getBKTHistory = getBKTHistory;
const client_1 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
/**
 * Get all skill masteries for the logged in student.
 */
async function getMasteries(req, res, next) {
    try {
        const studentId = req.user?.studentId;
        if (!studentId) {
            throw new apiError_1.ApiError(400, 'Không tìm thấy thông tin Student.');
        }
        const masteries = await client_1.default.skillMastery.findMany({
            where: { studentId },
            include: {
                skill: true
            }
        });
        res.status(200).json({
            success: true,
            masteries
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Get mastery details for a specific skill.
 */
async function getMasteryBySkill(req, res, next) {
    try {
        const studentId = req.user?.studentId;
        const { skillId } = req.params;
        if (!studentId) {
            throw new apiError_1.ApiError(400, 'Không tìm thấy thông tin Student.');
        }
        const mastery = await client_1.default.skillMastery.findUnique({
            where: {
                studentId_skillId: {
                    studentId,
                    skillId
                }
            },
            include: {
                skill: true
            }
        });
        if (!mastery) {
            throw new apiError_1.ApiError(404, 'Không tìm thấy thông tin thành thạo cho kỹ năng này.');
        }
        res.status(200).json({
            success: true,
            mastery
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Get BKT history timeline for a specific skill.
 */
async function getBKTHistory(req, res, next) {
    try {
        const studentId = req.user?.studentId;
        const { skillId } = req.params;
        if (!studentId) {
            throw new apiError_1.ApiError(400, 'Không tìm thấy thông tin Student.');
        }
        const mastery = await client_1.default.skillMastery.findUnique({
            where: {
                studentId_skillId: {
                    studentId,
                    skillId
                }
            }
        });
        if (!mastery) {
            res.status(200).json({ success: true, history: [] });
            return;
        }
        const history = await client_1.default.bKTHistory.findMany({
            where: {
                masteryId: mastery.id
            },
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
