import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { verifyRole } from '../middleware/role.middleware';
import { Role } from '../types/enums';
import { getBalance, getTransactions, demoDeposit } from '../controllers/wallet.controller';

const router = Router();

// Ensure student role for all wallet endpoints
router.use(verifyToken);
router.use(verifyRole(Role.STUDENT));

router.get('/balance', getBalance);
router.get('/transactions', getTransactions);
router.post('/deposit', demoDeposit);

export default router;
