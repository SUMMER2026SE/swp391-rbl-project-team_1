"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTasks = getTasks;
exports.createTask = createTask;
exports.updateTask = updateTask;
exports.updateStatus = updateStatus;
exports.reorderTask = reorderTask;
exports.deleteTask = deleteTask;
exports.aiGenerateTasks = aiGenerateTasks;
const client_1 = __importDefault(require("../prisma/client"));
const zod_1 = require("zod");
const apiError_1 = require("../utils/apiError");
const enums_1 = require("../types/enums");
const risk_service_1 = require("../services/risk.service");
const socket_service_1 = require("../services/socket.service");
const gemini_service_1 = require("../services/gemini.service");
const priorityScheduler_1 = require("../utils/priorityScheduler");
// Validation Schemas
const createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Tiêu đề không được để trống'),
    description: zod_1.z.string().optional(),
    skillId: zod_1.z.string().min(1, 'Kỹ năng không được để trống'),
    difficulty: zod_1.z.nativeEnum(enums_1.Difficulty),
    deadline: zod_1.z.string().transform(val => new Date(val)).optional(),
    estimatedMinutes: zod_1.z.number().int().min(1).default(25)
});
const updateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    skillId: zod_1.z.string().optional(),
    difficulty: zod_1.z.nativeEnum(enums_1.Difficulty).optional(),
    deadline: zod_1.z.string().transform(val => new Date(val)).optional().nullable(),
    estimatedMinutes: zod_1.z.number().int().min(1).optional()
});
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(enums_1.TaskStatus)
});
/**
 * Get all tasks for the logged in student.
 */
async function getTasks(req, res, next) {
    try {
        const studentId = req.user?.studentId;
        if (!studentId) {
            throw new apiError_1.ApiError(400, 'Không tìm thấy thông tin Student.');
        }
        const { status, skillId, sortBy } = req.query;
        const whereClause = { studentId };
        if (status) {
            whereClause.status = status;
        }
        if (skillId) {
            whereClause.skillId = skillId;
        }
        const tasks = await client_1.default.task.findMany({
            where: whereClause,
            include: {
                skill: true
            }
        });
        // If sorting by priority, we use the Priority Scheduler algorithm
        if (sortBy === 'priority') {
            const studentMasteries = await client_1.default.skillMastery.findMany({
                where: { studentId }
            });
            const mappedTasks = tasks.map(task => {
                const mastery = studentMasteries.find(m => m.skillId === task.skillId);
                const masteryLevel = mastery ? mastery.masteryLevel : 0.3;
                let diffNum = 1;
                if (task.difficulty === enums_1.Difficulty.MEDIUM)
                    diffNum = 2;
                if (task.difficulty === enums_1.Difficulty.HARD)
                    diffNum = 3;
                if (task.difficulty === enums_1.Difficulty.EXPERT)
                    diffNum = 4;
                return {
                    ...task,
                    masteryLevel,
                    difficultyNum: diffNum
                };
            });
            const schedulerTasks = mappedTasks.map(t => ({
                id: t.id,
                deadline: t.deadline || undefined,
                masteryLevel: t.masteryLevel,
                difficulty: t.difficultyNum
            }));
            const sortedSchedulerTasks = (0, priorityScheduler_1.sortByPriority)(schedulerTasks, new Date());
            const sortedTasks = sortedSchedulerTasks.map(st => {
                return mappedTasks.find(t => t.id === st.id);
            });
            res.status(200).json({ success: true, tasks: sortedTasks });
            return;
        }
        // Default sorting by createdAt desc
        tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        res.status(200).json({ success: true, tasks });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Create a new task.
 */
async function createTask(req, res, next) {
    try {
        const studentId = req.user?.studentId;
        if (!studentId) {
            throw new apiError_1.ApiError(400, 'Không tìm thấy thông tin Student.');
        }
        const data = createTaskSchema.parse(req.body);
        const task = await client_1.default.task.create({
            data: {
                studentId,
                title: data.title,
                description: data.description,
                skillId: data.skillId,
                difficulty: data.difficulty,
                deadline: data.deadline,
                estimatedMinutes: data.estimatedMinutes,
                status: enums_1.TaskStatus.TODO
            },
            include: {
                skill: true
            }
        });
        res.status(201).json({ success: true, task });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Update task details.
 */
async function updateTask(req, res, next) {
    try {
        const studentId = req.user?.studentId;
        const { id } = req.params;
        if (!studentId) {
            throw new apiError_1.ApiError(400, 'Không tìm thấy thông tin Student.');
        }
        const task = await client_1.default.task.findUnique({ where: { id } });
        if (!task || task.studentId !== studentId) {
            throw new apiError_1.ApiError(404, 'Không tìm thấy task hoặc bạn không có quyền chỉnh sửa.');
        }
        const data = updateTaskSchema.parse(req.body);
        const updatedTask = await client_1.default.task.update({
            where: { id },
            data: {
                title: data.title !== undefined ? data.title : undefined,
                description: data.description !== undefined ? data.description : undefined,
                skillId: data.skillId !== undefined ? data.skillId : undefined,
                difficulty: data.difficulty !== undefined ? data.difficulty : undefined,
                deadline: data.deadline !== undefined ? (data.deadline || null) : undefined,
                estimatedMinutes: data.estimatedMinutes !== undefined ? data.estimatedMinutes : undefined
            },
            include: {
                skill: true
            }
        });
        res.status(200).json({ success: true, task: updatedTask });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Update task status (drag-and-drop).
 * If task becomes DONE, triggers risk recalculation and Socket.IO Red Flag check.
 */
async function updateStatus(req, res, next) {
    try {
        const studentId = req.user?.studentId;
        const { id } = req.params;
        if (!studentId) {
            throw new apiError_1.ApiError(400, 'Không tìm thấy thông tin Student.');
        }
        const task = await client_1.default.task.findUnique({ where: { id } });
        if (!task || task.studentId !== studentId) {
            throw new apiError_1.ApiError(404, 'Không tìm thấy task hoặc bạn không có quyền.');
        }
        const { status } = updateStatusSchema.parse(req.body);
        const updatedTask = await client_1.default.task.update({
            where: { id },
            data: {
                status,
                completedAt: status === enums_1.TaskStatus.DONE ? new Date() : null
            },
            include: {
                skill: true
            }
        });
        let newRiskScore = task.studentId ? 0 : 0;
        if (status === enums_1.TaskStatus.DONE || task.status === enums_1.TaskStatus.DONE) {
            // Recalculate student risk when task status changes to/from DONE
            newRiskScore = await (0, risk_service_1.recalculate)(studentId);
            if (newRiskScore > 70) {
                await (0, socket_service_1.emitRedFlag)(studentId, newRiskScore);
            }
        }
        else {
            // Get current risk
            const student = await client_1.default.student.findUnique({ where: { id: studentId } });
            newRiskScore = student?.currentRiskScore || 0;
        }
        res.status(200).json({
            success: true,
            task: updatedTask,
            newRiskScore
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Reorder tasks in a column (simulate behavior).
 */
async function reorderTask(_req, res, next) {
    try {
        // Since we don't store a specific index in DB, we'll return 200 OK
        res.status(200).json({ success: true, message: 'Reordered successfully' });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Delete task.
 */
async function deleteTask(req, res, next) {
    try {
        const studentId = req.user?.studentId;
        const { id } = req.params;
        if (!studentId) {
            throw new apiError_1.ApiError(400, 'Không tìm thấy thông tin Student.');
        }
        const task = await client_1.default.task.findUnique({ where: { id } });
        if (!task || task.studentId !== studentId) {
            throw new apiError_1.ApiError(404, 'Không tìm thấy task hoặc bạn không có quyền.');
        }
        await client_1.default.task.delete({ where: { id } });
        // Recalculate risk in case the denominator changes
        const newRiskScore = await (0, risk_service_1.recalculate)(studentId);
        if (newRiskScore > 70) {
            await (0, socket_service_1.emitRedFlag)(studentId, newRiskScore);
        }
        res.status(200).json({ success: true, message: 'Đã xóa task thành công.', newRiskScore });
    }
    catch (error) {
        next(error);
    }
}
/**
 * AI suggest tasks based on weak skills (mastery < 0.5).
 */
async function aiGenerateTasks(req, res, next) {
    try {
        const studentId = req.user?.studentId;
        if (!studentId) {
            throw new apiError_1.ApiError(400, 'Không tìm thấy thông tin Student.');
        }
        // Get weak skill masteries
        const masteries = await client_1.default.skillMastery.findMany({
            where: {
                studentId,
                masteryLevel: { lt: 0.5 }
            },
            include: {
                skill: true
            }
        });
        if (masteries.length === 0) {
            res.status(200).json({ success: true, tasks: [], message: 'Tất cả các kỹ năng đều tốt (>= 0.5). Không cần gợi ý thêm.' });
            return;
        }
        const weakSkillsInfo = masteries.map(m => ({
            name: m.skill.name,
            masteryLevel: m.masteryLevel
        }));
        // Call Gemini to generate tasks
        let suggestedTasks;
        try {
            suggestedTasks = await (0, gemini_service_1.generateTasks)(weakSkillsInfo);
        }
        catch (error) {
            console.error("AI Task Generation failed:", error);
            throw new apiError_1.ApiError(503, "Dịch vụ AI gợi ý Task tạm thời không khả dụng. Vui lòng thử lại sau.");
        }
        const createdTasks = [];
        for (const t of suggestedTasks) {
            // Find skill matching skillName or default to one of the weak skills
            const matchedMastery = masteries.find(m => m.skill.name.toLowerCase().includes(t.skillName.toLowerCase()))
                || masteries[0];
            let difficultyEnum = enums_1.Difficulty.EASY;
            if (t.difficulty === 'MEDIUM')
                difficultyEnum = enums_1.Difficulty.MEDIUM;
            if (t.difficulty === 'HARD')
                difficultyEnum = enums_1.Difficulty.HARD;
            if (t.difficulty === 'EXPERT')
                difficultyEnum = enums_1.Difficulty.EXPERT;
            const created = await client_1.default.task.create({
                data: {
                    studentId,
                    title: t.title,
                    description: t.reason || `AI suggested for practicing ${matchedMastery.skill.name}`,
                    skillId: matchedMastery.skillId,
                    difficulty: difficultyEnum,
                    estimatedMinutes: t.estimatedMinutes || 25,
                    status: enums_1.TaskStatus.TODO,
                    isAIGenerated: true
                },
                include: {
                    skill: true
                }
            });
            createdTasks.push(created);
        }
        res.status(200).json({ success: true, tasks: createdTasks });
    }
    catch (error) {
        next(error);
    }
}
