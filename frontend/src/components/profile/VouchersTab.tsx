"use client";

import React, { useEffect, useState } from "react";
import { voucherService, Voucher, VoucherCategory } from "@/services/voucher.service";
import { Ticket, Clock, ChevronRight, Info } from "lucide-react";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import { differenceInDays } from "date-fns";

// ─── Category Config ─────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<VoucherCategory, { label: string; defaultColor: string; defaultIcon: string }> = {
  FIRST_BOOKING: { label: "LẦN ĐẦU", defaultColor: "#0d9488", defaultIcon: "🎁" },
  SPECIALTY:     { label: "CHUYÊN KHOA", defaultColor: "#9333ea", defaultIcon: "🩺" },
  PACKAGE:       { label: "GÓI KHÁM", defaultColor: "#22c55e", defaultIcon: "📦" },
  DOCTOR:        { label: "BÁC SĨ", defaultColor: "#3b82f6", defaultIcon: "👨‍⚕️" },
  REFERRAL:      { label: "GIỚI THIỆU", defaultColor: "#f97316", defaultIcon: "👥" },
  HOLIDAY:       { label: "NGÀY LỄ", defaultColor: "#ef4444", defaultIcon: "🎉" },
};

// ─── Shopee-style Voucher Card ────────────────────────────────────────────────

function VoucherCard({ v, onUse }: { v: Voucher; onUse: (v: Voucher) => void }) {
  const [showConditions, setShowConditions] = useState(false);
  const now = new Date();
  const endDate = new Date(v.endDate);
  const daysLeft = differenceInDays(endDate, now);
  const isExpiringSoon = daysLeft >= 0 && daysLeft < 7;
  const isExpired = daysLeft < 0;
  const isExhausted = v.maxUses != null && v.usedCount >= v.maxUses;

  const catCfg = CATEGORY_CONFIG[v.category || "FIRST_BOOKING"];
  const bgColor = v.avatarColor || catCfg.defaultColor;
  const icon = v.avatarIcon || catCfg.defaultIcon;
  const label = catCfg.label;

  const discountText = v.type === "PERCENT"
    ? `Giảm ${v.discountValue}%`
    : `Giảm ${v.discountValue.toLocaleString("vi-VN")}đ`;

  const applyText = v.applyTo === "ALL"
    ? "Tất cả dịch vụ"
    : v.applyTo === "PACKAGE"
    ? "Gói khám"
    : v.applyTo === "DOCTOR"
    ? "Khám bác sĩ"
    : v.specialty?.name
    ? `Chuyên khoa ${v.specialty.name}`
    : "Chuyên khoa";

  return (
    <div className={`relative flex rounded-xl overflow-hidden border shadow-sm transition-all ${isExpired || isExhausted ? "opacity-60 grayscale" : "hover:shadow-md hover:-translate-y-0.5"}`}>
      
      {/* ── Left Block ── */}
      <div
        className="relative flex-shrink-0 w-28 flex flex-col items-center justify-center py-5 px-2 text-white"
        style={{ backgroundColor: bgColor }}
      >
        {/* Ribbon "Số lượng có hạn" */}
        {v.maxUses !== null && (
          <div className="absolute top-2 left-0 right-0 text-center">
            <span className="bg-white/20 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
              Có hạn
            </span>
          </div>
        )}

        <div className="text-4xl mb-2 mt-3">{icon}</div>
        <p className="text-[10px] font-extrabold uppercase text-center leading-tight tracking-wide text-white/90">
          {label}
        </p>
      </div>

      {/* ── Zigzag connector (CSS) ── */}
      <div
        className="flex-shrink-0 w-5 relative overflow-hidden"
        style={{ background: `linear-gradient(to right, ${bgColor} 50%, white 50%)` }}
      >
        {/* Scallop cutouts */}
        <div className="absolute inset-y-0 left-0 right-0 flex flex-col justify-around">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-full border-2 border-white mx-auto"
              style={{ backgroundColor: bgColor }}
            />
          ))}
        </div>
        <div
          className="absolute inset-y-0 right-0 w-[2px] border-r-2 border-dashed"
          style={{ borderColor: `${bgColor}66` }}
        />
      </div>

      {/* ── Right Block ── */}
      <div className="flex-1 bg-white p-4 flex flex-col justify-between min-w-0">
        <div>
          {/* Discount value + Code */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-extrabold text-slate-900 text-base leading-tight">{discountText}</p>
              {v.description && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-snug">{v.description}</p>
              )}
            </div>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded text-white whitespace-nowrap flex-shrink-0"
              style={{ backgroundColor: bgColor }}
            >
              {v.code}
            </span>
          </div>

          {/* Apply condition */}
          {applyText !== "Tất cả dịch vụ" && (
            <span className="inline-block mt-2 text-[11px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded px-2 py-0.5">
              {applyText}
            </span>
          )}
          {v.isFirstBooking && (
            <span className="inline-block mt-2 ml-1 text-[11px] font-semibold text-violet-600 bg-violet-50 border border-violet-200 rounded px-2 py-0.5">
              Lần đầu đặt lịch
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-slate-200">
          <div>
            <div className={`flex items-center gap-1 text-xs font-semibold ${isExpiringSoon ? "text-red-500" : isExpired ? "text-slate-400" : "text-slate-500"}`}>
              <Clock className="w-3 h-3" />
              {isExpired ? "Đã hết hạn" : isExpiringSoon ? `Còn ${daysLeft} ngày` : `HSD: ${endDate.toLocaleDateString("vi-VN")}`}
            </div>
            {isExhausted && <p className="text-xs text-red-500 font-medium mt-0.5">Hết lượt sử dụng</p>}
          </div>

          <div className="flex flex-col items-end gap-1">
            {!isExpired && !isExhausted ? (
              <button
                onClick={() => onUse(v)}
                className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-800 transition-colors"
              >
                Dùng ngay <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : null}
            <button
              onClick={() => setShowConditions(!showConditions)}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Info className="w-3 h-3" /> Điều kiện
            </button>
          </div>
        </div>

        {/* Conditions tooltip */}
        {showConditions && (
          <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
            <p>• Áp dụng: {applyText}</p>
            <p>• Cọc tối thiểu: {v.minDepositAmount.toLocaleString("vi-VN")}đ</p>
            {v.maxUses !== null && <p>• Tổng lượt: {v.maxUses} (đã dùng {v.usedCount})</p>}
            {v.isFirstBooking && <p>• Chỉ dùng 1 lần khi đặt lịch đầu tiên</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Tab Component ───────────────────────────────────────────────────────

export default function VouchersTab() {
  const [savedVouchers, setSavedVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveCode, setSaveCode] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchVouchers(); }, []);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await voucherService.getSavedVouchers();
      setSavedVouchers(res.saved || []);
    } catch (err: any) {
      setError(err.message || "Lỗi tải voucher");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveCode.trim()) return;
    setSaving(true);
    setError("");
    try {
      await voucherService.saveVoucher(saveCode.trim());
      setSaveCode("");
      fetchVouchers();
      // toast or alert
    } catch (err: any) {
      setError(err.message || "Lỗi khi lưu voucher");
    } finally {
      setSaving(false);
    }
  };

  const handleUseVoucher = (v: Voucher) => {
    // Copy code to clipboard + show message
    navigator.clipboard.writeText(v.code).then(() => {
      alert(`Đã sao chép mã "${v.code}" vào clipboard. Hãy dán khi thanh toán!`);
    });
  };

  if (loading) return (
    <div className="flex justify-center p-12">
      <LoadingSpinner className="text-teal-600 w-8 h-8" />
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-teal-600" />
            Voucher Đã Lưu
          </h3>
          <p className="text-sm text-slate-500 mt-1">Lưu trữ và quản lý các mã giảm giá để sử dụng khi đặt khám.</p>
        </div>

        <form onSubmit={handleSave} className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Nhập mã voucher..."
            value={saveCode}
            onChange={e => setSaveCode(e.target.value.toUpperCase())}
            className="flex-1 md:w-64 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 uppercase font-mono text-sm"
          />
          <Button type="submit" isLoading={saving} className="whitespace-nowrap px-6">
            Lưu
          </Button>
        </form>
      </div>

      {error && <Alert type="error" message={error} className="mb-6" />}

      {savedVouchers.length === 0 ? (
        <div className="text-center py-16 text-slate-500 bg-slate-50 rounded-2xl border border-slate-100">
          <Ticket className="w-14 h-14 mx-auto mb-4 text-slate-200" />
          <p className="font-semibold text-slate-400 mb-1">Bạn chưa lưu voucher nào</p>
          <p className="text-sm text-slate-400">Nhập mã voucher ở trên để lưu và sử dụng khi đặt lịch</p>
        </div>
      ) : (
        <div className="space-y-4">
          {savedVouchers.map(v => (
            <VoucherCard key={v.id} v={v} onUse={handleUseVoucher} />
          ))}
        </div>
      )}
    </div>
  );
}
