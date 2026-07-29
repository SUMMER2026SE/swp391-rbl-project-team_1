"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const video_call_controller_1 = require("../controllers/video-call.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All video call routes require authentication
router.use(auth_middleware_1.verifyToken);
router.post("/log", video_call_controller_1.logVideoCall);
router.get("/history", video_call_controller_1.getVideoCallHistory);
exports.default = router;
