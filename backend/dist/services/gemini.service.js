"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTasks = generateTasks;
exports.generateQuiz = generateQuiz;
exports.generateRoadmap = generateRoadmap;
const apiKey = process.env.GEMINI_API_KEY;
let aiClient = null;
if (apiKey && apiKey !== 'MOCK_KEY') {
    try {
        // Note: in the official SDK, GoogleGenAI or GoogleGenerativeAI is instantiated
        // We instantiate it safely
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        aiClient = new GoogleGenerativeAI(apiKey);
    }
    catch (e) {
        console.warn('Could not initialize GoogleGenerativeAI client:', e);
    }
}
const TIMEOUT_MS = 15000;
async function withTimeout(promise, ms, message) {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}
/**
 * Generates tasks based on weak skills using Gemini AI.
 */
async function generateTasks(weakSkills) {
    if (!aiClient) {
        throw new Error('Gemini AI not initialized.');
    }
    try {
        const model = aiClient.getGenerativeModel({ model: 'gemini-3.5-flash' });
        const prompt = `Sinh viên đang yếu các kỹ năng sau: ${weakSkills.map(s => `${s.name} (mastery: ${s.masteryLevel})`).join(', ')}.
Tạo 5 task học tập cụ thể để cải thiện các kỹ năng này.
Hãy trả về DUY NHẤT một chuỗi JSON dạng mảng (array) chứa các object, không bọc trong markdown codeblock \`\`\`json.
Mỗi object có cấu trúc:
[
  {
    "title": "Tên task",
    "difficulty": "EASY" | "MEDIUM" | "HARD" | "EXPERT",
    "estimatedMinutes": 25,
    "skillName": "Tên kỹ năng tương ứng trong danh sách yếu",
    "reason": "Lý do AI gợi ý task này"
  }
]`;
        const result = await withTimeout(model.generateContent(prompt), TIMEOUT_MS, 'AI Task generation timed out after 15 seconds');
        const response = await result.response;
        let text = response.text().trim();
        try {
            // Find the first '[' and last ']' to extract just the JSON array
            const startIndex = text.indexOf('[');
            const endIndex = text.lastIndexOf(']');
            if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
                text = text.substring(startIndex, endIndex + 1);
            }
            return JSON.parse(text);
        }
        catch (parseError) {
            console.error('Failed to parse Gemini JSON for tasks. Raw text:', text);
            throw new Error('AI returned invalid JSON format');
        }
    }
    catch (error) {
        console.error('Error generating tasks with Gemini:', error);
        throw error;
    }
}
/**
 * Generates quiz questions based on content and skill using Gemini AI.
 */
async function generateQuiz(content, skillName, count) {
    if (!aiClient) {
        throw new Error('Gemini AI not initialized.');
    }
    try {
        const model = aiClient.getGenerativeModel({ model: 'gemini-3.5-flash' });
        const prompt = `Từ nội dung học tập sau đây:
"${content}"
Hãy tạo đúng ${count} câu hỏi trắc nghiệm ôn tập về kỹ năng "${skillName}".
Hãy trả về DUY NHẤT một chuỗi JSON dạng mảng (array) chứa các object, không bọc trong markdown codeblock.
Mỗi object có cấu trúc:
[
  {
    "question": "Nội dung câu hỏi trắc nghiệm",
    "options": [
      { "text": "Lựa chọn 1", "isCorrect": true },
      { "text": "Lựa chọn 2", "isCorrect": false },
      { "text": "Lựa chọn 3", "isCorrect": false },
      { "text": "Lựa chọn 4", "isCorrect": false }
    ],
    "explanation": "Giải thích chi tiết tại sao đáp án đó đúng",
    "difficulty": "EASY" | "MEDIUM" | "HARD" | "EXPERT"
  }
]`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();
        try {
            // Extract array between brackets
            const startIndex = text.indexOf('[');
            const endIndex = text.lastIndexOf(']');
            if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
                text = text.substring(startIndex, endIndex + 1);
            }
            return JSON.parse(text);
        }
        catch (parseError) {
            console.error('Failed to parse Gemini JSON for quiz. Raw text:', text);
            throw new Error('AI returned invalid JSON format');
        }
    }
    catch (error) {
        console.error('Error generating quiz with Gemini:', error);
        throw error;
    }
}
/**
 * Generates a weekly roadmap based on weak skills and goal using Gemini AI or fallback templates.
 */
async function generateRoadmap(weakSkills, goal) {
    if (!aiClient) {
        throw new Error('Gemini AI not initialized.');
    }
    try {
        const model = aiClient.getGenerativeModel({ model: 'gemini-3.5-flash' });
        const prompt = `Sinh viên có mục tiêu học tập: "${goal}".
Các kỹ năng yếu cần cải thiện gấp: ${weakSkills.map(s => `${s.name} (mastery: ${s.masteryLevel})`).join(', ')}.
Hãy thiết lập lộ trình học tập chi tiết trong 4 tuần bằng định dạng Markdown.
Lộ trình phải phân bổ rõ ràng theo từng tuần (Tuần 1, Tuần 2, Tuần 3, Tuần 4) với các đầu mục công việc, thời gian thực hiện, và tài liệu ôn tập tương ứng.`;
        const result = await withTimeout(model.generateContent(prompt), TIMEOUT_MS, 'AI Roadmap generation timed out after 15 seconds');
        const response = await result.response;
        return response.text();
    }
    catch (error) {
        console.error('Error generating roadmap with Gemini:', error);
        throw error;
    }
}
