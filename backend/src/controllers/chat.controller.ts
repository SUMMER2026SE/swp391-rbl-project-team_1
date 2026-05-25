import { NextFunction, Request, Response } from "express";
import { getMedicalDiagnosis, ChatMessage } from "../services/gemini.service";
import { ApiError } from "../utils/apiError";

interface ChatRequestBody {
    message: string;
    history?: ChatMessage[];
}

/**
 * POST /api/chat
 * Receives symptom descriptors and returns an AI medical advisory response.
 */
export async function chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { message, history } = req.body as ChatRequestBody;

        if (!message || message.trim() === "") {
            throw new ApiError("Tin nhắn triệu chứng không được để trống", 400);
        }

        const safeHistory: ChatMessage[] = Array.isArray(history) ? history : [];

        // Fetch AI/Fallback diagnosis
        const reply = await getMedicalDiagnosis(message, safeHistory);

        res.json({
            reply,
        });
    } catch (error) {
        next(error);
    }
}
