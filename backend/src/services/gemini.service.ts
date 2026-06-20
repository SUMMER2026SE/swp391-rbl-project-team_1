const apiKey = process.env.GEMINI_API_KEY;
let aiClient: any = null;

if (apiKey && apiKey !== 'MOCK_KEY') {
  try {
    // Note: in the official SDK, GoogleGenAI or GoogleGenerativeAI is instantiated
    // We instantiate it safely
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    aiClient = new GoogleGenerativeAI(apiKey);
  } catch (e) {
    console.warn('Could not initialize GoogleGenerativeAI client:', e);
  }
}

export interface TaskSuggestion {
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  estimatedMinutes: number;
  skillName: string;
  reason: string;
}

export interface QuizSuggestion {
  question: string;
  options: { text: string; isCorrect: boolean }[];
  explanation: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
}

const TIMEOUT_MS = 15000;

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

/**
 * Generates tasks based on weak skills using Gemini AI.
 */
export async function generateTasks(
  weakSkills: { name: string; masteryLevel: number; domain?: string | null }[]
): Promise<TaskSuggestion[]> {
  if (!aiClient) {
    throw new Error('Gemini AI not initialized.');
  }

  try {
    const model = aiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Sinh viên đang yếu các kỹ năng sau: ${weakSkills.map(s => `${s.name} (Lĩnh vực: ${s.domain || 'Lập trình'}, mastery: ${s.masteryLevel})`).join(', ')}.
Tạo 5 task học tập cụ thể để cải thiện các kỹ năng này. 
QUAN TRỌNG: Sinh task phù hợp với Lĩnh vực (domain) của kỹ năng:
- Nếu lĩnh vực là "ENGLISH" hoặc "JAPANESE": sinh các task ôn tập từ vựng, làm quiz ngữ pháp, luyện nghe, đọc hiểu (Tuyệt đối KHÔNG sinh task liên quan đến viết code).
- Nếu lĩnh vực là "WEB_DEV", "DATA_SCIENCE", "MOBILE_DEV" hoặc không rõ: sinh các task thực hành code, sửa lỗi, xây dựng dự án.
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

    const result = await withTimeout<any>(model.generateContent(prompt), TIMEOUT_MS, 'AI Task generation timed out after 15 seconds');
    const response = await result.response;
    let text = response.text().trim();
    
    try {
      // Find the first '[' and last ']' to extract just the JSON array
      const startIndex = text.indexOf('[');
      const endIndex = text.lastIndexOf(']');
      
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        text = text.substring(startIndex, endIndex + 1);
      }
      
      return JSON.parse(text) as TaskSuggestion[];
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON for tasks. Raw text:', text);
      throw new Error('AI returned invalid JSON format');
    }
  } catch (error) {
    console.error('Error generating tasks with Gemini:', error);
    throw error;
  }
}

/**
 * Generates an initial full roadmap of tasks based on selected skills and study metrics.
 */
export async function generateInitialRoadmapTasks(
  skills: { name: string; domain?: string | null }[],
  goal: string,
  studyHours: number,
  durationMonths: number
): Promise<TaskSuggestion[]> {
  if (!aiClient) {
    throw new Error('Gemini AI not initialized.');
  }

  try {
    const model = aiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Sinh viên vừa tạo hồ sơ với mục tiêu: "${goal}".
Thời gian tự học dự kiến: ${studyHours} giờ/ngày trong vòng ${durationMonths} tháng.
Các kỹ năng sinh viên chọn để học: ${skills.map(s => `${s.name} (Lĩnh vực: ${s.domain || 'Lập trình'})`).join(', ')}.

Hãy tạo danh sách gồm 10 đến 15 task học tập chi tiết để phủ đều các kỹ năng này và phân bổ từ dễ đến khó.
QUAN TRỌNG: Sinh task bám sát vào Lĩnh vực (domain):
- Nếu lĩnh vực là "ENGLISH" hoặc "JAPANESE": sinh các task ôn tập từ vựng, ngữ pháp, luyện nghe, luyện nói (Tuyệt đối KHÔNG sinh task liên quan đến viết code).
- Nếu lĩnh vực là "WEB_DEV", "DATA_SCIENCE", "MOBILE_DEV" hoặc không rõ: sinh các task thực hành code, sửa lỗi, xây dựng dự án.
- Thời lượng mỗi task (estimatedMinutes) nên từ 30 đến 120 phút.

Hãy trả về DUY NHẤT một chuỗi JSON dạng mảng (array) chứa các object, không bọc trong markdown codeblock \`\`\`json.
Mỗi object có cấu trúc:
[
  {
    "title": "Tên task",
    "difficulty": "EASY" | "MEDIUM" | "HARD" | "EXPERT",
    "estimatedMinutes": 60,
    "skillName": "Tên kỹ năng tương ứng (phải thuộc danh sách đã chọn)",
    "reason": "Mục đích của task này trong lộ trình"
  }
]`;

    const result = await withTimeout<any>(model.generateContent(prompt), TIMEOUT_MS, 'AI generation timed out');
    const response = await result.response;
    let text = response.text().trim();
    
    try {
      const startIndex = text.indexOf('[');
      const endIndex = text.lastIndexOf(']');
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        text = text.substring(startIndex, endIndex + 1);
      }
      return JSON.parse(text) as TaskSuggestion[];
    } catch (parseError) {
      console.error('Failed to parse JSON for initial tasks. Raw text:', text);
      throw new Error('AI returned invalid JSON format');
    }
  } catch (error) {
    console.error('Error generating initial tasks with Gemini:', error);
    throw error;
  }
}

/**
 * Generates quiz questions based on content and skill using Gemini AI.
 */
export async function generateQuiz(
  content: string,
  skillName: string,
  count: number
): Promise<QuizSuggestion[]> {
  if (!aiClient) {
    throw new Error('Gemini AI not initialized.');
  }

  try {
    const model = aiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
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
      
      return JSON.parse(text) as QuizSuggestion[];
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON for quiz. Raw text:', text);
      throw new Error('AI returned invalid JSON format');
    }
  } catch (error) {
    console.error('Error generating quiz with Gemini:', error);
    throw error;
  }
}

/**
 * Generates a weekly roadmap based on weak skills and goal using Gemini AI or fallback templates.
 */
export async function generateRoadmap(
  weakSkills: { name: string; masteryLevel: number; domain?: string | null }[],
  goal: string
): Promise<string> {
  if (!aiClient) {
    throw new Error('Gemini AI not initialized.');
  }

  try {
    const model = aiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Sinh viên có mục tiêu học tập: "${goal}".
Các kỹ năng yếu cần cải thiện gấp: ${weakSkills.map(s => `${s.name} (Lĩnh vực: ${s.domain || 'Lập trình'}, mastery: ${s.masteryLevel})`).join(', ')}.
Hãy thiết lập lộ trình học tập chi tiết trong 4 tuần bằng định dạng Markdown.
QUAN TRỌNG: Sinh lộ trình phù hợp với Lĩnh vực (domain) của kỹ năng:
- Nếu lĩnh vực là "ENGLISH" hoặc "JAPANESE": đưa ra lộ trình luyện tập ngôn ngữ, học từ vựng, ngữ pháp, nghe/nói.
- Nếu lĩnh vực là lập trình ("WEB_DEV", "DATA_SCIENCE", "MOBILE_DEV"): đưa ra lộ trình code, thực hành dự án.
Lộ trình phải phân bổ rõ ràng theo từng tuần (Tuần 1, Tuần 2, Tuần 3, Tuần 4) với các đầu mục công việc, thời gian thực hiện, và tài liệu ôn tập tương ứng.`;

    const result = await withTimeout<any>(model.generateContent(prompt), TIMEOUT_MS, 'AI Roadmap generation timed out after 15 seconds');
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating roadmap with Gemini:', error);
    throw error;
  }
}

