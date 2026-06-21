'use client';

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Button } from '@/components/common/Button';
import { Search, Filter, ShieldAlert, Edit, Trash2, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { handleError } from '@/utils/errorHandler';

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  role: 'STUDENT' | 'MENTOR' | 'ADMIN';
  createdAt: string;
}

export default function AdminUsersManagement() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Pagination
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/users', {
        params: {
          page,
          limit: 8,
          role: roleFilter || undefined,
          q: searchQuery || undefined
        }
      });
      if (response.data.success) {
        setUsers(response.data.users);
        setTotalPages(Math.ceil(response.data.total / 8) || 1);
      }
    } catch (_) {
      handleError('Không thể tải danh sách người dùng.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleRoleChange = async (userId: string, newRole: 'STUDENT' | 'MENTOR' | 'ADMIN') => {
    if (!window.confirm(`Bạn có chắc chắn muốn chuyển đổi phân quyền của người dùng này thành ${newRole}?`)) return;
    setIsUpdating(userId);
    try {
      const response = await api.put(`/admin/users/${userId}`, {
        role: newRole
      });
      if (response.data.success) {
        toast.success('Cập nhật phân quyền thành công! 🔑');
        // Update locally
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch (error: any) {
      handleError(error, 'Cập nhật quyền thất bại.');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Cảnh báo: Hành động này sẽ xóa vĩnh viễn tài khoản người dùng và tất cả dữ liệu liên quan (học tập, BKT, quiz). Bạn chắc chắn chứ?')) return;
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      if (response.data.success) {
        toast.success('Xóa người dùng thành công.');
        fetchUsers();
      }
    } catch (_) {
      handleError('Xóa người dùng thất bại.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-900 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
          Quản trị tài khoản người dùng
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Chỉnh sửa phân quyền (Admin, Mentor, Student), giám sát hoạt động và xóa các tài khoản vi phạm.
        </p>
      </div>

      {/* Filter Row */}
      <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo họ tên, email..."
            className="w-full bg-slate-950 border border-slate-850 pl-10 pr-4 py-2.5 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-purple-500/50 transition-all placeholder-slate-700"
          />
        </form>

        <div className="flex items-center gap-3">
          {/* Role select */}
          <div className="relative">
            <Filter className="absolute left-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="bg-slate-955 border border-slate-850 pl-9 pr-6 py-2 rounded-xl text-slate-400 text-xs focus:outline-none appearance-none cursor-pointer"
            >
              <option value="">Tất cả phân vai</option>
              <option value="STUDENT">Sinh viên (Student)</option>
              <option value="MENTOR">Giảng viên (Mentor)</option>
              <option value="ADMIN">Quản trị viên (Admin)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="py-20 text-center text-slate-550 text-xs">
          Không tìm thấy tài khoản người dùng nào.
        </div>
      ) : (
        <div className="bg-slate-900/20 border border-slate-850 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500 bg-slate-950/20">
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Họ và tên</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Email</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Ngày đăng ký</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Quyền hạn (Role)</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-350">
                {users.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-200">{row.fullName}</td>
                    <td className="py-4 px-6">{row.email}</td>
                    <td className="py-4 px-6">{new Date(row.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="py-4 px-6">
                      <select
                        value={row.role}
                        disabled={isUpdating === row.id}
                        onChange={(e) => handleRoleChange(row.id, e.target.value as any)}
                        className="bg-slate-950 border border-slate-850 text-slate-300 py-1.5 px-3 rounded-lg text-xs focus:outline-none appearance-none cursor-pointer disabled:opacity-40"
                      >
                        <option value="STUDENT">Student</option>
                        <option value="MENTOR">Mentor</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleDeleteUser(row.id)}
                        className="p-2 rounded-lg bg-slate-950 hover:bg-rose-955/20 text-slate-450 hover:text-rose-400 border border-slate-850 transition-colors"
                        title="Xóa tài khoản"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Row */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-900 bg-slate-950/20 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Trang {page} / {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200 p-2 rounded-xl text-xs flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Trang trước</span>
                </Button>
                <Button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200 p-2 rounded-xl text-xs flex items-center gap-1"
                >
                  <span>Trang sau</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
