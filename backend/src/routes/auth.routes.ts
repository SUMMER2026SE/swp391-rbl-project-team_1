import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { register, verifyOtp, login, logout, googleLogin, completeOnboarding, getMe, updateProfile, uploadAvatar, changePassword, forgotPassword, resetPassword, getNotificationSettings, updateNotificationSettings } from '../controllers/auth.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { verifyRole } from '../middleware/role.middleware';
import { Role } from '../types/enums';

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Add user ID to filename for easy tracing, or just random
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${(req as any).user?.id || 'anon'}-${uniqueSuffix}${ext}`);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép tải lên file ảnh!'));
    }
  }
});

const router = Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/logout', logout);

router.post('/complete-onboarding', verifyToken as any, verifyRole(Role.STUDENT) as any, completeOnboarding as any);
router.get('/me', verifyToken as any, getMe as any);
router.put('/profile', verifyToken as any, updateProfile as any);

router.post('/upload-avatar', verifyToken as any, upload.single('avatar'), uploadAvatar as any);
router.post('/change-password', verifyToken as any, changePassword as any);
router.get('/notification-settings', verifyToken as any, getNotificationSettings as any);
router.put('/notification-settings', verifyToken as any, updateNotificationSettings as any);
router.post('/forgot-password', forgotPassword as any);
router.post('/reset-password', resetPassword as any);

// Public route to fetch skills for onboarding list
router.get('/skills', async (_req, res, next) => {
  try {
    const prisma = (await import('../prisma/client')).default;
    const skills = await prisma.skill.findMany({
      where: { parentId: null }, // Only get parent skills to keep tree structure or get all
      include: { children: true }
    });
    res.status(200).json({ success: true, skills });
  } catch (error) {
    next(error);
  }
});

// Public route to fetch mentors list for onboarding selection
router.get('/mentors', async (_req, res, next) => {
  try {
    const prisma = (await import('../prisma/client')).default;
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
  } catch (error) {
    next(error);
  }
});

// Public route to fetch shared knowledge library units (accessible by students)
router.get('/knowledge-library', async (_req, res, next) => {
  try {
    const prisma = (await import('../prisma/client')).default;
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
  } catch (error) {
    next(error);
  }
});

export default router;
