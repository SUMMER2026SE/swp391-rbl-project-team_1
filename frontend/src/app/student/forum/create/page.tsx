'use client';

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ArrowLeft, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateForumPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('QUESTION');
  const [attachedRoadmapId, setAttachedRoadmapId] = useState('');
  
  const [skillsList, setSkillsList] = useState<any[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const response = await api.get('/auth/skills');
      if (response.data.success) {
        // Flatten skills
        const flat: any[] = [];
        response.data.skills.forEach((s: any) => {
          if (s.children && s.children.length > 0) {
            flat.push(...s.children);
          } else {
            flat.push(s);
          }
        });
        setSkillsList(flat);
      }
    } catch (_) {
      toast.error('Không thể tải danh sách kỹ năng.');
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Tiêu đề và nội dung không được để trống.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/community/posts', {
        title,
        content,
        type,
        skillIds: selectedSkills,
        attachedRoadmapId: attachedRoadmapId || null
      });

      if (res.data.success) {
        toast.success('Bài đăng đã được gửi để kiểm duyệt!');
        router.push('/student/forum');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo bài viết.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 min-h-screen text-slate-100">
      <div className="flex items-center gap-4 border-b border-slate-900 pb-6">
        <Link href="/student/forum">
          <Button className="bg-slate-900 hover:bg-slate-800 text-slate-300 p-2.5 rounded-xl border border-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Tạo bài đăng mới
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Bài viết của bạn sẽ được Mentor/Admin kiểm duyệt trước khi hiển thị công khai.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl space-y-6">
        <div className="space-y-2">
          <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Loại bài đăng</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['QUESTION', 'EXPERIENCE', 'ROADMAP_FEEDBACK'].map((t) => (
              <div
                key={t}
                onClick={() => setType(t)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  type === t 
                    ? 'bg-indigo-900/30 border-indigo-500 text-indigo-300' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-sm">
                  {t === 'QUESTION' ? 'Hỏi đáp' : t === 'EXPERIENCE' ? 'Chia sẻ kinh nghiệm' : 'Xin góp ý lộ trình'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Tiêu đề bài viết</label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề ngắn gọn, rõ ràng..."
            className="bg-slate-950 border-slate-800 text-slate-200"
          />
        </div>

        <div className="space-y-2">
          <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Nội dung</label>
          <textarea
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Trình bày chi tiết câu hỏi hoặc kinh nghiệm của bạn..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500/50 transition-all placeholder-slate-700"
          />
        </div>

        <div className="space-y-2">
          <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Gắn thẻ Kỹ năng (Tối đa 3)</label>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-4 bg-slate-950 border border-slate-800 rounded-xl">
            {skillsList.map((skill) => {
              const isSelected = selectedSkills.includes(skill.id);
              return (
                <span
                  key={skill.id}
                  onClick={() => toggleSkill(skill.id)}
                  className={`text-[10px] px-3 py-1.5 rounded-full cursor-pointer transition-all border font-medium ${
                    isSelected 
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20' 
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {skill.name}
                </span>
              );
            })}
          </div>
        </div>

        {type === 'ROADMAP_FEEDBACK' && (
          <div className="space-y-2">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block">ID Lộ trình đính kèm (Tùy chọn)</label>
            <Input
              type="text"
              value={attachedRoadmapId}
              onChange={(e) => setAttachedRoadmapId(e.target.value)}
              placeholder="Nhập ID lộ trình nếu có..."
              className="bg-slate-950 border-slate-800 text-slate-200"
            />
          </div>
        )}

        <div className="pt-4 flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2"
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi bài đăng'}
            {!isSubmitting && <Send className="w-4 h-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
