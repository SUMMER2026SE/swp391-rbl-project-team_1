"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuestions = getQuestions;
exports.submitAnswer = submitAnswer;
exports.getQuizHistory = getQuizHistory;
const client_1 = __importDefault(require("../prisma/client"));
const zod_1 = require("zod");
const apiError_1 = require("../utils/apiError");
const bktAlgorithm_1 = require("../utils/bktAlgorithm");
const risk_service_1 = require("../services/risk.service");
const socket_service_1 = require("../services/socket.service");
const gemini_service_1 = require("../services/gemini.service");
const submitQuizSchema = zod_1.z.object({
    questionId: zod_1.z.string().min(1, 'questionId không được để trống'),
    selectedOption: zod_1.z.number().int().min(0, 'selectedOption không hợp lệ'),
    timeSpentSec: zod_1.z.number().int().min(0).default(10)
});
/**
 * Get random questions for a skill.
 * Query parameters: difficulty, limit
 */
async function getQuestions(req, res, next) {
    try {
        const { skillId } = req.params;
        const { difficulty, limit } = req.query;
        const whereClause = { skillId };
        if (difficulty) {
            whereClause.difficulty = difficulty;
        }
        const limitNum = limit ? parseInt(limit, 10) : 5;
        let totalCount = await client_1.default.quizQuestion.count({
            where: whereClause
        });
        if (totalCount < limitNum) {
            console.log(`Need dynamic questions for skillId ${skillId}. Insufficient quantity.`);
            const skill = await client_1.default.skill.findUnique({ where: { id: skillId } });
            const unit = await client_1.default.knowledgeUnit.findFirst({ where: { skillId } });
            const mentor = await client_1.default.mentor.findFirst();
            if (skill) {
                const countToGenerate = Math.max(limitNum * 2, 10);
                console.log(`Calling Gemini API to generate ${countToGenerate} questions for ${skill.name}...`);
                try {
                    const generatedQs = await (0, gemini_service_1.generateQuiz)(unit?.content || '', skill.name, countToGenerate);
                    for (const q of generatedQs) {
                        await client_1.default.quizQuestion.create({
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
                }
                catch (error) {
                    console.error("AI Generation failed:", error);
                    if (totalCount === 0) {
                        throw new apiError_1.ApiError(503, "Dịch vụ AI tạo câu hỏi tạm thời không khả dụng. Vui lòng thử lại sau.");
                    }
                }
            }
        }
        // Shuffle questions using Database RANDOM() for memory efficiency
        let selectedQuestions;
        if (difficulty) {
            selectedQuestions = await client_1.default.$queryRaw `
        SELECT * FROM "QuizQuestion" 
        WHERE "skillId" = ${skillId} AND "difficulty"::text = ${difficulty}
        ORDER BY RANDOM() 
        LIMIT ${limitNum}
      `;
        }
        else {
            selectedQuestions = await client_1.default.$queryRaw `
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
            const optionsArray = (typeof q.options === 'string' ? JSON.parse(q.options) : q.options);
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
    }
    catch (error) {
        next(error);
    }
}
/**
 * Submit a single quiz question answer.
 * Triggers BKT mastery update and student risk recalculation.
 */
async function submitAnswer(req, res, next) {
    try {
        const studentId = req.user?.studentId;
        if (!studentId) {
            throw new apiError_1.ApiError(400, 'Không tìm thấy thông tin Student.');
        }
        const { questionId, selectedOption, timeSpentSec } = submitQuizSchema.parse(req.body);
        // 1. Find the question
        const question = await client_1.default.quizQuestion.findUnique({
            where: { id: questionId }
        });
        if (!question) {
            throw new apiError_1.ApiError(404, 'Không tìm thấy câu hỏi.');
        }
        const options = (typeof question.options === 'string' ? JSON.parse(question.options) : question.options);
        if (selectedOption < 0 || selectedOption >= options.length) {
            throw new apiError_1.ApiError(400, 'Lựa chọn đáp án vượt quá danh sách.');
        }
        // 2. Check correctness
        const isCorrect = options[selectedOption].isCorrect === true;
        // 3. Save QuizAttempt record
        await client_1.default.quizAttempt.create({
            data: {
                studentId,
                questionId,
                selectedOption,
                isCorrect,
                timeSpentSec
            }
        });
        // 4. Retrieve or create SkillMastery for this skill
        let mastery = await client_1.default.skillMastery.findUnique({
            where: {
                studentId_skillId: {
                    studentId,
                    skillId: question.skillId
                }
            }
        });
        if (!mastery) {
            mastery = await client_1.default.skillMastery.create({
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
        const masteryAfter = (0, bktAlgorithm_1.updateMastery)(mastery.masteryLevel, mastery.pLearn, mastery.pForget, mastery.pGuess, mastery.pSlip, isCorrect);
        // Save updated mastery
        await client_1.default.skillMastery.update({
            where: { id: mastery.id },
            data: { masteryLevel: masteryAfter }
        });
        // 6. Log BKT history
        await client_1.default.bKTHistory.create({
            data: {
                masteryId: mastery.id,
                masteryBefore,
                masteryAfter,
                wasCorrect: isCorrect
            }
        });
        // 7. Recalculate academic risk score
        const newRiskScore = await (0, risk_service_1.recalculate)(studentId);
        // 8. If risk score > 70%, trigger socket Red Flag broadcast
        if (newRiskScore > 70) {
            await (0, socket_service_1.emitRedFlag)(studentId, newRiskScore);
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
    }
    catch (error) {
        next(error);
    }
}
/**
 * Get student's quiz history.
 */
async function getQuizHistory(req, res, next) {
    try {
        const studentId = req.user?.studentId;
        if (!studentId) {
            throw new apiError_1.ApiError(400, 'Không tìm thấy thông tin Student.');
        }
        const { skillId, limit } = req.query;
        const whereClause = { studentId };
        if (skillId) {
            whereClause.question = { skillId: skillId };
        }
        const limitNum = limit ? parseInt(limit, 10) : 20;
        const attempts = await client_1.default.quizAttempt.findMany({
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
    }
    catch (error) {
        next(error);
    }
}
