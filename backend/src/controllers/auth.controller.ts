import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../prisma/client';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { z } from 'zod';
import { sendOTP } from '../services/email.service';
import { ApiError } from '../utils/apiError';
import { Role } from '../types/enums';
import { generateInitialRoadmapTasks } from '../services/gemini.service';

const JWT_SECRET = process.env.JWT_SECRET || 'edupath_super_secret_key_change_me_in_production';

// Validation Schemas
const registerSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(8, 'Mật khẩu phải dài ít nhất 8 ký tự'),
  fullName: z.string().min(1, 'Họ và tên không được để trống')
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'Mã OTP phải có 6 chữ số')
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Mật khẩu không được bỏ trống')
});

const onboardingSchema = z.object({
  skillIds: z.array(z.string()).min(1, 'Bạn phải chọn ít nhất 1 kỹ năng'),
  goal: z.string().min(1, 'Mục tiêu học tập không được bỏ trống'),
  studyHours: z.number().optional().default(2),
  durationMonths: z.number().optional().default(3),
  mentorId: z.string().optional()
});

/**
 * Register a new user and send an OTP code via email.
 */
export async function register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      // Check if this user has ever verified an OTP (completed registration)
      const hasVerifiedOtp = await prisma.oTP.findFirst({
        where: { email: data.email, verified: true }
      });
      
      if (hasVerifiedOtp) {
        // User fully registered — block duplicate
        throw new ApiError(400, 'Email này đã được sử dụng.');
      }
      
      // User exists but never verified OTP — delete old record and allow re-registration
      await prisma.user.delete({ where: { id: existingUser.id } });
      // Also clean up old unverified OTPs
      await prisma.oTP.deleteMany({ where: { email: data.email, verified: false } });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Create user with default role STUDENT
    await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        fullName: data.fullName,
        role: Role.STUDENT,
        student: {
          create: {} // Create empty student record
        }
      }
    });

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    await prisma.oTP.create({
      data: {
        email: data.email,
        code: otpCode,
        expiresAt
      }
    });

    // Send OTP via email service
    await sendOTP(data.email, otpCode);

    // In DEV MODE (no SMTP configured), include OTP in response for testing
    const isDevMode = !process.env.SMTP_HOST || process.env.SMTP_USER === 'mock_user';
    
    res.status(200).json({
      success: true,
      message: isDevMode 
        ? `[DEV] Mã OTP của bạn là: ${otpCode}` 
        : 'Mã OTP đã được gửi đến email của bạn.',
      ...(isDevMode && { otpCode })
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Verify OTP and activate JWT Session.
 */
export async function verifyOtp(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, code } = verifyOtpSchema.parse(req.body);

    const otpRecord = await prisma.oTP.findFirst({
      where: {
        email,
        code,
        verified: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (!otpRecord) {
      throw new ApiError(400, 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    }

    // Mark OTP as verified
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { verified: true }
    });

    const user = await prisma.user.findUnique({
      where: { email },
      include: { student: true, mentor: true }
    });

    if (!user) {
      throw new ApiError(404, 'Người dùng không tồn tại.');
    }

    // Generate JWT Token (valid for 7 days)
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        studentId: user.student?.id,
        mentorId: user.mentor?.id,
        student: user.student ? {
          id: user.student.id,
          learningGoal: user.student.learningGoal,
          totalFocusTime: user.student.totalFocusTime,
          currentRiskScore: user.student.currentRiskScore,
          onboardingCompleted: user.student.onboardingCompleted
        } : undefined
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Login handler. Returns token and user context.
 */
export async function login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { student: true, mentor: true }
    });

    if (!user) {
      throw new ApiError(401, 'Email hoặc mật khẩu không chính xác.');
    }

    if (!user.password) {
      throw new ApiError(401, 'Tài khoản này được đăng nhập thông qua Google, vui lòng sử dụng Google Login.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Email hoặc mật khẩu không chính xác.');
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        studentId: user.student?.id,
        mentorId: user.mentor?.id,
        student: user.student ? {
          id: user.student.id,
          learningGoal: user.student.learningGoal,
          totalFocusTime: user.student.totalFocusTime,
          currentRiskScore: user.student.currentRiskScore,
          onboardingCompleted: user.student.onboardingCompleted
        } : undefined
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Logout handler. Clears the JWT cookie.
 */
export async function logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.clearCookie('token');
    res.status(200).json({ success: true, message: 'Đăng xuất thành công' });
  } catch (error) {
    next(error);
  }
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Google Login handler.
 */
export async function googleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { credential } = req.body;
    if (!credential) {
      throw new ApiError(400, 'Không tìm thấy Google token.');
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new ApiError(400, 'Xác thực Google thất bại.');
    }

    const email = payload.email;
    const fullName = payload.name || 'Người dùng Google';
    const googleId = payload.sub;

    let user = await prisma.user.findUnique({
      where: { email },
      include: { student: true, mentor: true }
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          fullName,
          googleId,
          role: Role.STUDENT,
          student: {
            create: {
              onboardingCompleted: false
            }
          }
        },
        include: { student: true, mentor: true }
      });
    } else {
      // Update existing user with googleId if they didn't have one
      if (!user.googleId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { googleId }
        });
      }
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        studentId: user.student?.id,
        mentorId: user.mentor?.id,
        student: user.student ? {
          id: user.student.id,
          learningGoal: user.student.learningGoal,
          totalFocusTime: user.student.totalFocusTime,
          currentRiskScore: user.student.currentRiskScore,
          onboardingCompleted: user.student.onboardingCompleted
        } : undefined
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Onboarding survey completion for STUDENT actors.
 */
export async function completeOnboarding(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { skillIds, goal, studyHours, durationMonths, mentorId } = onboardingSchema.parse(req.body);
    const studentId = req.user?.studentId;

    if (!studentId) {
      throw new ApiError(400, 'Không tìm thấy thông tin Student cho tài khoản này.');
    }

    // 0. CLEAR OLD DATA to ensure fresh start (Fix for Radar Chart showing hardcoded skills)
    await prisma.skillMastery.deleteMany({
      where: { studentId }
    });
    await prisma.task.deleteMany({
      where: { studentId }
    });

    // 1. Initialize SkillMastery for selected skills
    const masteriesData = skillIds.map(skillId => ({
      studentId,
      skillId,
      masteryLevel: 0.3, // default mastery level
      pLearn: 0.4,
      pForget: 0.1,
      pGuess: 0.2,
      pSlip: 0.1
    }));

    await prisma.skillMastery.createMany({
      data: masteriesData
    });

    // 2. Assign Mentor if specified
    if (mentorId) {
      await prisma.mentorStudent.upsert({
        where: {
          studentId_mentorId: {
            studentId,
            mentorId
          }
        },
        update: {},
        create: {
          studentId,
          mentorId
        }
      });
    }

    // 3. Generate Initial AI Roadmap Tasks
    const selectedSkills = await prisma.skill.findMany({
      where: { id: { in: skillIds } }
    });

    const aiSkillsContext = selectedSkills.map(s => ({
      name: s.name,
      domain: s.domain
    }));

    const formattedGoal = `${goal} (Mục tiêu học tập: ${studyHours} giờ/ngày trong ${durationMonths} tháng)`;

    if (aiSkillsContext.length > 0) {
      try {
        const taskSuggestions = await generateInitialRoadmapTasks(
          aiSkillsContext,
          goal,
          studyHours,
          durationMonths
        );

        const tasksToCreate = taskSuggestions.map((suggestion, index) => {
          let matchedSkillId = selectedSkills[0].id;
          const matchedSkill = selectedSkills.find(s => s.name.toLowerCase() === suggestion.skillName.toLowerCase());
          if (matchedSkill) matchedSkillId = matchedSkill.id;

          // Spread tasks across timeline
          const deadline = new Date();
          deadline.setDate(deadline.getDate() + index + 1);

          return {
            studentId,
            title: suggestion.title,
            description: suggestion.reason,
            skillId: matchedSkillId,
            status: 'PENDING' as const,
            difficulty: (suggestion.difficulty as any) || 'MEDIUM',
            estimatedMinutes: suggestion.estimatedMinutes || 60,
            deadline: deadline,
            isManualOverride: false,
            manualOrder: 0
          };
        });

        if (tasksToCreate.length > 0) {
          await prisma.task.createMany({
            data: tasksToCreate
          });
        }
      } catch (aiError) {
        console.error('Failed to generate initial tasks:', aiError);
      }
    }

    // 4. Update student onboarding status and goals
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        learningGoal: formattedGoal,
        onboardingCompleted: true
      }
    });

    res.status(200).json({
      success: true,
      student: updatedStudent
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieves the current authenticated user context details.
 */
export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: { student: true, mentor: true }
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        studentId: user.student?.id,
        mentorId: user.mentor?.id,
        student: user.student ? {
          id: user.student.id,
          learningGoal: user.student.learningGoal,
          totalFocusTime: user.student.totalFocusTime,
          currentRiskScore: user.student.currentRiskScore,
          onboardingCompleted: user.student.onboardingCompleted
        } : undefined
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Updates the current authenticated user's profile settings.
 */
export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'Chưa xác thực người dùng.');
    }

    const { fullName, learningGoal, avatarUrl } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { student: true }
    });

    if (!user) {
      throw new ApiError(404, 'Không tìm thấy tài khoản người dùng.');
    }

    // Update User Fullname, Avatar and nested Student profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: fullName || undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
        student: user.role === Role.STUDENT && user.student ? {
          update: {
            learningGoal: learningGoal !== undefined ? learningGoal : undefined
          }
        } : undefined
      },
      include: { student: true, mentor: true }
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin cá nhân thành công!',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        studentId: updatedUser.student?.id,
        mentorId: updatedUser.mentor?.id,
        student: updatedUser.student ? {
          id: updatedUser.student.id,
          learningGoal: updatedUser.student.learningGoal,
          totalFocusTime: updatedUser.student.totalFocusTime,
          currentRiskScore: updatedUser.student.currentRiskScore,
          onboardingCompleted: updatedUser.student.onboardingCompleted
        } : undefined
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Upload avatar logic
 */
export async function uploadAvatar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'Chưa xác thực người dùng.');
    }

    if (!req.file) {
      throw new ApiError(400, 'Không tìm thấy file ảnh.');
    }

    const avatarUrl = `/uploads/${req.file.filename}`;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl }
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật ảnh đại diện thành công.',
      avatarUrl: updatedUser.avatarUrl
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Change password
 */
const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Vui lòng nhập mật khẩu cũ'),
  newPassword: z.string().min(8, 'Mật khẩu mới phải dài ít nhất 8 ký tự')
});

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'Chưa xác thực người dùng.');
    }

    const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, 'Người dùng không tồn tại.');
    if (!user.password) throw new ApiError(400, 'Tài khoản Google không thể đổi mật khẩu tại đây.');

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) throw new ApiError(400, 'Mật khẩu cũ không chính xác.');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công.' });
  } catch (error) {
    next(error);
  }
}

/**
 * Forgot password
 */
const forgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ')
});

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new ApiError(404, 'Email chưa được đăng ký trong hệ thống.');
    if (!user.password) throw new ApiError(400, 'Tài khoản Google không thể cấp lại mật khẩu.');

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.oTP.create({
      data: { email, code: otpCode, expiresAt }
    });

    await sendOTP(email, otpCode);

    const isDevMode = !process.env.SMTP_HOST || process.env.SMTP_USER === 'mock_user';
    res.status(200).json({ 
      success: true, 
      message: isDevMode 
        ? `[DEV] Mã OTP khôi phục: ${otpCode}` 
        : 'Mã OTP khôi phục mật khẩu đã được gửi đến email của bạn.',
      ...(isDevMode && { otpCode })
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reset password
 */
const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'Mã OTP phải gồm 6 số'),
  newPassword: z.string().min(8, 'Mật khẩu mới phải dài ít nhất 8 ký tự')
});

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, code, newPassword } = resetPasswordSchema.parse(req.body);

    const otpRecord = await prisma.oTP.findFirst({
      where: { email, code, verified: false, expiresAt: { gt: new Date() } }
    });

    if (!otpRecord) throw new ApiError(400, 'Mã OTP không hợp lệ hoặc đã hết hạn.');

    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { verified: true }
    });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    res.status(200).json({ success: true, message: 'Khôi phục mật khẩu thành công. Vui lòng đăng nhập lại.' });
  } catch (error) {
    next(error);
  }
}
