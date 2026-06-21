import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../prisma/client';
import { z } from 'zod';
import { ApiError } from '../utils/apiError';
import { Role } from '../types/enums';

const updateUserSchema = z.object({
  fullName: z.string().min(1).optional(),
  role: z.nativeEnum(Role).optional()
});

const skillSchema = z.object({
  name: z.string().min(1, 'Tên kỹ năng không được để trống'),
  slug: z.string().min(1, 'Slug không được để trống'),
  parentId: z.string().nullable().optional()
});

/**
 * Get overall system statistics for Admin Dashboard.
 */
export async function getSystemStats(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const totalUsers = await prisma.user.count();
    
    // Active today: registered today or had activity today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const activeUsersCount = await prisma.user.count({
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

    const totalQuizAttempts = await prisma.quizAttempt.count();

    const students = await prisma.student.findMany({ select: { currentRiskScore: true } });
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
  } catch (error) {
    next(error);
  }
}

/**
 * List all users with filtering and pagination.
 */
export async function getUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role, q, page, limit } = req.query;

    const pageNum = page ? parseInt(page as string, 10) : 1;
    const limitNum = limit ? parseInt(limit as string, 10) : 10;
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {};
    if (role) {
      whereClause.role = role as Role;
    }
    if (q) {
      whereClause.OR = [
        { fullName: { contains: q as string, mode: 'insensitive' } },
        { email: { contains: q as string, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
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

    const total = await prisma.user.count({ where: whereClause });

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
  } catch (error) {
    next(error);
  }
}

/**
 * Update user details (e.g. role).
 */
export async function updateUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const data = updateUserSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new ApiError(404, 'Không tìm thấy người dùng.');
    }

    // If changing role to MENTOR, make sure Mentor record exists
    if (data.role === Role.MENTOR && user.role !== Role.MENTOR) {
      await prisma.mentor.upsert({
        where: { userId: id },
        update: {},
        create: { userId: id }
      });
    }

    // If changing role to STUDENT, make sure Student record exists
    if (data.role === Role.STUDENT && user.role !== Role.STUDENT) {
      await prisma.student.upsert({
        where: { userId: id },
        update: {},
        create: { userId: id }
      });
    }

    const updatedUser = await prisma.user.update({
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
  } catch (error) {
    next(error);
  }
}

/**
 * Delete user account.
 */
export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new ApiError(404, 'Không tìm thấy người dùng.');
    }

    if (user.id === req.user?.id) {
      throw new ApiError(400, 'Bạn không thể tự xóa tài khoản của chính mình.');
    }

    await prisma.user.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Đã xóa tài khoản người dùng thành công.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get the flat list of all skills.
 */
export async function getSkills(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const skills = await prisma.skill.findMany({
      include: {
        parent: true
      }
    });

    res.status(200).json({
      success: true,
      skills
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new skill in the skill tree.
 */
export async function createSkill(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = skillSchema.parse(req.body);

    // Check slug uniqueness
    const existingSlug = await prisma.skill.findUnique({ where: { slug: data.slug } });
    if (existingSlug) {
      throw new ApiError(400, 'Slug này đã tồn tại.');
    }

    const skill = await prisma.skill.create({
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
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing skill.
 */
export async function updateSkill(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const data = skillSchema.partial().parse(req.body);

    const skill = await prisma.skill.findUnique({ where: { id } });
    if (!skill) {
      throw new ApiError(404, 'Không tìm thấy kỹ năng.');
    }

    if (data.slug) {
      const existingSlug = await prisma.skill.findFirst({
        where: {
          slug: data.slug,
          id: { not: id }
        }
      });
      if (existingSlug) {
        throw new ApiError(400, 'Slug này đã được sử dụng.');
      }
    }

    const updated = await prisma.skill.update({
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
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a skill.
 */
export async function deleteSkill(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const skill = await prisma.skill.findUnique({ where: { id } });
    if (!skill) {
      throw new ApiError(404, 'Không tìm thấy kỹ năng.');
    }

    await prisma.skill.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Đã xóa kỹ năng thành công.'
    });
  } catch (error) {
    next(error);
  }
}
