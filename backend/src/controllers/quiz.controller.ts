import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../prisma/client';
import { z } from 'zod';
import { ApiError } from '../utils/apiError';
import { Difficulty } from '../types/enums';
import { updateMastery } from '../utils/bktAlgorithm';
import { recalculate } from '../services/risk.service';
import { emitRedFlag } from '../services/socket.service';
import { generateQuiz } from '../services/gemini.service';

const submitQuizSchema = z.object({
  questionId: z.string().min(1, 'questionId không được để trống'),
  selectedOption: z.number().int().min(0, 'selectedOption không hợp lệ'),
  timeSpentSec: z.number().int().min(0).default(10)
});

/**
 * Get random questions for a skill.
 * Query parameters: difficulty, limit
 */
export async function getQuestions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { skillId } = req.params;
    const { difficulty, limit } = req.query;

    const whereClause: any = { skillId };
    if (difficulty) {
      whereClause.difficulty = difficulty as Difficulty;
    }

    const limitNum = limit ? parseInt(limit as string, 10) : 5;

    let totalCount = await prisma.quizQuestion.count({
      where: whereClause
    });

    if (totalCount < limitNum) {
      console.log(`Need dynamic questions for skillId ${skillId}. Insufficient quantity.`);
      
      const skill = await prisma.skill.findUnique({ where: { id: skillId } });
      const unit = await prisma.knowledgeUnit.findFirst({ where: { skillId } });
      const mentor = await prisma.mentor.findFirst();

      if (skill) {
        const countToGenerate = Math.max(limitNum * 2, 10);
        console.log(`Calling Gemini API to generate ${countToGenerate} questions for ${skill.name}...`);
        
        try {
          const generatedQs = await generateQuiz(unit?.content || '', skill.name, countToGenerate);
          
          for (const q of generatedQs) {
            await prisma.quizQuestion.create({
              data: {
                skillId,
                mentorId: mentor?.id || '',
                question: q.question,
                options: JSON.stringify(q.options),
                explanation: q.explanation,
                difficulty: q.difficulty || 'MEDIUM',
                type: 'SINGLE_CHOICE'
              }
            });
          }
        } catch (error) {
          console.error("AI Generation failed:", error);
          if (totalCount === 0) {
            throw new ApiError(503, "Dịch vụ AI tạo câu hỏi tạm thời không khả dụng. Vui lòng thử lại sau.");
          }
        }
      }
    }

    // Shuffle questions using Database RANDOM() for memory efficiency
    let selectedQuestions: any[];
    if (difficulty) {
      selectedQuestions = await prisma.$queryRaw`
        SELECT * FROM "QuizQuestion" 
        WHERE "skillId" = ${skillId} AND "difficulty"::text = ${difficulty}
        ORDER BY RANDOM() 
        LIMIT ${limitNum}
      `;
    } else {
      selectedQuestions = await prisma.$queryRaw`
        SELECT * FROM "QuizQuestion" 
        WHERE "skillId" = ${skillId} 
        ORDER BY RANDOM() 
        LIMIT ${limitNum}
      `;
    }

    // Map questions to omit answer configurations if needed, or return all
    // Since student needs option text, but we shouldn't leak the isCorrect flag!
    // Let's strip the isCorrect flag from options when sending to student
    const sanitizedQuestions = selectedQuestions.map(q => {
      const optionsArray = (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) as Array<{ text: string; isCorrect: boolean }>;
      const sanitizedOptions = optionsArray.map(opt => ({ text: opt.text }));
      return {
        ...q,
        options: sanitizedOptions
      };
    });

    res.status(200).json({
      success: true,
      questions: sanitizedQuestions
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Submit a single quiz question answer.
 * Triggers BKT mastery update and student risk recalculation.
 */
export async function submitAnswer(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    const { questionId, selectedOption, timeSpentSec } = submitQuizSchema.parse(req.body);

    // 1. Find the question
    const question = await prisma.quizQuestion.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      throw new ApiError(404, 'Không tìm thấy câu hỏi.');
    }

    const options = (typeof question.options === 'string' ? JSON.parse(question.options) : question.options) as Array<{ text: string; isCorrect: boolean }>;
    if (selectedOption < 0 || selectedOption >= options.length) {
      throw new ApiError(400, 'Lựa chọn đáp án vượt quá danh sách.');
    }

    // 2. Check correctness
    const isCorrect = options[selectedOption].isCorrect === true;

    // 3. Save QuizAttempt record
    await prisma.quizAttempt.create({
      data: {
        studentId,
        questionId,
        selectedOption,
        isCorrect,
        timeSpentSec
      }
    });

    // 4. Retrieve or create SkillMastery for this skill
    let mastery = await prisma.skillMastery.findUnique({
      where: {
        studentId_skillId: {
          studentId,
          skillId: question.skillId
        }
      }
    });

    if (!mastery) {
      mastery = await prisma.skillMastery.create({
        data: {
          studentId,
          skillId: question.skillId,
          masteryLevel: 0.3,
          pLearn: 0.4,
          pForget: 0.1,
          pGuess: 0.2,
          pSlip: 0.1
        }
      });
    }

    const masteryBefore = mastery.masteryLevel;

    // 5. Update mastery score using BKT
    const masteryAfter = updateMastery(
      mastery.masteryLevel,
      mastery.pLearn,
      mastery.pForget,
      mastery.pGuess,
      mastery.pSlip,
      isCorrect
    );

    // Save updated mastery
    await prisma.skillMastery.update({
      where: { id: mastery.id },
      data: { masteryLevel: masteryAfter }
    });

    // 6. Log BKT history
    await prisma.bKTHistory.create({
      data: {
        masteryId: mastery.id,
        masteryBefore,
        masteryAfter,
        wasCorrect: isCorrect
      }
    });

    // 7. Recalculate academic risk score
    const newRiskScore = await recalculate(studentId);

    // 8. If risk score > 70%, trigger socket Red Flag broadcast
    if (newRiskScore > 70) {
      await emitRedFlag(studentId, newRiskScore);
    }

    res.status(200).json({
      success: true,
      isCorrect,
      explanation: question.explanation,
      correctOptionIndex: options.findIndex(o => o.isCorrect),
      masteryBefore,
      masteryAfter,
      masteryDelta: masteryAfter - masteryBefore,
      newRiskScore
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get student's quiz history.
 */
export async function getQuizHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    }

    const { skillId, limit } = req.query;

    const whereClause: any = { studentId };
    if (skillId) {
      whereClause.question = { skillId: skillId as string };
    }

    const limitNum = limit ? parseInt(limit as string, 10) : 20;

    const attempts = await prisma.quizAttempt.findMany({
      where: whereClause,
      include: {
        question: {
          include: {
            skill: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limitNum
    });

    res.status(200).json({
      success: true,
      attempts
    });
  } catch (error) {
    next(error);
  }
}
