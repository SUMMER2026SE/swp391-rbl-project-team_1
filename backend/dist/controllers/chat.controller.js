"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chat = chat;
const gemini_service_1 = require("../services/gemini.service");
const apiError_1 = require("../utils/apiError");
/**
 * POST /api/chat
 * Receives symptom descriptors and returns an AI medical advisory response.
 */
async function chat(req, res, next) {
    try {
        const { message, history } = req.body;
        if (!message || message.trim() === "") {
            throw new apiError_1.ApiError("Tin nhắn triệu chứng không được để trống", 400);
        }
        const safeHistory = Array.isArray(history) ? history : [];
        // Fetch AI/Fallback diagnosis
        const reply = await (0, gemini_service_1.getMedicalDiagnosis)(message, safeHistory);
        res.json({
            reply,
        });
    }
    catch (error) {
        next(error);
    }
}
