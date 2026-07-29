"use client";

import React, { useEffect, useState } from "react";
import { reviewService, Review } from "@/services/review.service";
import { Appointment } from "@/types/appointment";
import { Star, MessageSquare, AlertCircle, X } from "lucide-react";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";

export default function ReviewsTab() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pending, setPending] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>("");

  const fetchData = async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const [revRes, pendRes] = await Promise.all([
        reviewService.getMyReviews(),
        reviewService.getPendingReviews()
      ]);
      setReviews(revRes.data || []);
      setPending(pendRes.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lỗi tải đánh giá";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await reviewService.createReview({
        appointmentId: selectedAppt.id,
        rating,
        comment: comment.trim() || undefined,
      });
      setSelectedAppt(null);
      setRating(5);
      setComment("");
      fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gửi đánh giá thất bại.";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
    ));
  };

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner className="text-teal-600 w-8 h-8" /></div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 animate-in fade-in duration-500">
      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
        <Star className="w-5 h-5 text-teal-600" />
        Đánh Giá Của Tôi
      </h3>

      {error && <Alert type="error" message={error} className="mb-6" />}

      {/* Pending Reviews Section */}
      {pending.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
            <AlertCircle className="w-5 h-5" />
            <span className="font-semibold">Bạn có {pending.length} lịch hẹn chưa đánh giá</span>
          </div>
          
          <div className="space-y-4">
            {pending.map(appt => (
              <div key={appt.id} className="flex flex-col md:flex-row items-center justify-between p-4 rounded-xl border border-amber-200 bg-amber-50/30 gap-4">
                <div>
                  <h4 className="font-bold text-slate-800">
                    Bác sĩ {appt.doctor?.name || "N/A"}
                  </h4>
                  <p className="text-sm text-slate-500">
                    Khám ngày: {new Date(appt.appointmentDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full md:w-auto border-amber-300 text-amber-700 hover:bg-amber-100"
                  onClick={() => setSelectedAppt(appt)}
                >
                  Đánh giá ngay
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Reviews Section */}
      <div>
        <h4 className="font-bold text-slate-700 mb-4">Lịch sử đánh giá ({reviews.length})</h4>
        
        {reviews.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>Bạn chưa gửi đánh giá nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map(r => (
              <div key={r.id} className="border border-slate-100 rounded-xl p-5 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                      {r.doctor?.avatar ? (
                        <img src={r.doctor.avatar} alt="Dr" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-teal-50 text-teal-600 font-bold">
                          BS
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">BS. {r.doctor?.name || "N/A"}</h4>
                      <p className="text-xs text-slate-500">{r.doctor?.specialty?.name}</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                
                <div className="flex gap-1 mb-3">
                  {renderStars(r.rating)}
                </div>
                
                {r.comment && (
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    &ldquo;{r.comment}&rdquo;
                  </p>
                )}
                
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span className="font-medium text-slate-600">Bệnh nhân khám:</span> {r.appointment?.patientInfo?.fullName || "N/A"} (Ngày: {r.appointment?.appointmentDate ? new Date(r.appointment?.appointmentDate).toLocaleDateString('vi-VN') : "N/A"})
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Review Modal */}
        {selectedAppt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => setSelectedAppt(null)}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col p-6 transform transition-all scale-100 opacity-100 animate-in fade-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-slate-800 mb-1">Đánh giá lịch hẹn</h3>
              <p className="text-sm text-slate-500 mb-6">
                Bác sĩ: {selectedAppt.doctor?.name || "N/A"} - Khám ngày: {new Date(selectedAppt.appointmentDate).toLocaleDateString('vi-VN')}
              </p>

              {submitError && <Alert type="error" message={submitError} className="mb-4" />}

              <form onSubmit={handleSubmitReview} className="space-y-6">
                {/* Star Rating */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-sm font-semibold text-slate-600">Mức độ hài lòng:</span>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="text-slate-200 hover:scale-110 transition-transform focus:outline-none"
                      >
                        <Star 
                          className={`w-9 h-9 transition-colors ${star <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} 
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-sm font-bold text-amber-600">
                    {rating === 5 ? "Rất hài lòng" : rating === 4 ? "Hài lòng" : rating === 3 ? "Bình thường" : rating === 2 ? "Không hài lòng" : "Rất không hài lòng"}
                  </span>
                </div>

                {/* Comment Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-600">Nhận xét của bạn:</label>
                  <textarea
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 min-h-[100px] resize-none"
                    placeholder="Chia sẻ trải nghiệm của bạn về bác sĩ và dịch vụ..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 rounded-xl py-2.5"
                    onClick={() => { setSelectedAppt(null); setRating(5); setComment(""); setSubmitError(""); }}
                    disabled={submitting}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white py-2.5 font-bold"
                    disabled={submitting}
                  >
                    {submitting ? "Đang gửi..." : "Gửi đánh giá"}
                  </Button>
                </div>
              </form>

              {/* Close Button Top Right */}
              <button
                type="button"
                onClick={() => { setSelectedAppt(null); setRating(5); setComment(""); setSubmitError(""); }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full p-1.5 transition-colors focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
