"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const message_controller_1 = require("../controllers/message.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyToken);
router.get("/conversations", message_controller_1.getConversations);
router.post("/conversations", message_controller_1.getOrCreateConversation); // Init or get conversation
router.get("/:conversationId", message_controller_1.getMessages);
router.post("/:conversationId", message_controller_1.sendMessage);
exports.default = router;
