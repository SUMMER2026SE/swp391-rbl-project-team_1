import { Response, NextFunction } from 'express';
import prisma from '../prisma/client';
import { ApiError } from '../utils/apiError';
import { AuthRequest } from '../middleware/auth.middleware';
import { chatWithAI } from '../services/gemini.service';
import { recalculate } from '../services/risk.service';
import { sortByPriority } from '../utils/priorityScheduler';

/**
 * GET /chat/conversations — List all conversations for the student
 */
export async function listConversations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) throw new ApiError(400, 'Không tìm thấy thông tin Student.');

    const conversations = await prisma.chatConversation.findMany({
      where: { studentId },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1 // last message preview
        }
      }
    });

    res.status(200).json({ success: true, conversations });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /chat/conversations/latest — Load the most recent conversation with full messages
 */
export async function getLatestConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) throw new ApiError(400, 'Không tìm thấy thông tin Student.');

    const conversation = await prisma.chatConversation.findFirst({
      where: { studentId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    res.status(200).json({ success: true, conversation: conversation ?? null });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /chat/conversations/:id — Load a specific conversation with all messages
 */
export async function getConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    const { id } = req.params;
    if (!studentId) throw new ApiError(400, 'Không tìm thấy thông tin Student.');

    const conversation = await prisma.chatConversation.findFirst({
      where: { id, studentId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!conversation) throw new ApiError(404, 'Không tìm thấy cuộc trò chuyện.');

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /chat/conversations — Create a new conversation
 */
export async function createConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) throw new ApiError(400, 'Không tìm thấy thông tin Student.');

    const { title } = req.body;

    const conversation = await prisma.chatConversation.create({
      data: {
        studentId,
        title: title?.trim() || 'Cuộc trò chuyện mới'
      }
    });

    res.status(201).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /chat/conversations/:id — Update conversation title
 */
export async function updateConversationTitle(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    const { id } = req.params;
    const { title } = req.body;
    if (!studentId) throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    if (!title?.trim()) throw new ApiError(400, 'Tiêu đề không được để trống.');

    const conversation = await prisma.chatConversation.updateMany({
      where: { id, studentId },
      data: { title: title.trim() }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /chat/conversations/:id/messages — Save a message to a conversation
 */
export async function saveMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    const { id: conversationId } = req.params;
    const { role, content, functionCalled } = req.body;

    if (!studentId) throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    if (!role || !content) throw new ApiError(400, 'Thiếu role hoặc content.');
    if (!['USER', 'ASSISTANT'].includes(role)) throw new ApiError(400, 'Role không hợp lệ.');

    // Verify ownership
    const conv = await prisma.chatConversation.findFirst({
      where: { id: conversationId, studentId }
    });
    if (!conv) throw new ApiError(404, 'Không tìm thấy cuộc trò chuyện.');

    // Save message
    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        role: role as 'USER' | 'ASSISTANT',
        content,
        functionCalled: functionCalled ?? null
      }
    });

    // Update conversation's updatedAt and auto-set title from first user message
    const messageCount = await prisma.chatMessage.count({ where: { conversationId } });
    if (messageCount === 1 && role === 'USER') {
      const autoTitle = content.length > 50 ? content.substring(0, 47) + '...' : content;
      await prisma.chatConversation.update({
        where: { id: conversationId },
        data: { title: autoTitle, updatedAt: new Date() }
      });
    } else {
      await prisma.chatConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      });
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /chat/conversations/:id/ask — Send message to Gemini AI and save both messages
 */
export async function askAI(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    const { id: conversationId } = req.params;
    const { content } = req.body;

    if (!studentId) throw new ApiError(400, 'Không tìm thấy thông tin Student.');
    if (!content?.trim()) throw new ApiError(400, 'Tin nhắn không được để trống.');

    // Verify conversation ownership
    const conv = await prisma.chatConversation.findFirst({
      where: { id: conversationId, studentId }
    });
    if (!conv) throw new ApiError(404, 'Không tìm thấy cuộc trò chuyện.');

    // 1. Save user message immediately
    const userMsg = await prisma.chatMessage.create({
      data: {
        conversationId,
        role: 'USER',
        content: content.trim()
      }
    });

    // Auto-set title from first user message
    const msgCount = await prisma.chatMessage.count({ where: { conversationId } });
    if (msgCount === 1) {
      const autoTitle = content.length > 50 ? content.substring(0, 47) + '...' : content.trim();
      await prisma.chatConversation.update({
        where: { id: conversationId },
        data: { title: autoTitle }
      });
    }

    // 2. Fetch student's active skill masteries for context
    const masteries = await prisma.skillMastery.findMany({
      where: { studentId, isActive: true },
      include: { skill: true },
      take: 10
    });
    const skillContext = masteries.map(m => m.skill.name);

    // 3. Fetch last 10 messages (excluding the one just saved) for conversation context
    const recentMessages = await prisma.chatMessage.findMany({
      where: { conversationId, id: { not: userMsg.id } },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    const orderedHistory = recentMessages
      .reverse()
      .map(m => ({ role: m.role as 'USER' | 'ASSISTANT', content: m.content }));

    // 4. Implement Executor for Function Calling
    const executor = async (name: string, args: Record<string, any>) => {
      switch (name) {
        case 'createTask': {
          const { title, skillName, difficulty = 'MEDIUM', estimatedMinutes = 25 } = args;
          const activeMasteries = await prisma.skillMastery.findMany({
            where: { studentId, isActive: true },
            include: { skill: true }
          });
          const match = activeMasteries.find(m => m.skill.name.toLowerCase().includes(skillName.toLowerCase()));
          if (!match) {
            return { error: `Không tìm thấy kỹ năng nào khớp với '${skillName}'. Vui lòng hỏi lại người dùng để xác nhận kỹ năng đang học.` };
          }
          
          let diffEnum = 'MEDIUM';
          if (['EASY', 'MEDIUM', 'HARD', 'EXPERT'].includes(difficulty?.toUpperCase())) {
            diffEnum = difficulty.toUpperCase();
          }

          const task = await prisma.task.create({
            data: {
              studentId,
              title,
              skillId: match.skillId,
              difficulty: diffEnum as any,
              estimatedMinutes,
              status: 'TODO',
              isAIGenerated: true,
              isManualOverride: false
            }
          });
          return { success: true, message: `Đã tạo task thành công.`, taskId: task.id, skillName: match.skill.name };
        }
        case 'getMyProgress': {
          const { skillName } = args;
          const activeMasteries = await prisma.skillMastery.findMany({
            where: { studentId, isActive: true },
            include: { skill: true }
          });
          
          let target = activeMasteries;
          if (skillName) {
            target = activeMasteries.filter(m => m.skill.name.toLowerCase().includes(skillName.toLowerCase()));
          }
          
          if (target.length === 0) {
            return { error: 'Không tìm thấy dữ liệu tiến độ cho kỹ năng này.' };
          }
          
          return {
            progress: target.map(m => ({
              skill: m.skill.name,
              masteryLevel: m.masteryLevel,
              domain: m.skill.domain
            }))
          };
        }
        case 'startPomodoro': {
          const { taskTitle } = args;
          let taskId = null;
          if (taskTitle) {
            const taskMatch = await prisma.task.findFirst({
              where: { studentId, title: { contains: taskTitle, mode: 'insensitive' } }
            });
            if (taskMatch) taskId = taskMatch.id;
          }
          
          const session = await prisma.pomodoroSession.create({
            data: {
              studentId,
              taskId,
              durationMin: 25,
              completed: false
            }
          });
          return { success: true, message: `Đã kích hoạt phiên Pomodoro 25 phút.`, sessionId: session.id };
        }
        case 'addRoadmapStep': {
          const { title, skillName, difficulty = 'MEDIUM', estimatedMinutes = 25 } = args;
          const activeMasteries = await prisma.skillMastery.findMany({
            where: { studentId, isActive: true },
            include: { skill: true }
          });
          const match = activeMasteries.find(m => m.skill.name.toLowerCase().includes(skillName.toLowerCase()));
          if (!match) {
            return { error: `Không tìm thấy kỹ năng nào khớp với '${skillName}'. Vui lòng hỏi lại người dùng để xác nhận kỹ năng đang học.` };
          }
          
          let diffEnum = 'MEDIUM';
          if (['EASY', 'MEDIUM', 'HARD', 'EXPERT'].includes(difficulty?.toUpperCase())) {
            diffEnum = difficulty.toUpperCase();
          }

          const currentManualTasks = await prisma.task.findMany({
            where: { studentId, isManualOverride: true },
            orderBy: { manualOrder: 'desc' },
            take: 1
          });
          let nextOrder = 0;
          if (currentManualTasks.length > 0 && currentManualTasks[0].manualOrder !== null) {
            nextOrder = currentManualTasks[0].manualOrder + 1;
          }

          const task = await prisma.task.create({
            data: {
              studentId,
              title,
              skillId: match.skillId,
              difficulty: diffEnum as any,
              estimatedMinutes,
              status: 'TODO',
              isAIGenerated: true,
              isManualOverride: true,
              manualOrder: nextOrder
            }
          });
          return { success: true, message: `Đã thêm bước lộ trình mới thành công.`, taskId: task.id, skillName: match.skill.name };
        }
        case 'getRiskStatus': {
          const riskScore = await recalculate(studentId);
          const latestHistory = await prisma.riskHistory.findFirst({
             where: { studentId },
             orderBy: { createdAt: 'desc' }
          });
          return {
             riskScore,
             factors: latestHistory ? {
               taskCompletionRate: latestHistory.taskCompletionRate,
               avgQuizScore: latestHistory.avgQuizScore,
               totalTimeSpentMinutes: latestHistory.totalTimeSpent
             } : null
          };
        }
        case 'suggestNextTask': {
          const tasks = await prisma.task.findMany({
            where: { studentId, status: 'TODO' },
            include: { skill: true }
          });
          if (tasks.length === 0) return { error: 'Không có task nào trong danh sách Cần Làm.' };

          const studentMasteries = await prisma.skillMastery.findMany({
            where: { studentId }
          });

          const mappedTasks = tasks.map(task => {
            const mastery = studentMasteries.find(m => m.skillId === task.skillId);
            const masteryLevel = mastery ? mastery.masteryLevel : 0.3;
            
            let diffNum = 1;
            if (task.difficulty === 'MEDIUM') diffNum = 2;
            if (task.difficulty === 'HARD') diffNum = 3;
            if (task.difficulty === 'EXPERT') diffNum = 4;

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

          const sortedSchedulerTasks = sortByPriority(schedulerTasks, new Date());
          if (sortedSchedulerTasks.length > 0) {
            const bestTaskRef = sortedSchedulerTasks[0];
            const bestTask = tasks.find(t => t.id === bestTaskRef.id);
            if (bestTask) {
              return {
                 suggestedTask: {
                   title: bestTask.title,
                   skillName: bestTask.skill.name,
                   deadline: bestTask.deadline,
                   difficulty: bestTask.difficulty
                 }
              };
            }
          }
          return { error: 'Không thể tính toán task tiếp theo.' };
        }
        default:
          return { error: `Function ${name} not implemented.` };
      }
    };

    // 5. Call Gemini AI
    let aiContent: string;
    let functionCalled: string | null = null;
    try {
      const result = await chatWithAI(content.trim(), skillContext, orderedHistory, executor);
      aiContent = result.text;
      if (result.functionCalled) functionCalled = result.functionCalled;
    } catch (aiError) {
      console.error('Chat AI error:', aiError);
      aiContent = 'Xin lỗi, tôi đang gặp sự cố kết nối, vui lòng thử lại sau 🙏';
    }

    // 6. Save AI response to DB
    const aiMsg = await prisma.chatMessage.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: aiContent,
        functionCalled: functionCalled ?? null
      }
    });

    // 7. Update conversation timestamp
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    res.status(200).json({
      success: true,
      userMessage: userMsg,
      aiMessage: aiMsg
    });
  } catch (error) {
    next(error);
  }
}
