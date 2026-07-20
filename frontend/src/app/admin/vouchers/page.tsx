"use client";

import React, { useState, useEffect, useCallback } from "react";
import { voucherService, Voucher, VoucherCategory } from "@/services/voucher.service";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { Plus, Edit, Trash2, Tag, Percent, Banknote, Calendar, CheckCircle2, XCircle, RefreshCw, BarChart2, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import Button from "@/components/common/Button";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<VoucherCategory, { label: string; color: string; bgColor: string; icon: string; desc: string; defaultApplyTo: string; defaultIcon: string; defaultColor: string }> = {
  FIRST_BOOKING: { label: "Lần đầu", color: "text-teal-700", bgColor: "bg-teal-100", icon: "🎁", desc: "Dành cho bệnh nhân chưa từng đặt lịch", defaultApplyTo: "ALL", defaultIcon: "🎁", defaultColor: "#0d9488" },
  SPECIALTY:     { label: "Chuyên khoa", color: "text-purple-700", bgColor: "bg-purple-100", icon: "🩺", desc: "Giảm giá cho một chuyên khoa cụ thể", defaultApplyTo: "SPECIALTY", defaultIcon: "🩺", defaultColor: "#9333ea" },
  PACKAGE:       { label: "Gói khám", color: "text-green-700", bgColor: "bg-green-100", icon: "📦", desc: "Ưu đãi áp dụng cho các gói khám", defaultApplyTo: "PACKAGE", defaultIcon: "📦", defaultColor: "#22c55e" },
  DOCTOR:        { label: "Bác sĩ", color: "text-blue-700", bgColor: "bg-blue-100", icon: "👨‍⚕️", desc: "Giảm phí đặt lịch khám bác sĩ", defaultApplyTo: "DOCTOR", defaultIcon: "👨‍⚕️", defaultColor: "#3b82f6" },
  REFERRAL:      { label: "Giới thiệu", color: "text-orange-700", bgColor: "bg-orange-100", icon: "👥", desc: "Mã chia sẻ giữa người dùng", defaultApplyTo: "ALL", defaultIcon: "👥", defaultColor: "#f97316" },
  HOLIDAY:       { label: "Ngày lễ", color: "text-red-700", bgColor: "bg-red-100", icon: "🎉", desc: "Voucher theo sự kiện đặc biệt", defaultApplyTo: "ALL", defaultIcon: "🎉", defaultColor: "#ef4444" },
};

const CATEGORY_TABS: { key: VoucherCategory | "ALL"; label: string }[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "FIRST_BOOKING", label: "Lần đầu" },
  { key: "SPECIALTY", label: "Chuyên khoa" },
  { key: "PACKAGE", label: "Gói khám" },
  { key: "DOCTOR", label: "Bác sĩ" },
  { key: "REFERRAL", label: "Giới thiệu" },
  { key: "HOLIDAY", label: "Ngày lễ" },
];

const EMOJI_OPTIONS = ["🎁", "🩺", "📦", "👨‍⚕️", "👥", "🎉", "💊", "🏥", "❤️", "🌸", "🌹", "🤰", "⭐", "✨", "🎯", "🔖"];
const BAR_COLORS = ["#0d9488", "#3b82f6", "#9333ea", "#f97316", "#ef4444", "#22c55e", "#eab308", "#ec4899"];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomBarTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-slate-800 text-white text-xs rounded-xl p-3 shadow-lg">
        <p className="font-bold text-teal-300 mb-1">{d.code}</p>
        <p>Kỳ này: <span className="font-bold text-white">{d.count} lượt</span></p>
        <p>All time: <span className="font-bold text-slate-300">{d.totalCount} lượt</span></p>
      </div>
    );
  }
  return null;
};

const CustomLineTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 text-white text-xs rounded-xl p-3 shadow-lg">
        <p className="font-bold text-slate-300 mb-1">{payload[0].payload.date}</p>
        <p>Đã giảm: <span className="font-bold text-teal-300">{Number(payload[0].value).toLocaleString("vi-VN")}đ</span></p>
      </div>
    );
  }
  return null;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminVoucherPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<VoucherCategory | "ALL">("ALL");

  // Charts
  const [chartPeriod, setChartPeriod] = useState<"week" | "month" | "year">("month");
  const [chartData, setChartData] = useState<{ barData: any[]; lineData: any[]; totalUsed: number; totalDiscount: number } | null>(null);
  const [chartLoading, setChartLoading] = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<VoucherCategory>("FIRST_BOOKING");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [formData, setFormData] = useState({
    code: "", type: "PERCENT", discountValue: "", applyTo: "ALL",
    specialtyId: "", minDepositAmount: "0", maxUses: "",
    isFirstBooking: false, isActive: true, startDate: "", endDate: "",
    category: "FIRST_BOOKING" as VoucherCategory,
    description: "", avatarColor: "#0d9488", avatarIcon: "🎁",
  });

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    loadChartData();
  }, [chartPeriod]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { vouchers } = await voucherService.adminGetVouchers();
      setVouchers(vouchers);
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi tải danh sách voucher");
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    setChartLoading(true);
    try {
      const data = await voucherService.adminGetChartData(chartPeriod);
      setChartData(data);
    } catch {
      // silently ignore; show empty charts
    } finally {
      setChartLoading(false);
    }
  };

  const filteredVouchers = categoryFilter === "ALL"
    ? vouchers
    : vouchers.filter(v => v.category === categoryFilter);

  const handleOpenCreate = () => {
    setEditingId(null);
    setModalStep(1);
    setSelectedCategory("FIRST_BOOKING");
    const today = format(new Date(), "yyyy-MM-dd'T'HH:mm");
    const end = format(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm");
    setFormData({ code: "", type: "PERCENT", discountValue: "", applyTo: "ALL", specialtyId: "", minDepositAmount: "0", maxUses: "", isFirstBooking: false, isActive: true, startDate: today, endDate: end, category: "FIRST_BOOKING", description: "", avatarColor: "#0d9488", avatarIcon: "🎁" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: Voucher) => {
    setEditingId(v.id);
    setSelectedCategory(v.category || "FIRST_BOOKING");
    setFormData({
      code: v.code, type: v.type, discountValue: v.discountValue.toString(), applyTo: v.applyTo,
      specialtyId: v.specialtyId || "", minDepositAmount: v.minDepositAmount.toString(),
      maxUses: v.maxUses?.toString() || "", isFirstBooking: v.isFirstBooking, isActive: v.isActive,
      startDate: format(new Date(v.startDate), "yyyy-MM-dd'T'HH:mm"),
      endDate: format(new Date(v.endDate), "yyyy-MM-dd'T'HH:mm"),
      category: v.category || "FIRST_BOOKING",
      description: v.description || "", avatarColor: v.avatarColor || "#0d9488", avatarIcon: v.avatarIcon || "🎁",
    });
    setModalStep(2);
    setIsModalOpen(true);
  };

  const handleSelectCategory = (cat: VoucherCategory) => {
    setSelectedCategory(cat);
    const cfg = CATEGORY_CONFIG[cat];
    const today = format(new Date(), "yyyy-MM-dd'T'HH:mm");
    const monthsLater = cat === "FIRST_BOOKING" ? 2 : 3;
    const endDate = format(new Date(Date.now() + monthsLater * 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm");
    setFormData(prev => ({
      ...prev,
      category: cat,
      applyTo: cfg.defaultApplyTo,
      isFirstBooking: cat === "FIRST_BOOKING",
      avatarIcon: cfg.defaultIcon,
      avatarColor: cfg.defaultColor,
      startDate: today,
      endDate,
    }));
  };

  const generateCode = () => {
    const prefix = selectedCategory.substring(0, 3).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    setFormData(prev => ({ ...prev, code: `${prefix}${rand}` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        discountValue: Number(formData.discountValue),
        minDepositAmount: Number(formData.minDepositAmount),
        maxUses: formData.maxUses ? Number(formData.maxUses) : null,
        specialtyId: formData.applyTo === "SPECIALTY" ? formData.specialtyId : null,
      };
      if (editingId) {
        const res = await voucherService.adminUpdateVoucher(editingId, payload);
        toast.success(res.capped ? "Đã cập nhật (Ngày kết thúc đã tự điều chỉnh)" : "Cập nhật thành công");
      } else {
        const res = await voucherService.adminCreateVoucher(payload);
        toast.success(res.message);
      }
      setIsModalOpen(false);
      loadData();
      loadChartData();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi lưu voucher");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa voucher này?")) return;
    try {
      await voucherService.adminDeleteVoucher(id);
      toast.success("Đã xóa voucher");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xóa voucher");
    }
  };

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <LoadingSpinner className="h-10 w-10 text-teal-600" />
    </div>
  );

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Tag className="h-6 w-6 text-teal-600" />
            Quản Lý Mã Giảm Giá
          </h1>
          <Button onClick={handleOpenCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Tạo Mới
          </Button>
        </div>

        {/* Charts Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">Thống kê sử dụng</h2>
              {chartData && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Kỳ này: <span className="font-bold text-slate-700">{chartData.totalUsed} lượt</span> &nbsp;·&nbsp;
                  Đã giảm: <span className="font-bold text-teal-600">{chartData.totalDiscount.toLocaleString("vi-VN")}đ</span>
                </p>
              )}
            </div>
            <div className="flex gap-1">
              {(["week", "month", "year"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${chartPeriod === p ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  {p === "week" ? "Tuần" : p === "month" ? "Tháng" : "Năm"}
                </button>
              ))}
              <button onClick={loadChartData} className="p-1 ml-1 text-slate-400 hover:text-teal-600">
                <RefreshCw className={`h-4 w-4 ${chartLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {chartLoading ? (
            <div className="h-52 flex items-center justify-center"><LoadingSpinner className="h-8 w-8 text-teal-500" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bar Chart */}
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                  <BarChart2 className="h-3.5 w-3.5" /> Lượt sử dụng theo voucher
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData?.barData || []} margin={{ top: 4, right: 8, left: -15, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="code" tick={{ fontSize: 10, fill: "#64748b" }} interval={0} angle={-20} textAnchor="end" height={40} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} allowDecimals={false} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {(chartData?.barData || []).map((_: any, i: number) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Line Chart */}
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" /> Tổng tiền đã giảm
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData?.lineData || []} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip content={<CustomLineTooltip />} />
                    <Line type="monotone" dataKey="amount" stroke="#0d9488" strokeWidth={2} dot={{ fill: "#0d9488", r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {(!chartLoading && (!chartData?.barData?.length && !chartData?.lineData?.length)) && (
            <div className="text-center py-8 text-slate-400 text-sm">
              Chưa có dữ liệu sử dụng voucher trong kỳ này
            </div>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setCategoryFilter(tab.key)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-full border transition-all ${
                categoryFilter === tab.key
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-teal-400"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-75">
                ({tab.key === "ALL" ? vouchers.length : vouchers.filter(v => v.category === tab.key).length})
              </span>
            </button>
          ))}
        </div>

        {/* Voucher Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4">Mã Voucher</th>
                <th className="p-4">Danh mục</th>
                <th className="p-4">Mô tả</th>
                <th className="p-4">Loại / Mức Giảm</th>
                <th className="p-4">Áp dụng</th>
                <th className="p-4">Thời gian</th>
                <th className="p-4">Lượt dùng</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVouchers.map(v => {
                const catCfg = CATEGORY_CONFIG[v.category || "FIRST_BOOKING"];
                return (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg leading-none">{v.avatarIcon || catCfg.icon}</span>
                        <span className="font-mono font-bold text-teal-700">{v.code}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${catCfg.bgColor} ${catCfg.color}`}>
                        {catCfg.label}
                      </span>
                    </td>
                    <td className="p-4 max-w-[180px]">
                      <p className="text-xs text-slate-500 truncate" title={v.description || ""}>
                        {v.description ? v.description.substring(0, 40) + (v.description.length > 40 ? "..." : "") : "—"}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 font-semibold text-slate-700">
                        {v.type === "PERCENT" ? <Percent className="h-4 w-4 text-blue-500" /> : <Banknote className="h-4 w-4 text-emerald-500" />}
                        {v.type === "PERCENT" ? `${v.discountValue}%` : `${v.discountValue.toLocaleString("vi-VN")}đ`}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        v.applyTo === "ALL" ? "bg-teal-50 text-teal-700" :
                        v.applyTo === "PACKAGE" ? "bg-violet-50 text-violet-700" :
                        v.applyTo === "DOCTOR" ? "bg-blue-50 text-blue-700" :
                        "bg-orange-50 text-orange-700"
                      }`}>
                        {v.applyTo === "ALL" ? "Tất cả" : v.applyTo === "PACKAGE" ? "Gói khám" : v.applyTo === "DOCTOR" ? "Bác sĩ" : "Chuyên khoa"}
                      </span>
                    </td>
                    <td className="p-4 text-xs space-y-1">
                      <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Từ: {format(new Date(v.startDate), "dd/MM/yyyy")}</div>
                      <div className="flex items-center gap-1 text-red-500"><Calendar className="h-3 w-3" /> Đến: {format(new Date(v.endDate), "dd/MM/yyyy")}</div>
                    </td>
                    <td className="p-4">
                      {v.usedCount} / {v.maxUses === null ? "∞" : v.maxUses}
                    </td>
                    <td className="p-4">
                      {v.isActive ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Hoạt động
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-full w-fit">
                          <XCircle className="h-3.5 w-3.5" /> Vô hiệu
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-1">
                      <button onClick={() => handleOpenEdit(v)} className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(v.id)} className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredVouchers.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-400">
                    <Tag className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    Không có mã giảm giá nào trong danh mục này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Create/Edit Modal ──────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {editingId ? "Cập nhật Voucher" : (modalStep === 1 ? "Bước 1: Chọn loại voucher" : "Bước 2: Điền thông tin")}
                </h2>
                {!editingId && <p className="text-xs text-slate-500 mt-0.5">{modalStep === 1 ? "Chọn danh mục phù hợp để tạo voucher" : `Danh mục: ${CATEGORY_CONFIG[selectedCategory].label}`}</p>}
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><XCircle className="h-5 w-5" /></button>
            </div>

            {/* Step 1: Choose Category */}
            {modalStep === 1 && !editingId && (
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(Object.entries(CATEGORY_CONFIG) as [VoucherCategory, typeof CATEGORY_CONFIG[VoucherCategory]][]).map(([cat, cfg]) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleSelectCategory(cat)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
                        selectedCategory === cat ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="text-3xl mb-2">{cfg.icon}</div>
                      <p className={`font-bold text-sm ${selectedCategory === cat ? "text-teal-700" : "text-slate-800"}`}>{cfg.label}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-snug">{cfg.desc}</p>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end mt-6">
                  <Button onClick={() => setModalStep(2)}>Tiếp theo →</Button>
                </div>
              </div>
            )}

            {/* Step 2: Fill Form */}
            {(modalStep === 2 || editingId) && (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Avatar Preview */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="relative">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow cursor-pointer"
                      style={{ backgroundColor: formData.avatarColor }}
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      title="Click để đổi icon"
                    >
                      {formData.avatarIcon}
                    </div>
                    {showEmojiPicker && (
                      <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-20 grid grid-cols-4 gap-2 w-48">
                        {EMOJI_OPTIONS.map(emoji => (
                          <button key={emoji} type="button" onClick={() => { setFormData(p => ({ ...p, avatarIcon: emoji })); setShowEmojiPicker(false); }} className="text-2xl hover:bg-slate-100 rounded-lg p-1 transition-colors">{emoji}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-600 mb-1.5">Màu nền avatar</p>
                    <div className="flex items-center gap-2">
                      <input type="color" value={formData.avatarColor} onChange={e => setFormData(p => ({ ...p, avatarColor: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border-0" />
                      <span className="text-xs text-slate-500">{formData.avatarColor}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Click vào icon để đổi emoji</p>
                  </div>
                </div>

                {/* Code + Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Mã Voucher *</label>
                    <div className="flex gap-1">
                      <input required type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="flex-1 border rounded-lg px-3 py-2 text-sm uppercase font-mono" placeholder="SUMMER2026" />
                      <button type="button" onClick={generateCode} title="Tạo ngẫu nhiên" className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 text-xs font-semibold transition-colors">🎲</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Loại giảm giá</label>
                    <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="PERCENT">Theo phần trăm (%)</option>
                      <option value="FIXED">Số tiền cố định (VNĐ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Mức giảm {formData.type === "PERCENT" ? "(tối đa 10%)" : "(VNĐ)"}</label>
                    <input required type="number" min="1" max={formData.type === "PERCENT" ? 10 : undefined} value={formData.discountValue} onChange={e => setFormData({ ...formData, discountValue: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder={formData.type === "PERCENT" ? "Tối đa 10" : "Ví dụ: 50000"} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Áp dụng cho</label>
                    <select value={formData.applyTo} onChange={e => setFormData({ ...formData, applyTo: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="ALL">Tất cả dịch vụ</option>
                      <option value="PACKAGE">Chỉ Gói khám</option>
                      <option value="SPECIALTY">Chuyên khoa cụ thể</option>
                      <option value="DOCTOR">Chỉ Bác sĩ</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả ngắn</label>
                  <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} maxLength={255} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" placeholder="Mô tả ngắn gọn về voucher này..." />
                </div>

                {/* Dates & Limits */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày bắt đầu</label>
                    <input required type="datetime-local" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày kết thúc</label>
                    <input required type="datetime-local" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Cọc tối thiểu (VNĐ)</label>
                    <input required type="number" min="0" value={formData.minDepositAmount} onChange={e => setFormData({ ...formData, minDepositAmount: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Giới hạn lượt dùng (để trống = vô hạn)</label>
                    <input type="number" min="1" value={formData.maxUses} onChange={e => setFormData({ ...formData, maxUses: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Vô hạn" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isFirstBooking" checked={formData.isFirstBooking} onChange={e => setFormData({ ...formData, isFirstBooking: e.target.checked })} className="w-4 h-4 accent-teal-600 rounded" />
                  <label htmlFor="isFirstBooking" className="text-sm font-semibold text-slate-700">Chỉ áp dụng lần đầu đặt lịch</label>
                </div>
                {editingId && (
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 accent-teal-600 rounded" />
                    <label htmlFor="isActive" className="text-sm font-semibold text-slate-700">Kích hoạt voucher</label>
                  </div>
                )}

                <div className="flex justify-between gap-3 pt-4 border-t border-slate-100">
                  {!editingId && (
                    <button type="button" onClick={() => setModalStep(1)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                      ← Quay lại
                    </button>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                    <Button type="submit">Lưu Voucher</Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
