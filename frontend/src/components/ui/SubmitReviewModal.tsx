"use client";

import React, { useState } from "react";
import { Star, X, CheckCircle, MessageSquare } from "lucide-react";
import api from "@/services/api";
import Button from "../common/Button";
import LoadingSpinner from "../common/LoadingSpinner";
import toast from "react-hot-toast";

interface SubmitReviewModalProps {
  appointmentId: string;
  doctorName: string;
  specialtyName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SubmitReviewModal({
  appointmentId,
  doctorName,
  specialtyName,
  onClose,
  onSuccess,
}: SubmitReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/reviews", {
        appointmentId,
        rating,
        comment: comment.trim() || undefined,
      });

      toast.success("Cảm ơn bạn đã gửi đánh giá cho Bác sĩ!");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to submit review:", err);
      toast.error(err.response?.data?.message || "Không thể gửi đánh giá. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col animate-fade-in">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-650" />
            <span className="font-bold text-slate-800 text-sm">Đánh Giá & Nhận Xét Bác Sĩ</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 flex flex-col">
          {/* Doctor summary */}
          <div className="text-center bg-teal-50/30 border border-teal-500/10 rounded-2xl p-4">
            <p className="text-xs text-slate-500">Bạn vừa hoàn thành lịch khám với</p>
            <h4 className="font-extrabold text-slate-850 text-base mt-1">{doctorName}</h4>
            <span className="inline-block text-[10px] font-bold text-teal-700 bg-teal-50 rounded-lg px-2.5 py-0.5 mt-1.5 uppercase tracking-wider">
              {specialtyName}
            </span>
          </div>

          {/* Star selector */}
          <div className="space-y-2 text-center">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Chất lượng dịch vụ khám bệnh
            </label>
            <div className="flex justify-center items-center gap-1.5 py-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isSelected = star <= (hoverRating ?? rating);
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 text-slate-300 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                  >
                    <Star
                      className={`w-9 h-9 stroke-[1.5] ${
                        isSelected 
                          ? "fill-amber-400 stroke-amber-500 text-amber-450 animate-pulse-slow" 
                          : "text-slate-200 stroke-slate-350"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-xs font-semibold text-slate-650">
              {rating === 5 && "Rất tốt - Cực kỳ hài lòng! ⭐⭐⭐⭐⭐"}
              {rating === 4 && "Tốt - Hài lòng về dịch vụ ⭐⭐⭐⭐"}
              {rating === 3 && "Bình thường - Đạt yêu cầu ⭐⭐⭐"}
              {rating === 2 && "Tệ - Cần cải thiện thêm ⭐⭐"}
              {rating === 1 && "Rất tệ - Không hài lòng ⭐"}
            </p>
          </div>

          {/* Comment textarea */}
          <div className="space-y-1.5 flex-grow">
            <label htmlFor="review-comment" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Nhận xét chi tiết (tùy chọn)
            </label>
            <textarea
              id="review-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm khám bệnh của bạn (thái độ bác sĩ, tư vấn chuyên khoa, chất lượng cuộc gọi...)"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-xs resize-none leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Hủy bỏ
            </button>
            <Button
              type="submit"
              variant="teal"
              disabled={submitting}
              className="rounded-xl text-xs font-semibold px-6 py-2.5 shadow-md shadow-teal-500/10 flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <LoadingSpinner className="w-3.5 h-3.5 text-white" />
                  Đang gửi đánh giá...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Gửi nhận xét
                </>
              )}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
