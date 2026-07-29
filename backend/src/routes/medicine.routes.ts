import { Router } from 'express';
import { searchMedicines } from '../controllers/medicine.controller';

const router = Router();

router.get('/', searchMedicines);

export default router;
