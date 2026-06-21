import express from 'express';
import { getAchievements } from '../controllers/achievement.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = express.Router();

router.use(verifyToken);

router.get('/', getAchievements);

export default router;
