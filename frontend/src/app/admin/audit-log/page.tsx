"use client";

import React, { useEffect, useState } from "react";
import { adminService } from "@/services/admin.service";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import {
  Search, ShieldAlert, History, Activity, Calendar, Filter, X, 
  ChevronLeft, ChevronRight, UserCog, Database, Trash2, CheckCircle2, XCircle
} from "lucide-react";
import { format } from "date-fns";

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [action, setAction] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Expanded log row
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getAuditLogs({
        page,
        limit: 20,
        action: action || undefined,
        adminEmail: adminEmail || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setLogs(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalRecords(res.pagination.total);
    } catch (err: any) {
      setError("Không thể tải lịch sử hoạt động. Vui lòng thử lại.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const handleFilter = () => {
    setPage(1);
    fetchLogs();
  };

  const clearFilter = () => {
    setAction("");
    setAdminEmail("");
    setStartDate("");
    setEndDate("");
    setPage(1);
    // setTimeout to ensure state is updated before fetching
    setTimeout(fetchLogs, 0);
  };

  const getActionInfo = (type: string) => {
    switch(type) {
      case "LOCK_USER": return { label: "Khóa User", color: "text-orange-400" };
      case "UNLOCK_USER": return { label: "Mở khóa User", color: "text-emerald-400" };
      case "DELETE_USER": return { label: "Xóa User", color: "text-red-400" };
      case "UPDATE_USER_ROLE": return { label: "Đổi Role", color: "text-indigo-400" };
      case "APPROVE_DOCTOR": return { label: "Duyệt Bác sĩ", color: "text-emerald-400" };
      case "REJECT_DOCTOR": return { label: "Từ chối Bác sĩ", color: "text-red-400" };
      case "CREATE_SPECIALTY": return { label: "Tạo Chuyên khoa", color: "text-teal-400" };
      case "UPDATE_SPECIALTY": return { label: "Sửa Chuyên khoa", color: "text-blue-400" };
      case "DELETE_SPECIALTY": return { label: "Xóa Chuyên khoa", color: "text-red-400" };
      case "RESOLVE_COMPLAINT": return { label: "Xử lý Khiếu nại", color: "text-emerald-400" };
      default: return { label: type, color: "text-slate-400" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <History className="h-6 w-6 text-teal-400" />
          Nhật ký Hoạt động (Audit Log)
        </h1>
        <p className="text-sm text-slate-400">Theo dõi toàn bộ thao tác quan trọng của Quản trị viên trên hệ thống.</p>
      </div>

      {error && <Alert type="error" message={error} className="bg-red-950/40 border-red-900/50 text-red-300" />}

      {/* Filters */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-300">
          <Filter className="h-4 w-4 text-slate-500" /> Bộ lọc tìm kiếm
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3">
            <input
              type="text"
              placeholder="Email Admin thực hiện..."
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-sm"
            />
          </div>
          <div className="md:col-span-3">
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-sm"
            >
              <option value="">Tất cả thao tác</option>
              <option value="LOCK_USER">Khóa User</option>
              <option value="UNLOCK_USER">Mở khóa User</option>
              <option value="DELETE_USER">Xóa User</option>
              <option value="UPDATE_USER_ROLE">Thay đổi Role</option>
              <option value="APPROVE_DOCTOR">Duyệt Bác sĩ</option>
              <option value="REJECT_DOCTOR">Từ chối Bác sĩ</option>
              <option value="CREATE_SPECIALTY">Thêm Chuyên khoa</option>
              <option value="UPDATE_SPECIALTY">Sửa Chuyên khoa</option>
              <option value="DELETE_SPECIALTY">Xóa Chuyên khoa</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-sm"
              title="Từ ngày"
            />
          </div>
          <div className="md:col-span-2">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-sm"
              title="Đến ngày"
            />
          </div>
          <div className="md:col-span-2 flex gap-2">
            <button onClick={handleFilter} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors">
              Lọc
            </button>
            <button onClick={clearFilter} className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-sm font-semibold transition-colors" title="Xóa bộ lọc">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200">Danh sách Log ({totalRecords})</h2>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex justify-center"><LoadingSpinner className="text-teal-500 h-8 w-8" /></div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-sm font-medium">Không có nhật ký nào phù hợp.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  <th className="px-5 py-4">Thời gian</th>
                  <th className="px-5 py-4">Admin</th>
                  <th className="px-5 py-4">Hành động</th>
                  <th className="px-5 py-4">Đối tượng</th>
                  <th className="px-5 py-4">IP Address</th>
                  <th className="px-5 py-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-900">
                {logs.map((log) => {
                  const actionInfo = getActionInfo(log.action);
                  const isExpanded = expandedLogId === log.id;
                  
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-5 py-4 text-slate-400 whitespace-nowrap">
                          {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss")}
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-semibold text-slate-200">{log.adminEmail}</span>
                          <span className="block text-[10px] text-slate-500 font-mono mt-0.5">{log.adminId.split("-")[0]}...</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`font-bold ${actionInfo.color}`}>{actionInfo.label}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2 py-1 rounded bg-slate-800 text-[10px] font-bold text-slate-300 uppercase tracking-wide border border-slate-700">
                            {log.targetType}
                          </span>
                          {log.targetLabel && <span className="block text-slate-400 mt-1 max-w-[150px] truncate" title={log.targetLabel}>{log.targetLabel}</span>}
                        </td>
                        <td className="px-5 py-4 text-slate-500 font-mono text-[10px]">{log.ipAddress || "N/A"}</td>
                        <td className="px-5 py-4 text-right">
                          <button 
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${isExpanded ? "bg-teal-500/10 text-teal-400" : "bg-slate-800 text-slate-400 hover:text-white"}`}
                          >
                            {isExpanded ? "Thu gọn" : "Xem JSON"}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-950/80">
                          <td colSpan={6} className="px-5 py-4 border-l-2 border-teal-500">
                            <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 overflow-x-auto">
                              <pre className="text-[11px] text-slate-300 font-mono leading-relaxed">
                                {log.detail ? JSON.stringify(log.detail, null, 2) : "Không có dữ liệu chi tiết."}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800 bg-slate-900/30">
            <p className="text-xs text-slate-500">
              Trang <span className="text-white font-semibold">{page}</span> / {totalPages}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-400 disabled:opacity-40 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-400 disabled:opacity-40 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
