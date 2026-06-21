import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import {
  listConversations,
  getLatestConversation,
  getConversation,
  createConversation,
  updateConversationTitle,
  saveMessage,
  askAI
} from '../controllers/chat.controller';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Conversations
router.get('/conversations', listConversations);
router.get('/conversations/latest', getLatestConversation);
router.get('/conversations/:id', getConversation);
router.post('/conversations', createConversation);
router.patch('/conversations/:id', updateConversationTitle);

// Messages
router.post('/conversations/:id/messages', saveMessage);
router.post('/conversations/:id/ask', askAI);

export default router;
