"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/services/api";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { CheckCircle2, ShieldAlert, Calendar, User, FileText, ArrowLeft, Stethoscope, Hospital, Activity } from "lucide-react";
import Link from "next/link";

interface PublicPrescriptionData {
  id: string;
  appointmentDate: string;
  status: string;
  user: {
    fullName: string;
    gender: string;
    dateOfBirth: string;
  };
  doctor: {
    name: string;
    hospital: string;
    specialty: {
      name: string;
    };
  };
  medicalRecord: {
    diagnosis: string;
    notes: string | null;
    prescriptions: {
      id: string;
      medicationName: string;
      dosage: string;
      frequency: string;
      duration: string;
    }[];
    createdAt: string;
  };
}

function VerifyPrescriptionContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PublicPrescriptionData | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Không tìm thấy mã số đơn thuốc trong liên kết.");
      setLoading(false);
      return;
    }

    async function verifyPrescription() {
      try {
        setLoading(true);
        setError(null);
        // Hit the public endpoint
        const res = await api.get(`/appointments/${id}/prescription/public`);
        if (res.data && res.data.verified) {
          setData(res.data.prescription);
        } else {
          setError("Đơn thuốc không hợp lệ hoặc đã bị thay đổi.");
        }
      } catch (err: any) {
        console.error("Verification failed:", err);
        setError(
          err.response?.data?.message ||
            "Không thể xác thực đơn thuốc. Vui lòng kiểm tra lại mã QR."
        );
      } finally {
        setLoading(false);
      }
    }

    verifyPrescription();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner className="w-12 h-12 text-teal-600 mb-4" />
        <p className="text-sm font-semibold text-slate-500">Đang truy xuất và xác thực đơn thuốc từ hệ thống...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-red-100 shadow-xl shadow-red-500/5 text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8 animate-bounce" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800">Xác thực thất bại</h2>
        <p className="text-sm text-slate-500 leading-relaxed">{error || "Đơn thuốc không tồn tại trên hệ thống MedBooking."}</p>
        <div className="pt-4">
          <Link href="/">
            <button className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Quay lại Trang chủ
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const { user, doctor, medicalRecord } = data;
  const prescriptions = medicalRecord.prescriptions || [];
  const patientDob = user.dateOfBirth
    ? new Date(user.dateOfBirth).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Chưa cập nhật";

  const recordDate = new Date(medicalRecord.createdAt).toLocaleString("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="max-w-2xl mx-auto my-8 px-4">
      {/* Verification Success Badge */}
      <div className="bg-emerald-500 text-white rounded-3xl p-6 md:p-8 shadow-xl shadow-emerald-500/10 mb-8 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden border border-emerald-400">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-12 -translate-y-12" />
        <div className="w-16 h-16 bg-white/20 backdrop-blur-md text-white rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div className="text-center md:text-left space-y-1 relative">
          <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-100">Cổng xác thực MedBooking</span>
          <h2 className="text-2xl font-extrabold tracking-tight">Đơn Thuốc Hợp Lệ</h2>
          <p className="text-xs text-emerald-50 leading-relaxed">
            Hệ thống xác thực đây là đơn thuốc y tế chính thức, được kê bởi bác sĩ đã đăng ký của MedBooking.
          </p>
        </div>
      </div>

      {/* Details Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-6 md:p-8 space-y-6">
        
        {/* Logo & ID Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-650 rounded-xl">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-sm">Hệ Thống Y Tế MedBooking</span>
              <p className="text-[10px] text-slate-400">Thời gian xác thực: {new Date().toLocaleString("vi-VN")}</p>
            </div>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">Mã số đơn</span>
            <span className="text-xs font-mono font-bold text-slate-700">{data.id.toUpperCase()}</span>
          </div>
        </div>

        {/* Patient Details */}
        <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 space-y-3">
          <h3 className="font-bold text-teal-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
            <User className="w-4 h-4" />
            Thông tin bệnh nhân
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-650">
            <p>Họ tên: <strong className="text-slate-800">{user.fullName}</strong></p>
            <p>Ngày sinh: <strong className="text-slate-800">{patientDob}</strong></p>
            <p>Giới tính: <strong className="text-slate-800">{user.gender === "MALE" ? "Nam" : user.gender === "FEMALE" ? "Nữ" : user.gender}</strong></p>
          </div>
        </div>

        {/* Doctor Details */}
        <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 space-y-3">
          <h3 className="font-bold text-teal-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
            <Activity className="w-4 h-4" />
            Bác sĩ điều trị
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-650">
            <p>Họ tên bác sĩ: <strong className="text-slate-800">{doctor.name}</strong></p>
            <p>Chuyên khoa: <strong className="text-slate-800">{doctor.specialty.name}</strong></p>
            <p className="sm:col-span-2 flex items-start gap-1">
              <Hospital className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <span>Nơi công tác: <strong className="text-slate-800">{doctor.hospital}</strong></span>
            </p>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Chẩn đoán bệnh y khoa:</h3>
          <p className="text-xs text-slate-800 font-semibold bg-teal-50/30 p-3.5 rounded-xl border border-teal-500/10 whitespace-pre-wrap">{medicalRecord.diagnosis}</p>
        </div>

        {/* Notes */}
        {medicalRecord.notes && (
          <div className="space-y-2">
            <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Ghi chú / Lời dặn của Bác sĩ:</h3>
            <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100 italic whitespace-pre-wrap">{medicalRecord.notes}</p>
          </div>
        )}

        {/* Medications List */}
        <div className="space-y-3">
          <h3 className="font-bold text-teal-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            Đơn thuốc chỉ định
          </h3>

          {prescriptions.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-500">
              Đơn thuốc không bao gồm chỉ định thuốc uống.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Tên thuốc</th>
                    <th className="p-3">Liều dùng</th>
                    <th className="p-3">Tần suất</th>
                    <th className="p-3 text-right">Số ngày</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {prescriptions.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="p-3 text-slate-400 font-medium">{idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-800">{item.medicationName}</td>
                      <td className="p-3">{item.dosage}</td>
                      <td className="p-3">{item.frequency}</td>
                      <td className="p-3 text-right font-medium">{item.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Verify Footer */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <Calendar className="w-4 h-4" />
            <span>Ngày khám bệnh: {new Date(data.appointmentDate).toLocaleDateString("vi-VN")}</span>
          </div>
          <Link href="/">
            <button className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Quay lại Trang chủ
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function VerifyPrescriptionPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner className="w-12 h-12 text-teal-600 mb-4" />
        <p className="text-sm font-semibold text-slate-500 font-medium">Đang chuẩn bị trang xác thực...</p>
      </div>
    }>
      <VerifyPrescriptionContent />
    </Suspense>
  );
}
