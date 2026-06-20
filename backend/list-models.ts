import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;
  
  try {
    const aiClient = new GoogleGenerativeAI(apiKey);
    
    console.log('Fetching models...');
    // We can fetch models using the rest endpoint, but the SDK doesn't expose it easily.
    // Instead, let's just make a raw fetch call.
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error: any) {
    console.error('Error:', error.message || error);
  }
}

test();
