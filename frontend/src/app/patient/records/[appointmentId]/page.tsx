"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/services/api";
import Link from "next/link";
import {
  ArrowLeft, User, Stethoscope, FlaskConical, Pill, FileText,
  Heart, Thermometer, Activity, Droplet, Weight, Ruler, Calendar,
  AlertCircle, ClipboardList, Printer, Clock
} from "lucide-react";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function PatientRecordPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params?.appointmentId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeSection, setActiveSection] = useState("vitals");

  useEffect(() => {
    if (!appointmentId) return;
    const fetch = async () => {
      try {
        const res = await api.get(`/medical-records/patient/appointment/${appointmentId}`);
        if (res.data.success) setData(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [appointmentId]);

  const handlePrint = async () => {
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const el = document.getElementById("record-print-area");
      if (!el) return;
      const opt = {
        margin: 10,
        filename: `BenhAn_${appointmentId}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      };
      html2pdf().from(el).set(opt).save();
    } catch (err) {
      console.error("PDF error:", err);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner className="w-10 h-10 text-teal-600" />
      </div>
    );

  if (!data)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 text-slate-500">
        <FileText className="w-16 h-16 text-slate-300" />
        <p className="text-lg font-medium">Không tìm thấy bệnh án</p>
        <Link href="/profile?tab=records" className="text-teal-600 hover:underline text-sm">
          ← Quay lại hồ sơ bệnh án
        </Link>
      </div>
    );

  const { appointment, record } = data;
  const doctor = appointment?.doctor;
  const apptDate = new Date(appointment?.appointmentDate);

  const sections = [
    { id: "vitals", label: "Sinh hiệu", icon: <Activity className="w-4 h-4" /> },
    { id: "diagnosis", label: "Chẩn đoán", icon: <Stethoscope className="w-4 h-4" /> },
    { id: "prescription", label: "Đơn thuốc", icon: <Pill className="w-4 h-4" />, count: record?.prescriptions?.length },
    { id: "lab", label: "Xét nghiệm", icon: <FlaskConical className="w-4 h-4" />, count: record?.LabOrder?.length },
    { id: "notes", label: "Lời dặn", icon: <ClipboardList className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-slate-800 text-lg">Chi tiết Bệnh án</h1>
              <p className="text-sm text-slate-500">
                Ngày khám: {apptDate.toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            In / Tải PDF
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar navigation */}
        <div className="w-56 shrink-0 hidden md:block">
          {/* Doctor Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-teal-50 mx-auto mb-3">
              {doctor?.avatar ? (
                <img src={doctor.avatar} alt={doctor.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-teal-600 font-bold text-2xl">
                  {doctor?.name?.charAt(0) || "B"}
                </div>
              )}
            </div>
            <p className="font-bold text-slate-800 text-center text-sm">{doctor?.name || "Bác sĩ"}</p>
            <p className="text-xs text-teal-600 text-center mt-1">{doctor?.specialty?.name || ""}</p>
          </div>

          {/* Section nav */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 space-y-1 sticky top-24">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setActiveSection(s.id);
                  document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  activeSection === s.id
                    ? "bg-teal-50 text-teal-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {s.icon}
                {s.label}
                {s.count !== undefined && s.count > 0 && (
                  <span className="ml-auto text-[11px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full">
                    {s.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 space-y-6" id="record-print-area">
          {/* Print header (hidden on screen, visible in PDF) */}
          <div className="hidden print:block text-center mb-4 border-b-2 border-teal-600 pb-4">
            <h1 className="text-2xl font-bold text-teal-600">MedBooking</h1>
            <p className="text-sm text-gray-500">Hệ thống Y tế thông minh</p>
            <h2 className="text-xl font-bold mt-2">BỆNH ÁN ĐIỆN TỬ</h2>
            <p className="text-sm mt-1">
              Ngày khám: {apptDate.toLocaleDateString("vi-VN")} — Bác sĩ: {doctor?.name} — Chuyên khoa: {doctor?.specialty?.name}
            </p>
          </div>

          {/* Section: Sinh hiệu */}
          <section id="vitals" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-600" /> Chỉ số sinh hiệu
            </h2>
            {record ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: "Chiều cao", value: record.height ? `${record.height} cm` : null, icon: <Ruler className="w-5 h-5 text-blue-500" />, bg: "bg-blue-50" },
                  { label: "Cân nặng", value: record.weight ? `${record.weight} kg` : null, icon: <Weight className="w-5 h-5 text-purple-500" />, bg: "bg-purple-50" },
                  { label: "Huyết áp", value: record.bloodPressure || null, icon: <Heart className="w-5 h-5 text-red-500" />, bg: "bg-red-50" },
                  { label: "Nhịp tim", value: record.heartRate ? `${record.heartRate} bpm` : null, icon: <Activity className="w-5 h-5 text-pink-500" />, bg: "bg-pink-50" },
                  { label: "Nhiệt độ", value: record.temperature ? `${record.temperature} °C` : null, icon: <Thermometer className="w-5 h-5 text-orange-500" />, bg: "bg-orange-50" },
                  { label: "SpO2", value: record.spo2 ? `${record.spo2}%` : null, icon: <Droplet className="w-5 h-5 text-cyan-500" />, bg: "bg-cyan-50" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
                    <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{item.label}</p>
                      <p className="font-bold text-slate-800 text-sm">{item.value || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic">Chưa ghi nhận chỉ số sinh hiệu</p>
            )}
          </section>

          {/* Section: Chẩn đoán */}
          <section id="diagnosis" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-600" /> Chẩn đoán
            </h2>
            {record ? (
              <div className="space-y-4">
                {record.symptoms && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Triệu chứng</p>
                    <p className="text-sm text-slate-700">{record.symptoms}</p>
                  </div>
                )}
                {record.physicalExam && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Khám lâm sàng</p>
                    <p className="text-sm text-slate-700">{record.physicalExam}</p>
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  {record.preliminaryDiagnosis && (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Chẩn đoán sơ bộ</p>
                      <p className="text-sm font-semibold text-slate-800">{record.preliminaryDiagnosis}</p>
                    </div>
                  )}
                  {record.finalDiagnosis && (
                    <div className="p-4 bg-teal-50 rounded-xl border border-teal-100">
                      <p className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">
                        Chẩn đoán xác định {record.icd10Code && <span className="ml-1 text-xs bg-teal-100 px-1.5 py-0.5 rounded">{record.icd10Code}</span>}
                      </p>
                      <p className="text-sm font-semibold text-slate-800">{record.finalDiagnosis}</p>
                    </div>
                  )}
                </div>
                {record.treatmentPlan && (
                  <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                    <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Kế hoạch điều trị</p>
                    <p className="text-sm text-slate-700">{record.treatmentPlan}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic">Chưa có thông tin chẩn đoán</p>
            )}
          </section>

          {/* Section: Đơn thuốc */}
          <section id="prescription" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
              <Pill className="w-5 h-5 text-teal-600" /> Đơn thuốc
              {record?.prescriptions?.length > 0 && (
                <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">{record.prescriptions.length} loại</span>
              )}
            </h2>
            {record?.prescriptions?.length > 0 ? (
              <div className="space-y-3">
                {record.prescriptions.map((p: any, idx: number) => (
                  <div key={p.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:border-teal-100 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 font-bold text-sm flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800">{p.medicine?.name || "Thuốc không xác định"}</p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span>Liều: <span className="font-medium text-slate-700">{p.dosage}</span></span>
                        <span>Tần suất: <span className="font-medium text-slate-700">{p.frequency}</span></span>
                        <span>Số ngày: <span className="font-medium text-slate-700">{p.durationDays} ngày</span></span>
                        <span>Số lượng: <span className="font-medium text-slate-700">{p.quantity} {p.medicine?.unit || "viên"}</span></span>
                      </div>
                      {p.instructions && (
                        <p className="text-xs text-slate-400 italic mt-1">📝 {p.instructions}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic">Không có đơn thuốc</p>
            )}
          </section>

          {/* Section: Xét nghiệm */}
          <section id="lab" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-teal-600" /> Chỉ định cận lâm sàng
              {record?.LabOrder?.length > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{record.LabOrder.length} chỉ định</span>
              )}
            </h2>
            {record?.LabOrder?.length > 0 ? (
              <div className="space-y-3">
                {record.LabOrder.map((lab: any, idx: number) => (
                  <div key={lab.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{lab.testName}</p>
                      {lab.testType && <p className="text-xs text-slate-500 mt-0.5">Loại: {lab.testType}</p>}
                      {lab.notes && <p className="text-xs text-slate-400 italic mt-0.5">📝 {lab.notes}</p>}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      lab.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {lab.status === "COMPLETED" ? "Hoàn thành" : "Chờ kết quả"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic">Không có chỉ định xét nghiệm</p>
            )}
          </section>

          {/* Section: Lời dặn & Tái khám */}
          <section id="notes" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-teal-600" /> Lời dặn & Tái khám
            </h2>
            <div className="space-y-4">
              {record?.doctorNotes ? (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Lời dặn của Bác sĩ
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">{record.doctorNotes}</p>
                </div>
              ) : (
                <p className="text-slate-400 text-sm italic">Không có lời dặn đặc biệt</p>
              )}
              {record?.followUpDate && (
                <div className="p-4 bg-teal-50 rounded-xl border border-teal-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-teal-600 uppercase tracking-wider">Ngày tái khám</p>
                    <p className="font-semibold text-slate-800">
                      {new Date(record.followUpDate).toLocaleDateString("vi-VN", {
                        weekday: "long", year: "numeric", month: "long", day: "numeric"
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Bottom back link */}
          <div className="pb-6 flex justify-center">
            <Link
              href="/profile?tab=records"
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-teal-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại Hồ sơ bệnh án
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
