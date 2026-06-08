"use client";

import React from "react";
import {
  X,
  Stethoscope,
  Building2,
  Award,
  Phone,
  DollarSign,
  FileText,
  ExternalLink,
  Clock,
  BadgeCheck,
  ImageIcon,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { AdminDoctor, DoctorCertificate } from "@/types/admin";

interface DoctorDetailModalProps {
  doctor: AdminDoctor | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isSubmitting?: boolean;
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
      <div className="mt-0.5 text-teal-400 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">
          {label}
        </p>
        <p className="text-sm text-slate-200 break-words">{value || "—"}</p>
      </div>
    </div>
  );
}

function CertificateItem({ cert }: { cert: DoctorCertificate }) {
  const viewUrl = cert.imageUrl || cert.fileUrl;
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 hover:border-teal-500/30 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 rounded-lg bg-teal-500/10 shrink-0">
          {cert.imageUrl ? (
            <ImageIcon className="h-4 w-4 text-teal-400" />
          ) : (
            <FileText className="h-4 w-4 text-teal-400" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-200 truncate">{cert.title}</p>
          <p className="text-xs text-slate-500 truncate">
            {cert.issuer && <span>{cert.issuer}</span>}
            {cert.issuer && cert.issuedYear && <span> · </span>}
            {cert.issuedYear && <span>Năm {cert.issuedYear}</span>}
          </p>
          {cert.description && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">{cert.description}</p>
          )}
        </div>
      </div>
      {viewUrl && (
        <a
          href={viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 transition-all shrink-0"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Xem
        </a>
      )}
    </div>
  );
}

export default function DoctorDetailModal({
  doctor,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isSubmitting = false,
}: DoctorDetailModalProps) {
  if (!isOpen || !doctor) return null;

  const statusLabel: Record<string, string> = {
    PENDING: "Chờ duyệt",
    APPROVED: "Đã duyệt",
    REJECTED: "Đã từ chối",
  };

  const statusClass: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-teal-400" />
            Hồ sơ Bác sĩ
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Profile Section */}
          <div className="flex items-start gap-4">
            <div className="h-20 w-20 rounded-2xl bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-700">
              {doctor.avatar ? (
                <img
                  src={doctor.avatar}
                  alt={doctor.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Stethoscope className="h-8 w-8 text-slate-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-xl font-black text-white">{doctor.name}</h3>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-lg border text-[10px] font-bold tracking-wide uppercase ${
                    statusClass[doctor.status] ?? ""
                  }`}
                >
                  {statusLabel[doctor.status] ?? doctor.status}
                </span>
                {doctor.isLocked && (
                  <span className="inline-block px-2.5 py-0.5 rounded-lg border text-[10px] font-bold tracking-wide uppercase bg-red-500/10 text-red-400 border-red-500/20">
                    Bị khóa
                  </span>
                )}
              </div>
              <p className="text-teal-400 font-semibold text-sm">{doctor.specialty.name}</p>
              {doctor.userAccount && (
                <p className="text-xs text-slate-500 mt-0.5">{doctor.userAccount.email}</p>
              )}
            </div>
          </div>

          {/* Info Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Thông tin chi tiết
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow
                icon={<Building2 className="h-4 w-4" />}
                label="Bệnh viện / Phòng khám"
                value={doctor.hospital}
              />
              <InfoRow
                icon={<Clock className="h-4 w-4" />}
                label="Kinh nghiệm"
                value={`${doctor.experience} năm`}
              />
              <InfoRow
                icon={<DollarSign className="h-4 w-4" />}
                label="Giá khám"
                value={
                  doctor.price != null
                    ? `${doctor.price.toLocaleString("vi-VN")} đ`
                    : "Chưa cập nhật"
                }
              />
              <InfoRow
                icon={<Phone className="h-4 w-4" />}
                label="Số điện thoại"
                value={doctor.phone}
              />
              {doctor.clinic && (
                <InfoRow
                  icon={<Building2 className="h-4 w-4" />}
                  label="Cơ sở y tế"
                  value={doctor.clinic.name}
                />
              )}
              {doctor.rejectedReason && (
                <div className="sm:col-span-2">
                  <InfoRow
                    icon={<XCircle className="h-4 w-4 text-red-400" />}
                    label="Lý do từ chối"
                    value={
                      <span className="text-red-300">{doctor.rejectedReason}</span>
                    }
                  />
                </div>
              )}
            </div>

            {doctor.description && (
              <div className="mt-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Mô tả
                </p>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {doctor.description}
                </p>
              </div>
            )}
          </div>

          {/* Certificates */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-teal-400" />
              Bằng cấp &amp; Chứng chỉ
              <span className="ml-auto text-teal-500 font-semibold normal-case tracking-normal">
                {doctor.certificates?.length ?? 0} mục
              </span>
            </h4>
            {!doctor.certificates || doctor.certificates.length === 0 ? (
              <div className="text-center py-6 text-slate-600 text-sm border border-dashed border-slate-800 rounded-xl">
                <BadgeCheck className="h-8 w-8 mx-auto mb-2 text-slate-700" />
                Chưa có bằng cấp / chứng chỉ
              </div>
            ) : (
              <div className="space-y-2">
                {doctor.certificates.map((cert) => (
                  <CertificateItem key={cert.id} cert={cert} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 shrink-0 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 bg-slate-900 border border-slate-800 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>

          {doctor.status === "PENDING" && (
            <>
              <button
                onClick={() => onReject(doctor.id)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                Từ chối
              </button>
              <button
                onClick={() => onApprove(doctor.id)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                Duyệt hồ sơ
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
