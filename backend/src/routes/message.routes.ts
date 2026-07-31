import { Router } from "express";
import { getConversations, getMessages, getOrCreateConversation, sendMessage, markAsRead } from "../controllers/message.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

router.use(verifyToken);

router.get("/conversations", getConversations);
router.post("/conversations", getOrCreateConversation); // Init or get conversation
router.get("/:conversationId", getMessages);
router.post("/:conversationId", sendMessage);
router.post("/:conversationId/read", markAsRead);

export default router;
