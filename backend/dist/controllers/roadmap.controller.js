"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoadmapTasks = getRoadmapTasks;
exports.generateAIRoadmap = generateAIRoadmap;
const client_1 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
const enums_1 = require("../types/enums");
const priorityScheduler_1 = require("../utils/priorityScheduler");
const gemini_service_1 = require("../services/gemini.service");
/**
 * Get active student tasks sorted by the Priority Scheduler.
 */
async function getRoadmapTasks(req, res, next) {
    try {
        const studentId = req.user?.studentId;
        if (!studentId) {
            throw new apiError_1.ApiError(400, 'Không tìm thấy thông tin Student.');
        }
        // 1. Fetch active tasks (TODO, IN_PROGRESS)
        const tasks = await client_1.default.task.findMany({
            where: {
                studentId,
                status: {
                    in: [enums_1.TaskStatus.TODO, enums_1.TaskStatus.IN_PROGRESS]
                }
            },
            include: {
                skill: true
            }
        });
        // 2. Fetch student masteries
        const masteries = await client_1.default.skillMastery.findMany({
            where: { studentId }
        });
        // 3. Map tasks to SchedulerTask format and calculate priorities
        const now = new Date();
        const mappedTasks = tasks.map(task => {
            const mastery = masteries.find(m => m.skillId === task.skillId);
            const masteryLevel = mastery ? mastery.masteryLevel : 0.3;
            let diffNum = 1;
            if (task.difficulty === enums_1.Difficulty.MEDIUM)
                diffNum = 2;
            if (task.difficulty === enums_1.Difficulty.HARD)
                diffNum = 3;
            if (task.difficulty === enums_1.Difficulty.EXPERT)
                diffNum = 4;
            const schedulerTask = {
                id: task.id,
                deadline: task.deadline || undefined,
                masteryLevel,
                difficulty: diffNum
            };
            const priorityScore = (0, priorityScheduler_1.calculatePriority)(schedulerTask, now);
            return {
                ...task,
                masteryLevel,
                priorityScore: parseFloat(priorityScore.toFixed(4))
            };
        });
        // Sort by priority score DESC
        mappedTasks.sort((a, b) => b.priorityScore - a.priorityScore);
        // Get overall progress (DONE tasks vs total tasks)
        const allTasksCount = await client_1.default.task.count({ where: { studentId } });
        const doneTasksCount = await client_1.default.task.count({ where: { studentId, status: enums_1.TaskStatus.DONE } });
        const progressPercent = allTasksCount > 0 ? Math.round((doneTasksCount / allTasksCount) * 100) : 0;
        res.status(200).json({
            success: true,
            tasks: mappedTasks,
            progress: {
                completed: doneTasksCount,
                total: allTasksCount,
                percent: progressPercent
            }
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Generate adaptive roadmap markdown via Gemini AI based on weak skills and goals.
 */
async function generateAIRoadmap(req, res, next) {
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
        const goal = student.learningGoal || 'Thành thạo công nghệ thông tin';
        // Get weak skill masteries (masteryLevel < 0.5)
        const masteries = await client_1.default.skillMastery.findMany({
            where: {
                studentId,
                masteryLevel: { lt: 0.5 }
            },
            include: {
                skill: true
            }
        });
        // Fallback if no weak skills are found, use all masteries
        const listToAnalyze = masteries.length > 0
            ? masteries
            : await client_1.default.skillMastery.findMany({
                where: { studentId },
                include: { skill: true },
                take: 5
            });
        const weakSkillsInfo = listToAnalyze.map(m => ({
            name: m.skill.name,
            masteryLevel: m.masteryLevel
        }));
        const markdownRoadmap = await (0, gemini_service_1.generateRoadmap)(weakSkillsInfo, goal);
        res.status(200).json({
            success: true,
            roadmap: markdownRoadmap
        });
    }
    catch (error) {
        next(error);
    }
}
