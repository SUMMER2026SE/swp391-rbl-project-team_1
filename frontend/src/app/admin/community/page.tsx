'use client';

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Button } from '@/components/common/Button';
import { ShieldCheck, MessageSquare, AlertTriangle, CheckCircle, XCircle, Trash2, RotateCcw, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'PENDING_POSTS' | 'REPORTED_COMMENTS';

export default function AdminCommunityPage() {
  const [activeTab, setActiveTab] = useState<Tab>('PENDING_POSTS');
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [reportedComments, setReportedComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Reject Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingPostId, setRejectingPostId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Filters
  const [filterType, setFilterType] = useState<string>('');
  
  useEffect(() => {
    if (activeTab === 'PENDING_POSTS') {
      fetchPendingPosts();
    } else {
      fetchReportedComments();
    }
  }, [activeTab]);

  const fetchPendingPosts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/community/moderation/pending');
      if (res.data.success) {
        setPendingPosts(res.data.posts);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách bài viết chờ duyệt.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReportedComments = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/community/moderation/reported-comments');
      if (res.data.success) {
        setReportedComments(res.data.comments);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách bình luận bị báo cáo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePost = async (id: string) => {
    try {
      const res = await api.put(`/community/moderation/${id}/review`, { status: 'PUBLISHED' });
      if (res.data.success) {
        toast.success('Đã duyệt bài viết thành công!');
        fetchPendingPosts();
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi duyệt bài.');
    }
  };

  const openRejectModal = (id: string) => {
    setRejectingPostId(id);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const handleRejectPost = async () => {
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối.');
      return;
    }
    
    try {
      const res = await api.put(`/community/moderation/${rejectingPostId}/review`, { 
        status: 'REJECTED',
        rejectReason
      });
      if (res.data.success) {
        toast.success('Đã từ chối bài viết và gửi thông báo cho tác giả.');
        setIsRejectModalOpen(false);
        fetchPendingPosts();
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi từ chối bài.');
    }
  };

  const handleResolveComment = async (id: string) => {
    try {
      const res = await api.put(`/community/moderation/comments/${id}/resolve`);
      if (res.data.success) {
        toast.success('Đã bỏ qua báo cáo.');
        fetchReportedComments();
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra.');
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này? Hành động này không thể hoàn tác.')) return;
    try {
      const res = await api.delete(`/community/moderation/comments/${id}`);
      if (res.data.success) {
        toast.success('Đã xóa bình luận.');
        fetchReportedComments();
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xóa bình luận.');
    }
  };

  const getPostTypeConfig = (type: string) => {
    switch (type) {
      case 'QUESTION':
        return { label: 'Hỏi đáp', color: 'text-amber-400 bg-amber-950/40 border-amber-900/50' };
      case 'EXPERIENCE':
        return { label: 'Chia sẻ kinh nghiệm', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-900/50' };
      case 'ROADMAP_FEEDBACK':
        return { label: 'Xin góp ý lộ trình', color: 'text-blue-400 bg-blue-950/40 border-blue-900/50' };
      default:
        return { label: 'Khác', color: 'text-slate-400 bg-slate-800 border-slate-700' };
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-indigo-500" />
          Kiểm Duyệt Cộng Đồng
        </h1>
        <p className="text-slate-400 mt-2">Quản lý bài đăng đang chờ duyệt và xử lý các bình luận vi phạm.</p>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('PENDING_POSTS')}
            className={`font-semibold text-sm transition-all px-2 ${
              activeTab === 'PENDING_POSTS' ? 'text-indigo-400 border-b-2 border-indigo-500 pb-1 translate-y-[14px]' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Bài đăng chờ duyệt
              {pendingPosts.length > 0 && activeTab !== 'PENDING_POSTS' && (
                <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{pendingPosts.length}</span>
              )}
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('REPORTED_COMMENTS')}
            className={`font-semibold text-sm transition-all px-2 ${
              activeTab === 'REPORTED_COMMENTS' ? 'text-rose-400 border-b-2 border-rose-500 pb-1 translate-y-[14px]' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Bình luận bị báo cáo
            </div>
          </button>
        </div>

        {activeTab === 'PENDING_POSTS' && (
          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg py-1.5 px-3 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="">Tất cả loại bài</option>
              <option value="QUESTION">Hỏi đáp</option>
              <option value="EXPERIENCE">Chia sẻ kinh nghiệm</option>
              <option value="ROADMAP_FEEDBACK">Xin góp ý lộ trình</option>
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : activeTab === 'PENDING_POSTS' ? (
        <div className="space-y-4">
          {pendingPosts.filter(p => !filterType || p.type === filterType).length === 0 ? (
            <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800">
              <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Không có bài đăng nào đang chờ duyệt.</p>
            </div>
          ) : (
            pendingPosts
              .filter(post => !filterType || post.type === filterType)
              .map(post => {
              const typeConfig = getPostTypeConfig(post.type);
              return (
                <div key={post.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row gap-6 hover:border-slate-700 transition-colors">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${typeConfig.color}`}>
                        {typeConfig.label}
                      </span>
                      <span className="text-sm font-semibold text-slate-300">{post.author?.user?.fullName}</span>
                      <span className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{post.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">
                      {post.content}
                    </p>
                    {post.skillTags && post.skillTags.length > 0 && (
                      <div className="flex gap-2 pt-2">
                        {post.skillTags.map((s: any) => (
                          <span key={s.id} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-row md:flex-col gap-3 justify-center md:min-w-[140px]">
                    <Button 
                      onClick={() => handleApprovePost(post.id)}
                      className="flex-1 md:flex-none bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/50 transition-colors py-2.5 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Duyệt bài
                    </Button>
                    <Button 
                      onClick={() => openRejectModal(post.id)}
                      className="flex-1 md:flex-none bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/50 transition-colors py-2.5 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Từ chối
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reportedComments.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800">
              <CheckCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Tuyệt vời! Không có bình luận nào bị báo cáo.</p>
            </div>
          ) : (
            reportedComments.map(comment => (
              <div key={comment.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-950/50 border border-rose-900/50 rounded-lg text-rose-400 text-xs font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {comment.reportCount} Reports
                      </div>
                      <span className="text-sm font-semibold text-slate-300">{comment.author?.user?.fullName}</span>
                      <span className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mt-2">
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Thuộc bài đăng: <span className="font-semibold text-slate-400">{comment.post?.title}</span>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col gap-3 justify-center md:min-w-[160px]">
                    <Button 
                      onClick={() => handleResolveComment(comment.id)}
                      className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors py-2 flex items-center justify-center gap-2 text-xs font-semibold"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Bỏ qua báo cáo
                    </Button>
                    <Button 
                      onClick={() => handleDeleteComment(comment.id)}
                      className="flex-1 md:flex-none bg-rose-600 hover:bg-rose-500 text-white transition-colors py-2 flex items-center justify-center gap-2 text-xs font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa bình luận
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reject Reason Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsRejectModalOpen(false)}></div>
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-500" />
                Từ chối bài đăng
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-400">
                Vui lòng cung cấp lý do từ chối để tác giả biết và chỉnh sửa (bắt buộc). Lý do này sẽ được gửi trực tiếp cho sinh viên.
              </p>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Bài đăng của bạn vi phạm nội quy..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-sm focus:outline-none focus:border-rose-500/50 transition-all placeholder-slate-600"
              />
            </div>
            <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3 rounded-b-3xl">
              <Button 
                onClick={() => setIsRejectModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              >
                Hủy
              </Button>
              <Button 
                onClick={handleRejectPost}
                className="bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20"
              >
                Xác nhận từ chối
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
