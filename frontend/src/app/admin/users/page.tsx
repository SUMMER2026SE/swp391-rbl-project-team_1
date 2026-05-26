"use client";

import React, { useEffect, useState } from "react";
import { adminService } from "@/services/admin.service";
import { doctorService } from "@/services/doctor.service";
import { useAuth } from "@/hooks/useAuth";
import { AdminUser } from "@/types/admin";
import { Doctor } from "@/types/doctor";
import { UserRole } from "@/types/auth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import { Search, UserCog, Link as LinkIcon, Trash2, ShieldAlert, Award, UserCheck } from "lucide-react";

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | "ALL">("ALL");

  // Interaction Modals/Selections
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [linkingUserId, setLinkingUserId] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [usersRes, doctorsRes] = await Promise.all([
        adminService.getUsers(),
        doctorService.listDoctors(),
      ]);
      setUsers(usersRes.data);
      setDoctors(doctorsRes.doctors);
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể tải danh sách tài khoản.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filter list
  useEffect(() => {
    let result = [...users];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((u) => 
        (u.email && u.email.toLowerCase().includes(q))
      );
    }

    if (selectedRole !== "ALL") {
      result = result.filter((u) => u.role === selectedRole);
    }

    setFilteredUsers(result);
  }, [searchQuery, selectedRole, users]);

  // Handle role update
  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    setActionMessage(null);
    setSubmittingAction(true);
    try {
      await adminService.updateUserRole(userId, newRole);
      setActionMessage({
        type: "success",
        text: `Đã thay đổi vai trò tài khoản thành "${newRole}" thành công!`,
      });
      setEditingUserId(null);
      loadData(); // reload
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể thay đổi vai trò tài khoản.";
      setActionMessage({
        type: "error",
        text: errorMsg,
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle account deletion
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tài khoản này? Toàn bộ lịch đặt hẹn liên quan sẽ bị xóa!")) {
      return;
    }
    setActionMessage(null);
    setSubmittingAction(true);
    try {
      await adminService.deleteUser(userId);
      setActionMessage({
        type: "success",
        text: "Đã xóa tài khoản và toàn bộ lịch hẹn liên quan thành công!",
      });
      loadData(); // reload
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể xóa tài khoản này.";
      setActionMessage({
        type: "error",
        text: errorMsg,
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle doctor link
  const handleLinkDoctor = async (userId: string) => {
    if (!selectedDoctorId) return;
    setActionMessage(null);
    setSubmittingAction(true);
    try {
      await adminService.linkDoctorToUser(userId, selectedDoctorId);
      setActionMessage({
        type: "success",
        text: "Liên kết tài khoản bác sĩ thành công!",
      });
      setLinkingUserId(null);
      setSelectedDoctorId("");
      loadData(); // reload
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể liên kết với hồ sơ bác sĩ này.";
      setActionMessage({
        type: "error",
        text: errorMsg,
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Find linked doctor name if exists
  const getLinkedDoctorName = (doctorId: string | null) => {
    if (!doctorId) return "Chưa liên kết";
    const doc = doctors.find((d) => d.id === doctorId);
    return doc ? doc.name : "Hồ sơ không khả dụng";
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
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-white">Quản lý Thành viên</h1>
        <p className="text-sm text-slate-400">Xem danh sách, phân vai trò, liên kết hồ sơ bác sĩ và xóa tài khoản thành viên.</p>
      </div>

      {error && <Alert type="error" message={error} className="bg-red-950/40 border-red-900/50 text-red-300" />}
      {actionMessage && <Alert type={actionMessage.type} message={actionMessage.text} className="my-2" />}

      {/* Filter and Search Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 relative">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm theo email tài khoản..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm animate-fade-in"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole | "ALL")}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm cursor-pointer"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="USER">Người bệnh (USER)</option>
              <option value="DOCTOR">Bác sĩ (DOCTOR)</option>
              <option value="ADMIN">Quản trị viên (ADMIN)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-sm font-medium">Không tìm thấy thành viên phù hợp.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  <th className="p-5 font-semibold">Tài khoản (Email)</th>
                  <th className="p-5 font-semibold">Vai trò (Role)</th>
                  <th className="p-5 font-semibold">Liên kết bác sĩ</th>
                  <th className="p-5 font-semibold">Ngày tạo tài khoản</th>
                  <th className="p-5 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-900">
                {filteredUsers.map((u) => {
                  const roleColors = {
                    USER: "bg-teal-500/10 text-teal-400 border-teal-500/20",
                    DOCTOR: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
                    ADMIN: "bg-red-500/10 text-red-400 border-red-500/20",
                  };

                  const isMe = currentAdmin?.id === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-5 font-bold text-slate-200">
                        <span className="flex items-center gap-1.5">
                          {u.email}
                          {isMe && (
                            <span className="text-[9px] uppercase tracking-wide font-black px-1.5 py-0.5 rounded bg-teal-500 text-slate-950">
                              BẠN
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="p-5">
                        {editingUserId === u.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              defaultValue={u.role}
                              disabled={submittingAction}
                              onChange={(e) => handleUpdateRole(u.id, e.target.value as UserRole)}
                              className="px-2 py-1 text-xs rounded border border-slate-700 bg-slate-900 text-slate-100"
                            >
                              <option value="USER">USER</option>
                              <option value="DOCTOR">DOCTOR</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="text-slate-500 hover:text-slate-300"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => {
                              if (!isMe) setEditingUserId(u.id);
                            }}
                            className={`px-2.5 py-1 rounded-lg border font-bold text-[10px] tracking-wide uppercase cursor-pointer hover:opacity-80 transition-all ${
                              roleColors[u.role]
                            }`}
                          >
                            {u.role}
                          </span>
                        )}
                      </td>
                      <td className="p-5 text-slate-400 font-medium">
                        {u.role === "DOCTOR" ? (
                          linkingUserId === u.id ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={selectedDoctorId}
                                onChange={(e) => setSelectedDoctorId(e.target.value)}
                                className="px-2 py-1 text-xs rounded border border-slate-700 bg-slate-900 text-slate-100 max-w-[150px]"
                              >
                                <option value="">Chọn hồ sơ...</option>
                                {doctors.map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.name}
                                  </option>
                                ))}
                              </select>
                              <Button
                                variant="teal"
                                onClick={() => handleLinkDoctor(u.id)}
                                className="!px-2 !py-1 text-[10px] rounded"
                                disabled={submittingAction || !selectedDoctorId}
                              >
                                Lưu
                              </Button>
                              <button
                                onClick={() => {
                                  setLinkingUserId(null);
                                  setSelectedDoctorId("");
                                }}
                                className="text-[10px] text-slate-500 hover:text-slate-300"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setLinkingUserId(u.id)}
                              className="flex items-center gap-1 hover:text-teal-400 text-slate-400 transition-colors"
                            >
                              <LinkIcon className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate max-w-[150px]">
                                {getLinkedDoctorName(u.doctorId)}
                              </span>
                            </button>
                          )
                        ) : (
                          <span className="text-slate-600 italic">Không áp dụng</span>
                        )}
                      </td>
                      <td className="p-5 text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-5 text-right">
                        {!isMe && u.role !== "ADMIN" ? (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 rounded-lg bg-slate-900 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 text-slate-400 hover:text-red-400 transition-all shadow-sm"
                            title="Xóa tài khoản thành viên"
                            disabled={submittingAction}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="text-slate-600 italic text-[10px] pr-2">Bảo vệ</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
