"use client";

import React, { useState, useEffect, useRef } from "react";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import userService from "@/services/user.service";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Alert from "@/components/common/Alert";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { User, Activity, MapPin, Calendar, Mail, Shield, UserSquare, KeyRound, Lock, Sparkles, Camera } from "lucide-react";

type ProfileTab = "info" | "password";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("info");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab 1: Profile Info State
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // Tab 2: Change Password State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Initialize profile info when user loaded
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setGender(user.gender || "Nam");
      setAddress(user.address || "");
      if (user.dateOfBirth) {
        const dateObj = new Date(user.dateOfBirth);
        const formattedDate = dateObj.toISOString().split("T")[0];
        setFormattedDate(formattedDate);
      } else {
        setDateOfBirth("");
      }
    }
  }, [user]);

  const setFormattedDate = (val: string) => {
    setDateOfBirth(val);
  };

  // Reset message states on tab switch
  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
    setError(null);
    setSuccess(null);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // Avatar Click Trigger
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Avatar Upload Handler
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Client-side validations
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("Chỉ chấp nhận định dạng ảnh PNG, JPG hoặc JPEG");
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setError("Kích thước ảnh đại diện không được vượt quá 2MB");
      return;
    }

    // Set local preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setError(null);
    setSuccess(null);
    setAvatarLoading(true);

    try {
      const response = await userService.uploadAvatar(file);
      updateUser(response.data);
      setSuccess("Tải ảnh đại diện lên thành công!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải ảnh đại diện lên";
      setError(message);
      setPreviewUrl(null); // Reset preview on failure
    } finally {
      setAvatarLoading(false);
    }
  };

  // Profile Edit Submit
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim()) {
      setError("Họ và tên không được để trống");
      return;
    }

    setLoading(true);
    try {
      const response = await userService.updateProfile({
        fullName: fullName.trim(),
        gender,
        address: address.trim(),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
      });

      updateUser(response.data);
      setSuccess("Cập nhật thông tin cá nhân thành công!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi khi cập nhật thông tin";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Change Password Submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!oldPassword) {
      setError("Mật khẩu hiện tại là bắt buộc");
      return;
    }

    if (!newPassword) {
      setError("Mật khẩu mới là bắt buộc");
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải chứa ít nhất 6 ký tự");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp với mật khẩu mới");
      return;
    }

    setLoading(true);
    try {
      await userService.changePassword(oldPassword, newPassword);
      setSuccess("Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Mật khẩu hiện tại không chính xác";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const getInitials = (nameStr: string | null, emailStr: string) => {
    const name = nameStr || emailStr;
    const parts = name.split("@")[0].split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const currentAvatarUrl = previewUrl || (user.avatar ? (user.avatar.startsWith("http") ? user.avatar : `http://localhost:5000${user.avatar}`) : null);

  return (
    <div className="flex-grow bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserSquare className="h-8 w-8 text-teal-600" />
            Hồ Sơ Cá Nhân
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Quản lý thông tin cá nhân và thiết lập mật khẩu bảo vệ tài khoản của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left card: Summary & Tabs */}
          <div className="lg:col-span-4 space-y-6">
            {/* User overview card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center space-y-6">
              {/* Avatar Uploader container */}
              <div 
                onClick={handleAvatarClick}
                className="relative inline-block mx-auto group cursor-pointer"
              >
                {currentAvatarUrl ? (
                  <img
                    src={currentAvatarUrl}
                    alt={user.fullName || "User Avatar"}
                    className="h-28 w-28 rounded-full object-cover border-4 border-teal-50 shadow-inner group-hover:opacity-80 transition-all duration-200"
                  />
                ) : (
                  <div className="h-28 w-28 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 text-white flex items-center justify-center text-3xl font-bold shadow-md border-4 border-teal-50 group-hover:opacity-80 transition-all duration-200">
                    {getInitials(user.fullName, user.email)}
                  </div>
                )}
                
                {/* Upload Hover Overlay */}
                <div className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Camera className="h-5 w-5 mb-0.5" />
                  <span className="text-[10px] font-bold">Thay ảnh</span>
                </div>

                {/* Avatar Loading Spinner */}
                {avatarLoading && (
                  <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center z-10">
                    <LoadingSpinner className="h-8 w-8 text-teal-400" />
                  </div>
                )}

                {/* Small check icon */}
                {!avatarLoading && (
                  <div className="absolute bottom-0 right-0 h-7 w-7 bg-teal-500 border-2 border-white rounded-full flex items-center justify-center text-white text-xs shadow">
                    ✓
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept=".png, .jpg, .jpeg"
                  className="hidden"
                />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">{user.fullName || "Chưa cập nhật tên"}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                <div className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100">
                  <Shield className="h-3 w-3" />
                  {user.role === "ADMIN" ? "Quản trị viên" : user.role === "DOCTOR" ? "Bác sĩ" : "Bệnh nhân"}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 text-left space-y-3.5 text-sm text-slate-600">
                <div className="flex items-center gap-3">
                  <Mail className="h-4.5 w-4.5 text-slate-400" />
                  <span className="truncate">{user.email}</span>
                </div>
                {user.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    <span className="line-clamp-2">{user.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="h-4.5 w-4.5 text-slate-400" />
                  <span>Tham gia: {new Date(user.createdAt).toLocaleDateString("vi-VN")}</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2 flex flex-col gap-1">
              <button
                onClick={() => handleTabChange("info")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left cursor-pointer ${
                  activeTab === "info"
                    ? "bg-teal-50 text-teal-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <User className="h-5 w-5" />
                Thông tin cá nhân
              </button>
              <button
                onClick={() => handleTabChange("password")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left cursor-pointer ${
                  activeTab === "password"
                    ? "bg-teal-50 text-teal-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <KeyRound className="h-5 w-5" />
                Đổi mật khẩu
              </button>
            </div>
          </div>

          {/* Right card: Form contents */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
            {activeTab === "info" ? (
              // Tab 1: Profile Info Form
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-6 pb-3 border-b border-slate-100 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-teal-600" />
                  Thông Tin Chi Tiết
                </h3>

                {error && <Alert type="error" message={error} className="mb-6" />}
                {success && <Alert type="success" message={success} className="mb-6" />}

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Họ và Tên <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Nhập đầy đủ họ và tên"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="gender" className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Giới Tính
                      </label>
                      <select
                        id="gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all shadow-sm"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="dob" className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Ngày Sinh
                      </label>
                      <Input
                        id="dob"
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor="emailDisplay" className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Địa chỉ Email (Không thể sửa)
                      </label>
                      <Input
                        id="emailDisplay"
                        type="email"
                        value={user.email}
                        disabled
                        className="bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Địa Chỉ Cư Trú
                    </label>
                    <textarea
                      id="address"
                      placeholder="Nhập địa chỉ hiện tại (Số nhà, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố)"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all shadow-sm resize-none placeholder:text-slate-400"
                    />
                  </div>

                  <div className="pt-4 flex justify-end border-t border-slate-100">
                    <Button type="submit" variant="teal" className="py-2.5 px-6 font-semibold rounded-xl" isLoading={loading}>
                      Lưu Thay Đổi
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              // Tab 2: Change Password Form
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-6 pb-3 border-b border-slate-100 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-teal-600" />
                  Thiết Lập Mật Khẩu
                </h3>

                {error && <Alert type="error" message={error} className="mb-6" />}
                {success && <Alert type="success" message={success} className="mb-6" />}

                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="oldPassword" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Mật khẩu hiện tại <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 z-10" />
                      <Input
                        id="oldPassword"
                        type="password"
                        placeholder="Nhập mật khẩu hiện tại"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 z-10" />
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Nhập lại mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 z-10" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Xác nhận lại mật khẩu mới"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end border-t border-slate-100">
                    <Button type="submit" variant="teal" className="py-2.5 px-6 font-semibold rounded-xl flex items-center gap-2" isLoading={loading}>
                      <Sparkles className="h-4 w-4" /> Đổi Mật Khẩu
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
