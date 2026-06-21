'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react';
import { handleError } from '@/utils/errorHandler';
import toast from 'react-hot-toast';
import api from '@/services/api';

export default function RoadmapTemplatesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // For delete modal
  const [templateToDelete, setTemplateToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/roadmap/templates');
      if (res.data.success) {
        setTemplates(res.data.templates || []);
      }
    } catch (error) {
      handleError(error, 'Không thể tải danh sách lộ trình mẫu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const res = await api.delete(`/mentor/roadmap-templates/${templateToDelete.id}`);
      if (res.data.success) {
        setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));
        toast.success('Đã xóa lộ trình mẫu thành công!'); // Workaround to use handleError for success temporarily, wait no, let's use toast.
        // Wait, I will use window.confirm below instead of state to be quick.
      }
    } catch (error) {
      handleError(error, 'Xóa lộ trình mẫu thất bại.');
    } finally {
      setIsDeleting(false);
      setTemplateToDelete(null);
    }
  };

  const confirmDelete = async (template: any) => {
    if (window.confirm(`Bạn có chắc muốn xóa lộ trình mẫu "${template.title}"? Hành động này không thể hoàn tác.`)) {
      setTemplateToDelete(template);
      setIsDeleting(true);
      try {
        const res = await api.delete(`/mentor/roadmap-templates/${template.id}`);
        if (res.data.success) {
          setTemplates(prev => prev.filter(t => t.id !== template.id));
          toast.success('Đã xóa lộ trình mẫu thành công!');
        }
      } catch (error) {
        handleError(error, 'Xóa lộ trình mẫu thất bại.');
      } finally {
        setIsDeleting(false);
        setTemplateToDelete(null);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="animate-pulse bg-slate-900 rounded-2xl h-32"></div>
        <div className="animate-pulse bg-slate-900 rounded-2xl h-64"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-emerald-500" />
            Quản lý Lộ trình Mẫu
          </h1>
          <p className="text-slate-400 mt-1">Danh sách các Roadmap Templates dành cho sinh viên.</p>
        </div>
        <button
          onClick={() => router.push('/mentor/roadmap-templates/create')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-5 h-5" />
          Tạo Lộ trình mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {templates.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
            Chưa có lộ trình mẫu nào. Hãy tạo lộ trình đầu tiên!
          </div>
        ) : (
          templates.map((template) => {
            const canEdit = user?.role === 'ADMIN' || template.createdById === user?.id;

            return (
              <div key={template.id} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden hover:border-emerald-500/30 transition-colors flex flex-col">
                <div className={`h-24 bg-gradient-to-r ${template.bannerGradient} opacity-80`} />
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{template.title}</h3>
                  <p className="text-sm text-slate-400 mb-4 line-clamp-3 flex-1">{template.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-md">
                      {template.durationWeeks} tuần
                    </span>
                    <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-md">
                      {template.phases?.length || 0} Phase
                    </span>
                    <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-md">
                      {template.difficulty}
                    </span>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-800 mt-auto">
                      <button
                        onClick={() => router.push(`/mentor/roadmap-templates/${template.id}/edit`)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Sửa
                      </button>
                      <button
                        onClick={() => confirmDelete(template)}
                        disabled={isDeleting}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
