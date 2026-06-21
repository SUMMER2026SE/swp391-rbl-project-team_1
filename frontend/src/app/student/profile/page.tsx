'use client';

import React, { useState, useEffect } from 'react';
import useAuth from '../../../hooks/useAuth';
import api from '../../../services/api';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import Modal from '../../../components/common/Modal';
import { User, Mail, Award, Flame, Timer, GraduationCap, ClipboardList, Send, ShieldCheck, Activity, Bell, Lock, Key, CheckCircle, MessageSquare, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentProfile() {
  const { user, refreshUser } = useAuth();
  
  // States
  const [fullName, setFullName] = useState<string>('');
  const [learningGoal, setLearningGoal] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const [mentorInfo, setMentorInfo] = useState<any>(null);
  const [masteries, setMasteries] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);

  // Password Change States
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Notification Settings
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [notifSettings, setNotifSettings] = useState({
    riskAlert: true,
    deadlineReminder: true,
    communityUpdates: true,
    achievementAlerts: true,
    dailyReminder: true
  });
  
  // Dashboard statistics
  const [stats, setStats] = useState({
    streak: 0,
    totalFocusHours: 0,
    completedTasks: 0,
    totalTasks: 0,
    totalQuizzes: 0,
    avgQuizScore: 0
  });

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      fetchProfileDetails();
    }
  }, [user]);

  const fetchProfileDetails = async () => {
    try {
      // 1. Fetch user profile data to get current goal
      const profileRes = await api.get('/auth/me');
      if (profileRes.data.success && profileRes.data.user) {
        // learningGoal lives under student, not at top-level user
        const rawGoal = profileRes.data.user.student?.learningGoal || '';
        // Strip the auto-appended metadata suffix so the textarea shows only the user-written description
        const goalMatch = rawGoal.match(/^(.*)\s*\(Mục tiêu học tập:.*\)\s*$/);
        setLearningGoal(goalMatch ? goalMatch[1].trim() : rawGoal);
      }

      // 2. Fetch Leaderboard stats for streak
      const lbRes = await api.get('/leaderboard');
      let streak = 0;
      if (lbRes.data.success && lbRes.data.myRank?.details) {
        streak = lbRes.data.myRank.details.streak || 0;
      }

      // 3. Fetch workspace tasks for tasks count
      const taskRes = await api.get('/workspace/tasks');
      let completedTasks = 0;
      let totalTasks = 0;
      if (taskRes.data.success) {
        completedTasks = taskRes.data.progress?.completed || 0;
        totalTasks = taskRes.data.progress?.total || 0;
      }

      // 4. Fetch risk history / details to get avg quiz score / hours
      // Or query GTEx/Risk history endpoint
      const riskRes = await api.get('/risk/history');
      let avgQuizScore = 80;
      let totalTimeSpent = 120; // in minutes
      if (riskRes.data.success && riskRes.data.history?.length > 0) {
        const latest = riskRes.data.history[riskRes.data.history.length - 1];
        avgQuizScore = Math.round(latest.avgQuizScore || 80);
        totalTimeSpent = latest.totalTimeSpent || 120;
      }

      // Convert minutes to hours
      const focusHours = parseFloat((totalTimeSpent / 60).toFixed(1));

      setStats({
        streak,
        totalFocusHours: focusHours,
        completedTasks,
        totalTasks,
        totalQuizzes: Math.round(completedTasks * 0.7), // estimated quiz ratio
        avgQuizScore
      });

      // 5. Fetch assigned mentors
      const mentorsRes = await api.get('/auth/mentors');
      if (mentorsRes.data.success && user?.mentorId) {
        const matched = mentorsRes.data.mentors.find((m: any) => m.id === user.mentorId);
        if (matched) {
          setMentorInfo({
            fullName: matched.user?.fullName || 'Mentor FPT',
            email: matched.user?.email || 'mentor@fpt.edu.vn'
          });
        }
      }

      // 6. Fetch masteries
      const masteriesRes = await api.get('/bkt/mastery');
      if (masteriesRes.data.success) {
        setMasteries(masteriesRes.data.masteries);
      }

      // 7. Mock recent activity timeline
      setActivityLog([
        { id: 1, type: 'task', text: 'Hoàn thành nhiệm vụ "Cú pháp cơ bản và kiểu dữ liệu Python"', time: '2 giờ trước', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-950/40' },
        { id: 2, type: 'quiz', text: 'Đạt 90% bài kiểm tra BKT', time: 'Hôm qua', icon: Award, color: 'text-amber-400', bg: 'bg-amber-950/40' },
        { id: 3, type: 'community', text: 'Đăng bài hỏi đáp Cộng đồng', time: '3 ngày trước', icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-950/40' },
      ]);

      // 8. Fetch notification settings
      const notifRes = await api.get('/auth/notification-settings');
      if (notifRes.data.success && notifRes.data.settings) {
        const s = notifRes.data.settings;
        setNotifSettings({
          riskAlert: s.riskAlert,
          deadlineReminder: s.deadlineReminder,
          communityUpdates: s.communityUpdates,
          achievementAlerts: s.achievementAlerts,
          dailyReminder: s.dailyReminder
        });
      }

    } catch (_) {
      // Quiet fail if some metrics fail
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Họ và tên không được để trống.');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await api.put('/auth/profile', {
        fullName,
        learningGoal
      });
      if (response.data.success) {
        await refreshUser();
        toast.success('Cập nhật thông tin tài khoản thành công! ✨');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Không thể cập nhật hồ sơ.';
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/auth/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        await refreshUser();
        toast.success('Cập nhật ảnh đại diện thành công!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể upload ảnh đại diện.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Vui lòng điền đầy đủ các trường.');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError('Mật khẩu mới phải khác mật khẩu hiện tại.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&^_-]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setPasswordError('Mật khẩu mới phải dài ít nhất 8 ký tự, có ít nhất 1 chữ và 1 số.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await api.post('/auth/change-password', {
        oldPassword: currentPassword,
        newPassword
      });
      if (res.data.success) {
        toast.success('Đổi mật khẩu thành công!');
        setIsPasswordModalOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Lỗi khi đổi mật khẩu.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggleNotif = async (key: keyof typeof notifSettings) => {
    const newValue = !notifSettings[key];
    setNotifSettings(prev => ({ ...prev, [key]: newValue }));
    
    try {
      const res = await api.put('/auth/notification-settings', { [key]: newValue });
      if (res.data.success) {
        toast.success('Đã cập nhật cài đặt thông báo');
      }
    } catch (err: any) {
      setNotifSettings(prev => ({ ...prev, [key]: !newValue }));
      toast.error('Lỗi khi cập nhật thông báo.');
    }
  };

  // Lấy danh sách huy hiệu đã đạt (tái sử dụng logic từ trang Thành tích)
  const earnedBadges = [
    { id: 'first_quiz', emoji: '🎯', name: 'First Quiz', description: 'Làm bài trắc nghiệm BKT lần đầu tiên', unlocked: stats.totalQuizzes > 0 },
    { id: 'week_warrior', emoji: '🔥', name: 'Week Warrior', description: 'Duy trì chuỗi học tập liên tiếp 7 ngày', unlocked: stats.streak >= 7 },
    { id: 'month_master', emoji: '🏆', name: 'Month Master', description: 'Duy trì chuỗi học tập liên tiếp 30 ngày', unlocked: stats.streak >= 30 },
    { id: 'skill_mastered', emoji: '⭐', name: 'Skill Mastered', description: 'Đạt tỉ lệ thành thạo >= 80% cho một kỹ năng', unlocked: masteries.some((m: any) => m.masteryLevel >= 0.8) },
    { id: 'focus_champion', emoji: '🍅', name: 'Focus Champion', description: 'Hoàn thành 10 phiên Pomodoro tập trung', unlocked: stats.totalFocusHours >= 4.1 },
    { id: 'knowledge_seeker', emoji: '📚', name: 'Knowledge Seeker', description: 'Tham gia học tập 3 kỹ năng mới', unlocked: masteries.length >= 3 }
  ].filter(b => b.unlocked);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-900 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
          Hồ sơ & Thiết lập tài khoản
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Quản lý mục tiêu học tập, theo dõi thống kê cá nhân và thông tin người hướng dẫn (Mentor).
        </p>
      </div>

      {/* Grid Profile Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-950/40 text-amber-500 flex items-center justify-center border border-amber-900/30">
            <Flame className="w-6 h-6 fill-amber-500 animate-pulse" />
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Học tập liên tục</span>
            <h3 className="text-xl font-extrabold text-slate-200 mt-0.5">{stats.streak} Ngày</h3>
          </div>
        </div>

        {/* Time */}
        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-950/40 text-blue-500 flex items-center justify-center border border-blue-900/30">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Tổng giờ học</span>
            <h3 className="text-xl font-extrabold text-slate-200 mt-0.5">{stats.totalFocusHours} Giờ</h3>
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/40 text-emerald-500 flex items-center justify-center border border-emerald-900/30">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Nhiệm vụ hoàn thành</span>
            <h3 className="text-xl font-extrabold text-slate-200 mt-0.5">{stats.completedTasks} / {stats.totalTasks}</h3>
          </div>
        </div>

        {/* Average quiz */}
        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-950/40 text-purple-500 flex items-center justify-center border border-purple-900/30">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Điểm quiz trung bình</span>
            <h3 className="text-xl font-extrabold text-slate-200 mt-0.5">{stats.avgQuizScore}%</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: General Settings Form */}
        <form
          onSubmit={handleUpdateProfile}
          className="lg:col-span-8 bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-6"
        >
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 pb-4 border-b border-slate-900">
            <User className="w-5 h-5 text-indigo-500" />
            <span>Thông tin cá nhân</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fullname */}
            <div className="space-y-2">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Họ và tên</label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên..."
                className="bg-slate-950 border-slate-850 text-slate-200"
              />
            </div>

            {/* Email (Readonly) */}
            <div className="space-y-2">
              <label className="text-slate-500 text-xs font-bold uppercase tracking-wider block">Địa chỉ Email (Không thể thay đổi)</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-650" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-slate-950/40 border border-slate-900 pl-10 pr-4 py-2.5 rounded-xl text-slate-600 text-sm cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Goal */}
          <div className="space-y-2">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Mục tiêu học tập dài hạn</label>
            <textarea
              rows={4}
              value={learningGoal}
              onChange={(e) => setLearningGoal(e.target.value)}
              placeholder="Nhập định hướng nghề nghiệp, mục tiêu capstone, học bổng..."
              className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500/50 transition-all placeholder-slate-700"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isUpdating}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/10 flex items-center gap-2"
            >
              {isUpdating ? 'Đang cập nhật...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>

        {/* Right: Mentor Info card & Role context */}
        <div className="lg:col-span-4 space-y-6">
          {/* User Role Card */}
          <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 border border-indigo-900/30 p-6 rounded-3xl flex flex-col items-center text-center space-y-4">
            
            <div className="relative group cursor-pointer w-20 h-20">
              <label htmlFor="avatar-upload" className="block w-full h-full rounded-2xl overflow-hidden bg-indigo-900/40 border border-indigo-800/40 cursor-pointer flex items-center justify-center text-2xl font-bold uppercase shadow-inner relative">
                {(user as any)?.avatarUrl ? (
                  <img src={`http://localhost:5000${(user as any).avatarUrl}`} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-indigo-400">{user?.fullName.substring(0, 2)}</span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-xs text-white font-medium">Đổi ảnh</span>
                </div>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleAvatarUpload(e.target.files[0]);
                  }
                }}
              />
            </div>
            {isUploadingAvatar && <p className="text-xs text-indigo-400 animate-pulse mt-0">Đang tải lên...</p>}
            <div>
              <h3 className="text-slate-100 font-extrabold text-lg leading-snug">{user?.fullName}</h3>
              <p className="text-slate-500 text-xs mt-0.5">{user?.email}</p>
            </div>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-950 text-indigo-400 border border-indigo-900/50">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{user?.role}</span>
            </span>
          </div>

          {/* Assigned Mentor Info */}
          <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-4">
            <h3 className="text-slate-200 font-bold text-sm flex items-center gap-2 pb-3 border-b border-slate-900">
              <GraduationCap className="w-4.5 h-4.5 text-pink-500" />
              <span>Người hướng dẫn (Mentor)</span>
            </h3>

            {mentorInfo ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Tên giảng viên</span>
                  <span className="text-slate-200 text-sm font-semibold block">{mentorInfo.fullName}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Địa chỉ liên hệ</span>
                  <span className="text-slate-200 text-sm font-medium block">{mentorInfo.email}</span>
                </div>

                <a
                  href={`mailto:${mentorInfo.email}`}
                  className="w-full bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi Mail Liên Hệ</span>
                </a>
              </div>
            ) : (
              <p className="text-slate-500 text-xs leading-relaxed">
                Bạn chưa được phân bổ Mentor hướng dẫn. Bạn có thể cập nhật trong các khảo sát tiếp theo hoặc liên hệ phòng đào tạo.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Grid for Bottom Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Kỹ năng đang theo đuổi */}
        <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-6">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 pb-4 border-b border-slate-900">
            <Activity className="w-5 h-5 text-emerald-500" />
            <span>Kỹ năng đang theo đuổi</span>
          </h2>
          <div className="space-y-4">
            {masteries.length > 0 ? (
              masteries.map((m: any) => (
                <div key={m.id} className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-slate-200">{m.skill.name}</span>
                    <span className="text-emerald-400">{Math.round(m.masteryLevel * 100)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.round(m.masteryLevel * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-xs text-center py-4">Chưa có kỹ năng nào được theo dõi.</p>
            )}
          </div>
        </div>

        {/* Huy hiệu đã đạt */}
        <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-6">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 pb-4 border-b border-slate-900">
            <Award className="w-5 h-5 text-amber-500" />
            <span>Huy hiệu đã đạt ({earnedBadges.length})</span>
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {earnedBadges.length > 0 ? (
              earnedBadges.map((badge) => (
                <div key={badge.id} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-3 flex flex-col items-center justify-center text-center hover:border-amber-500/30 transition-colors cursor-help" title={badge.description}>
                  <span className="text-2xl mb-1">{badge.emoji}</span>
                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider line-clamp-1">{badge.name}</span>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-4 text-slate-500 text-xs">Chưa có huy hiệu nào. Hãy tiếp tục cố gắng!</div>
            )}
          </div>
        </div>

        {/* Hoạt động gần đây */}
        <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-6">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 pb-4 border-b border-slate-900">
            <Activity className="w-5 h-5 text-blue-500" />
            <span>Hoạt động gần đây</span>
          </h2>
          <div className="space-y-5 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
            {activityLog.map((log) => {
              const Icon = log.icon;
              return (
                <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border border-slate-800 bg-slate-900 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${log.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-950/50 p-3 rounded-xl border border-slate-800/60 shadow hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-200 text-xs">{log.text}</span>
                    </div>
                    <div className="text-[10px] font-medium text-slate-500">{log.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cài đặt bảo mật & Thông báo */}
        <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 pb-4 border-b border-slate-900">
              <Lock className="w-5 h-5 text-rose-500" />
              <span>Bảo mật & Cài đặt</span>
            </h2>
            <p className="text-slate-400 text-xs mt-4">
              Quản lý mật khẩu và tùy chỉnh thông báo để nhận cảnh báo học tập từ hệ thống Adaptive AI.
            </p>
          </div>
          
          <div className="space-y-3 mt-auto pt-4">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold group"
            >
              <Key className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors" />
              <span>Đổi Mật Khẩu</span>
            </button>
            <button
              onClick={() => setIsNotifModalOpen(true)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold group"
            >
              <Bell className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
              <span>Cài đặt Thông báo</span>
            </button>
          </div>
        </div>

      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Đổi Mật Khẩu"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordError && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl text-sm">
              {passwordError}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Mật khẩu hiện tại</label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                className="w-full bg-slate-950 border-slate-800 text-slate-200 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Mật khẩu mới</label>
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                className="w-full bg-slate-950 border-slate-800 text-slate-200 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Tối thiểu 8 ký tự, gồm ít nhất 1 chữ và 1 số.</p>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Xác nhận mật khẩu mới</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Xác nhận mật khẩu mới"
                className="w-full bg-slate-950 border-slate-800 text-slate-200 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPasswordModalOpen(false)}
              className="px-6 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isChangingPassword}
              className="px-6 bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {isChangingPassword ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Notification Settings Modal */}
      <Modal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        title="Cài đặt Thông báo"
      >
        <div className="space-y-6 pb-2">
          {/* Cảnh báo rủi ro học tập */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-200">Cảnh báo rủi ro học tập</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Nhận cảnh báo khi có nguy cơ tụt lại hoặc trượt môn.</p>
            </div>
            <button 
              onClick={() => handleToggleNotif('riskAlert')}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${notifSettings.riskAlert ? 'bg-indigo-500' : 'bg-slate-700'}`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifSettings.riskAlert ? 'translate-x-2' : '-translate-x-2'}`} />
            </button>
          </div>

          {/* Nhắc nhở deadline task */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-200">Nhắc nhở deadline task</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Nhận thông báo khi task sắp đến hạn chót.</p>
            </div>
            <button 
              onClick={() => handleToggleNotif('deadlineReminder')}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${notifSettings.deadlineReminder ? 'bg-indigo-500' : 'bg-slate-700'}`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifSettings.deadlineReminder ? 'translate-x-2' : '-translate-x-2'}`} />
            </button>
          </div>

          {/* Cập nhật từ Cộng đồng */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-200">Cập nhật từ Cộng đồng</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Thông báo khi có phản hồi bài viết hoặc bài đăng được duyệt.</p>
            </div>
            <button 
              onClick={() => handleToggleNotif('communityUpdates')}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${notifSettings.communityUpdates ? 'bg-indigo-500' : 'bg-slate-700'}`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifSettings.communityUpdates ? 'translate-x-2' : '-translate-x-2'}`} />
            </button>
          </div>

          {/* Thành tích & Huy hiệu mới */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-200">Thành tích & Huy hiệu mới</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Thông báo khi đạt danh hiệu mới trên bảng xếp hạng.</p>
            </div>
            <button 
              onClick={() => handleToggleNotif('achievementAlerts')}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${notifSettings.achievementAlerts ? 'bg-indigo-500' : 'bg-slate-700'}`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifSettings.achievementAlerts ? 'translate-x-2' : '-translate-x-2'}`} />
            </button>
          </div>

          {/* Nhắc nhở học tập hàng ngày */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-200">Nhắc nhở học tập hàng ngày</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Nhận lời nhắc nếu bạn chưa hoàn thành mục tiêu học trong ngày.</p>
            </div>
            <button 
              onClick={() => handleToggleNotif('dailyReminder')}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${notifSettings.dailyReminder ? 'bg-indigo-500' : 'bg-slate-700'}`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifSettings.dailyReminder ? 'translate-x-2' : '-translate-x-2'}`} />
            </button>
          </div>
        </div>
        <div className="flex justify-end pt-4 mt-2 border-t border-slate-800">
          <Button
            type="button"
            onClick={() => setIsNotifModalOpen(false)}
            className="px-6 bg-slate-800 hover:bg-slate-700 text-white"
          >
            Đóng
          </Button>
        </div>
      </Modal>
    </div>
  );
}
