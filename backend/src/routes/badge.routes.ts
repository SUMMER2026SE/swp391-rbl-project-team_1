import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { verifyRole } from '../middleware/role.middleware';
import { Role } from '../types/enums';
import { getBadges } from '../controllers/badge.controller';

const router = Router();

router.use(verifyToken);
router.use(verifyRole(Role.STUDENT));

router.get('/', getBadges);

export default router;
