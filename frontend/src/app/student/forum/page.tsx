'use client';

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Users, MessageSquare, ThumbsUp, Plus, Tag, Search, Clock, ArrowUpCircle, Paperclip, X, Send, AlertTriangle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Tab = 'COMMUNITY' | 'MY_POSTS';

export default function ForumPage() {
  const [activeTab, setActiveTab] = useState<Tab>('COMMUNITY');
  const [posts, setPosts] = useState<any[]>([]);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Filters State (Community)
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Skills List
  const [skillsList, setSkillsList] = useState<any[]>([]);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostType, setNewPostType] = useState('QUESTION');
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [attachedRoadmapId, setAttachedRoadmapId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock User Roadmaps
  const [userRoadmaps, setUserRoadmaps] = useState<any[]>([]);

  useEffect(() => {
    fetchSkills();
    // Simulate fetching user's public roadmaps
    setUserRoadmaps([]); 
  }, []);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (activeTab === 'COMMUNITY') {
      fetchPosts();
    } else {
      fetchMyPosts();
    }
  }, [activeTab, debouncedSearch, selectedType, selectedSkill, sortBy]);

  const fetchSkills = async () => {
    try {
      const res = await api.get('/auth/skills');
      if (res.data.success) {
        const flat: any[] = [];
        res.data.skills.forEach((s: any) => {
          if (s.children && s.children.length > 0) {
            flat.push(...s.children);
          } else {
            flat.push(s);
          }
        });
        setSkillsList(flat);
      }
    } catch (_) {}
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedType) params.append('type', selectedType);
      if (selectedSkill) params.append('skillId', selectedSkill);
      if (sortBy !== 'newest') params.append('sortBy', sortBy);

      const res = await api.get(`/community/posts?${params.toString()}`);
      if (res.data.success) {
        setPosts(res.data.posts);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách bài viết.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyPosts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/community/my-posts');
      if (res.data.success) {
        setMyPosts(res.data.posts);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách bài viết của bạn.');
    } finally {
      setIsLoading(false);
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

  const toggleSkill = (id: string) => {
    if (selectedSkills.includes(id)) {
      setSelectedSkills(selectedSkills.filter(s => s !== id));
    } else {
      if (selectedSkills.length >= 3) {
        toast.error('Chỉ được chọn tối đa 3 kỹ năng.');
        return;
      }
      setSelectedSkills([...selectedSkills, id]);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast.error('Vui lòng điền đủ Tiêu đề và Nội dung.');
      return;
    }
    if (newPostTitle.trim().length < 5) {
      toast.error('Tiêu đề bài viết phải có ít nhất 5 ký tự.');
      return;
    }
    if (newPostContent.trim().length < 10) {
      toast.error('Nội dung bài viết phải có ít nhất 10 ký tự.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/community/posts', {
        title: newPostTitle,
        content: newPostContent,
        type: newPostType,
        skillIds: selectedSkills,
        attachedRoadmapId: attachedRoadmapId || null
      });

      if (res.data.success) {
        toast.success('Bài đăng của bạn đang chờ kiểm duyệt, sẽ hiển thị công khai sau khi được Admin/Mentor phê duyệt!', { duration: 5000 });
        setIsCreateModalOpen(false);
        // Reset form
        setNewPostTitle('');
        setNewPostContent('');
        setNewPostType('QUESTION');
        setSelectedSkills([]);
        setAttachedRoadmapId('');
        
        // Refresh my posts if that tab is active
        if (activeTab === 'MY_POSTS') {
          fetchMyPosts();
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo bài viết.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen text-slate-100 relative">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Cộng Đồng EduPath
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Nơi giao lưu, chia sẻ kinh nghiệm học tập và giải đáp thắc mắc giữa các học viên.
          </p>

          <div className="flex gap-4 mt-6">
            <button 
              onClick={() => setActiveTab('COMMUNITY')}
              className={`pb-2 border-b-2 font-medium text-sm transition-all ${
                activeTab === 'COMMUNITY' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Tất cả bài đăng
            </button>
            <button 
              onClick={() => setActiveTab('MY_POSTS')}
              className={`pb-2 border-b-2 font-medium text-sm transition-all ${
                activeTab === 'MY_POSTS' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Bài đăng của tôi
            </button>
          </div>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 py-2.5 px-6 rounded-xl flex items-center gap-2 font-bold transition-all hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          <span>Tạo bài đăng</span>
        </Button>
      </div>

      {activeTab === 'COMMUNITY' && (
        <>
          {/* Toolbar / Filters */}
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center animate-in fade-in slide-in-from-bottom-2">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm bài đăng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-slate-600"
              />
            </div>

            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer"
              >
                <option value="">Tất cả loại bài</option>
                <option value="QUESTION">Hỏi đáp</option>
                <option value="EXPERIENCE">Chia sẻ kinh nghiệm</option>
                <option value="ROADMAP_FEEDBACK">Xin góp ý lộ trình</option>
              </select>

              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer max-w-[200px] truncate"
              >
                <option value="">Tất cả kỹ năng</option>
                {skillsList.map((skill) => (
                  <option key={skill.id} value={skill.id}>{skill.name}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer"
              >
                <option value="newest">Mới nhất</option>
                <option value="upvotes">Nhiều upvote nhất</option>
                <option value="comments">Nhiều bình luận nhất</option>
              </select>
            </div>
          </div>

          {/* Content Area */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800 animate-in fade-in">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-300">Không tìm thấy bài đăng nào</h3>
              <p className="text-slate-500 text-sm mt-1">Hãy thay đổi bộ lọc hoặc là người đầu tiên tạo bài đăng!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => {
                const typeConfig = getPostTypeConfig(post.type);
                return (
                  <Link key={post.id} href={`/student/forum/${post.id}`}>
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/50 hover:bg-slate-900/80 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 group cursor-pointer flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden shadow-inner">
                            {post.author?.user?.avatarUrl ? (
                              <img src={`http://localhost:5000${post.author.user.avatarUrl}`} alt="" className="w-full h-full object-cover" />
                            ) : (
                              post.author?.user?.fullName?.substring(0, 2).toUpperCase() || 'U'
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold text-slate-200">{post.author?.user?.fullName}</span>
                            <span className="text-slate-600 text-[10px]">•</span>
                            <span className="text-slate-500 text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getTimeAgo(post.createdAt)}
                            </span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                      </div>

                      <div className="pl-11 space-y-2">
                        <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-400 transition-colors leading-snug">
                          {post.title}
                        </h3>
                        <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
                          {post.content}
                        </p>
                        {post.skillTags && post.skillTags.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {post.skillTags.map((skill: any) => (
                              <span key={skill.id} className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-700/50">
                                <Tag className="w-3 h-3" />
                                {skill.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pl-11 flex items-center justify-between pt-2">
                        <div className="flex items-center gap-4 text-slate-400">
                          <div className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors">
                            <ArrowUpCircle className="w-4 h-4" />
                            <span className="text-xs font-semibold">{post.upvoteCount}</span>
                          </div>
                          <div className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors">
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-xs font-semibold">{post._count?.comments || 0}</span>
                          </div>
                        </div>

                        {post.attachedRoadmapId && (
                          <div className="flex items-center gap-1.5 text-[11px] text-blue-400 bg-blue-950/30 px-2.5 py-1 rounded-lg border border-blue-900/30">
                            <Paperclip className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[200px]">Đính kèm lộ trình: {post.attachedRoadmapId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'MY_POSTS' && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : myPosts.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-300">Chưa có bài đăng nào</h3>
              <p className="text-slate-500 text-sm mt-1">Các bài đăng bạn tạo sẽ xuất hiện ở đây.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myPosts.map((post) => {
                const typeConfig = getPostTypeConfig(post.type);
                return (
                  <div key={post.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                        <span className="text-slate-500 text-xs">
                          {getTimeAgo(post.createdAt)}
                        </span>
                      </div>
                      
                      {/* Status Badge */}
                      {post.status === 'PENDING' && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-900/50 bg-amber-950/40 text-amber-400">
                          Đang chờ duyệt
                        </span>
                      )}
                      {post.status === 'PUBLISHED' && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-900/50 bg-emerald-950/40 text-emerald-400">
                          Đã đăng tải
                        </span>
                      )}
                      {post.status === 'REJECTED' && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-rose-900/50 bg-rose-950/40 text-rose-400">
                          Bị từ chối
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-slate-100">{post.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">{post.content}</p>
                    </div>

                    {post.status === 'REJECTED' && post.rejectReason && (
                      <div className="bg-rose-950/20 border border-rose-900/50 p-3 rounded-xl mt-2 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <p className="text-rose-400 text-xs leading-relaxed"><strong className="block text-rose-500 mb-0.5">Lý do từ chối:</strong> {post.rejectReason}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Post Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-extrabold text-white">Tạo Bài Đăng Mới</h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="space-y-2">
                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Tiêu đề bài viết <span className="text-rose-500">*</span></label>
                <Input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="Nhập tiêu đề ngắn gọn, rõ ràng..."
                  className="bg-slate-950 border-slate-800 text-slate-200 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Loại bài đăng <span className="text-rose-500">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {['QUESTION', 'EXPERIENCE', 'ROADMAP_FEEDBACK'].map((t) => (
                    <label
                      key={t}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all text-center ${
                        newPostType === t 
                          ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 shadow-sm shadow-indigo-500/10' 
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="postType" 
                        value={t} 
                        checked={newPostType === t} 
                        onChange={() => setNewPostType(t)} 
                        className="sr-only" 
                      />
                      <span className="font-bold text-xs">
                        {t === 'QUESTION' ? 'Hỏi đáp' : t === 'EXPERIENCE' ? 'Chia sẻ kinh nghiệm' : 'Xin góp ý lộ trình'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Nội dung <span className="text-rose-500">*</span></label>
                <textarea
                  rows={6}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Trình bày chi tiết câu hỏi hoặc kinh nghiệm của bạn..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500/50 transition-all placeholder-slate-700"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Kỹ năng liên quan (Tối đa 3)</label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl max-h-32 overflow-y-auto custom-scrollbar">
                  {skillsList.map((skill) => {
                    const isSelected = selectedSkills.includes(skill.id);
                    return (
                      <button
                        type="button"
                        key={skill.id}
                        onClick={() => toggleSkill(skill.id)}
                        className={`text-[10px] px-2.5 py-1 rounded-md transition-all border font-medium flex items-center gap-1 ${
                          isSelected 
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-500/20' 
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        {skill.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {(newPostType === 'EXPERIENCE' || newPostType === 'ROADMAP_FEEDBACK') && (
                <div className="space-y-2">
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Đính kèm lộ trình công khai (Tùy chọn)</label>
                  <select
                    value={attachedRoadmapId}
                    onChange={(e) => setAttachedRoadmapId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-xl p-3 focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer"
                  >
                    <option value="">-- Không đính kèm lộ trình --</option>
                    {userRoadmaps.length > 0 ? (
                      userRoadmaps.map((r, idx) => (
                        <option key={idx} value={r.id}>{r.name}</option>
                      ))
                    ) : (
                      <option disabled>Bạn chưa có lộ trình nào được share public</option>
                    )}
                  </select>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3 rounded-b-3xl">
              <Button 
                onClick={() => setIsCreateModalOpen(false)} 
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 py-2.5 px-6 rounded-xl text-sm font-semibold"
              >
                Hủy bỏ
              </Button>
              <Button 
                onClick={handleCreatePost} 
                disabled={isSubmitting}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 py-2.5 px-6 rounded-xl text-sm font-bold flex items-center gap-2"
              >
                {isSubmitting ? 'Đang gửi...' : 'Đăng bài'}
                {!isSubmitting && <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
