"use client";

import React, { useEffect, useState, useCallback } from "react";
import { adminService } from "@/services/admin.service";
import { AdminArticle, CreateArticlePayload, UpdateArticlePayload } from "@/types/admin";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  FileText,
  X,
  Eye,
  EyeOff,
  Globe,
} from "lucide-react";

interface ArticleFormData {
  title: string;
  content: string;
  thumbnail: string;
  published: boolean;
}

const emptyForm: ArticleFormData = { title: "", content: "", thumbnail: "", published: false };

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<AdminArticle | null>(null);
  const [formData, setFormData] = useState<ArticleFormData>(emptyForm);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<AdminArticle | null>(null);

  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getArticles();
      setArticles(res.data);
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể tải danh sách bài viết.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => setActionMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

  const filteredArticles = articles.filter(
    (a) =>
      !searchQuery.trim() ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingArticle(null);
    setFormData(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (article: AdminArticle) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      thumbnail: article.thumbnail || "",
      published: article.published,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;
    setSubmitting(true);
    try {
      if (editingArticle) {
        const payload: UpdateArticlePayload = {
          title: formData.title,
          content: formData.content,
          thumbnail: formData.thumbnail || undefined,
          published: formData.published,
        };
        await adminService.updateArticle(editingArticle.id, payload);
        setActionMessage({ type: "success", text: `Đã cập nhật bài viết "${formData.title}".` });
      } else {
        const payload: CreateArticlePayload = {
          title: formData.title,
          content: formData.content,
          thumbnail: formData.thumbnail || undefined,
          published: formData.published,
        };
        await adminService.createArticle(payload);
        setActionMessage({ type: "success", text: `Đã tạo bài viết "${formData.title}" thành công!` });
      }
      setModalOpen(false);
      setFormData(emptyForm);
      loadArticles();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể lưu bài viết.";
      setActionMessage({ type: "error", text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async (article: AdminArticle) => {
    setSubmitting(true);
    try {
      await adminService.updateArticle(article.id, { published: !article.published });
      setActionMessage({
        type: "success",
        text: `Bài viết "${article.title}" đã ${!article.published ? "được xuất bản" : "bị ẩn"}.`,
      });
      loadArticles();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể thay đổi trạng thái bài viết.";
      setActionMessage({ type: "error", text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await adminService.deleteArticle(deleteTarget.id);
      setActionMessage({ type: "success", text: `Đã xóa bài viết "${deleteTarget.title}".` });
      setDeleteTarget(null);
      loadArticles();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể xóa bài viết này.";
      setActionMessage({ type: "error", text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <LoadingSpinner className="h-10 w-10 text-teal-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white">Quản lý Bài viết</h1>
          <p className="text-sm text-slate-400">Viết, chỉnh sửa, xuất bản và quản lý các bài viết sức khỏe.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Thêm bài viết
        </button>
      </div>

      {error && <Alert type="error" message={error} className="bg-red-950/40 border-red-900/50 text-red-300" />}
      {actionMessage && <Alert type={actionMessage.type} message={actionMessage.text} className="my-2" />}

      {/* Search */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề bài viết..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-sm font-medium">
              <FileText className="h-10 w-10 mx-auto mb-3 text-slate-700" />
              Không tìm thấy bài viết nào.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  <th className="p-5 font-semibold">Tiêu đề</th>
                  <th className="p-5 font-semibold">Thumbnail</th>
                  <th className="p-5 font-semibold">Trạng thái</th>
                  <th className="p-5 font-semibold">Ngày tạo</th>
                  <th className="p-5 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-900">
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-5 font-bold text-slate-200 max-w-[300px]">
                      <p className="truncate" title={article.title}>{article.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[250px]" title={article.content}>
                        {article.content.substring(0, 80)}...
                      </p>
                    </td>
                    <td className="p-5">
                      {article.thumbnail ? (
                        <div className="h-10 w-16 rounded-lg overflow-hidden bg-slate-900">
                          <img src={article.thumbnail} alt="" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <span className="text-slate-600 italic text-[10px]">Chưa có</span>
                      )}
                    </td>
                    <td className="p-5">
                      {article.published ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold text-[10px] tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          <Globe className="h-3 w-3" /> Đã xuất bản
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold text-[10px] tracking-wide uppercase bg-slate-800 text-slate-400 border-slate-700">
                          <EyeOff className="h-3 w-3" /> Bản nháp
                        </span>
                      )}
                    </td>
                    <td className="p-5 text-slate-500">
                      {new Date(article.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTogglePublish(article)}
                          disabled={submitting}
                          className={`p-2 rounded-lg border transition-all disabled:opacity-50 ${
                            article.published
                              ? "bg-slate-900 hover:bg-amber-500/10 border-slate-800 hover:border-amber-500/20 text-slate-400 hover:text-amber-400"
                              : "bg-slate-900 hover:bg-emerald-500/10 border-slate-800 hover:border-emerald-500/20 text-slate-400 hover:text-emerald-400"
                          }`}
                          title={article.published ? "Ẩn bài viết" : "Xuất bản"}
                        >
                          {article.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => openEditModal(article)}
                          className="p-2 rounded-lg bg-slate-900 hover:bg-teal-500/10 border border-slate-800 hover:border-teal-500/20 text-slate-400 hover:text-teal-400 transition-all shadow-sm"
                          title="Chỉnh sửa"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(article)}
                          className="p-2 rounded-lg bg-slate-900 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 text-slate-400 hover:text-red-400 transition-all shadow-sm"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-white">
                {editingArticle ? "Chỉnh sửa Bài viết" : "Thêm Bài viết mới"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Tiêu đề *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Tiêu đề bài viết"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nội dung *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Nội dung bài viết..."
                  rows={8}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Thumbnail (URL)
                </label>
                <input
                  type="text"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData((prev) => ({ ...prev, thumbnail: e.target.value }))}
                  placeholder="https://example.com/thumbnail.jpg"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, published: !prev.published }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.published ? "bg-teal-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.published ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-sm text-slate-300 font-medium">
                  {formData.published ? "Xuất bản ngay" : "Lưu bản nháp"}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 bg-slate-900 border border-slate-800 hover:text-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !formData.title.trim() || !formData.content.trim()}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Đang lưu..." : editingArticle ? "Cập nhật" : "Tạo mới"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Xóa Bài viết</h3>
            <p className="text-sm text-slate-400 mb-5">
              Bạn có chắc chắn muốn xóa bài viết{" "}
              <strong className="text-slate-200">&quot;{deleteTarget.title}&quot;</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 bg-slate-900 border border-slate-800 hover:text-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Đang xóa..." : "Xác nhận Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
