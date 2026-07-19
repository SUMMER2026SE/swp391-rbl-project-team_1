"use client";

import React, { useState } from "react";
import userService from "@/services/user.service";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Alert from "@/components/common/Alert";
import { KeyRound, Lock, ShieldCheck, Sparkles } from "lucide-react";

export default function SecurityTab() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!oldPassword) return setError("Vui lòng nhập mật khẩu hiện tại.");
    if (newPassword.length < 6) return setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
    if (newPassword !== confirmPassword) return setError("Mật khẩu xác nhận không khớp.");

    setIsUpdating(true);
    try {
      await userService.changePassword(oldPassword, newPassword);
      setSuccess("Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi đổi mật khẩu.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 animate-in fade-in duration-500 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4 border border-teal-100">
          <ShieldCheck className="w-8 h-8 text-teal-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Bảo mật tài khoản</h2>
        <p className="text-slate-500 text-sm">
          Đảm bảo tài khoản của bạn đang sử dụng một mật khẩu mạnh và an toàn.
        </p>
      </div>

      {error && <Alert type="error" message={error} className="mb-6" />}
      {success && <Alert type="success" message={success} className="mb-6" />}

      <form onSubmit={handleUpdatePassword} className="space-y-5 bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-100">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu hiện tại</label>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10" />
            <Input
              type="password"
              placeholder="••••••••"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="pl-11"
              required
            />
          </div>
        </div>

        <div className="pt-2">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu mới</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10" />
            <Input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-11"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Xác nhận mật khẩu mới</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10" />
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-11"
              required
            />
          </div>
        </div>

        <div className="pt-6">
          <Button 
            type="submit" 
            isLoading={isUpdating} 
            className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-500/20 py-3 rounded-xl flex items-center justify-center gap-2 font-bold"
          >
            <Sparkles className="w-5 h-5" />
            Cập nhật mật khẩu
          </Button>
        </div>
      </form>
    </div>
  );
}
