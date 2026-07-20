"use client";

import React, { useState, useEffect } from "react";
import { Appointment } from "@/types/appointment";
import { X, Printer, ShieldCheck, FileText, Calendar, User, UserCheck, Stethoscope } from "lucide-react";
import api from "@/services/api";
import LoadingSpinner from "../common/LoadingSpinner";
import toast from "react-hot-toast";

interface PrescriptionModalProps {
  appointmentId: string;
  onClose: () => void;
}

export default function PrescriptionModal({ appointmentId, onClose }: PrescriptionModalProps) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAppointmentDetails() {
      try {
        setLoading(true);
        const res = await api.get(`/appointments/${appointmentId}`);
        if (res.data && res.data.appointment) {
          setAppointment(res.data.appointment);
        } else {
          toast.error("Không tìm thấy thông tin cuộc hẹn.");
        }
      } catch (err) {
        console.error("Failed to load appointment details:", err);
        toast.error("Lỗi khi tải thông tin đơn thuốc.");
      } finally {
        setLoading(false);
      }
    }

    fetchAppointmentDetails();
  }, [appointmentId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 no-print">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center max-w-sm w-full shadow-xl">
          <LoadingSpinner className="w-10 h-10 text-teal-600 mb-4" />
          <p className="text-sm font-semibold text-slate-600">Đang tải thông tin đơn thuốc...</p>
        </div>
      </div>
    );
  }

  if (!appointment || !appointment.medicalRecord) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 no-print">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl text-center">
          <X className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h4 className="font-bold text-slate-800 text-lg">Không tìm thấy bệnh án</h4>
          <p className="text-xs text-slate-500 mt-1 mb-4">Lịch khám này chưa được lập bệnh án và kê đơn thuốc.</p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  const { medicalRecord } = appointment;
  const prescriptions = medicalRecord.prescriptions || [];
  
  // Use patientInfo snapshot (always SELF now, so just read from patientInfo or user fallback)
  const patientInfoSnapshot = (appointment.patientInfo as any) || {};
  const patientName = patientInfoSnapshot.fullName || appointment.user?.fullName || "Chưa rõ";
    
  const patient = {
    fullName: patientName,
    gender: patientInfoSnapshot.gender || appointment.user?.gender || "Chưa rõ",
    dateOfBirth: patientInfoSnapshot.dateOfBirth || appointment.user?.dateOfBirth || "",
    address: [
      patientInfoSnapshot.street,
      patientInfoSnapshot.ward,
      patientInfoSnapshot.district,
      patientInfoSnapshot.province
    ].filter(Boolean).join(", ") || appointment.user?.address || ""
  };

  const patientDob = patient.dateOfBirth
    ? new Date(patient.dateOfBirth).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Chưa cập nhật";

  const apptDate = new Date(appointment.appointmentDate).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const recordDate = new Date(medicalRecord.createdAt).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Dynamic QR Code link to verification page
  const verificationLink = `${window.location.origin}/verify-prescription?id=${appointment.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(
    verificationLink
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto no-print">
      {/* Printable CSS embedded */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-prescription, #printable-prescription * {
            visibility: visible !important;
          }
          #printable-prescription {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 20px !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      ` }} />

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-fade-in no-print">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-650" />
            <span className="font-bold text-slate-800 text-sm">Đơn Thuốc & Bệnh Án Điện Tử</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {/* Main Printable Content Container */}
          <div 
            id="printable-prescription" 
            className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm text-slate-800 font-sans"
          >
            {/* Hospital Logo & Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-teal-600 pb-4 mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-teal-700 tracking-tight flex items-center gap-1.5">
                  <Stethoscope className="w-5 h-5 text-teal-650" />
                  HỆ THỐNG Y TẾ MEDBOOKING
                </h2>
                <p className="text-[10px] text-slate-500 mt-1">Đường 3/2, Quận 10, TP. Hồ Chí Minh • Hotline: 1900-6080</p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Mã số đơn</span>
                <span className="text-xs font-mono font-bold text-slate-700">{appointment.id.substring(0, 13).toUpperCase()}</span>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-wide uppercase">ĐƠN THUỐC & BỆNH ÁN</h1>
              <p className="text-[11px] text-slate-500 mt-0.5">Ngày lập: {recordDate}</p>
            </div>

            {/* Section 1: Patient Details */}
            <div className="bg-slate-50/60 rounded-xl p-4 mb-6 border border-slate-100 text-xs">
              <h3 className="font-bold text-teal-800 uppercase tracking-wider mb-2 text-[10px] flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                Thông tin bệnh nhân
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <p>Họ tên: <strong className="text-slate-900">{patient.fullName}</strong></p>
                <p>Ngày sinh: <strong className="text-slate-900">{patientDob}</strong></p>
                <p>Giới tính: <strong className="text-slate-900">{patient.gender === "MALE" ? "Nam" : patient.gender === "FEMALE" ? "Nữ" : patient.gender}</strong></p>
                {patient.address && (
                  <p className="sm:col-span-2">Địa chỉ: <span className="text-slate-900">{patient.address}</span></p>
                )}
              </div>
            </div>

            {/* Section 2: Clinical Details */}
            <div className="mb-6 space-y-3 text-xs">
              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Chẩn đoán bệnh y khoa:</h4>
                <p className="mt-1 text-slate-900 font-semibold bg-teal-50/30 p-2.5 rounded-lg border border-teal-500/10 whitespace-pre-wrap">{medicalRecord.diagnosis}</p>
              </div>
              {medicalRecord.notes && (
                <div>
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Ghi chú / Lời dặn của Bác sĩ:</h4>
                  <p className="mt-1 text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic whitespace-pre-wrap">{medicalRecord.notes}</p>
                </div>
              )}
            </div>

            {/* Section 3: Prescribed Medications */}
            <div className="mb-6">
              <h3 className="font-bold text-teal-800 uppercase tracking-wider mb-2.5 text-[10px] flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Chỉ định thuốc điều trị
              </h3>
              
              {prescriptions.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl">
                  <p className="text-xs text-slate-500">Đơn thuốc không có chỉ định thuốc uống (Bác sĩ chỉ dặn dò tự theo dõi).</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Tên thuốc / Hàm lượng</th>
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

            {/* Section 4: Signature and QR Code Verification */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              {/* QR Verification info */}
              <div className="flex items-center gap-4">
                <img 
                  src={qrCodeUrl} 
                  alt="Mã QR Xác Thực Đơn Thuốc" 
                  className="w-24 h-24 p-1 border border-slate-200 rounded-lg shrink-0" 
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    Đơn thuốc điện tử hợp lệ
                  </div>
                  <p className="text-[10px] text-slate-500 max-w-[200px] leading-relaxed">
                    Quét mã QR bằng điện thoại để kiểm tra và xác thực đơn thuốc gốc trực tiếp trên hệ thống MedBooking.
                  </p>
                </div>
              </div>

              {/* Signature block */}
              <div className="text-right self-stretch sm:self-auto flex flex-col justify-between items-end min-h-[96px] text-xs">
                <div>
                  <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px] mb-1">Bác sĩ điều trị</p>
                  <p className="font-semibold text-slate-800">{appointment.doctor?.name || "Bác sĩ Chuyên khoa"}</p>
                </div>
                
                {/* simulated doctor signature */}
                <div className="my-2 select-none opacity-80 rotate-[-3deg] font-mono text-teal-650 text-sm font-bold tracking-widest italic pr-4">
                  Dr. {appointment.doctor?.name ? appointment.doctor.name.split(" ").pop() : "Doctor"}
                </div>

                <div className="text-[10px] text-slate-400">MedBooking Digital Signature</div>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer (Actions) */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-850 hover:bg-slate-250 transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-md shadow-teal-500/10 flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            In / Tải đơn thuốc PDF
          </button>
        </div>
      </div>
    </div>
  );
}
