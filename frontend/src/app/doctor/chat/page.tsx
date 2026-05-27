"use client";

import React from "react";
import { Search, Send, Paperclip, MoreVertical, Phone, Video } from "lucide-react";

export default function DoctorChatPage() {
  return (
    <div className="h-[calc(100vh-8rem)] min-h-[600px] flex bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200">
      {/* Sidebar - Chat List */}
      <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50">
        <div className="p-4 border-b border-slate-100 bg-white">
          <h2 className="font-bold text-lg text-slate-800 mb-4">Tin nhắn</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Active Chat Item */}
          <div className="flex items-center gap-3 p-4 bg-teal-50/50 border-l-4 border-teal-500 cursor-pointer transition-colors">
            <div className="relative">
              <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=100&auto=format&fit=crop" className="w-12 h-12 rounded-full object-cover" alt="Patient" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-semibold text-slate-800 text-sm truncate">Nguyễn Văn A</h3>
                <span className="text-xs text-teal-600 font-medium">Vừa xong</span>
              </div>
              <p className="text-xs text-slate-600 truncate">Bác sĩ ơi, tôi đã uống thuốc theo đơn...</p>
            </div>
          </div>

          {/* Inactive Chat Item */}
          <div className="flex items-center gap-3 p-4 hover:bg-slate-100 cursor-pointer transition-colors border-l-4 border-transparent">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              T
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-semibold text-slate-700 text-sm truncate">Trần Thị B</h3>
                <span className="text-xs text-slate-400">Hôm qua</span>
              </div>
              <p className="text-xs text-slate-500 truncate">Cảm ơn bác sĩ nhiều ạ.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=100&auto=format&fit=crop" className="w-10 h-10 rounded-full object-cover" alt="Patient" />
            <div>
              <h3 className="font-bold text-slate-800">Nguyễn Văn A</h3>
              <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
              <Phone className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-teal-600 hover:bg-teal-50 transition-colors">
              <Video className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 space-y-6">
          {/* Incoming Message */}
          <div className="flex items-end gap-2 max-w-lg">
            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=100&auto=format&fit=crop" className="w-8 h-8 rounded-full object-cover" alt="Patient" />
            <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-sm shadow-sm">
              <p className="text-sm text-slate-700">Chào bác sĩ, tôi vừa nhận được kết quả xét nghiệm máu sáng nay.</p>
              <span className="text-[10px] text-slate-400 mt-1 block">09:12 AM</span>
            </div>
          </div>

          {/* Outgoing Message */}
          <div className="flex items-end gap-2 max-w-lg ml-auto flex-row-reverse">
            <div className="w-8 h-8 rounded-full bg-teal-100 flex shrink-0" />
            <div className="bg-teal-500 text-white p-3 rounded-2xl rounded-br-sm shadow-sm shadow-teal-500/20">
              <p className="text-sm">Chào bạn. Bạn có thể gửi ảnh chụp kết quả qua đây để tôi xem nhé.</p>
              <span className="text-[10px] text-teal-100 mt-1 block text-right">09:15 AM</span>
            </div>
          </div>

          {/* Incoming Message */}
          <div className="flex items-end gap-2 max-w-lg">
            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=100&auto=format&fit=crop" className="w-8 h-8 rounded-full object-cover" alt="Patient" />
            <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-sm shadow-sm">
              <p className="text-sm text-slate-700">Bác sĩ ơi, tôi đã uống thuốc theo đơn từ tuần trước nhưng thỉnh thoảng vẫn thấy hơi đau đầu nhẹ vào buổi sáng.</p>
              <span className="text-[10px] text-slate-400 mt-1 block">Vừa xong</span>
            </div>
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-white border-t border-slate-100">
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-all">
            <button className="p-2 text-slate-400 hover:text-teal-500 transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <input 
              type="text" 
              placeholder="Nhập tin nhắn..." 
              className="flex-1 bg-transparent outline-none text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  alert("Tính năng chat đang trong quá trình phát triển (Mock UI).");
                }
              }}
            />
            <button 
              className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center hover:bg-teal-600 transition-colors shadow-sm"
              onClick={() => alert("Tính năng chat đang trong quá trình phát triển (Mock UI).")}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
