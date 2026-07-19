"use client";

import React, { useState, useEffect } from "react";
import { voucherService, Voucher } from "@/services/voucher.service";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { Plus, Edit, Trash2, Tag, Percent, Banknote, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import Button from "@/components/common/Button";

export default function AdminVoucherPage() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    // Form state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        code: "",
        type: "PERCENT",
        discountValue: "",
        applyTo: "ALL",
        specialtyId: "",
        minDepositAmount: "0",
        maxUses: "",
        isFirstBooking: false,
        isActive: true,
        startDate: "",
        endDate: "",
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const { vouchers, stats } = await voucherService.adminGetVouchers();
            setVouchers(vouchers);
            setStats(stats);
        } catch (error: any) {
            toast.error(error.message || "Lỗi khi tải danh sách voucher");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (voucher?: Voucher) => {
        if (voucher) {
            setEditingId(voucher.id);
            setFormData({
                code: voucher.code,
                type: voucher.type,
                discountValue: voucher.discountValue.toString(),
                applyTo: voucher.applyTo,
                specialtyId: voucher.specialtyId || "",
                minDepositAmount: voucher.minDepositAmount.toString(),
                maxUses: voucher.maxUses?.toString() || "",
                isFirstBooking: voucher.isFirstBooking,
                isActive: voucher.isActive,
                startDate: format(new Date(voucher.startDate), "yyyy-MM-dd'T'HH:mm"),
                endDate: format(new Date(voucher.endDate), "yyyy-MM-dd'T'HH:mm"),
            });
        } else {
            setEditingId(null);
            setFormData({
                code: "",
                type: "PERCENT",
                discountValue: "",
                applyTo: "ALL",
                specialtyId: "",
                minDepositAmount: "0",
                maxUses: "",
                isFirstBooking: false,
                isActive: true,
                startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSubmit = {
                ...formData,
                discountValue: Number(formData.discountValue),
                minDepositAmount: Number(formData.minDepositAmount),
                maxUses: formData.maxUses ? Number(formData.maxUses) : null,
                specialtyId: formData.applyTo === "SPECIALTY" ? formData.specialtyId : null,
            };

            if (editingId) {
                const res = await voucherService.adminUpdateVoucher(editingId, dataToSubmit);
                toast.success(res.capped ? "Đã cập nhật (Ngày hết hạn đã được tự động điều chỉnh theo giới hạn)" : "Cập nhật thành công");
            } else {
                const res = await voucherService.adminCreateVoucher(dataToSubmit);
                toast.success(res.message);
            }
            setIsModalOpen(false);
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Lỗi khi lưu voucher");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa voucher này?")) return;
        try {
            await voucherService.adminDeleteVoucher(id);
            toast.success("Xóa voucher thành công");
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Lỗi khi xóa voucher");
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <LoadingSpinner className="h-10 w-10 text-teal-600" />
            </div>
        );
    }

    return (
        <ProtectedRoute allowedRoles={["ADMIN"]}>
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Tag className="h-6 w-6 text-teal-600" />
                        Quản Lý Mã Giảm Giá
                    </h1>
                    <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Tạo Mới
                    </Button>
                </div>

                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-sm text-slate-500 font-medium">Voucher đang hoạt động</p>
                            <p className="text-2xl font-bold text-teal-600">{stats.active}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-sm text-slate-500 font-medium">Sắp hết hạn (7 ngày)</p>
                            <p className="text-2xl font-bold text-amber-500">{stats.expiring}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-sm text-slate-500 font-medium">Tổng lượt sử dụng</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.totalUsed}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-sm text-slate-500 font-medium">Tổng tiền đã giảm</p>
                            <p className="text-2xl font-bold text-rose-500">{stats.totalDiscounted.toLocaleString("vi-VN")}đ</p>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="p-4">Mã Voucher</th>
                                <th className="p-4">Loại / Mức Giảm</th>
                                <th className="p-4">Áp dụng</th>
                                <th className="p-4">Điều kiện</th>
                                <th className="p-4">Thời gian</th>
                                <th className="p-4">Lượt dùng</th>
                                <th className="p-4">Trạng thái</th>
                                <th className="p-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {vouchers.map((v) => (
                                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-mono font-bold text-teal-700">{v.code}</td>
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
                                            "bg-orange-50 text-orange-700"
                                        }`}>
                                            {v.applyTo === "ALL" ? "Tất cả" : v.applyTo === "PACKAGE" ? "Gói khám" : "Chuyên khoa"}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-xs">Cọc tối thiểu: {v.minDepositAmount.toLocaleString("vi-VN")}đ</p>
                                        {v.isFirstBooking && <p className="text-xs text-amber-600 font-medium mt-1">Lần đầu đặt lịch</p>}
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
                                    <td className="p-4 text-right space-x-2">
                                        <button onClick={() => handleOpenModal(v)} className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors">
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleDelete(v.id)} className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {vouchers.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500">
                                        Chưa có mã giảm giá nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-slate-800">{editingId ? "Cập nhật Voucher" : "Tạo Voucher mới"}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Mã Voucher</label>
                                    <input required type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="w-full border rounded-lg px-3 py-2 uppercase" placeholder="VD: SUMMER2026" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Loại giảm giá</label>
                                    <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                                        <option value="PERCENT">Theo phần trăm (%)</option>
                                        <option value="FIXED">Số tiền cố định (VNĐ)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Mức giảm</label>
                                    <input required type="number" min="1" value={formData.discountValue} onChange={e => setFormData({ ...formData, discountValue: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder={formData.type === "PERCENT" ? "Tối đa 10%" : "Ví dụ: 100000"} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Áp dụng cho</label>
                                    <select value={formData.applyTo} onChange={e => setFormData({ ...formData, applyTo: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                                        <option value="ALL">Tất cả (Cả Gói khám lẫn Bác sĩ)</option>
                                        <option value="PACKAGE">Chỉ Gói khám</option>
                                        <option value="SPECIALTY">Chuyên khoa cụ thể (cần ID)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Cọc tối thiểu (VNĐ)</label>
                                    <input required type="number" min="0" value={formData.minDepositAmount} onChange={e => setFormData({ ...formData, minDepositAmount: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày bắt đầu</label>
                                    <input required type="datetime-local" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày kết thúc</label>
                                    <input required type="datetime-local" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Giới hạn số lượt dùng (Trống = Vô hạn)</label>
                                    <input type="number" min="1" value={formData.maxUses} onChange={e => setFormData({ ...formData, maxUses: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                                </div>
                                <div className="flex items-center gap-2 mt-6">
                                    <input type="checkbox" id="isFirstBooking" checked={formData.isFirstBooking} onChange={e => setFormData({ ...formData, isFirstBooking: e.target.checked })} className="w-4 h-4 text-teal-600 rounded" />
                                    <label htmlFor="isFirstBooking" className="text-sm font-semibold text-slate-700">Chỉ áp dụng lần đầu đặt lịch</label>
                                </div>
                                {editingId && (
                                    <div className="flex items-center gap-2 mt-6">
                                        <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 text-teal-600 rounded" />
                                        <label htmlFor="isActive" className="text-sm font-semibold text-slate-700">Kích hoạt voucher</label>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                                <Button type="submit">Lưu Voucher</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ProtectedRoute>
    );
}
