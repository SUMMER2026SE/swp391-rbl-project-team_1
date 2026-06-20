'use client';

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Button } from '@/components/common/Button';
import { Compass, BookOpen, Clock, BarChart, ChevronRight, X, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface RoadmapTaskTemplate {
  title: string;
  description: string;
  skillSlug: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  estimatedMinutes: number;
}

interface RoadmapTemplate {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  durationWeeks: number;
  totalSkills: number;
  bannerGradient: string;
  phases: {
    title: string;
    description: string;
    tasks: RoadmapTaskTemplate[];
  }[];
}

const ROADMAP_TEMPLATES: RoadmapTemplate[] = [
  {
    id: 'web-fullstack',
    title: 'Fullstack Web Developer',
    description: 'Trở thành kỹ sư phát triển Web toàn diện từ Frontend đến Backend. Lộ trình được thiết kế chuẩn đầu ra của FPT University.',
    difficulty: 'Trung bình',
    durationWeeks: 12,
    totalSkills: 6,
    bannerGradient: 'from-blue-600 via-indigo-600 to-purple-600',
    phases: [
      {
        title: 'Giai đoạn 1: Frontend Basics',
        description: 'Làm quen với HTML5, CSS3 và Javascript ES6 căn bản.',
        tasks: [
          { title: 'Xây dựng giao diện Landing Page với HTML/CSS', description: 'Tạo website đáp ứng (responsive) sử dụng Flexbox và Grid.', skillSlug: 'html-css', difficulty: 'EASY', estimatedMinutes: 120 },
          { title: 'Lập trình logic tương tác với Javascript', description: 'Tìm hiểu DOM manipulation, events, và async/await fetching API.', skillSlug: 'javascript', difficulty: 'EASY', estimatedMinutes: 180 }
        ]
      },
      {
        title: 'Giai đoạn 2: Modern Frontend Framework',
        description: 'Học React.js và Next.js để phát triển các Single Page Apps tối ưu.',
        tasks: [
          { title: 'Xây dựng Component & State Management', description: 'Sử dụng React Hooks (useState, useEffect, useContext) xây dựng giỏ hàng.', skillSlug: 'react', difficulty: 'MEDIUM', estimatedMinutes: 240 },
          { title: 'Định tuyến & Render phía máy chủ (SSR) với Next.js App Router', description: 'Thiết kế cấu trúc routes, dynamic layouts và SEO tags.', skillSlug: 'react', difficulty: 'MEDIUM', estimatedMinutes: 300 }
        ]
      },
      {
        title: 'Giai đoạn 3: Backend & Database Integration',
        description: 'Lập trình máy chủ Express.js, quản lý PostgreSQL qua Prisma ORM.',
        tasks: [
          { title: 'Thiết kế RESTful API với Express.js', description: 'Viết routing, controllers, và error handler middleware.', skillSlug: 'node-express', difficulty: 'MEDIUM', estimatedMinutes: 240 },
          { title: 'Thiết kế cơ sở dữ liệu với Prisma & PostgreSQL', description: 'Định nghĩa schema, thiết lập relationships và thực hiện migrations.', skillSlug: 'database', difficulty: 'HARD', estimatedMinutes: 300 }
        ]
      }
    ]
  },
  {
    id: 'data-science',
    title: 'Data Science & Machine Learning',
    description: 'Chinh phục khoa học dữ liệu, phân tích thống kê và các mô hình dự báo học máy sử dụng Python.',
    difficulty: 'Khó',
    durationWeeks: 16,
    totalSkills: 5,
    bannerGradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    phases: [
      {
        title: 'Giai đoạn 1: Data Analytics Foundations',
        description: 'Sử dụng Python và thư viện để xử lý, làm sạch và phân tích trực quan hóa dữ liệu.',
        tasks: [
          { title: 'Làm sạch và phân tích dữ liệu với Pandas', description: 'Xử lý dữ liệu bị khuyết, lọc và gộp các DataFrames.', skillSlug: 'python', difficulty: 'EASY', estimatedMinutes: 180 },
          { title: 'Trực quan hóa dữ liệu với Matplotlib & Seaborn', description: 'Vẽ biểu đồ phân bố, tương quan để phát hiện xu hướng dữ liệu.', skillSlug: 'python', difficulty: 'EASY', estimatedMinutes: 120 }
        ]
      },
      {
        title: 'Giai đoạn 2: Machine Learning Models',
        description: 'Xây dựng và đánh giá các thuật toán học có giám sát và không giám sát.',
        tasks: [
          { title: 'Huấn luyện mô hình hồi quy tuyến tính & Logistic', description: 'Giải thích hệ số tương quan và đánh giá ma trận nhầm lẫn (Confusion Matrix).', skillSlug: 'machine-learning', difficulty: 'MEDIUM', estimatedMinutes: 240 },
          { title: 'Phân cụm khách hàng với thuật toán K-Means', description: 'Xác định số lượng cụm tối ưu qua phương pháp Elbow.', skillSlug: 'machine-learning', difficulty: 'HARD', estimatedMinutes: 200 }
        ]
      }
    ]
  },
  {
    id: 'mobile-native',
    title: 'Mobile App Development (React Native)',
    description: 'Xây dựng ứng dụng di động đa nền tảng iOS & Android cực kỳ mượt mà sử dụng React Native.',
    difficulty: 'Trung bình',
    durationWeeks: 10,
    totalSkills: 4,
    bannerGradient: 'from-orange-600 via-rose-600 to-red-600',
    phases: [
      {
        title: 'Giai đoạn 1: Native Components & Navigation',
        description: 'Làm quen với các thẻ UI gốc của di động và chuyển đổi màn hình.',
        tasks: [
          { title: 'Thiết kế giao diện Custom Button & Card', description: 'Sử dụng StyleSheet và Flexbox trong React Native để render giao diện đẹp mắt.', skillSlug: 'react-native', difficulty: 'EASY', estimatedMinutes: 150 },
          { title: 'Cài đặt React Navigation (Stack & Tab)', description: 'Tạo luồng chuyển tiếp màn hình trong ứng dụng di động.', skillSlug: 'react-native', difficulty: 'MEDIUM', estimatedMinutes: 180 }
        ]
      },
      {
        title: 'Giai đoạn 2: Mobile Features Integration',
        description: 'Tương tác với phần cứng thiết bị (Camera, Storage, Push Notifications).',
        tasks: [
          { title: 'Lưu trữ cục bộ với AsyncStorage', description: 'Lưu session đăng nhập và trạng thái offline của người dùng.', skillSlug: 'react-native', difficulty: 'MEDIUM', estimatedMinutes: 180 },
          { title: 'Tích hợp chụp ảnh bằng Expo Camera', description: 'Yêu cầu quyền truy cập camera và chụp hình hiển thị avatar.', skillSlug: 'react-native', difficulty: 'HARD', estimatedMinutes: 240 }
        ]
      }
    ]
  }
];

export default function CommunityRoadmaps() {
  const [selectedTemplate, setSelectedTemplate] = useState<RoadmapTemplate | null>(null);
  const [skillsList, setSkillsList] = useState<any[]>([]);
  const [isCloning, setIsCloning] = useState<boolean>(false);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const response = await api.get('/auth/skills');
      if (response.data.success) {
        // Flatten children to make slug mapping easier
        const flat: any[] = [];
        response.data.skills.forEach((s: any) => {
          flat.push(s);
          if (s.children && s.children.length > 0) {
            flat.push(...s.children);
          }
        });
        setSkillsList(flat);
      }
    } catch (_) {
      toast.error('Không thể tải danh sách kỹ năng hệ thống.');
    }
  };

  const getSkillIdBySlug = (slug: string): string => {
    const matched = skillsList.find(s => s.slug === slug || s.name.toLowerCase().includes(slug));
    if (matched) return matched.id;
    // Default fallback to first skill if available, otherwise mock UUID
    return skillsList[0]?.id || 'default-skill-id';
  };

  const handleCloneRoadmap = async (template: RoadmapTemplate) => {
    setIsCloning(true);
    const loadingToast = toast.loading(`Đang khởi tạo lộ trình "${template.title}" vào bảng học tập của bạn...`);
    
    try {
      let createdCount = 0;
      // Extract all tasks from phases
      const allTasks: RoadmapTaskTemplate[] = [];
      template.phases.forEach(phase => {
        phase.tasks.forEach(t => {
          allTasks.push(t);
        });
      });

      // Post tasks one by one to ensure database order
      for (const t of allTasks) {
        const skillId = getSkillIdBySlug(t.skillSlug);
        
        await api.post('/workspace/tasks', {
          title: t.title,
          description: t.description,
          skillId,
          difficulty: t.difficulty,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days deadline default
          estimatedMinutes: t.estimatedMinutes
        });
        createdCount++;
      }

      toast.success(`Đã thêm thành công ${createdCount} nhiệm vụ vào Bảng học tập! 🎉`, { id: loadingToast });
      setSelectedTemplate(null);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi sao chép lộ trình.';
      toast.error(msg, { id: loadingToast });
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Thư viện Lộ trình & Mẫu học tập
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Khám phá các lộ trình học tập tiêu chuẩn được hội đồng chuyên môn FPT phê duyệt và nhân bản về không gian cá nhân.
          </p>
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ROADMAP_TEMPLATES.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between group"
          >
            <div>
              {/* Card Banner */}
              <div className={`h-36 bg-gradient-to-tr ${tpl.bannerGradient} p-6 flex flex-col justify-between relative`}>
                <div className="absolute inset-0 bg-slate-950/20 mix-blend-multiply"></div>
                <div className="z-10 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-950/40 backdrop-blur-sm px-2.5 py-1 rounded-full text-slate-200">
                    Lộ trình mẫu
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white">
                    <Compass className="w-4 h-4 animate-spin-slow" />
                  </div>
                </div>
                <h3 className="z-10 text-white font-bold text-xl drop-shadow-md">
                  {tpl.title}
                </h3>
              </div>

              {/* Card Content */}
              <div className="p-6 space-y-4">
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                  {tpl.description}
                </p>

                {/* Badges Grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                  <div className="bg-slate-950/50 rounded-xl p-2 border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">Độ khó</span>
                    <span className="text-slate-200 text-xs font-semibold">{tpl.difficulty}</span>
                  </div>
                  <div className="bg-slate-950/50 rounded-xl p-2 border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">Thời gian</span>
                    <span className="text-slate-200 text-xs font-semibold">{tpl.durationWeeks} tuần</span>
                  </div>
                  <div className="bg-slate-950/50 rounded-xl p-2 border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">Kỹ năng</span>
                    <span className="text-slate-200 text-xs font-semibold">{tpl.totalSkills} Units</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="p-6 pt-0">
              <Button
                onClick={() => setSelectedTemplate(tpl)}
                className="w-full bg-slate-800 hover:bg-blue-600 hover:text-white transition-all duration-300 py-2.5 rounded-xl border border-slate-700 flex items-center justify-center gap-2 group-hover:border-blue-500/30"
              >
                <span>Xem chi tiết & Lưu</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Side Slide Drawer for Detailed Roadmap Preview */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-screen shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-in">
            {/* Drawer Header */}
            <div className={`p-6 bg-gradient-to-r ${selectedTemplate.bannerGradient} text-white relative flex justify-between items-start`}>
              <div className="absolute inset-0 bg-slate-950/30 mix-blend-multiply"></div>
              <div className="z-10 space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider bg-black/30 px-2.5 py-1 rounded-full">
                  Lộ Trình Đào Tạo
                </span>
                <h2 className="text-2xl font-extrabold tracking-tight drop-shadow-md">{selectedTemplate.title}</h2>
                <p className="text-slate-200 text-xs max-w-md">{selectedTemplate.description}</p>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body - Timeline Phases */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/50">
              <h4 className="text-sm font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                Các giai đoạn đào tạo ({selectedTemplate.phases.length})
              </h4>

              <div className="relative border-l border-slate-800 pl-6 ml-3 space-y-8">
                {selectedTemplate.phases.map((phase, pIdx) => (
                  <div key={pIdx} className="relative">
                    {/* Circle icon on timeline */}
                    <div className="absolute -left-[35px] top-1.5 w-6 h-6 rounded-full bg-slate-900 border-2 border-blue-500 flex items-center justify-center text-xs text-blue-400 font-bold shadow-md shadow-blue-500/20">
                      {pIdx + 1}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h5 className="text-slate-100 font-bold text-base leading-snug">{phase.title}</h5>
                        <p className="text-slate-400 text-xs mt-0.5">{phase.description}</p>
                      </div>

                      {/* Tasks in phase */}
                      <div className="space-y-2">
                        {phase.tasks.map((task, tIdx) => (
                          <div
                            key={tIdx}
                            className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-750 transition-colors"
                          >
                            <div className="space-y-1">
                              <span className="text-slate-200 text-sm font-medium block leading-tight">
                                {task.title}
                              </span>
                              <span className="text-slate-500 text-xs block leading-relaxed max-w-md">
                                {task.description}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 self-start md:self-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                task.difficulty === 'EASY' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' :
                                task.difficulty === 'MEDIUM' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/50' :
                                'bg-rose-950/40 text-rose-400 border border-rose-900/50'
                              }`}>
                                {task.difficulty}
                              </span>
                              <span className="text-slate-400 text-xs flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                {task.estimatedMinutes}m
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Drawer Footer CTA */}
            <div className="p-6 border-t border-slate-800 bg-slate-900 flex items-center gap-4">
              <Button
                onClick={() => setSelectedTemplate(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-3 rounded-xl"
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={() => handleCloneRoadmap(selectedTemplate)}
                disabled={isCloning}
                className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                {isCloning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Đang sao chép...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Thêm vào Bảng học tập</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
