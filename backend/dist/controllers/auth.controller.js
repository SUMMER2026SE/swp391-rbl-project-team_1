"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.verifyOtp = verifyOtp;
exports.login = login;
exports.logout = logout;
exports.googleLogin = googleLogin;
exports.completeOnboarding = completeOnboarding;
exports.getMe = getMe;
exports.updateProfile = updateProfile;
exports.uploadAvatar = uploadAvatar;
exports.changePassword = changePassword;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
const google_auth_library_1 = require("google-auth-library");
const client_1 = __importDefault(require("../prisma/client"));
const bcrypt = __importStar(require("bcrypt"));
const jwt = __importStar(require("jsonwebtoken"));
const zod_1 = require("zod");
const email_service_1 = require("../services/email.service");
const apiError_1 = require("../utils/apiError");
const enums_1 = require("../types/enums");
const JWT_SECRET = process.env.JWT_SECRET || 'edupath_super_secret_key_change_me_in_production';
// Validation Schemas
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email không đúng định dạng'),
    password: zod_1.z.string().min(8, 'Mật khẩu phải dài ít nhất 8 ký tự'),
    fullName: zod_1.z.string().min(1, 'Họ và tên không được để trống')
});
const verifyOtpSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    code: zod_1.z.string().length(6, 'Mã OTP phải có 6 chữ số')
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1, 'Mật khẩu không được bỏ trống')
});
const onboardingSchema = zod_1.z.object({
    skillIds: zod_1.z.array(zod_1.z.string()).min(1, 'Bạn phải chọn ít nhất 1 kỹ năng'),
    goal: zod_1.z.string().min(1, 'Mục tiêu học tập không được bỏ trống'),
    mentorId: zod_1.z.string().optional()
});
/**
 * Register a new user and send an OTP code via email.
 */
async function register(req, res, next) {
    try {
        const data = registerSchema.parse(req.body);
        // Check if user already exists
        const existingUser = await client_1.default.user.findUnique({ where: { email: data.email } });
        if (existingUser) {
            throw new apiError_1.ApiError(400, 'Email này đã được sử dụng.');
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        // Create user with default role STUDENT
        await client_1.default.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                fullName: data.fullName,
                role: enums_1.Role.STUDENT,
                student: {
                    create: {} // Create empty student record
                }
            }
        });
        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        await client_1.default.oTP.create({
            data: {
                email: data.email,
                code: otpCode,
                expiresAt
            }
        });
        // Send OTP via email service
        await (0, email_service_1.sendOTP)(data.email, otpCode);
        res.status(200).json({
            success: true,
            message: 'Mã OTP đã được gửi đến email của bạn.'
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Verify OTP and activate JWT Session.
 */
async function verifyOtp(req, res, next) {
    try {
        const { email, code } = verifyOtpSchema.parse(req.body);
        const otpRecord = await client_1.default.oTP.findFirst({
            where: {
                email,
                code,
                verified: false,
                expiresAt: { gt: new Date() }
            }
        });
        if (!otpRecord) {
            throw new apiError_1.ApiError(400, 'Mã OTP không hợp lệ hoặc đã hết hạn.');
        }
        // Mark OTP as verified
        await client_1.default.oTP.update({
            where: { id: otpRecord.id },
            data: { verified: true }
        });
        const user = await client_1.default.user.findUnique({
            where: { email },
            include: { student: true, mentor: true }
        });
        if (!user) {
            throw new apiError_1.ApiError(404, 'Người dùng không tồn tại.');
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
    }
    catch (error) {
        next(error);
    }
}
/**
 * Login handler. Returns token and user context.
 */
async function login(req, res, next) {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await client_1.default.user.findUnique({
            where: { email },
            include: { student: true, mentor: true }
        });
        if (!user) {
            throw new apiError_1.ApiError(401, 'Email hoặc mật khẩu không chính xác.');
        }
        if (!user.password) {
            throw new apiError_1.ApiError(401, 'Tài khoản này được đăng nhập thông qua Google, vui lòng sử dụng Google Login.');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new apiError_1.ApiError(401, 'Email hoặc mật khẩu không chính xác.');
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
    }
    catch (error) {
        next(error);
    }
}
/**
 * Logout handler. Clears the JWT cookie.
 */
async function logout(_req, res, next) {
    try {
        res.clearCookie('token');
        res.status(200).json({ success: true, message: 'Đăng xuất thành công' });
    }
    catch (error) {
        next(error);
    }
}
const googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
/**
 * Google Login handler.
 */
async function googleLogin(req, res, next) {
    try {
        const { credential } = req.body;
        if (!credential) {
            throw new apiError_1.ApiError(400, 'Không tìm thấy Google token.');
        }
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            throw new apiError_1.ApiError(400, 'Xác thực Google thất bại.');
        }
        const email = payload.email;
        const fullName = payload.name || 'Người dùng Google';
        const googleId = payload.sub;
        let user = await client_1.default.user.findUnique({
            where: { email },
            include: { student: true, mentor: true }
        });
        if (!user) {
            // Create new user
            user = await client_1.default.user.create({
                data: {
                    email,
                    fullName,
                    googleId,
                    role: enums_1.Role.STUDENT,
                    student: {
                        create: {
                            onboardingCompleted: false
                        }
                    }
                },
                include: { student: true, mentor: true }
            });
        }
        else {
            // Update existing user with googleId if they didn't have one
            if (!user.googleId) {
                await client_1.default.user.update({
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
    }
    catch (error) {
        next(error);
    }
}
/**
 * Onboarding survey completion for STUDENT actors.
 */
async function completeOnboarding(req, res, next) {
    try {
        const { skillIds, goal, mentorId } = onboardingSchema.parse(req.body);
        const studentId = req.user?.studentId;
        if (!studentId) {
            throw new apiError_1.ApiError(400, 'Không tìm thấy thông tin Student cho tài khoản này.');
        }
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
        // Use createMany or loop
        for (const data of masteriesData) {
            await client_1.default.skillMastery.upsert({
                where: {
                    studentId_skillId: {
                        studentId: data.studentId,
                        skillId: data.skillId
                    }
                },
                update: {},
                create: data
            });
        }
        // 2. Assign Mentor if specified
        if (mentorId) {
            await client_1.default.mentorStudent.upsert({
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
        // 3. Update student onboarding status and goals
        const updatedStudent = await client_1.default.student.update({
            where: { id: studentId },
            data: {
                learningGoal: goal,
                onboardingCompleted: true
            }
        });
        res.status(200).json({
            success: true,
            student: updatedStudent
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Retrieves the current authenticated user context details.
 */
async function getMe(req, res, next) {
    try {
        const user = await client_1.default.user.findUnique({
            where: { id: req.user?.id },
            include: { student: true, mentor: true }
        });
        if (!user) {
            throw new apiError_1.ApiError(404, 'User not found');
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
    }
    catch (error) {
        next(error);
    }
}
/**
 * Updates the current authenticated user's profile settings.
 */
async function updateProfile(req, res, next) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new apiError_1.ApiError(401, 'Chưa xác thực người dùng.');
        }
        const { fullName, learningGoal, avatarUrl } = req.body;
        const user = await client_1.default.user.findUnique({
            where: { id: userId },
            include: { student: true }
        });
        if (!user) {
            throw new apiError_1.ApiError(404, 'Không tìm thấy tài khoản người dùng.');
        }
        // Update User Fullname, Avatar and nested Student profile
        const updatedUser = await client_1.default.user.update({
            where: { id: userId },
            data: {
                fullName: fullName || undefined,
                avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
                student: user.role === enums_1.Role.STUDENT && user.student ? {
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
    }
    catch (error) {
        next(error);
    }
}
/**
 * Upload avatar logic
 */
async function uploadAvatar(req, res, next) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new apiError_1.ApiError(401, 'Chưa xác thực người dùng.');
        }
        if (!req.file) {
            throw new apiError_1.ApiError(400, 'Không tìm thấy file ảnh.');
        }
        const avatarUrl = `/uploads/${req.file.filename}`;
        const updatedUser = await client_1.default.user.update({
            where: { id: userId },
            data: { avatarUrl }
        });
        res.status(200).json({
            success: true,
            message: 'Cập nhật ảnh đại diện thành công.',
            avatarUrl: updatedUser.avatarUrl
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Change password
 */
const changePasswordSchema = zod_1.z.object({
    oldPassword: zod_1.z.string().min(1, 'Vui lòng nhập mật khẩu cũ'),
    newPassword: zod_1.z.string().min(8, 'Mật khẩu mới phải dài ít nhất 8 ký tự')
});
async function changePassword(req, res, next) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new apiError_1.ApiError(401, 'Chưa xác thực người dùng.');
        }
        const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);
        const user = await client_1.default.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new apiError_1.ApiError(404, 'Người dùng không tồn tại.');
        if (!user.password)
            throw new apiError_1.ApiError(400, 'Tài khoản Google không thể đổi mật khẩu tại đây.');
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid)
            throw new apiError_1.ApiError(400, 'Mật khẩu cũ không chính xác.');
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await client_1.default.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });
        res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công.' });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Forgot password
 */
const forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email không hợp lệ')
});
async function forgotPassword(req, res, next) {
    try {
        const { email } = forgotPasswordSchema.parse(req.body);
        const user = await client_1.default.user.findUnique({ where: { email } });
        if (!user)
            throw new apiError_1.ApiError(404, 'Email chưa được đăng ký trong hệ thống.');
        if (!user.password)
            throw new apiError_1.ApiError(400, 'Tài khoản Google không thể cấp lại mật khẩu.');
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await client_1.default.oTP.create({
            data: { email, code: otpCode, expiresAt }
        });
        await (0, email_service_1.sendOTP)(email, otpCode);
        res.status(200).json({ success: true, message: 'Mã OTP khôi phục mật khẩu đã được gửi đến email của bạn.' });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Reset password
 */
const resetPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    code: zod_1.z.string().length(6, 'Mã OTP phải gồm 6 số'),
    newPassword: zod_1.z.string().min(8, 'Mật khẩu mới phải dài ít nhất 8 ký tự')
});
async function resetPassword(req, res, next) {
    try {
        const { email, code, newPassword } = resetPasswordSchema.parse(req.body);
        const otpRecord = await client_1.default.oTP.findFirst({
            where: { email, code, verified: false, expiresAt: { gt: new Date() } }
        });
        if (!otpRecord)
            throw new apiError_1.ApiError(400, 'Mã OTP không hợp lệ hoặc đã hết hạn.');
        await client_1.default.oTP.update({
            where: { id: otpRecord.id },
            data: { verified: true }
        });
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await client_1.default.user.update({
            where: { email },
            data: { password: hashedPassword }
        });
        res.status(200).json({ success: true, message: 'Khôi phục mật khẩu thành công. Vui lòng đăng nhập lại.' });
    }
    catch (error) {
        next(error);
    }
}
