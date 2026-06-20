import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../prisma/client';
import { z } from 'zod';
import { ApiError } from '../utils/apiError';
import { Difficulty, QuizType, AlertType, TaskStatus } from '../types/enums';
import { generateQuiz } from '../services/gemini.service';

// Validation Schemas
const knowledgeUnitSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  content: z.string().min(1, 'Nội dung không được để trống'),
  skillId: z.string().min(1, 'Kỹ năng không được để trống'),
  difficulty: z.nativeEnum(Difficulty),
  isPublic: z.boolean().default(false)
});

const quizQuestionSchema = z.object({
  question: z.string().min(1, 'Câu hỏi không được để trống'),
  type: z.nativeEnum(QuizType).default(QuizType.SINGLE_CHOICE),
  options: z.array(z.object({
    text: z.string().min(1, 'Đáp án không được để trống'),
    isCorrect: z.boolean()
  })).min(2, 'Phải có ít nhất 2 phương án trả lời'),
  explanation: z.string().optional(),
  difficulty: z.nativeEnum(Difficulty),
  skillId: z.string().min(1, 'Kỹ năng không được để trống')
});

const aiGenerateQuizSchema = z.object({
  knowledgeUnitId: z.string().min(1, 'knowledgeUnitId không được để trống'),
  count: z.number().int().min(1).max(10).default(5)
});

const manualAlertSchema = z.object({
  studentId: z.string().min(1, 'studentId không được để trống'),
  type: z.nativeEnum(AlertType).default(AlertType.YELLOW_WARNING),
  message: z.string().min(1, 'Nội dung cảnh báo không được để trống')
});

/**
 * List all students assigned to the mentor.
 */
export async function getMentorStudents(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const mentorId = req.user?.mentorId;
    if (!mentorId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Mentor.');
    }

    const assignments = await prisma.mentorStudent.findMany({
      where: { mentorId },
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true
              }
            }
          }
        }
      }
    });

    const students = assignments.map(a => ({
      id: a.student.id,
      userId: a.student.userId,
      fullName: a.student.user.fullName,
      email: a.student.user.email,
      learningGoal: a.student.learningGoal,
      totalFocusTime: a.student.totalFocusTime,
      currentRiskScore: a.student.currentRiskScore
    }));

    res.status(200).json({ success: true, students });
  } catch (error) {
    next(error);
  }
}

/**
 * Get full detailed analytics of a student.
 */
export async function getStudentDetails(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const mentorId = req.user?.mentorId;
    const { id: studentId } = req.params;

    if (!mentorId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Mentor.');
    }

    // Verify assignment
    const assignment = await prisma.mentorStudent.findUnique({
      where: {
        studentId_mentorId: { studentId, mentorId }
      }
    });

    if (!assignment) {
      throw new ApiError(403, 'Học viên này không thuộc quyền quản lý của bạn.');
    }

    // 1. Fetch student info
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { fullName: true, email: true } }
      }
    });

    if (!student) {
      throw new ApiError(404, 'Không tìm thấy học viên.');
    }

    // 2. Fetch skill masteries and recent history (last 5)
    const masteries = await prisma.skillMastery.findMany({
      where: { studentId },
      include: {
        skill: true,
        bktHistories: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    // 3. Fetch risk history (last 30 records)
    const riskHistory = await prisma.riskHistory.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 30
    });

    // 4. Fetch task completion stats
    const tasks = await prisma.task.findMany({ where: { studentId } });
    const taskStats = {
      todo: tasks.filter(t => t.status === TaskStatus.TODO).length,
      inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      done: tasks.filter(t => t.status === TaskStatus.DONE).length
    };

    // 5. Fetch recent quiz attempts (last 10)
    const attempts = await prisma.quizAttempt.findMany({
      where: { studentId },
      include: {
        question: {
          include: { skill: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // 6. Calculate Pomodoro minutes for the last 7 days
    const pomodoros = await prisma.pomodoroSession.findMany({
      where: { studentId, completed: true, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    });

    const pomodoroByDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dailyMinutes = pomodoros
        .filter(p => p.createdAt.toISOString().split('T')[0] === dateStr)
        .reduce((sum, p) => sum + p.durationMin, 0);

      pomodoroByDay.push({
        date: dateStr,
        totalMinutes: dailyMinutes
      });
    }

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student.id,
          fullName: student.user.fullName,
          email: student.user.email,
          currentRiskScore: student.currentRiskScore,
          totalFocusTime: student.totalFocusTime,
          learningGoal: student.learningGoal
        },
        skillMasteries: masteries,
        riskHistory: riskHistory.reverse(),
        taskStats,
        recentQuizAttempts: attempts,
        pomodoroByDay
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get assigned students with high risk (>70%), sorted DESC.
 */
export async function getRedFlags(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const mentorId = req.user?.mentorId;
    if (!mentorId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Mentor.');
    }

    const assignments = await prisma.mentorStudent.findMany({
      where: { mentorId },
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true } }
          }
        }
      }
    });

    const redFlags = assignments
      .map(a => a.student)
      .filter(s => s.currentRiskScore > 70)
      .map(s => ({
        id: s.id,
        fullName: s.user.fullName,
        email: s.user.email,
        riskScore: s.currentRiskScore
      }))
      .sort((a, b) => b.riskScore - a.riskScore);

    res.status(200).json({ success: true, redFlags });
  } catch (error) {
    next(error);
  }
}

/**
 * Get overview stats for Mentor Dashboard.
 */
export async function getOverviewStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const mentorId = req.user?.mentorId;
    if (!mentorId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Mentor.');
    }

    const assignments = await prisma.mentorStudent.findMany({
      where: { mentorId },
      include: { student: true }
    });

    const totalStudents = assignments.length;
    const redFlagsCount = assignments.filter(a => a.student.currentRiskScore > 70).length;
    
    const totalRisk = assignments.reduce((sum, a) => sum + a.student.currentRiskScore, 0);
    const avgRiskScore = totalStudents > 0 ? Math.round(totalRisk / totalStudents) : 0;

    // Total tasks completed by assigned students
    const studentIds = assignments.map(a => a.studentId);
    const completedTasksCount = await prisma.task.count({
      where: {
        studentId: { in: studentIds },
        status: TaskStatus.DONE
      }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        redFlagsCount,
        avgRiskScore,
        completedTasksCount
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new KnowledgeUnit.
 */
export async function createKnowledgeUnit(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const mentorId = req.user?.mentorId;
    if (!mentorId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Mentor.');
    }

    const data = knowledgeUnitSchema.parse(req.body);

    const unit = await prisma.knowledgeUnit.create({
      data: {
        mentorId,
        title: data.title,
        content: data.content,
        skillId: data.skillId,
        difficulty: data.difficulty,
        isPublic: data.isPublic
      },
      include: {
        skill: true
      }
    });

    res.status(201).json({ success: true, unit });
  } catch (error) {
    next(error);
  }
}

/**
 * Update KnowledgeUnit.
 */
export async function updateKnowledgeUnit(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const mentorId = req.user?.mentorId;
    const { id } = req.params;

    if (!mentorId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Mentor.');
    }

    const unit = await prisma.knowledgeUnit.findUnique({ where: { id } });
    if (!unit || unit.mentorId !== mentorId) {
      throw new ApiError(404, 'Không tìm thấy tài liệu hoặc bạn không có quyền.');
    }

    const data = knowledgeUnitSchema.partial().parse(req.body);

    const updatedUnit = await prisma.knowledgeUnit.update({
      where: { id },
      data: {
        title: data.title !== undefined ? data.title : undefined,
        content: data.content !== undefined ? data.content : undefined,
        skillId: data.skillId !== undefined ? data.skillId : undefined,
        difficulty: data.difficulty !== undefined ? data.difficulty : undefined,
        isPublic: data.isPublic !== undefined ? data.isPublic : undefined
      },
      include: {
        skill: true
      }
    });

    res.status(200).json({ success: true, unit: updatedUnit });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete KnowledgeUnit.
 */
export async function deleteKnowledgeUnit(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const mentorId = req.user?.mentorId;
    const { id } = req.params;

    if (!mentorId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Mentor.');
    }

    const unit = await prisma.knowledgeUnit.findUnique({ where: { id } });
    if (!unit || unit.mentorId !== mentorId) {
      throw new ApiError(404, 'Không tìm thấy tài liệu hoặc bạn không có quyền.');
    }

    await prisma.knowledgeUnit.delete({ where: { id } });

    res.status(200).json({ success: true, message: 'Đã xóa tài liệu học tập thành công.' });
  } catch (error) {
    next(error);
  }
}

/**
 * List KnowledgeUnits created by mentor.
 */
export async function getKnowledgeUnits(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const mentorId = req.user?.mentorId;
    if (!mentorId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Mentor.');
    }

    const { skillId, difficulty, q } = req.query;

    const whereClause: any = { mentorId };
    if (skillId) {
      whereClause.skillId = skillId as string;
    }
    if (difficulty) {
      whereClause.difficulty = difficulty as Difficulty;
    }
    if (q) {
      whereClause.title = { contains: q as string, mode: 'insensitive' };
    }

    const units = await prisma.knowledgeUnit.findMany({
      where: whereClause,
      include: { skill: true },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, units });
  } catch (error) {
    next(error);
  }
}

/**
 * Create QuizQuestion.
 */
export async function createQuizQuestion(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const mentorId = req.user?.mentorId;
    if (!mentorId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Mentor.');
    }

    const data = quizQuestionSchema.parse(req.body);

    const question = await prisma.quizQuestion.create({
      data: {
        mentorId,
        question: data.question,
        type: data.type,
        options: JSON.stringify(data.options),
        explanation: data.explanation,
        difficulty: data.difficulty,
        skillId: data.skillId
      },
      include: {
        skill: true
      }
    });

    const parsedQuestion = {
      ...question,
      options: typeof question.options === 'string' ? JSON.parse(question.options) : question.options
    };

    res.status(201).json({ success: true, question: parsedQuestion });
  } catch (error) {
    next(error);
  }
}

/**
 * Update QuizQuestion.
 */
export async function updateQuizQuestion(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const mentorId = req.user?.mentorId;
    const { id } = req.params;

    if (!mentorId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Mentor.');
    }

    const question = await prisma.quizQuestion.findUnique({ where: { id } });
    if (!question || question.mentorId !== mentorId) {
      throw new ApiError(404, 'Không tìm thấy câu hỏi hoặc bạn không có quyền.');
    }

    const data = quizQuestionSchema.partial().parse(req.body);

    const updatedQuestion = await prisma.quizQuestion.update({
      where: { id },
      data: {
        question: data.question !== undefined ? data.question : undefined,
        type: data.type !== undefined ? data.type : undefined,
        options: data.options !== undefined ? JSON.stringify(data.options) : undefined,
        explanation: data.explanation !== undefined ? data.explanation : undefined,
        difficulty: data.difficulty !== undefined ? data.difficulty : undefined,
        skillId: data.skillId !== undefined ? data.skillId : undefined
      },
      include: {
        skill: true
      }
    });

    const parsedQuestion = {
      ...updatedQuestion,
      options: typeof updatedQuestion.options === 'string' ? JSON.parse(updatedQuestion.options) : updatedQuestion.options
    };

    res.status(200).json({ success: true, question: parsedQuestion });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete QuizQuestion.
 */
export async function deleteQuizQuestion(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const mentorId = req.user?.mentorId;
    const { id } = req.params;

    if (!mentorId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Mentor.');
    }

    const question = await prisma.quizQuestion.findUnique({ where: { id } });
    if (!question || question.mentorId !== mentorId) {
      throw new ApiError(404, 'Không tìm thấy câu hỏi hoặc bạn không có quyền.');
    }

    await prisma.quizQuestion.delete({ where: { id } });

    res.status(200).json({ success: true, message: 'Đã xóa câu hỏi thành công.' });
  } catch (error) {
    next(error);
  }
}

/**
 * List QuizQuestions created by mentor.
 */
export async function getQuizQuestions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const mentorId = req.user?.mentorId;
    if (!mentorId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Mentor.');
    }

    const { skillId, type } = req.query;

    const whereClause: any = { mentorId };
    if (skillId) {
      whereClause.skillId = skillId as string;
    }
    if (type) {
      whereClause.type = type as QuizType;
    }

    const questions = await prisma.quizQuestion.findMany({
      where: whereClause,
      include: { skill: true },
      orderBy: { createdAt: 'desc' }
    });

    const parsedQuestions = questions.map(q => ({
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
    }));

    res.status(200).json({ success: true, questions: parsedQuestions });
  } catch (error) {
    next(error);
  }
}

/**
 * AI generate quiz questions from KnowledgeUnit content.
 */
export async function aiGenerateQuizQuestions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const mentorId = req.user?.mentorId;
    if (!mentorId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Mentor.');
    }

    const { knowledgeUnitId, count } = aiGenerateQuizFormat(req.body);

    const unit = await prisma.knowledgeUnit.findUnique({
      where: { id: knowledgeUnitId },
      include: { skill: true }
    });

    if (!unit) {
      throw new ApiError(404, 'Không tìm thấy tài liệu học tập.');
    }

    // Call Gemini service to generate quiz questions based on the content
    const quizSuggestions = await generateQuiz(unit.content, unit.skill.name, count);

    const createdQuestions = [];
    for (const q of quizSuggestions) {
      let difficultyEnum: Difficulty = Difficulty.EASY;
      if (q.difficulty === 'MEDIUM') difficultyEnum = Difficulty.MEDIUM;
      if (q.difficulty === 'HARD') difficultyEnum = Difficulty.HARD;
      if (q.difficulty === 'EXPERT') difficultyEnum = Difficulty.EXPERT;

      const created = await prisma.quizQuestion.create({
        data: {
          mentorId,
          skillId: unit.skillId,
          question: q.question,
          type: QuizType.SINGLE_CHOICE,
          options: JSON.stringify(q.options),
          explanation: q.explanation,
          difficulty: difficultyEnum
        },
        include: {
          skill: true
        }
      });
      createdQuestions.push(created);
    }

    const parsedQuestions = createdQuestions.map(q => ({
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
    }));

    res.status(200).json({
      success: true,
      questions: parsedQuestions
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Helper parser for AI quiz generation payload.
 */
function aiGenerateQuizFormat(body: any) {
  return aiGenerateQuizSchema.parse(body);
}

/**
 * Send a manual academic Alert to a student.
 */
export async function sendManualAlert(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const mentorId = req.user?.mentorId;
    if (!mentorId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Mentor.');
    }

    const { studentId, type, message } = manualAlertSchema.parse(req.body);

    // Verify assignment
    const assignment = await prisma.mentorStudent.findUnique({
      where: {
        studentId_mentorId: { studentId, mentorId }
      }
    });

    if (!assignment) {
      throw new ApiError(403, 'Sinh viên này không thuộc quyền quản lý của bạn.');
    }

    const alert = await prisma.alert.create({
      data: {
        studentId,
        type,
        message
      }
    });

    // We can also trigger a Socket.IO message, but the service handles db alert logging
    // Let's import Socket.IO instance and emit if available
    // (Real-time alerting is automatically handled upon critical events)

    res.status(201).json({
      success: true,
      alert
    });
  } catch (error) {
    next(error);
  }
}
