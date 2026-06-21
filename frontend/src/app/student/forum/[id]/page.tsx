'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/services/api';
import { Button } from '@/components/common/Button';
import { ArrowLeft, ArrowUpCircle, MessageSquare, Flag, Paperclip, Clock, Tag, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

export default function PostDetailsPage() {
  const { id: postId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (postId) {
      fetchPostDetails();
    }
  }, [postId]);

  const fetchPostDetails = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/community/posts/${postId}`);
      if (res.data.success) {
        setPost(res.data.post);
      }
    } catch (error) {
      toast.error('Không thể tải chi tiết bài viết.');
      router.push('/student/forum');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpvote = async () => {
    try {
      const res = await api.post(`/community/posts/${postId}/upvote`);
      if (res.data.success) {
        // Update local state smoothly
        setPost((prev: any) => ({
          ...prev,
          upvoteCount: res.data.upvoteCount,
          upvotedBy: res.data.hasUpvoted 
            ? [...(prev.upvotedBy || []), { id: user?.student?.id }] 
            : (prev.upvotedBy || []).filter((u: any) => u.id !== user?.student?.id)
        }));
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi upvote.');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    setIsSubmitting(true);
    try {
      const res = await api.post(`/community/posts/${postId}/comments`, {
        content: commentText
      });
      if (res.data.success) {
        setCommentText('');
        // Add new comment to local state
        setPost((prev: any) => ({
          ...prev,
          comments: [...(prev.comments || []), res.data.comment]
        }));
        toast.success('Gửi bình luận thành công!');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi gửi bình luận.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportComment = async (commentId: string) => {
    try {
      const res = await api.post(`/community/comments/${commentId}/report`);
      if (res.data.success) {
        toast.success('Đã báo cáo bình luận. Cảm ơn bạn!');
        // Update local state to increment report count
        setPost((prev: any) => ({
          ...prev,
          comments: prev.comments.map((c: any) => 
            c.id === commentId ? { ...c, reportCount: c.reportCount + 1 } : c
          )
        }));
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi báo cáo.');
    }
  };

  const handleReportPost = async () => {
    toast.success('Đã báo cáo bài viết. Cảm ơn bạn!');
    // In a real app we would call an API here.
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
        return { label: 'Thảo luận', color: 'text-slate-400 bg-slate-800 border-slate-700' };
    }
  };

  const getTimeAgo = (dateString: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " năm trước";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " tháng trước";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " ngày trước";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " giờ trước";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " phút trước";
    return Math.floor(seconds) + " giây trước";
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!post) return null;

  const typeConfig = getPostTypeConfig(post.type);
  const currentStudentId = user?.student?.id;
  const hasUpvoted = post.upvotedBy?.some((u: any) => u.id === currentStudentId);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 min-h-screen text-slate-100">
      <button 
        onClick={() => router.push('/student/forum')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Quay lại Cộng đồng</span>
      </button>

      {/* Main Post Content */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
        
        {/* Header: Author & Time & Badge */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/50 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white text-lg font-bold overflow-hidden shadow-inner">
              {post.author?.user?.avatarUrl ? (
                <img src={`http://localhost:5000${post.author.user.avatarUrl}`} alt="" className="w-full h-full object-cover" />
              ) : (
                post.author?.user?.fullName?.substring(0, 2).toUpperCase() || 'U'
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-lg">{post.author?.user?.fullName}</h3>
              <div className="text-slate-500 text-xs flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                {getTimeAgo(post.createdAt)}
              </div>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${typeConfig.color} self-start md:self-auto`}>
            {typeConfig.label}
          </span>
        </div>

        {/* Title & Content */}
        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
            {post.title}
          </h1>
          
          <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </div>

          {/* Skill Tags */}
          {post.skillTags && post.skillTags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800/50 mt-6">
              {post.skillTags.map((skill: any) => (
                <span key={skill.id} className="text-xs bg-slate-800/80 text-slate-300 px-3 py-1 rounded-lg flex items-center gap-1.5 border border-slate-700/50">
                  <Tag className="w-3.5 h-3.5" />
                  {skill.name}
                </span>
              ))}
            </div>
          )}

          {/* Attached Roadmap Preview Card */}
          {post.attachedRoadmapId && (
            <div className="bg-gradient-to-br from-blue-950/30 to-indigo-950/30 border border-blue-900/40 rounded-xl p-4 mt-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-900/50 flex items-center justify-center text-blue-400">
                  <Paperclip className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Lộ trình đính kèm</h4>
                  <p className="text-xs text-slate-400 mt-0.5">ID: {post.attachedRoadmapId}</p>
                </div>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 px-4 rounded-lg flex items-center gap-1.5">
                Xem lộ trình này <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-800/50">
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpvote}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                hasUpvoted 
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-sm shadow-indigo-500/10' 
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <ArrowUpCircle className={`w-5 h-5 ${hasUpvoted ? 'fill-indigo-500/20' : ''}`} />
              <span className="font-bold">{post.upvoteCount} Upvotes</span>
            </button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
              <MessageSquare className="w-5 h-5" />
              <span className="font-bold">{post.comments?.filter((c:any) => c.reportCount < 5).length || 0} Bình luận</span>
            </div>
          </div>

          <button 
            onClick={handleReportPost}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors text-xs font-semibold"
          >
            <Flag className="w-4 h-4" />
            Báo cáo
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-8">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          Bình luận
        </h3>

        {/* Comment Form */}
        <form onSubmit={handleCommentSubmit} className="flex gap-4">
          <div className="w-10 h-10 shrink-0 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-sm font-bold overflow-hidden">
            {user?.avatarUrl ? (
              <img src={`http://localhost:5000${user.avatarUrl}`} alt="" className="w-full h-full object-cover" />
            ) : (
              user?.fullName?.substring(0, 2).toUpperCase() || 'U'
            )}
          </div>
          <div className="flex-1 space-y-3">
            <textarea
              rows={3}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Viết bình luận của bạn..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500/50 transition-all placeholder-slate-600"
            />
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting || !commentText.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2 px-6 rounded-lg text-sm font-bold shadow-md shadow-indigo-500/20 transition-all"
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi bình luận'}
              </Button>
            </div>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-6 pt-4">
          {post.comments?.filter((c: any) => c.reportCount < 5).length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ ý kiến của bạn!
            </div>
          ) : (
            post.comments?.map((comment: any) => {
              if (comment.reportCount >= 5) {
                return (
                  <div key={comment.id} className="py-3 px-4 bg-rose-950/10 border border-rose-900/20 rounded-xl text-xs text-rose-400/80 italic text-center">
                    Bình luận này đã bị ẩn do có quá nhiều lượt báo cáo.
                  </div>
                );
              }

              return (
                <div key={comment.id} className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-sm font-bold overflow-hidden">
                    {comment.author?.user?.avatarUrl ? (
                      <img src={`http://localhost:5000${comment.author.user.avatarUrl}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      comment.author?.user?.fullName?.substring(0, 2).toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="flex-1 bg-slate-950 border border-slate-800/80 rounded-xl rounded-tl-sm p-4">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h4 className="font-bold text-slate-200 text-sm">{comment.author?.user?.fullName}</h4>
                        <span className="text-[11px] text-slate-500">{getTimeAgo(comment.createdAt)}</span>
                      </div>
                      <button 
                        onClick={() => handleReportComment(comment.id)}
                        className="text-slate-600 hover:text-rose-400 p-1 rounded transition-colors"
                        title="Báo cáo bình luận này"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
