import api from "./api";

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export interface ChatResponse {
  reply: string;
}

export const chatService = {
  /**
   * Send a symptom message to the AI chatbot backend along with context/history
   * @param message The user's symptom message
   * @param history Prior chat context messages
   * @returns The AI response containing the diagnosis/advisory
   */
  async sendMessage(message: string, history: ChatMessage[] = []): Promise<ChatResponse> {
    const response = await api.post<ChatResponse>("/chat", { message, history });
    return response.data;
  }
};
export default chatService;
