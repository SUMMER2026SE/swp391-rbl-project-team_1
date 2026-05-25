"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, Stethoscope, Sparkles, Activity, AlertCircle, Heart } from "lucide-react";
import { chatService, ChatMessage } from "../../services/chat.service";

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      text: "Xin chào! Tôi là **MedBooking AI - Trợ lý Bác sĩ Ảo** của bạn. 🩺\n\nHãy chia sẻ với tôi các triệu chứng hoặc lo lắng về sức khỏe hiện tại của bạn (ví dụ: *'Tôi bị đau họng và sốt nhẹ'*, *'Đau nhức khớp gối sau khi tập thể dục'*...). Tôi sẽ tư vấn chẩn đoán sơ bộ y khoa và đề xuất chuyên khoa phù hợp nhất để giúp bạn chăm sóc sức khỏe tốt hơn.\n\n*Lưu ý: Nhận định từ AI mang tính chất tham khảo y tế sơ bộ, vui lòng đặt lịch với Bác sĩ chuyên môn của MedBooking để được điều trị chính xác.*",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Quick suggestion symptom templates
  const suggestions = [
    { label: "Ho sốt, đau họng", value: "Tôi bị ho khan kéo dài 3 ngày nay kèm theo sốt nhẹ và đau họng khi nuốt." },
    { label: "Đau bụng thượng vị", value: "Tôi bị đau quặn bụng vùng thượng vị âm ỉ kèm theo đầy bụng, ợ hơi nóng sau khi ăn." },
    { label: "Mỏi cổ vai gáy", value: "Tôi là dân văn phòng, dạo này bị đau mỏi vai gáy dữ dội, thỉnh thoảng có tê bì lan xuống tay." },
    { label: "Mất ngủ, nhức đầu", value: "Tôi bị mất ngủ triền miên kèm theo chóng mặt, đau nhức đầu căng thẳng quanh hai bên thái dương." },
  ];

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", text: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      // Exclude introductory bot message from the history to keep token limit light and clean
      const historyContext = messages.slice(1);

      const response = await chatService.sendMessage(textToSend, historyContext);

      const botMessage: ChatMessage = {
        role: "model",
        text: response.reply,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("AI Chatbot error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "⚠️ **Rất tiếc! Đã xảy ra lỗi kết nối với máy chủ.**\n\nKhông thể gửi triệu chứng của bạn đến AI lúc này. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau vài giây nhé!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  const handleSuggestionClick = (value: string) => {
    handleSendMessage(value);
  };

  // Safe custom Markdown Parser for premium rendering without external npm dependencies
  const renderMarkdown = (text: string) => {
    return text.split("\n").map((line, lineIdx) => {
      let content = line;

      // Handle Headers
      if (content.startsWith("### ")) {
        return (
          <h4 key={lineIdx} className="font-bold text-slate-800 text-[13px] sm:text-sm mt-3 mb-1 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-teal-600 animate-pulse" />
            {content.replace("### ", "")}
          </h4>
        );
      }
      if (content.startsWith("## ")) {
        return (
          <h3 key={lineIdx} className="font-bold text-slate-800 text-sm sm:text-base mt-4 mb-2">
            {content.replace("## ", "")}
          </h3>
        );
      }

      // Handle Bullet list
      let isBullet = false;
      if (content.startsWith("- ") || content.startsWith("* ")) {
        isBullet = true;
        content = content.substring(2);
      }

      // Handle bold **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(content.substring(lastIndex, match.index));
        }
        parts.push(
          <strong key={match.index} className="font-bold text-slate-900 bg-teal-50/50 px-1 rounded text-[11px] sm:text-xs">
            {match[1]}
          </strong>
        );
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
      }

      const renderedContent = parts.length > 0 ? parts : content;

      if (isBullet) {
        return (
          <li key={lineIdx} className="ml-3 list-none text-slate-700 text-[11px] sm:text-xs my-1 pl-3.5 relative before:content-['•'] before:absolute before:left-0.5 before:text-teal-500 before:font-bold leading-relaxed">
            {renderedContent}
          </li>
        );
      }

      // Handle empty lines
      if (line.trim() === "") {
        return <div key={lineIdx} className="h-1.5" />;
      }

      // Handle Horizontal rule separator
      if (line.trim() === "---") {
        return <hr key={lineIdx} className="my-2 border-t border-slate-100" />;
      }

      // Handle medical disclaimer (starts with ⚠️ or *Lưu ý)
      const isDisclaimer = line.startsWith("⚠️") || line.startsWith("*Lưu ý") || line.startsWith("*") && line.endsWith("*");
      if (isDisclaimer) {
        return (
          <p key={lineIdx} className="text-slate-400 text-[10px] sm:text-[11px] italic mt-2.5 p-2 bg-slate-50/80 rounded-lg border border-slate-100 leading-relaxed flex gap-1.5 items-start">
            <AlertCircle className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>{renderedContent}</span>
          </p>
        );
      }

      return (
        <p key={lineIdx} className="text-slate-700 text-[11px] sm:text-xs my-1 leading-relaxed">
          {renderedContent}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 ${isOpen ? "h-12 w-12 rotate-90" : "h-14 w-14 hover:shadow-teal-500/20"
          } focus:outline-none`}
        aria-label="AI Doctor Assistant"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <div className="relative">
            <Bot className="h-6 w-6" />
            {/* Breathing notification dot */}
            <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 text-[8px] font-bold text-white items-center justify-center">AI</span>
            </span>
          </div>
        )}
      </button>

      {/* Floating Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-6 z-50 flex w-[calc(100vw-3rem)] sm:w-[410px] h-[520px] sm:h-[590px] flex-col rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-md shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-6 fade-in-20 overflow-hidden"
          style={{ maxHeight: "calc(100vh - 8rem)" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-xl border border-white/10 backdrop-blur-sm">
                <Stethoscope className="h-5 w-5 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm sm:text-base tracking-wide">Trợ Lý Bác Sĩ AI</h3>
                  <div className="flex items-center gap-1 bg-white/15 px-1.5 py-0.5 rounded-full border border-white/10">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 absolute"></span>
                    <span className="text-[9px] font-medium tracking-wider">ONLINE</span>
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-white/80 flex items-center gap-1 mt-0.5">
                  <Sparkles className="h-3 w-3 text-emerald-300" />
                  <span>Tự động tư vấn chẩn đoán triệu chứng 24/7</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/85 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Conversation list */}
          <div
            ref={chatContainerRef}
            className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50/50"
          >
            {messages.map((msg, index) => {
              const isBot = msg.role === "model";
              return (
                <div key={index} className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
                  <div className={`flex gap-2 max-w-[85%] ${isBot ? "flex-row" : "flex-row-reverse"}`}>
                    {/* Avatar icon */}
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${isBot
                        ? "bg-gradient-to-br from-teal-500 to-emerald-500 text-white"
                        : "bg-slate-200 text-slate-600"
                        }`}
                    >
                      {isBot ? <Bot className="h-4 w-4" /> : <Heart className="h-3.5 w-3.5 fill-current" />}
                    </div>

                    {/* Chat Bubble bubble */}
                    <div
                      className={`p-3 rounded-2xl shadow-sm text-[11px] sm:text-xs leading-relaxed border ${isBot
                        ? "bg-white text-slate-800 border-slate-100 rounded-tl-sm"
                        : "bg-gradient-to-br from-teal-600 to-teal-700 text-white border-teal-500/10 rounded-tr-sm"
                        }`}
                    >
                      {isBot ? (
                        <div className="space-y-0.5">{renderMarkdown(msg.text)}</div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Thinking typing indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[80%]">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-white border border-slate-100 p-3.5 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5 h-9">
                    <span className="h-1.5 w-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="h-1.5 w-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="h-1.5 w-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions area */}
          {messages.length === 1 && !isLoading && (
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
              <p className="text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-teal-500" />
                <span>Gợi ý triệu chứng nhanh:</span>
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-1">
                {suggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(sug.value)}
                    className="text-[9px] sm:text-[10px] bg-white hover:bg-teal-50 text-slate-600 hover:text-teal-700 font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-teal-200 shadow-sm hover:shadow-teal-100/30 transition-all text-left"
                  >
                    {sug.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat input box */}
          <form
            onSubmit={handleFormSubmit}
            className="p-3 border-t border-slate-100 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isLoading ? "AI đang chẩn đoán..." : "Nhập triệu chứng của bạn (ví dụ: đau bụng, ho...)"}
              disabled={isLoading}
              className="flex-grow text-[11px] sm:text-xs text-black bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1.5 focus:ring-teal-500 focus:border-teal-500 bg-white transition-all disabled:opacity-75 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-2.5 rounded-xl hover:shadow-lg hover:shadow-teal-500/10 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none cursor-pointer flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
