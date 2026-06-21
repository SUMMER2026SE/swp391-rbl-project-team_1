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

async function generateJsonWithRetry<T>(
  model: any,
  originalPrompt: string,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  try {
    const result = await withTimeout<any>(model.generateContent(originalPrompt), timeoutMs, timeoutMessage);
    const response = await result.response;
    let text = response.text().trim();
    
    try {
      const startIndex = text.indexOf('[');
      const endIndex = text.lastIndexOf(']');
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        text = text.substring(startIndex, endIndex + 1);
      }
      return JSON.parse(text) as T;
    } catch (parseError) {
      console.warn('Failed to parse Gemini JSON on first try, retrying...', text);
      const retryPrompt = originalPrompt + '\n\nQUAN TRỌNG: Hãy trả về CHỈ JSON thuần, không markdown (không dùng ```json), không giải thích thêm.';
      const retryResult = await withTimeout<any>(model.generateContent(retryPrompt), timeoutMs, timeoutMessage);
      const retryResponse = await retryResult.response;
      let retryText = retryResponse.text().trim();
      
      const retryStartIndex = retryText.indexOf('[');
      const retryEndIndex = retryText.lastIndexOf(']');
      if (retryStartIndex !== -1 && retryEndIndex !== -1 && retryEndIndex > retryStartIndex) {
        retryText = retryText.substring(retryStartIndex, retryEndIndex + 1);
      }
      return JSON.parse(retryText) as T;
    }
  } catch (error) {
    console.error('Error in generateJsonWithRetry:', error);
    console.error('Prompt that caused error:', originalPrompt);
    throw error;
  }
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

    return await generateJsonWithRetry<TaskSuggestion[]>(
      model,
      prompt,
      TIMEOUT_MS,
      'AI Task generation timed out after 15 seconds'
    );
  } catch (error) {
    console.error('Error generating tasks with Gemini:', error);
    throw error;
  }
}

/**
 * Generates an initial full roadmap of tasks based on selected skills and study metrics.
 */
export async function generateInitialRoadmapTasks(
  skills: { name: string; domain?: string | null; proficiency?: number }[],
  goal: string,
  studyHours: number,
  durationMonths: number,
  learningStyle: string = 'Thực hành'
): Promise<TaskSuggestion[]> {
  if (!aiClient) {
    throw new Error('Gemini AI not initialized.');
  }

  try {
    const model = aiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Sinh viên vừa tạo hồ sơ với mục tiêu: "${goal}".
Thời gian tự học dự kiến: ${studyHours} giờ/ngày trong vòng ${durationMonths} tháng.
Phong cách học tập ưa thích: ${learningStyle}.
Các kỹ năng sinh viên chọn để học (kèm mức độ thành thạo từ 0 đến 1, 0 là chưa biết gì, 1 là xuất sắc):
${skills.map(s => `- ${s.name} (Lĩnh vực: ${s.domain || 'Lập trình'}, Mức độ: ${s.proficiency ?? 0.3})`).join('\n')}

Hãy tạo một lộ trình chi tiết gồm 10 đến 15 task học tập để phủ đều TẤT CẢ các kỹ năng này và phân bổ từ dễ đến khó.
QUAN TRỌNG:
1. Mức độ task (EASY/MEDIUM/HARD/EXPERT) phải phù hợp với "Mức độ" ban đầu của kỹ năng (vd: kỹ năng mức >=0.5 thì không giao task EASY cơ bản).
2. Giá trị "skillName" PHẢI CHÍNH XÁC 100% giống tên kỹ năng trong danh sách trên, KHÔNG ĐƯỢC tự chế tên kỹ năng mới.
3. Sinh task bám sát vào Lĩnh vực (domain):
- Nếu lĩnh vực là "ENGLISH" hoặc "JAPANESE": sinh các task ngôn ngữ (từ vựng, ngữ pháp, luyện nghe, luyện nói).
- Nếu lĩnh vực là "WEB_DEV", "DATA_SCIENCE", "MOBILE_DEV" hoặc không rõ: sinh các task thực hành code, sửa lỗi, dự án.
4. Thời lượng mỗi task (estimatedMinutes) từ 30 đến 120 phút.

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

    return await generateJsonWithRetry<TaskSuggestion[]>(
      model,
      prompt,
      25000,
      'AI generation timed out'
    );
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

/**
 * Executor callback type for Function Calling.
 */
export type AIExecutor = (name: string, args: Record<string, any>) => Promise<any>;

const chatTools = [
  {
    functionDeclarations: [
      {
        name: 'createTask',
        description: 'Tạo 1 task mới vào Kanban board (cột Cần Làm) gắn với một kỹ năng cụ thể.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Tên của task cần tạo' },
            skillName: { type: 'STRING', description: 'Tên kỹ năng (môn học) tương ứng với task' },
            difficulty: { type: 'STRING', description: 'Mức độ khó của task. Bắt buộc thuộc [EASY, MEDIUM, HARD, EXPERT]' },
            estimatedMinutes: { type: 'NUMBER', description: 'Thời gian hoàn thành dự kiến (phút)' }
          },
          required: ['title', 'skillName']
        }
      },
      {
        name: 'getMyProgress',
        description: 'Kiểm tra phần trăm thành thạo (% mastery) của các kỹ năng người dùng đang học.',
        parameters: {
          type: 'OBJECT',
          properties: {
            skillName: { type: 'STRING', description: 'Tên kỹ năng cần kiểm tra. Bỏ trống nếu muốn xem tất cả.' }
          }
        }
      },
      {
        name: 'startPomodoro',
        description: 'Kích hoạt 1 phiên Pomodoro Focus Timer (chế độ Work 25 phút).',
        parameters: {
          type: 'OBJECT',
          properties: {
            taskTitle: { type: 'STRING', description: 'Tên task muốn gắn với Pomodoro (nếu có).' }
          }
        }
      },
      {
        name: 'addRoadmapStep',
        description: 'Tạo 1 bước mới trong Lộ trình cá nhân.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Tên của bước lộ trình' },
            skillName: { type: 'STRING', description: 'Tên kỹ năng (môn học) tương ứng' },
            difficulty: { type: 'STRING', description: 'Mức độ khó. Bắt buộc thuộc [EASY, MEDIUM, HARD, EXPERT]' },
            estimatedMinutes: { type: 'NUMBER', description: 'Thời gian hoàn thành dự kiến (phút)' },
            position: { type: 'STRING', description: 'Vị trí của bước (ví dụ: END để thêm vào cuối)' }
          },
          required: ['title', 'skillName']
        }
      },
      {
        name: 'getRiskStatus',
        description: 'Kiểm tra tỷ lệ rủi ro (Risk Score) hiện tại của người dùng. Từ đó AI có thể đưa ra lời khuyên phù hợp.',
      },
      {
        name: 'suggestNextTask',
        description: 'Đề xuất task tiếp theo nên học dựa trên Priority Score. AI dùng dữ liệu này để đưa ra gợi ý.'
      }
    ]
  }
];

/**
 * Chat with AI — conversational Q&A with context of user's skills and recent messages.
 * Supports Function Calling (Tool Use).
 */
export async function chatWithAI(
  userMessage: string,
  skillContext: string[],
  recentMessages: { role: 'USER' | 'ASSISTANT'; content: string }[],
  executor?: AIExecutor
): Promise<{ text: string; functionCalled?: string }> {
  if (!aiClient) {
    throw new Error('Gemini AI not initialized. Check GEMINI_API_KEY.');
  }

  // Build skill context string
  const skillList = skillContext.length > 0
    ? `Người dùng đang học: ${skillContext.join(', ')}.`
    : 'Người dùng chưa cung cấp thông tin kỹ năng cụ thể.';

  const systemPrompt = `Bạn là Trợ lý học tập của EduPath, hỗ trợ người dùng giải đáp thắc mắc về các kỹ năng họ đang học (lập trình, tiếng Anh, tiếng Nhật...). Trả lời ngắn gọn, rõ ràng, bằng tiếng Việt, phù hợp với người tự học.
TUYỆT ĐỐI không tự suy diễn việc xóa task hay xóa kỹ năng. Với các hành động làm thay đổi dữ liệu, hãy hỏi lại người dùng để xác nhận nếu thấy chưa rõ ràng.
${skillList}`;

  // Configure model with tools and system instruction
  const model = aiClient.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: systemPrompt,
    tools: chatTools
  });

  // Build history array using Gemini SDK structure
  const contents: any[] = recentMessages.map(m => ({
    role: m.role === 'USER' ? 'user' : 'model',
    parts: [{ text: m.content }]
  }));
  
  // Add current user message
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  // 1. Send first request
  const result = await withTimeout(
    model.generateContent({ contents }),
    20000,
    'Chat AI timeout after 20 seconds'
  );
  
  const response = await result.response;
  
  // 2. Check if a function call is requested
  const functionCalls = response.functionCalls();
  if (functionCalls && functionCalls.length > 0 && executor) {
    const call = functionCalls[0];
    let functionResult;
    try {
      functionResult = await executor(call.name, call.args);
    } catch (err: any) {
      functionResult = { error: err.message || 'Lỗi khi thực thi action' };
    }

    // Append AI's function call request to history
    contents.push({ role: 'model', parts: [{ functionCall: call }] });
    
    // Append the function execution result
    contents.push({
      role: 'function',
      parts: [{ functionResponse: { name: call.name, response: functionResult } }]
    });

    // 3. Send second request to get natural language response based on function result
    const finalResult = await withTimeout(
      model.generateContent({ contents }),
      20000,
      'Chat AI timeout during function response'
    );
    
    const finalResponse = await finalResult.response;
    return {
      text: finalResponse.text().trim(),
      functionCalled: call.name
    };
  }

  // No function called, return text directly
  return {
    text: response.text().trim()
  };
}
