"use client";

import React, { useState } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";

interface RejectModalProps {
  isOpen: boolean;
  doctorName: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

const QUICK_REASONS = [
  "Bằng cấp không hợp lệ",
  "Thông tin không đầy đủ",
  "Hình ảnh không rõ",
  "Chuyên khoa không phù hợp",
];

export default function RejectModal({
  isOpen,
  doctorName,
  onConfirm,
  onClose,
  isSubmitting = false,
}: RejectModalProps) {
  const [reason, setReason] = useState("");

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  };

  if (!isOpen) return null;

  const isValid = reason.trim().length >= 10;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            Từ chối Hồ sơ
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-400">
            Từ chối hồ sơ bác sĩ:{" "}
            <strong className="text-slate-100">{doctorName}</strong>
          </p>

          {/* Quick reason chips */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Lý do nhanh
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    reason === r
                      ? "bg-red-500/20 text-red-300 border-red-500/40"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Lý do từ chối{" "}
              <span className="text-red-400 normal-case tracking-normal font-normal ml-1">
                * (tối thiểu 10 ký tự)
              </span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do từ chối chi tiết..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/60 transition-all text-sm resize-none"
            />
            <p className="text-right text-xs text-slate-600 mt-1">
              {reason.trim().length} / 10+ ký tự
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 bg-slate-900 border border-slate-800 hover:text-slate-100 hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid || isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              "Xác nhận Từ chối"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
