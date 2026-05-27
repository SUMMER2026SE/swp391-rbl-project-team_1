"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/services/api";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import { FileText, CalendarDays, Pill, Activity } from "lucide-react";

export default function PatientDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await api.get(`/doctor/patients/${userId}/records`);
        setRecords(res.data);
      } catch (err) {
        setError("Không thể tải hồ sơ bệnh án.");
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchRecords();
  }, [userId]);

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner className="w-8 h-8 text-teal-600" /></div>;
  if (error) return <Alert type="error" message={error} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Activity className="w-6 h-6 text-teal-500" /> Chi tiết Bệnh án
        </h2>
        <p className="text-slate-500">Lịch sử khám bệnh và đơn thuốc của bệnh nhân.</p>
      </div>

      <div className="space-y-6">
        {records.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 border-dashed">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Chưa có bệnh án nào được ghi nhận cho bệnh nhân này.</p>
          </div>
        ) : (
          records.map((record, index) => (
            <div key={record.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
              
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                <CalendarDays className="w-5 h-5 text-slate-400" />
                <h3 className="font-bold text-lg text-slate-800">
                  Khám ngày: {new Date(record.createdAt).toLocaleDateString('vi-VN')}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Chẩn đoán</h4>
                    <p className="text-slate-800 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {record.diagnosis}
                    </p>
                  </div>
                  {record.notes && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Ghi chú thêm</h4>
                      <p className="text-slate-700 bg-amber-50 p-3 rounded-xl border border-amber-100 text-sm">
                        {record.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Pill className="w-4 h-4" /> Đơn thuốc
                  </h4>
                  {record.prescriptions && record.prescriptions.length > 0 ? (
                    <div className="space-y-2">
                      {record.prescriptions.map((p: any) => (
                        <div key={p.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-white">
                          <div>
                            <p className="font-bold text-slate-800">{p.medicationName}</p>
                            <p className="text-xs text-slate-500">{p.dosage} • {p.frequency}</p>
                          </div>
                          <span className="text-xs font-semibold px-2 py-1 bg-teal-50 text-teal-700 rounded-lg border border-teal-100">
                            {p.duration}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Không có đơn thuốc nào được kê.</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
