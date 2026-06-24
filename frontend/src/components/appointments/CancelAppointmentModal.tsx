import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import Button from "@/components/common/Button";

interface CancelAppointmentModalProps {
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}

export default function CancelAppointmentModal({
  onClose,
  onConfirm,
  loading,
}: CancelAppointmentModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError("Vui lòng nhập lý do huỷ lịch để phòng khám có thể hỗ trợ bạn tốt hơn.");
      return;
    }
    if (reason.trim().length < 5) {
      setError("Lý do quá ngắn, vui lòng miêu tả chi tiết hơn.");
      return;
    }
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-rose-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Xác nhận huỷ lịch hẹn</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <p className="text-slate-600 mb-4 text-sm leading-relaxed">
            Hành động này không thể hoàn tác. Nếu lịch hẹn đã được thanh toán, hệ thống sẽ tự động tiến hành hoàn tiền về tài khoản ngân hàng gốc của bạn trong thời gian sớm nhất.
          </p>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              Lý do huỷ lịch <span className="text-rose-500">*</span>
            </label>
            <textarea
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:outline-none transition-all resize-none ${
                error 
                  ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200" 
                  : "border-slate-200 focus:border-[#017a86] focus:ring-teal-100"
              }`}
              rows={4}
              placeholder="Vui lòng cho chúng tôi biết lý do bạn muốn huỷ lịch khám..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
            />
            {error && <p className="text-rose-500 text-xs font-medium">{error}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center gap-3 justify-end shrink-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Quay lại
          </Button>
          <Button
            onClick={handleConfirm}
            isLoading={loading}
            className="bg-rose-600 hover:bg-rose-700 text-white border-transparent"
          >
            Đồng ý Huỷ
          </Button>
        </div>
      </div>
    </div>
  );
}
