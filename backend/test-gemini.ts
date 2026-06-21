import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('API Key configured:', apiKey ? 'YES' : 'NO');
  
  if (!apiKey || apiKey === 'MOCK_KEY') {
    console.error('No valid API key found in .env');
    return;
  }

  try {
    const aiClient = new GoogleGenerativeAI(apiKey);
    const model = aiClient.getGenerativeModel({ model: 'gemini-3.5-flash' });
    
    const prompt = `Từ nội dung học tập sau đây:
"Flutter cơ bản"
Hãy tạo đúng 1 câu hỏi trắc nghiệm ôn tập về kỹ năng "Flutter".
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
    "explanation": "Giải thích chi tiết",
    "difficulty": "EASY"
  }
]`;

    console.log('Sending prompt to Gemini...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    console.log('--- RAW RESPONSE ---');
    console.log(text);
    console.log('--------------------');
    
    const startIndex = text.indexOf('[');
    const endIndex = text.lastIndexOf(']');
    
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      text = text.substring(startIndex, endIndex + 1);
    }
    
    const json = JSON.parse(text);
    console.log('Parsed JSON successfully!', json);
  } catch (error: any) {
    console.error('Error generating with Gemini:', error.message || error);
  }
}

test();
