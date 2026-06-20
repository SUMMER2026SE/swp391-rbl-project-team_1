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
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const enums_1 = require("../types/enums");
// Configure Multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Add user ID to filename for easy tracing, or just random
        const ext = path_1.default.extname(file.originalname);
        cb(null, `avatar-${req.user?.id || 'anon'}-${uniqueSuffix}${ext}`);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Chỉ cho phép tải lên file ảnh!'));
        }
    }
});
const router = (0, express_1.Router)();
router.post('/register', auth_controller_1.register);
router.post('/verify-otp', auth_controller_1.verifyOtp);
router.post('/login', auth_controller_1.login);
router.post('/google', auth_controller_1.googleLogin);
router.post('/logout', auth_controller_1.logout);
router.post('/complete-onboarding', auth_middleware_1.verifyToken, (0, role_middleware_1.verifyRole)(enums_1.Role.STUDENT), auth_controller_1.completeOnboarding);
router.get('/me', auth_middleware_1.verifyToken, auth_controller_1.getMe);
router.put('/profile', auth_middleware_1.verifyToken, auth_controller_1.updateProfile);
router.post('/upload-avatar', auth_middleware_1.verifyToken, upload.single('avatar'), auth_controller_1.uploadAvatar);
router.post('/change-password', auth_middleware_1.verifyToken, auth_controller_1.changePassword);
router.post('/forgot-password', auth_controller_1.forgotPassword);
router.post('/reset-password', auth_controller_1.resetPassword);
// Public route to fetch skills for onboarding list
router.get('/skills', async (_req, res, next) => {
    try {
        const prisma = (await Promise.resolve().then(() => __importStar(require('../prisma/client')))).default;
        const skills = await prisma.skill.findMany({
            where: { parentId: null }, // Only get parent skills to keep tree structure or get all
            include: { children: true }
        });
        res.status(200).json({ success: true, skills });
    }
    catch (error) {
        next(error);
    }
});
// Public route to fetch mentors list for onboarding selection
router.get('/mentors', async (_req, res, next) => {
    try {
        const prisma = (await Promise.resolve().then(() => __importStar(require('../prisma/client')))).default;
        const mentors = await prisma.mentor.findMany({
            include: {
                user: {
                    select: {
                        fullName: true,
                        email: true
                    }
                }
            }
        });
        res.status(200).json({ success: true, mentors });
    }
    catch (error) {
        next(error);
    }
});
// Public route to fetch shared knowledge library units (accessible by students)
router.get('/knowledge-library', async (_req, res, next) => {
    try {
        const prisma = (await Promise.resolve().then(() => __importStar(require('../prisma/client')))).default;
        const units = await prisma.knowledgeUnit.findMany({
            where: { isPublic: true },
            include: {
                skill: true,
                mentor: {
                    include: {
                        user: {
                            select: {
                                fullName: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, units });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
