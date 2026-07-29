import React, { useState, useEffect } from "react";
import { X, Tag, AlertCircle, Check, Search, Ticket } from "lucide-react";
import { voucherService, Voucher } from "@/services/voucher.service";
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface VoucherSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (voucherCode: string) => void;
  depositAmount: number;
  specialtyId?: string | null;
  packageId?: string | null;
  isDoctorBooking?: boolean;
}

export default function VoucherSelectorModal({
  isOpen,
  onClose,
  onSelect,
  depositAmount,
  specialtyId,
  packageId,
  isDoctorBooking
}: VoucherSelectorModalProps) {
  const [manualCode, setManualCode] = useState("");
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setManualCode("");
      fetchVouchers();
    }
  }, [isOpen]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await voucherService.getMyVouchers();
      setVouchers(res.available || []);
    } catch (err: any) {
      setError(err.message || "Lỗi tải danh sách voucher.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const checkEligibility = (voucher: Voucher): { eligible: boolean; reason: string } => {
    if (depositAmount < voucher.minDepositAmount) {
      return { eligible: false, reason: `Đơn tối thiểu ${voucher.minDepositAmount.toLocaleString("vi-VN")}đ` };
    }
    if (isDoctorBooking) {
      if (voucher.applyTo === "PACKAGE") return { eligible: false, reason: "Chỉ áp dụng cho gói khám" };
      if (voucher.applyTo === "SPECIALTY" && voucher.specialtyId !== specialtyId) {
        return { eligible: false, reason: "Không áp dụng chuyên khoa này" };
      }
    } else if (packageId) {
      if (voucher.applyTo === "DOCTOR" || voucher.applyTo === "SPECIALTY") {
        return { eligible: false, reason: "Chỉ áp dụng khám bác sĩ" };
      }
    }
    return { eligible: true, reason: "" };
  };

  const handleApplyManual = () => {
    if (!manualCode.trim()) return;
    onSelect(manualCode.trim().toUpperCase());
    onClose();
  };

  const handleSelectVoucher = (voucher: Voucher, eligible: boolean) => {
    if (!eligible) return;
    onSelect(voucher.code);
    onClose();
  };

  // Phân loại voucher
  const eligibleVouchers = [];
  const ineligibleVouchers = [];

  for (const v of vouchers) {
    const { eligible, reason } = checkEligibility(v);
    if (eligible) {
      eligibleVouchers.push({ ...v, reason });
    } else {
      ineligibleVouchers.push({ ...v, reason });
    }
  }

  const renderVoucherCard = (v: any, eligible: boolean) => {
    return (
      <div 
        key={v.id}
        onClick={() => handleSelectVoucher(v, eligible)}
        className={`flex border rounded-2xl overflow-hidden mb-3 transition-all ${
          eligible 
            ? "bg-white border-teal-200 cursor-pointer hover:shadow-md hover:border-teal-400" 
            : "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed grayscale-[50%]"
        }`}
      >
        {/* Left Edge / Avatar */}
        <div className={`w-24 shrink-0 flex flex-col items-center justify-center p-3 text-white relative ${
          eligible ? "bg-gradient-to-br from-teal-400 to-teal-600" : "bg-slate-400"
        }`}>
          {/* Sawtooth border effect */}
          <div className="absolute right-[-4px] top-0 bottom-0 w-[8px] flex flex-col justify-between overflow-hidden">
             {Array.from({length: 10}).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full -ml-1 ${eligible ? "bg-white" : "bg-slate-50"}`}></div>
             ))}
          </div>
          <span className="text-2xl mb-1">{v.avatarIcon || "🏷️"}</span>
          <span className="text-[10px] font-bold text-center leading-tight">
             {v.category === "FIRST_BOOKING" ? "LẦN ĐẦU" 
               : v.category === "SPECIALTY" ? "CHUYÊN KHOA"
               : v.category === "PACKAGE" ? "GÓI KHÁM" : "VOUCHER"}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 pl-4 relative">
          <div className="pr-16">
            <h4 className={`font-bold text-sm ${eligible ? "text-slate-800" : "text-slate-600"}`}>
              {v.type === "PERCENT" ? `Giảm ${v.discountValue}%` : `Giảm ${v.discountValue.toLocaleString("vi-VN")}đ`}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{v.description || "Mã giảm giá ưu đãi"}</p>
            <p className="text-[10px] text-slate-400 mt-1">Đơn tối thiểu {v.minDepositAmount.toLocaleString("vi-VN")}đ</p>
          </div>
          
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-end">
             {eligible ? (
               <div className="w-5 h-5 rounded-full border border-teal-500 flex items-center justify-center text-white bg-teal-500">
                  <Check className="w-3 h-3" />
               </div>
             ) : (
               <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded font-medium max-w-[60px] text-right line-clamp-2">
                 {v.reason}
               </span>
             )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-3xl">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-teal-600" />
            Chọn Mã Giảm Giá
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Manual Code */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Nhập mã voucher..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm uppercase focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                onKeyDown={(e) => e.key === "Enter" && handleApplyManual()}
              />
            </div>
            <button
              onClick={handleApplyManual}
              disabled={!manualCode.trim()}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Áp dụng
            </button>
          </div>
        </div>

        {/* Vouchers List */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <LoadingSpinner className="w-8 h-8 text-teal-600" />
              <span className="text-sm text-slate-500">Đang tải mã giảm giá...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Ticket className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 text-sm font-medium">Bạn chưa có mã giảm giá nào được lưu.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {eligibleVouchers.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Mã Đủ Điều Kiện</h3>
                  <div>{eligibleVouchers.map(v => renderVoucherCard(v, true))}</div>
                </div>
              )}
              
              {ineligibleVouchers.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Chưa Đủ Điều Kiện</h3>
                  <div>{ineligibleVouchers.map(v => renderVoucherCard(v, false))}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
