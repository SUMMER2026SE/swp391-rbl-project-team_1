import React from "react";
import Link from "next/link";
import { Doctor } from "@/types/doctor";
import { Award, Building2, Stethoscope, ArrowRight, User } from "lucide-react";
import Button from "../common/Button";

interface DoctorCardProps {
  doctor: Doctor;
}

export default function DoctorCard({ doctor }: DoctorCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 hover:border-teal-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden group">
      {/* Profile Header */}
      <div className="p-6 flex items-start gap-4">
        {/* Doctor Avatar */}
        <div className="h-16 w-16 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100/50 shrink-0 overflow-hidden relative flex items-center justify-center">
          {doctor.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doctor.avatar}
              alt={doctor.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                // Fallback on image loading error
                (e.target as HTMLImageElement).src = "";
                (e.target as HTMLImageElement).className = "hidden";
              }}
            />
          ) : (
            <User className="h-8 w-8 text-teal-500" />
          )}
        </div>

        {/* Basic Info */}
        <div className="space-y-1.5 min-w-0">
          <h3 className="font-bold text-slate-900 group-hover:text-teal-600 transition-colors text-base truncate">
            {doctor.name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100/50 rounded-lg px-2 py-0.5 w-max">
            <Stethoscope className="h-3 w-3" />
            <span>{doctor.specialty?.name}</span>
          </div>
        </div>
      </div>

      {/* Meta Specs */}
      <div className="px-6 pb-6 pt-2 border-t border-slate-50 flex-grow space-y-3">
        <div className="flex items-center gap-2.5 text-xs text-slate-600">
          <Award className="h-4 w-4 text-slate-400 shrink-0" />
          <span>Kinh nghiệm: <strong>{doctor.experience} năm</strong></span>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-slate-600">
          <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="truncate">Bệnh viện: <strong>{doctor.hospital}</strong></span>
        </div>
      </div>

      {/* Action Button Footer */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100/60 mt-auto flex items-center justify-between">
        <Link href={`/doctors/${doctor.id}`} className="w-full">
          <Button
            variant="outline"
            className="w-full py-2.5 text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all group-hover:shadow-md font-semibold"
          >
            Xem Chi Tiết & Đặt Lịch
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
