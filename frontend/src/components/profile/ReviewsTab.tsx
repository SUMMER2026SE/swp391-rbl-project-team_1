"use client";

import React, { useEffect, useState } from "react";
import { reviewService, Review } from "@/services/review.service";
import { Appointment } from "@/types/appointment";
import { Star, MessageSquare, AlertCircle } from "lucide-react";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";

export default function ReviewsTab() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pending, setPending] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [revRes, pendRes] = await Promise.all([
        reviewService.getMyReviews(),
        reviewService.getPendingReviews()
      ]);
      setReviews(revRes.data || []);
      setPending(pendRes.data || []);
    } catch (err: any) {
      setError(err.message || "Lỗi tải đánh giá");
    } finally {
      setLoading(false);
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
                  onClick={() => { /* TODO: Open review modal */ }}
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
                    "{r.comment}"
                  </p>
                )}
                
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span className="font-medium text-slate-600">Bệnh nhân khám:</span> {(r.appointment?.patientInfo as any)?.fullName || "N/A"} (Ngày: {r.appointment?.appointmentDate ? new Date(r.appointment?.appointmentDate).toLocaleDateString('vi-VN') : "N/A"})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
