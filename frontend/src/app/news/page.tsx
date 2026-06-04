"use client";

import React, { useEffect, useState } from "react";
import { articleService, Article, RealtimeArticle } from "@/services/article.service";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import { Calendar, Clock, ExternalLink, ArrowRight, Newspaper, Bell, Rss, BookOpen, X } from "lucide-react";

export default function PatientNewsPage() {
  const [activeTab, setActiveTab] = useState<"realtime" | "system">("realtime");
  const [systemArticles, setSystemArticles] = useState<Article[]>([]);
  const [realtimeArticles, setRealtimeArticles] = useState<RealtimeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State for Viewing System Article Content
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    async function loadNews() {
      try {
        setLoading(true);
        setError(null);

        if (activeTab === "realtime") {
          const res = await articleService.getRealtimeArticles();
          setRealtimeArticles(res.data || []);
        } else {
          const res = await articleService.getPublicArticles();
          setSystemArticles(res.data || []);
        }
      } catch (err: any) {
        setError("Không thể tải tin tức vào lúc này. Vui lòng kiểm tra lại sau.");
        console.error("Error loading news:", err);
      } finally {
        setLoading(false);
      }
    }

    loadNews();
  }, [activeTab]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow">
      {/* Header Banner */}
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Tin Tức & Kiến Thức Sức Khỏe</span>
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
          Cẩm Nang Chăm Sóc Sức Khỏe
        </h1>
        <p className="text-base text-slate-500 max-w-2xl mx-auto">
          Cập nhật thông tin y khoa chính thống, bản tin phòng dịch, và thông báo quan trọng từ hệ thống MedBooking mỗi ngày.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex justify-center mb-10">
        <div className="bg-slate-100/80 backdrop-blur-sm p-1.5 rounded-2xl flex gap-1 border border-slate-200">
          <button
            onClick={() => setActiveTab("realtime")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
              activeTab === "realtime"
                ? "bg-white text-teal-600 shadow-sm border border-slate-200/50"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Rss className="w-4 h-4" />
            Tin Y Tế Ngoài Nước & Trong Nước
          </button>
          <button
            onClick={() => setActiveTab("system")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
              activeTab === "system"
                ? "bg-white text-teal-600 shadow-sm border border-slate-200/50"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Bell className="w-4 h-4" />
            Bản Tin MedBooking
          </button>
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm animate-pulse space-y-4 p-4">
              <div className="bg-slate-200 h-48 w-full rounded-2xl" />
              <div className="space-y-2">
                <div className="bg-slate-200 h-4 w-1/4 rounded" />
                <div className="bg-slate-200 h-6 w-3/4 rounded" />
                <div className="bg-slate-200 h-4 w-full rounded" />
                <div className="bg-slate-200 h-4 w-5/6 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <Alert type="error" message={error} className="max-w-2xl mx-auto" />
      ) : activeTab === "realtime" ? (
        realtimeArticles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-base font-bold text-slate-800">Không có tin tức nào mới nhất</p>
            <p className="text-sm text-slate-500 mt-1">Hệ thống đang tải lại nguồn cấp tin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {realtimeArticles.map((article, idx) => (
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                key={idx}
                className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full"
              >
                {/* Image */}
                <div className="h-48 overflow-hidden relative bg-teal-50 shrink-0">
                  {article.thumbnail ? (
                    <img
                      src={article.thumbnail}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold">
                      Tin tức Y khoa
                    </div>
                  )}
                  <span className="absolute top-4 left-4 bg-red-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    VnExpress
                  </span>
                </div>

                {/* Body */}
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{article.pubDate ? new Date(article.pubDate).toLocaleDateString("vi-VN") : "Hôm nay"}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-base line-clamp-2 leading-snug group-hover:text-teal-600 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {article.summary}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-50 mt-4 flex items-center justify-between text-teal-600 text-xs font-bold">
                    <span>Đọc tiếp báo gốc</span>
                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        )
      ) : systemArticles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-base font-bold text-slate-800">Không tìm thấy thông báo nào</p>
          <p className="text-sm text-slate-500 mt-1">Ban quản trị hệ thống chưa đăng tải bài viết nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {systemArticles.map((article) => (
            <div
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full cursor-pointer"
            >
              {/* Image */}
              <div className="h-48 overflow-hidden relative bg-teal-50 shrink-0">
                {article.thumbnail ? (
                  <img
                    src={article.thumbnail}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-teal-300 bg-teal-50/30">
                    <BookOpen className="w-8 h-8 text-teal-600" />
                  </div>
                )}
                <span className="absolute top-4 left-4 bg-teal-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  Thông báo
                </span>
              </div>

              {/* Body */}
              <div className="p-6 flex-grow flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(article.createdAt).toLocaleDateString("vi-VN")}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-base line-clamp-2 leading-snug group-hover:text-teal-600 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {article.content}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-50 mt-4 flex items-center justify-between text-teal-600 text-xs font-bold">
                  <span>Chi tiết thông báo</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* System Article Modal Viewer */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div className="space-y-1">
                <span className="bg-teal-50 text-teal-700 font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Bản tin hệ thống
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2 leading-snug">
                  {selectedArticle.title}
                </h3>
                <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Đăng ngày {new Date(selectedArticle.createdAt).toLocaleString("vi-VN")}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-slate-600 leading-relaxed text-sm">
              {selectedArticle.thumbnail && (
                <div className="w-full h-64 rounded-2xl overflow-hidden mb-4">
                  <img
                    src={selectedArticle.thumbnail}
                    alt={selectedArticle.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="whitespace-pre-line">
                {selectedArticle.content}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
