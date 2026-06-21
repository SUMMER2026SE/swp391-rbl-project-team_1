import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import * as documentController from '../controllers/document.controller';

const router = Router();

// GET /api/documents (Optional auth to get saved state)
router.get('/', verifyToken, documentController.getDocuments);
// Alternatively, if we want unauthenticated users to see documents:
// We could make authenticate middleware optional or handle it inside the controller if no token is provided.
// For now, assuming authenticated users.

// POST /api/documents/:id/save (Requires auth)
router.post('/:id/save', verifyToken, documentController.toggleSaveDocument);

// GET /api/documents/saved (Requires auth)
router.get('/saved', verifyToken, documentController.getSavedDocuments);

// POST /api/documents/:id/purchase (Requires auth)
router.post('/:id/purchase', verifyToken, documentController.purchaseDocument);

export default router;
