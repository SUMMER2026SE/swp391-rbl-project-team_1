"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemStats = getSystemStats;
exports.getUsers = getUsers;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
exports.getSkills = getSkills;
exports.createSkill = createSkill;
exports.updateSkill = updateSkill;
exports.deleteSkill = deleteSkill;
const client_1 = __importDefault(require("../prisma/client"));
const zod_1 = require("zod");
const apiError_1 = require("../utils/apiError");
const enums_1 = require("../types/enums");
const updateUserSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(1).optional(),
    role: zod_1.z.nativeEnum(enums_1.Role).optional()
});
const skillSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Tên kỹ năng không được để trống'),
    slug: zod_1.z.string().min(1, 'Slug không được để trống'),
    parentId: zod_1.z.string().nullable().optional()
});
/**
 * Get overall system statistics for Admin Dashboard.
 */
async function getSystemStats(_req, res, next) {
    try {
        const totalUsers = await client_1.default.user.count();
        // Active today: registered today or had activity today
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const activeUsersCount = await client_1.default.user.count({
            where: {
                OR: [
                    { createdAt: { gte: startOfToday } },
                    {
                        student: {
                            OR: [
                                {
                                    quizAttempts: {
                                        some: { createdAt: { gte: startOfToday } }
                                    }
                                },
                                {
                                    pomodoroSessions: {
                                        some: { createdAt: { gte: startOfToday } }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        });
        const totalQuizAttempts = await client_1.default.quizAttempt.count();
        const students = await client_1.default.student.findMany({ select: { currentRiskScore: true } });
        const avgRiskScore = students.length > 0
            ? Math.round(students.reduce((sum, s) => sum + s.currentRiskScore, 0) / students.length)
            : 0;
        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                activeToday: activeUsersCount,
                totalQuizAttempts,
                avgRiskScore
            }
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * List all users with filtering and pagination.
 */
async function getUsers(req, res, next) {
    try {
        const { role, q, page, limit } = req.query;
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;
        const skip = (pageNum - 1) * limitNum;
        const whereClause = {};
        if (role) {
            whereClause.role = role;
        }
        if (q) {
            whereClause.OR = [
                { fullName: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } }
            ];
        }
        const users = await client_1.default.user.findMany({
            where: whereClause,
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum
        });
        const total = await client_1.default.user.count({ where: whereClause });
        res.status(200).json({
            success: true,
            users,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Update user details (e.g. role).
 */
async function updateUser(req, res, next) {
    try {
        const { id } = req.params;
        const data = updateUserSchema.parse(req.body);
        const user = await client_1.default.user.findUnique({ where: { id } });
        if (!user) {
            throw new apiError_1.ApiError(404, 'Không tìm thấy người dùng.');
        }
        // If changing role to MENTOR, make sure Mentor record exists
        if (data.role === enums_1.Role.MENTOR && user.role !== enums_1.Role.MENTOR) {
            await client_1.default.mentor.upsert({
                where: { userId: id },
                update: {},
                create: { userId: id }
            });
        }
        // If changing role to STUDENT, make sure Student record exists
        if (data.role === enums_1.Role.STUDENT && user.role !== enums_1.Role.STUDENT) {
            await client_1.default.student.upsert({
                where: { userId: id },
                update: {},
                create: { userId: id }
            });
        }
        const updatedUser = await client_1.default.user.update({
            where: { id },
            data: {
                fullName: data.fullName !== undefined ? data.fullName : undefined,
                role: data.role !== undefined ? data.role : undefined
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true
            }
        });
        res.status(200).json({
            success: true,
            user: updatedUser
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Delete user account.
 */
async function deleteUser(req, res, next) {
    try {
        const { id } = req.params;
        const user = await client_1.default.user.findUnique({ where: { id } });
        if (!user) {
            throw new apiError_1.ApiError(404, 'Không tìm thấy người dùng.');
        }
        if (user.id === req.user?.id) {
            throw new apiError_1.ApiError(400, 'Bạn không thể tự xóa tài khoản của chính mình.');
        }
        await client_1.default.user.delete({ where: { id } });
        res.status(200).json({
            success: true,
            message: 'Đã xóa tài khoản người dùng thành công.'
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Get the flat list of all skills.
 */
async function getSkills(_req, res, next) {
    try {
        const skills = await client_1.default.skill.findMany({
            include: {
                parent: true
            }
        });
        res.status(200).json({
            success: true,
            skills
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Create a new skill in the skill tree.
 */
async function createSkill(req, res, next) {
    try {
        const data = skillSchema.parse(req.body);
        // Check slug uniqueness
        const existingSlug = await client_1.default.skill.findUnique({ where: { slug: data.slug } });
        if (existingSlug) {
            throw new apiError_1.ApiError(400, 'Slug này đã tồn tại.');
        }
        const skill = await client_1.default.skill.create({
            data: {
                name: data.name,
                slug: data.slug,
                parentId: data.parentId || null
            }
        });
        res.status(201).json({
            success: true,
            skill
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Update an existing skill.
 */
async function updateSkill(req, res, next) {
    try {
        const { id } = req.params;
        const data = skillSchema.partial().parse(req.body);
        const skill = await client_1.default.skill.findUnique({ where: { id } });
        if (!skill) {
            throw new apiError_1.ApiError(404, 'Không tìm thấy kỹ năng.');
        }
        if (data.slug) {
            const existingSlug = await client_1.default.skill.findFirst({
                where: {
                    slug: data.slug,
                    id: { not: id }
                }
            });
            if (existingSlug) {
                throw new apiError_1.ApiError(400, 'Slug này đã được sử dụng.');
            }
        }
        const updated = await client_1.default.skill.update({
            where: { id },
            data: {
                name: data.name !== undefined ? data.name : undefined,
                slug: data.slug !== undefined ? data.slug : undefined,
                parentId: data.parentId !== undefined ? data.parentId : undefined
            }
        });
        res.status(200).json({
            success: true,
            skill: updated
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Delete a skill.
 */
async function deleteSkill(req, res, next) {
    try {
        const { id } = req.params;
        const skill = await client_1.default.skill.findUnique({ where: { id } });
        if (!skill) {
            throw new apiError_1.ApiError(404, 'Không tìm thấy kỹ năng.');
        }
        await client_1.default.skill.delete({ where: { id } });
        res.status(200).json({
            success: true,
            message: 'Đã xóa kỹ năng thành công.'
        });
    }
    catch (error) {
        next(error);
    }
}
