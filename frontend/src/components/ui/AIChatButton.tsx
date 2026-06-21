'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles, X, Send, Minus, Bot, Plus, History, ChevronLeft, MessageSquare, CheckCircle2
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DBMessage {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  functionCalled?: string | null;
  createdAt: string;
}

interface DBConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: DBMessage[];
}

interface UIMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  saved?: boolean;
  functionCalled?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const dbMsgToUI = (m: DBMessage): UIMessage => ({
  id: m.id,
  role: m.role === 'USER' ? 'user' : 'ai',
  content: m.content,
  timestamp: new Date(m.createdAt),
  saved: true,
  functionCalled: m.functionCalled,
});

const formatTime = (date: Date) =>
  date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

const WELCOME_MSG: UIMessage = {
  id: 'welcome',
  role: 'ai',
  content: 'Xin chào! Tôi có thể giúp bạn học tập hoặc thao tác trên EduPath. Bạn cần gì? 😊',
  timestamp: new Date(),
  saved: false,
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AIChatButton() {
  const { user } = useAuth();

  // Panel state
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [view, setView] = useState<'chat' | 'history'>('chat');

  // Conversation
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([WELCOME_MSG]);
  const [convList, setConvList] = useState<DBConversation[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Compose
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasLoadedSession = useRef(false);

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && !isMinimized && view === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, view]);

  // ── Auto-focus input ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && !isMinimized && view === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized, view]);

  // ── Load latest conversation on first open ───────────────────────────────
  const loadLatestConversation = useCallback(async () => {
    if (!user || hasLoadedSession.current) return;
    hasLoadedSession.current = true;
    try {
      const res = await api.get('/chat/conversations/latest');
      if (res.data.success && res.data.conversation) {
        const conv: DBConversation = res.data.conversation;
        setConversationId(conv.id);
        if (conv.messages && conv.messages.length > 0) {
          setMessages(conv.messages.map(dbMsgToUI));
        } else {
          setMessages([WELCOME_MSG]);
        }
      }
      // No conversation yet → stay with welcome message, create on first send
    } catch (_) {
      // Fail silently — still show welcome message
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user) loadLatestConversation();
  }, [isOpen, user, loadLatestConversation]);

  // ── Load conversation list ────────────────────────────────────────────────
  const loadConvList = useCallback(async () => {
    if (!user) return;
    setIsLoadingHistory(true);
    try {
      const res = await api.get('/chat/conversations');
      if (res.data.success) setConvList(res.data.conversations);
    } catch (_) {}
    finally { setIsLoadingHistory(false); }
  }, [user]);

  useEffect(() => {
    if (view === 'history') loadConvList();
  }, [view, loadConvList]);

  // ── Save a single message to DB ──────────────────────────────────────────
  const saveMessage = useCallback(async (
    convId: string, role: 'USER' | 'ASSISTANT', content: string
  ) => {
    try {
      await api.post(`/chat/conversations/${convId}/messages`, { role, content });
    } catch (_) { /* silent */ }
  }, []);

  // ── Create new conversation ───────────────────────────────────────────────
  const createConversation = useCallback(async (firstUserMsg?: string): Promise<string | null> => {
    try {
      const res = await api.post('/chat/conversations', {
        title: firstUserMsg
          ? (firstUserMsg.length > 50 ? firstUserMsg.substring(0, 47) + '...' : firstUserMsg)
          : 'Cuộc trò chuyện mới'
      });
      if (res.data.success) return res.data.conversation.id;
    } catch (_) {}
    return null;
  }, []);

  // ── Handle send ──────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isThinking) return;

    // Show user message optimistically
    const tempUserId = `local-${Date.now()}`;
    const userMsg: UIMessage = {
      id: tempUserId,
      role: 'user',
      content: text,
      timestamp: new Date(),
      saved: false,
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsThinking(true);

    // Ensure we have a conversation in DB
    let convId = conversationId;
    if (!convId) {
      convId = await createConversation(text);
      if (convId) setConversationId(convId);
    }

    // Show thinking bubble
    const thinkId = `think-${Date.now()}`;
    setMessages(prev => [...prev, { id: thinkId, role: 'ai' as const, content: '...', timestamp: new Date() }]);

    if (!convId) {
      // No convId means DB failed — show error
      setMessages(prev => prev.map(m =>
        m.id === thinkId ? { ...m, content: 'Xin lỗi, tôi đang gặp sự cố kết nối, vui lòng thử lại sau 🙏' } : m
      ));
      setIsThinking(false);
      return;
    }

    try {
      // Single call: saves user msg + calls Gemini + saves AI response
      const res = await api.post(`/chat/conversations/${convId}/ask`, { content: text });

      if (res.data.success) {
        const aiContent: string = res.data.aiMessage.content;
        const aiTimestamp = new Date(res.data.aiMessage.createdAt);
        const functionCalled: string | null = res.data.aiMessage.functionCalled;

        setMessages(prev => prev.map(m => {
          if (m.id === tempUserId) return { ...m, id: res.data.userMessage.id, saved: true };
          if (m.id === thinkId) return { id: res.data.aiMessage.id, role: 'ai' as const, content: aiContent, timestamp: aiTimestamp, saved: true, functionCalled };
          return m;
        }));
      }
    } catch (_) {
      setMessages(prev => prev.map(m =>
        m.id === thinkId
          ? { ...m, content: 'Xin lỗi, tôi đang gặp sự cố kết nối, vui lòng thử lại sau 🙏' }
          : m
      ));
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Start new conversation ────────────────────────────────────────────────
  const handleNewConversation = async () => {
    const convId = await createConversation();
    if (convId) {
      setConversationId(convId);
      setMessages([WELCOME_MSG]);
      setView('chat');
    }
  };

  // ── Load a past conversation ──────────────────────────────────────────────
  const handleLoadConversation = async (conv: DBConversation) => {
    try {
      const res = await api.get(`/chat/conversations/${conv.id}`);
      if (res.data.success) {
        const full: DBConversation = res.data.conversation;
        setConversationId(full.id);
        setMessages(
          full.messages && full.messages.length > 0
            ? full.messages.map(dbMsgToUI)
            : [WELCOME_MSG]
        );
        setView('chat');
      }
    } catch (_) {}
  };

  // ── Toggle panel ─────────────────────────────────────────────────────────
  const handleToggle = () => {
    if (isOpen && isMinimized) { setIsMinimized(false); return; }
    setIsOpen(prev => !prev);
    setIsMinimized(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Chat Panel ──────────────────────────────────────────────────── */}
      <div
        className={`fixed bottom-24 right-6 z-[9998] w-[380px] transition-all duration-300 ease-out
          ${isOpen && !isMinimized ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        style={{ height: 560 }}
      >
        <div className="w-full h-full bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-slate-950/80 flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-b border-slate-800 flex-shrink-0">
            {view === 'history' ? (
              <button
                onClick={() => setView('chat')}
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm font-bold">Lịch sử</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/30 flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-slate-100 font-bold text-sm leading-none">Trợ lý EduPath</p>
                  <p className="text-emerald-400 text-[10px] font-semibold mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    Trực tuyến
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-1">
              {view === 'chat' && (
                <>
                  <button
                    onClick={handleNewConversation}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                    title="Cuộc trò chuyện mới"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setView('history')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    title="Xem lịch sử"
                  >
                    <History className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Thu nhỏ"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── CHAT VIEW ──────────────────────────────────────────────── */}
          {view === 'chat' && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    {msg.role === 'ai' ? (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20 mb-4">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-[10px] shadow-md mb-4 uppercase">
                        {user?.fullName?.substring(0, 2) ?? 'U'}
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`max-w-[75%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'ai'
                            ? 'bg-slate-800 text-slate-200 rounded-bl-sm'
                            : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm shadow-md shadow-blue-500/20'
                        }`}
                      >
                        {msg.content === '...' ? (
                          <span className="flex items-center gap-1 h-4">
                            {[0, 150, 300].map(d => (
                              <span key={d} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                            ))}
                          </span>
                        ) : msg.content}
                      </div>
                      
                      {msg.role === 'ai' && msg.functionCalled && (
                        <div className="flex items-center gap-1 mt-0.5 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="text-[10px] font-medium">
                            Đã thực thi: {msg.functionCalled}
                          </span>
                        </div>
                      )}

                      <span className="text-slate-600 text-[10px] px-1 mt-0.5">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex-shrink-0 p-3 border-t border-slate-800 bg-slate-900/60">
                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 focus-within:border-blue-500/60 transition-colors">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Hỏi tôi điều gì đó..."
                    disabled={isThinking}
                    className="flex-1 bg-transparent text-slate-200 text-sm placeholder:text-slate-500 outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isThinking}
                    className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-sm shadow-blue-500/30"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-slate-600 text-[10px] text-center mt-1.5">
                  EduPath AI · Trợ lý học tập thích ứng
                </p>
              </div>
            </>
          )}

          {/* ── HISTORY VIEW ───────────────────────────────────────────── */}
          {view === 'history' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-5 h-5 border-2 border-blue-500/40 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : convList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
                  <MessageSquare className="w-10 h-10 text-slate-700" />
                  <p className="text-slate-500 text-sm">Chưa có cuộc trò chuyện nào.</p>
                </div>
              ) : (
                convList.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => handleLoadConversation(conv)}
                    className={`w-full text-left px-3 py-3 rounded-xl border transition-all duration-200 group ${
                      conv.id === conversationId
                        ? 'bg-blue-950/30 border-blue-500/40 text-blue-300'
                        : 'bg-slate-800/50 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${conv.id === conversationId ? 'text-blue-400' : 'text-slate-500'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{conv.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(conv.updatedAt).toLocaleDateString('vi-VN', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                        {conv.messages && conv.messages[0] && (
                          <p className="text-[11px] text-slate-500 mt-1 truncate">
                            {conv.messages[0].content}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Floating Action Button ─────────────────────────────────────────── */}
      <button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-600/40 hover:shadow-blue-500/60 hover:scale-110 active:scale-95 transition-all duration-300 group"
        title="Trợ lý AI EduPath"
      >
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping" />
        )}
        {isOpen && !isMinimized ? (
          <Minus className="w-6 h-6 text-white" />
        ) : (
          <Sparkles className="w-6 h-6 text-white transition-transform duration-200 group-hover:rotate-12" />
        )}
        {/* Unread badge when minimized */}
        {isMinimized && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">!</span>
        )}
      </button>
    </>
  );
}
