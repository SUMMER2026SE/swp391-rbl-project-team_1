import express from 'express';
import { getNotifications, markAsRead } from '../controllers/notification.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = express.Router();

router.use(verifyToken);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);

export default router;
